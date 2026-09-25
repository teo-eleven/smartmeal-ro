-- 0003_user_reminders.sql
--
-- When a user wants to be reminded to cook and to shop.
--
-- The reminders themselves are scheduled on the device: a phone knows what time it is even
-- with no signal, and a cooking reminder that needs a working connection is a cooking
-- reminder that fails on exactly the evening it matters. What lives here is the *choice*, so
-- it follows the user to a second phone the way their plan already does.
--
-- Run with:  supabase db push

create table if not exists public.user_reminders (
  user_id           uuid        primary key references auth.users (id) on delete cascade,

  cooking_enabled   boolean     not null default false,
  -- Local wall-clock time, as HH:MM. Stored as text on purpose: a `time` column invites the
  -- assumption that it is comparable across users, and 18:00 means something different in
  -- every timezone.
  cooking_time      text        not null default '17:30',

  shopping_enabled  boolean     not null default false,
  -- 0 = Monday, matching DayOfWeek order in src/types.
  shopping_weekday  smallint    not null default 5,
  shopping_time     text        not null default '10:00',

  updated_at        timestamptz not null default now(),
  created_at        timestamptz not null default now(),

  constraint user_reminders_cooking_time_format
    check (cooking_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  constraint user_reminders_shopping_time_format
    check (shopping_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  constraint user_reminders_weekday_range
    check (shopping_weekday between 0 and 6)
);

comment on table public.user_reminders is
  'Reminder preferences per user. The notifications themselves are scheduled on the device.';

alter table public.user_reminders enable row level security;

-- Same rule as every other table here: the anon key ships in the client bundle, so a row is
-- only ever reachable by the account it belongs to.
create policy "Users read their own reminders"
  on public.user_reminders for select
  using (auth.uid() = user_id);

create policy "Users create their own reminders"
  on public.user_reminders for insert
  with check (auth.uid() = user_id);

create policy "Users update their own reminders"
  on public.user_reminders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete their own reminders"
  on public.user_reminders for delete
  using (auth.uid() = user_id);

create or replace function public.set_reminders_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_reminders_updated_at on public.user_reminders;
create trigger user_reminders_updated_at
  before update on public.user_reminders
  for each row execute function public.set_reminders_updated_at();
