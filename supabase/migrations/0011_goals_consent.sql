-- 0011_goals_consent.sql
--
-- The 2026-11-17 security review (M2). Consent to hold health data was one tick, and the
-- sign-up text differs by platform: on Android and the web it names "alergiile, dieta și
-- obiectivele mele de sănătate"; on iOS, where health goals are hidden, it names only
-- "alergiile și dieta mea". One boolean could not say which text a person agreed to, so an
-- iPhone sign-up looked like consent to goals it never mentioned.
--
-- user_consents now records whether the text shown included health goals. Existing rows get
-- false: what they agreed to is not known, so the app asks once before the first upload of
-- goals instead of assuming.
--
-- Same rule as 0005: the sign-up trigger writes the first answer, and no user can write the
-- table. The one later change a person can make is the extension of their own consent, and
-- it goes through grant_goals_consent(), which can set one thing to true for auth.uid().

alter table public.user_consents
  add column if not exists goals_included boolean not null default false,
  add column if not exists goals_consented_at timestamptz,
  add column if not exists goals_policy_version text;

comment on column public.user_consents.goals_included is
  'True when the person agreed to health goals being kept in the account: either the sign-up text named them (Android, web) or they said yes later through grant_goals_consent(). False on iOS sign-ups and on rows created before 0011.';
comment on column public.user_consents.goals_consented_at is
  'Server time at which goals_included became true; null while it is false.';
comment on column public.user_consents.goals_policy_version is
  'The privacy policy version in force when goals_included became true.';

create or replace function public.record_signup_consent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_health boolean := coalesce(meta ->> 'health_data_consent', '') = 'true';
  -- Goals can be included only on top of the health data consent, never instead of it.
  v_goals boolean := v_health and coalesce(meta ->> 'goals_included', '') = 'true';
begin
  -- Only accounts opened through the app carry the statements. One created by hand in the
  -- dashboard gets no row rather than a row claiming a consent nobody gave.
  if meta ? 'age_confirmed_16' then
    insert into public.user_consents (
      user_id, age_confirmed_16, health_data_consent, privacy_policy_version,
      goals_included, goals_consented_at, goals_policy_version
    )
    -- Compared as text rather than cast: a ::boolean cast on a value like 'abc' would raise
    -- inside a trigger on auth.users and fail the whole sign-up with a database error.
    values (
      new.id,
      coalesce(meta ->> 'age_confirmed_16', '') = 'true',
      v_health,
      left(meta ->> 'privacy_policy_version', 32),
      v_goals,
      case when v_goals then now() end,
      case when v_goals then left(meta ->> 'privacy_policy_version', 32) end
    )
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

-- Extends the caller's own consent to health goals. Nothing else about it can change here,
-- there is no way back through this function (withdrawing is deleting the account, as in the
-- privacy policy), and it never creates a row: an account with no consent record, or one
-- without the health data consent, gets false.
create or replace function public.grant_goals_consent(p_policy_version text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_included boolean;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  update public.user_consents c
     set goals_included = true,
         goals_consented_at = now(),
         goals_policy_version = left(p_policy_version, 32)
   where c.user_id = v_user
     and c.health_data_consent
     and not c.goals_included;

  -- Already true counts as granted, with the first time and version left as they were.
  select c.goals_included into v_included
    from public.user_consents c
   where c.user_id = v_user and c.health_data_consent;
  return coalesce(v_included, false);
end;
$$;

revoke all on function public.grant_goals_consent(text) from public, anon;
grant execute on function public.grant_goals_consent(text) to authenticated;
revoke all on function public.record_signup_consent() from public, anon, authenticated;
