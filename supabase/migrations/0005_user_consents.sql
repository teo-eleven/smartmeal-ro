-- Consent to hold health data, recorded where the user cannot rewrite it.
--
-- The sign-up form sends the two statements (16 or older; agrees to allergies being kept in
-- the account) in the sign-up metadata, the only channel that exists before an account does.
-- That metadata stays editable by its owner forever — any signed-in user can call
-- auth.updateUser({ data }) — so it is not evidence of anything. This trigger copies the
-- statements into a table at the moment the account is created, with the server's clock, and
-- no user can insert, change or delete a row in it afterwards.

create table if not exists public.user_consents (
  user_id                 uuid        primary key references auth.users (id) on delete cascade,
  age_confirmed_16        boolean     not null,
  health_data_consent     boolean     not null,
  privacy_policy_version  text,
  consented_at            timestamptz not null default now()
);

comment on table public.user_consents is
  'Frozen at account creation by trg_record_signup_consent. Read-only to its owner.';

alter table public.user_consents enable row level security;

-- Read only. There is deliberately no insert, update or delete policy: the trigger below,
-- running as its owner, is the only writer, and deleting the account cascades the row away.
create policy "Users read their own consent"
  on public.user_consents for select
  using (auth.uid() = user_id);

revoke insert, update, delete on public.user_consents from anon, authenticated;

create or replace function public.record_signup_consent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  -- Only accounts opened through the app carry the statements. One created by hand in the
  -- dashboard gets no row rather than a row claiming a consent nobody gave.
  if meta ? 'age_confirmed_16' then
    insert into public.user_consents (
      user_id, age_confirmed_16, health_data_consent, privacy_policy_version
    )
    -- Compared as text rather than cast: a ::boolean cast on a value like 'abc' would raise
    -- inside a trigger on auth.users and fail the whole sign-up with a database error.
    values (
      new.id,
      coalesce(meta ->> 'age_confirmed_16', '') = 'true',
      coalesce(meta ->> 'health_data_consent', '') = 'true',
      left(meta ->> 'privacy_policy_version', 32)
    )
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_record_signup_consent on auth.users;
create trigger trg_record_signup_consent
  after insert on auth.users
  for each row execute function public.record_signup_consent();
