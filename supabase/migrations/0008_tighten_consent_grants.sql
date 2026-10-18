-- 0005 revoked insert, update and delete on user_consents, but Supabase's default privileges
-- also hand anon and authenticated truncate, references and trigger on every new table, and
-- execute on every new function. PostgREST exposes none of those, so nothing was reachable;
-- this makes the grants say what 0005 meant: the owner reads their consent, nobody else does
-- anything with it, and the trigger function is not callable on its own.

revoke all on public.user_consents from anon, authenticated;
grant select on public.user_consents to authenticated;

revoke all on function public.record_signup_consent() from public, anon, authenticated;
