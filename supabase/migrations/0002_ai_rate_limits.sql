-- 0002_ai_rate_limits.sql
--
-- A rate limit the Gemini proxy can actually rely on.
--
-- The proxy previously counted calls in a Map inside the Deno isolate. Supabase recycles and
-- horizontally scales isolates, so that cap was really "20 per minute per isolate", and the
-- key was the client-supplied X-Forwarded-For header, which an attacker rotates per request.
-- Between the two, the limit could be walked past entirely — on a project's own Gemini bill.
--
-- Counting here instead means one shared counter, keyed on the authenticated user id, which
-- a caller cannot forge.
--
-- Run with:  supabase db push

create table if not exists public.ai_rate_limits (
  user_id      uuid        primary key references auth.users (id) on delete cascade,
  window_start timestamptz not null default now(),
  call_count   integer     not null default 0
);

comment on table public.ai_rate_limits is
  'One row per user, holding the current rate-limit window for the Gemini proxy.';

alter table public.ai_rate_limits enable row level security;

-- No policies at all: only the service role, which bypasses RLS, ever touches this table.
-- The anon key ships in the client bundle, so a user being able to read or reset their own
-- counter would make the limit meaningless.

/**
 * Counts one call and says whether the caller has gone over.
 *
 * `security definer` so it runs as the owner regardless of who calls it, and the search path
 * is pinned because a mutable one is the classic way a definer function gets hijacked.
 */
create or replace function public.register_ai_call(
  p_user_id uuid,
  p_limit    integer default 20,
  p_window   interval default interval '1 minute'
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  insert into public.ai_rate_limits as l (user_id, window_start, call_count)
  values (p_user_id, now(), 1)
  on conflict (user_id) do update
    set
      -- A window that has expired starts over; otherwise the count grows.
      window_start = case when now() - l.window_start > p_window then now() else l.window_start end,
      call_count   = case when now() - l.window_start > p_window then 1 else l.call_count + 1 end
  returning call_count into v_count;

  return v_count > p_limit;
end;
$$;

revoke all on function public.register_ai_call(uuid, integer, interval) from public, anon, authenticated;

-- Keeps the table from growing without bound as users come and go.
create index if not exists ai_rate_limits_window_start_idx
  on public.ai_rate_limits (window_start);
