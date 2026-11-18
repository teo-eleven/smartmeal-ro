-- 0012_goals_need_consent.sql
--
-- Second round of the 2026-11-17 security review. 0011 made the app ask before uploading
-- health goals, but the table itself still accepted them: save_meal_plan_if_unchanged (0009)
-- and the owner's direct writes (RLS, 0001) never looked at user_consents. A modified or
-- older client could store goals for an account that never agreed to hold them.
--
-- A trigger now removes the health goals from preferences -> healthGoalTags on every insert
-- and update, unless the row owner's user_consents.goals_included is true. Pork-free and any
-- tag that is not on the list below stay: it is a personal choice, not health data.
--
-- The list is explicit and must equal HEALTH_GOALS_CATALOG minus pork_free in
-- src/data/healthTags.ts; src/data/__tests__/goalsConsentMigration.test.ts fails when the two
-- drift apart. Adding a goal means adding it in both places.
--
-- It also covers legacy rows: any later save from an account without goals consent drops the
-- goals it holds. That is the same outcome as the client's "only on this device" choice.

create or replace function public.limit_goals_to_consent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_health_goals constant text[] := array['anti_inflammatory', 'pcos_friendly', 'diabetic_friendly', 'high_fiber', 'heart_healthy'];
  v_tags jsonb;
begin
  if new.preferences is null or not (new.preferences ? 'healthGoalTags') then
    return new;
  end if;

  -- The consent belongs to the row's owner. No record, or one without goals, means no goals.
  if exists (
    select 1 from public.user_consents c
     where c.user_id = new.user_id and c.health_data_consent and c.goals_included
  ) then
    return new;
  end if;

  v_tags := new.preferences -> 'healthGoalTags';
  -- Anything but a list cannot be checked tag by tag, so it is not kept.
  if jsonb_typeof(v_tags) <> 'array' then
    new.preferences := new.preferences - 'healthGoalTags';
    return new;
  end if;

  new.preferences := jsonb_set(
    new.preferences,
    '{healthGoalTags}',
    coalesce(
      (
        select jsonb_agg(t.tag)
          from jsonb_array_elements(v_tags) as t(tag)
         where not (jsonb_typeof(t.tag) = 'string' and (t.tag #>> '{}') = any (v_health_goals))
      ),
      '[]'::jsonb
    )
  );
  return new;
end;
$$;

revoke all on function public.limit_goals_to_consent() from public, anon, authenticated;

drop trigger if exists trg_limit_goals_to_consent on public.user_meal_plans;
create trigger trg_limit_goals_to_consent
  before insert or update on public.user_meal_plans
  for each row execute function public.limit_goals_to_consent();

-- grant_goals_consent (0011) recorded a null or empty policy version when called without one.
-- "Agreed to what" is the point of the record, so a missing version is now refused.
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
  if p_policy_version is null or btrim(p_policy_version) = '' then
    raise exception 'policy version is required' using errcode = '22023';
  end if;

  update public.user_consents c
     set goals_included = true,
         goals_consented_at = now(),
         goals_policy_version = left(btrim(p_policy_version), 32)
   where c.user_id = v_user
     and c.health_data_consent
     and not c.goals_included;

  select c.goals_included into v_included
    from public.user_consents c
   where c.user_id = v_user and c.health_data_consent;
  return coalesce(v_included, false);
end;
$$;

revoke all on function public.grant_goals_consent(text) from public, anon;
grant execute on function public.grant_goals_consent(text) to authenticated;
