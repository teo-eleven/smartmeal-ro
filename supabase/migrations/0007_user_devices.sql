-- The phones and browsers signed in to an account, so its owner can see them and sign one
-- out from another ("Deconectează" in Cont → Dispozitive).
--
-- The Supabase client cannot list or end another session, so each device records itself
-- here with the id of the session it holds. Signing a device out deletes that session, which
-- takes its refresh tokens with it (auth.refresh_tokens.session_id cascades): the device's
-- next token refresh fails and supabase-js signs it out. Its current access token stays
-- valid until it expires, at most an hour; the app also reads revoked_at when it starts and
-- when it comes back to the foreground, to sign out sooner.
--
-- Nobody writes this table directly. Both writers are functions below that take the user
-- and the session from the caller's JWT, never from arguments, so a device cannot record
-- itself under somebody else's account or claim somebody else's session.

create table if not exists public.user_devices (
  user_id       uuid        not null references auth.users (id) on delete cascade,
  -- Generated once per install and kept in the keychain. The same phone used by two
  -- accounts in turn is two rows, one per account, hence the composite key.
  device_id     uuid        not null,
  device_name   text        not null check (char_length(device_name) between 1 and 60),
  platform      text        not null check (platform in ('ios', 'android', 'web')),
  session_id    uuid        not null,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  revoked_at    timestamptz,
  primary key (user_id, device_id),
  -- One session is one device. Without this a caller could file the same session under two
  -- device ids, and revoking one row would silently end the other.
  unique (user_id, session_id)
);

comment on table public.user_devices is
  'Written only by register_device and revoke_device. Readable by its owner.';

alter table public.user_devices enable row level security;

create policy "Users read their own devices"
  on public.user_devices for select
  using (auth.uid() = user_id);

-- Supabase's default privileges hand anon and authenticated everything on a new table,
-- truncate and trigger included. Take it all back and give only what the policy is for.
revoke all on public.user_devices from anon, authenticated;
grant select on public.user_devices to authenticated;

create or replace function public.register_device(
  p_device_id uuid,
  p_name text,
  p_platform text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Enough for every phone, tablet and browser a household could plausibly use.
  max_devices constant int := 20;
  caller uuid := auth.uid();
  caller_session uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
  clean_name text := nullif(left(btrim(coalesce(p_name, '')), 60), '');
begin
  if caller is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  if p_device_id is null or p_platform is null or p_platform not in ('ios', 'android', 'web') then
    raise exception 'invalid device' using errcode = '22023';
  end if;
  -- A device signed out from elsewhere keeps a working access token for up to an hour. Its
  -- session is gone by then, and this is what stops it checking back in — under its own id
  -- or a fresh one — and showing up in the list as signed in.
  if caller_session is null or not exists (
    select 1 from auth.sessions s where s.id = caller_session and s.user_id = caller
  ) then
    raise exception 'session ended' using errcode = '42501';
  end if;

  -- This session now belongs to this device; any other row claiming it is stale.
  delete from public.user_devices
  where user_id = caller and session_id = caller_session and device_id <> p_device_id;

  -- At the cap, make room by dropping the rows least likely to matter: signed out first,
  -- then the longest unseen. A new device is never refused for an old one's sake.
  if not exists (
    select 1 from public.user_devices where user_id = caller and device_id = p_device_id
  ) then
    delete from public.user_devices
    where user_id = caller and device_id in (
      select d.device_id from public.user_devices d
      where d.user_id = caller
      order by (d.revoked_at is null), d.last_seen_at
      limit greatest(
        (select count(*) from public.user_devices where user_id = caller) - (max_devices - 1),
        0
      )
    );
  end if;

  insert into public.user_devices (user_id, device_id, device_name, platform, session_id)
  values (caller, p_device_id, coalesce(clean_name, 'Dispozitiv'), p_platform, caller_session)
  on conflict (user_id, device_id) do update
    set device_name  = excluded.device_name,
        platform     = excluded.platform,
        session_id   = excluded.session_id,
        last_seen_at = now(),
        -- The session was checked above, so a different one here means the person signed
        -- in again on this device: whatever revoked the old session no longer applies.
        revoked_at   = case
                         when public.user_devices.session_id = excluded.session_id
                           then public.user_devices.revoked_at
                         else null
                       end;
end;
$$;

-- Runs as the migration's owner so it can end a session in auth.sessions, which no client
-- role can touch. That table is Supabase's own, not a documented API: if a platform update
-- moves it, this is the one place to change (or move into an edge function using the
-- service role, as delete-account does).
create or replace function public.revoke_device(p_device_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  current_session uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
  target_session uuid;
begin
  if caller is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  -- Locked so a check-in from that device cannot swap its session between this read and
  -- the delete below.
  select d.session_id into target_session
  from public.user_devices d
  where d.user_id = caller and d.device_id = p_device_id and d.revoked_at is null
  for update;

  if not found then
    raise exception 'no such device' using errcode = 'P0002';
  end if;
  -- "Deconectare" in the same panel signs this device out properly; revoking the session
  -- in use would leave the app holding tokens that fail at an arbitrary moment.
  if target_session = current_session then
    raise exception 'cannot revoke the current device' using errcode = '22023';
  end if;

  delete from auth.sessions s where s.id = target_session and s.user_id = caller;

  update public.user_devices
  set revoked_at = now()
  where user_id = caller and device_id = p_device_id;
end;
$$;

revoke all on function public.register_device(uuid, text, text) from public, anon, authenticated;
revoke all on function public.revoke_device(uuid) from public, anon, authenticated;
grant execute on function public.register_device(uuid, text, text) to authenticated;
grant execute on function public.revoke_device(uuid) to authenticated;
