-- 0001_user_meal_plans.sql
--
-- The table src/services/supabase.ts has always expected. It existed only in that file's
-- .from('user_meal_plans') calls, so anyone deploying had to reverse-engineer it from code.
--
-- Run with:  supabase db push
-- Or paste into the SQL editor of the project dashboard.

create table if not exists public.user_meal_plans (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  plan_data     jsonb       not null,
  grocery_items jsonb       not null default '[]'::jsonb,
  -- Diet and allergies live here so they follow the user across devices. An allergy that
  -- only exists on one phone is the kind of gap this column is meant to close.
  preferences   jsonb,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

comment on table public.user_meal_plans is
  'One saved weekly plan per user. Written by cloudSyncService.saveMealPlan (upsert on user_id).';
comment on column public.user_meal_plans.preferences is
  'UserPreferences, including avoidedAllergens and dietTypes. Null for rows written before this column existed.';

-- saveMealPlan upserts with onConflict: 'user_id'; the primary key above is what makes that work.

-- A row is one week's plan. Without a ceiling an authenticated user can upsert multi-megabyte
-- blobs in a loop and turn their own row into a storage bill. 256 KB is far above any real
-- plan: a full seven-day, three-meal week serialises to a few tens of kilobytes.
alter table public.user_meal_plans
  add constraint user_meal_plans_plan_data_size
  check (pg_column_size(plan_data) <= 262144);

alter table public.user_meal_plans
  add constraint user_meal_plans_grocery_items_size
  check (pg_column_size(grocery_items) <= 262144);

alter table public.user_meal_plans
  add constraint user_meal_plans_preferences_size
  check (pg_column_size(preferences) <= 65536);

alter table public.user_meal_plans enable row level security;

-- Without these policies the anon key, which ships in the client bundle, would be able to
-- read every user's plan. Each user may only ever touch their own row.
drop policy if exists "own rows: select" on public.user_meal_plans;
create policy "own rows: select"
  on public.user_meal_plans for select
  using (auth.uid() = user_id);

drop policy if exists "own rows: insert" on public.user_meal_plans;
create policy "own rows: insert"
  on public.user_meal_plans for insert
  with check (auth.uid() = user_id);

drop policy if exists "own rows: update" on public.user_meal_plans;
create policy "own rows: update"
  on public.user_meal_plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own rows: delete" on public.user_meal_plans;
create policy "own rows: delete"
  on public.user_meal_plans for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_meal_plans_set_updated_at on public.user_meal_plans;
create trigger user_meal_plans_set_updated_at
  before update on public.user_meal_plans
  for each row execute function public.set_updated_at();
