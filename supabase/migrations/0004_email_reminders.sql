-- 0004_email_reminders.sql
--
-- Email nudges, on top of the on-device ones.
--
-- Deliberately infrequent: every two or three days, never daily. A planner that emails every
-- morning gets muted, and a muted channel is worth less than no channel. The on-device
-- reminders are the ones that fire at dinner time; these are the ones that reach somebody who
-- has not opened the app in a while.
--
-- Nothing here sends anything. The sending is `supabase/functions/send-reminder-emails`,
-- which a scheduled job calls; this only records who wants them and when they were last sent.
--
-- Run with:  supabase db push

alter table public.user_reminders
  add column if not exists email_enabled boolean not null default false;

alter table public.user_reminders
  add column if not exists email_frequency_days smallint not null default 3;

-- Null means "never sent", which is what makes the first email due immediately.
alter table public.user_reminders
  add column if not exists last_email_sent_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_reminders_email_frequency_range'
  ) then
    alter table public.user_reminders
      add constraint user_reminders_email_frequency_range
      check (email_frequency_days between 2 and 7);
  end if;
end $$;

comment on column public.user_reminders.email_frequency_days is
  'Minimum days between emails. Floored at 2 by the check constraint: daily email is how a
   channel gets muted.';

-- The index the sending job reads on every run: who is due, cheaply.
create index if not exists user_reminders_email_due_idx
  on public.user_reminders (email_enabled, last_email_sent_at)
  where email_enabled;

/**
 * Everyone who should get an email now.
 *
 * `security definer` with a pinned search path, executable only by the service role: the
 * sending job runs as that, and nobody else has any business reading other people's
 * addresses. Joining auth.users here is why this cannot be a plain view with RLS.
 */
create or replace function public.reminders_due_for_email()
returns table (user_id uuid, email text, frequency_days smallint)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  return query
  select r.user_id, u.email::text, r.email_frequency_days
  from public.user_reminders r
  join auth.users u on u.id = r.user_id
  where r.email_enabled
    and u.email is not null
    -- Never sent, or the gap since the last one has passed.
    and (
      r.last_email_sent_at is null
      or now() - r.last_email_sent_at >= make_interval(days => r.email_frequency_days)
    );
end;
$$;

revoke all on function public.reminders_due_for_email() from public, anon, authenticated;

/** Marks an email as sent, so the next one is a frequency window away. */
create or replace function public.mark_reminder_email_sent(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.user_reminders
  set last_email_sent_at = now()
  where user_id = p_user_id;
end;
$$;

revoke all on function public.mark_reminder_email_sent(uuid) from public, anon, authenticated;
