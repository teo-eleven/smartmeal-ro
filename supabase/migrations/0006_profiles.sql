-- The name a person gives at sign-up ("Cum te numești?"), used to greet them.
--
-- Like the consent in 0005, it arrives in the sign-up metadata, the only channel that exists
-- before an account does, and a trigger copies it into a table when the account is created.
-- Unlike the consent, a name is the owner's to change, so the owner may update their row —
-- but never insert one for somebody else or delete it; deleting the account cascades it away.

create table if not exists public.profiles (
  user_id       uuid        primary key references auth.users (id) on delete cascade,
  display_name  text        check (display_name is null or char_length(btrim(display_name)) between 1 and 60),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is
  'Created at sign-up by trg_create_profile. Readable and editable by its owner only.';

alter table public.profiles enable row level security;

create policy "Users read their own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No insert or delete policy: the trigger is the only way a row comes into existence, so
-- every account has at most one, and only its own. Supabase's default privileges hand anon
-- and authenticated everything on a new table; take it all back, then give the owner reading
-- and the name — the key and the clock are not theirs to change.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_profile on public.profiles;
create trigger trg_touch_profile
  before update on public.profiles
  for each row execute function public.touch_profile_updated_at();

create or replace function public.create_profile_from_metadata()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  -- Trimmed and cut here, not checked: a name the check constraint rejected would raise
  -- inside a trigger on auth.users and fail the whole sign-up with a database error.
  given_name text := nullif(left(btrim(coalesce(meta ->> 'display_name', '')), 60), '');
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, given_name)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_create_profile on auth.users;
create trigger trg_create_profile
  after insert on auth.users
  for each row execute function public.create_profile_from_metadata();

-- Trigger functions only; nobody has a reason to call them directly.
revoke all on function public.touch_profile_updated_at() from public, anon, authenticated;
revoke all on function public.create_profile_from_metadata() from public, anon, authenticated;

-- Accounts opened before this migration get an empty profile, so renaming works for them too
-- (there is no insert policy to create one later).
insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;
