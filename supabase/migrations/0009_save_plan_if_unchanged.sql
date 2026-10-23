-- 0009_save_plan_if_unchanged.sql
--
-- The 2026-10-21 audit (F2): saveMealPlan upserted blindly, so the phone that synced last
-- overwrote the plan another device had saved, without anyone being told.
--
-- The client now sends the updated_at it last saw. The row is written only if it still
-- carries that version; otherwise nothing is written and the caller gets 'conflict' with the
-- cloud's version, so the app can ask whether to replace it. Passing the cloud's version
-- back (after the user chose "replace") is how an overwrite is confirmed.
--
-- security invoker: row-level security on user_meal_plans still decides what is visible,
-- and auth.uid() is the only user this can ever touch.

create or replace function public.save_meal_plan_if_unchanged(
  p_plan_data jsonb,
  p_grocery_items jsonb,
  p_preferences jsonb,
  p_expected_updated_at timestamptz
)
returns table (status text, updated_at timestamptz)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_current timestamptz;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select p.updated_at into v_current
    from public.user_meal_plans p
   where p.user_id = v_user
   for update;

  if not found then
    insert into public.user_meal_plans (user_id, plan_data, grocery_items, preferences)
    values (v_user, p_plan_data, coalesce(p_grocery_items, '[]'::jsonb), p_preferences)
    returning public.user_meal_plans.updated_at into v_current;
    return query select 'saved'::text, v_current;
    return;
  end if;

  -- A device that never saw the cloud's plan (null) must not silently replace it either.
  if p_expected_updated_at is null or v_current is distinct from p_expected_updated_at then
    return query select 'conflict'::text, v_current;
    return;
  end if;

  update public.user_meal_plans p
     set plan_data = p_plan_data,
         grocery_items = coalesce(p_grocery_items, '[]'::jsonb),
         preferences = coalesce(p_preferences, p.preferences)
   where p.user_id = v_user
  returning p.updated_at into v_current;
  return query select 'saved'::text, v_current;
end;
$$;

revoke all on function public.save_meal_plan_if_unchanged(jsonb, jsonb, jsonb, timestamptz)
  from public, anon;
grant execute on function public.save_meal_plan_if_unchanged(jsonb, jsonb, jsonb, timestamptz)
  to authenticated;
