// Applies every migration in supabase/migrations to a real Postgres (PGlite, in memory) over
// a minimal stand-in for Supabase's auth schema, then checks the access rules the app relies
// on: who may read and write profiles, devices and consents. `npm run test:sql`.
//
// The stand-in is not Supabase. It proves the SQL is valid and the grants and policies do
// what they say; it cannot prove that the hosted project lets a definer function delete from
// auth.sessions — that needs one run against a real project (see supabase/README.md).
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../supabase/migrations/', import.meta.url));
const MIGRATIONS = readdirSync(ROOT)
  .filter((f) => f.endsWith('.sql'))
  .sort();
const db = new PGlite();
let failures = 0;

function check(label, ok, detail = '') {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
}

async function expectError(label, sql, pattern, code) {
  try {
    await db.exec(sql);
    check(label, false, 'no error raised');
  } catch (e) {
    const codeOk = code === undefined || e.code === code;
    check(label, pattern.test(e.message) && codeOk, `${e.code}: ${e.message}`);
  }
}

const U1 = '11111111-1111-1111-1111-111111111111';
const U2 = '22222222-2222-2222-2222-222222222222';
const S1 = 'aaaaaaaa-0000-0000-0000-000000000001'; // U1's phone
const S2 = 'aaaaaaaa-0000-0000-0000-000000000002'; // U1's laptop
const S3 = 'aaaaaaaa-0000-0000-0000-000000000003'; // U1's laptop, signed in again
const D1 = 'dddddddd-0000-0000-0000-000000000001';
const D2 = 'dddddddd-0000-0000-0000-000000000002';

/** Act as a signed-in client: role authenticated, with these JWT claims. */
const as = (user, session) => `
  reset role;
  select set_config('request.jwt.claims', '${JSON.stringify({ sub: user, session_id: session })}', false);
  set role authenticated;`;

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, raw_user_meta_data jsonb);
  create table auth.sessions (id uuid primary key, user_id uuid references auth.users(id) on delete cascade);
  create table auth.refresh_tokens (id serial primary key, session_id uuid references auth.sessions(id) on delete cascade);
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on all functions in schema auth to anon, authenticated;
  -- What Supabase grants by default on everything new in public; the migrations must take
  -- back whatever they do not mean to allow.
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`);

const OLD = '44444444-4444-4444-4444-444444444444';
await db.exec(`insert into auth.users values ('${OLD}', null)`);
for (const file of MIGRATIONS) {
  try {
    await db.exec(readFileSync(`${ROOT}/${file}`, 'utf8'));
    check(`${file} applies`, true);
  } catch (e) {
    check(`${file} applies`, false, e.message);
    process.exit(1);
  }
}
let b = await db.query(`select count(*)::int as n from public.profiles where user_id = '${OLD}'`);
check('existing accounts are backfilled with a profile', b.rows[0].n === 1);
await db.exec(`delete from auth.users where id = '${OLD}'`);

// --- profiles ---
await db.exec(`
  insert into auth.users values ('${U1}', '{"display_name": "  Ana Popescu  "}');
  insert into auth.users values ('${U2}', '{"display_name": "${'x'.repeat(80)}"}');
`);
let r = await db.query(`select user_id, display_name from public.profiles order by user_id`);
check(
  'trigger creates a trimmed profile',
  r.rows[0]?.display_name === 'Ana Popescu',
  r.rows[0]?.display_name
);
check('an over-long name is cut, sign-up not failed', r.rows[1]?.display_name?.length === 60);

await db.exec(`insert into auth.users values ('33333333-3333-3333-3333-333333333333', null)`);
r = await db.query(
  `select display_name from public.profiles where user_id = '33333333-3333-3333-3333-333333333333'`
);
check(
  'no metadata gives a profile with no name',
  r.rows.length === 1 && r.rows[0].display_name === null
);

await db.exec(as(U1, S1));
r = await db.query(`select user_id from public.profiles`);
await expectError(
  'whitespace-only name rejected',
  `${as(U1, S1)} update public.profiles set display_name = '   '`,
  /check constraint/
);
await db.exec(as(U1, S1));
check('a user sees only their own profile', r.rows.length === 1 && r.rows[0].user_id === U1);
await db.exec(`update public.profiles set display_name = 'Ana' where user_id = '${U1}'`);
await db.exec(`update public.profiles set display_name = 'Hacked' where user_id = '${U2}'`);
await db.exec('reset role');
r = await db.query(
  `select user_id, display_name, updated_at > now() - interval '1 minute' as fresh from public.profiles order by user_id`
);
check('owner can rename themselves', r.rows[0].display_name === 'Ana' && r.rows[0].fresh);
check('owner cannot rename somebody else', r.rows[1].display_name.length === 60);

await expectError(
  'owner cannot insert a profile',
  `${as(U1, S1)} insert into public.profiles (user_id) values ('${U2}')`,
  /permission denied/
);
await expectError(
  'owner cannot change user_id',
  `${as(U1, S1)} update public.profiles set user_id = '${U2}'`,
  /permission denied/
);
await expectError(
  'owner cannot delete their profile',
  `${as(U1, S1)} delete from public.profiles`,
  /permission denied/
);
await expectError(
  'empty name rejected by check',
  `${as(U1, S1)} update public.profiles set display_name = ''`,
  /check constraint/
);

// --- user_devices ---
await db.exec(`reset role; insert into auth.sessions values ('${S1}', '${U1}'), ('${S2}', '${U1}');
  insert into auth.refresh_tokens (session_id) values ('${S1}'), ('${S2}');`);
await db.exec(`${as(U1, S1)} select public.register_device('${D1}', 'iPhone', 'ios');`);
await db.exec(`${as(U1, S2)} select public.register_device('${D2}', 'Laptop (web)', 'web');`);
r = await db.query(`select device_id, session_id from public.user_devices order by device_id`);
check(
  'two devices registered with sessions from the JWT',
  r.rows.length === 2 && r.rows[0].session_id === S1 && r.rows[1].session_id === S2
);

await expectError(
  'direct insert refused',
  `${as(U1, S1)} insert into public.user_devices (user_id, device_id, device_name, platform) values ('${U1}', gen_random_uuid(), 'x', 'ios')`,
  /permission denied/
);
await expectError(
  'bad platform refused',
  `${as(U1, S1)} select public.register_device('${D1}', 'x', 'windows')`,
  /invalid device/
);
await expectError(
  'null platform refused',
  `${as(U1, S1)} select public.register_device('${D1}', 'x', null)`,
  /invalid device/
);
await expectError(
  'a session that does not exist cannot register',
  `${as(U1, 'aaaaaaaa-0000-0000-0000-00000000dead')} select public.register_device('${D1}', 'x', 'ios')`,
  /session ended/,
  'SM001'
);
await expectError(
  'anon cannot register',
  `reset role; select set_config('request.jwt.claims', '', false); set role anon; select public.register_device('${D1}', 'x', 'ios')`,
  /permission denied/
);
await expectError(
  'cannot revoke the current device',
  `${as(U1, S1)} select public.revoke_device('${D1}')`,
  /current device/,
  'SM003'
);
await expectError(
  'another user cannot revoke it',
  `${as(U2, S3)} select public.revoke_device('${D2}')`,
  /no such device/,
  'SM002'
);

await db.exec(`${as(U1, S1)} select public.revoke_device('${D2}');`);
await db.exec('reset role');
r = await db.query(`select (select count(*) from auth.sessions where id = '${S2}')::int as sessions,
  (select count(*) from auth.refresh_tokens where session_id = '${S2}')::int as tokens,
  (select revoked_at is not null from public.user_devices where device_id = '${D2}') as revoked,
  (select count(*) from auth.sessions where id = '${S1}')::int as own_session`);
check(
  'revoke deletes the session and its refresh tokens',
  r.rows[0].sessions === 0 && r.rows[0].tokens === 0
);
check('revoke marks the device', r.rows[0].revoked === true);
check("revoke leaves the caller's own session", r.rows[0].own_session === 1);

await expectError(
  'the revoked session cannot check back in',
  `${as(U1, S2)} select public.register_device('${D2}', 'Laptop (web)', 'web')`,
  /session ended/,
  'SM001'
);
await expectError(
  'nor reappear under a new device id',
  `${as(U1, S2)} select public.register_device(gen_random_uuid(), 'Laptop (web)', 'web')`,
  /session ended/,
  'SM001'
);
await expectError(
  'revoking twice is refused',
  `${as(U1, S1)} select public.revoke_device('${D2}')`,
  /no such device/,
  'SM002'
);
await db.exec('reset role');
r = await db.query(
  `select revoked_at is not null as revoked from public.user_devices where device_id = '${D2}'`
);
check('the device stays revoked', r.rows[0].revoked === true);

await db.exec(`reset role; insert into auth.sessions values ('${S3}', '${U1}');`);
await db.exec(`${as(U1, S3)} select public.register_device('${D2}', 'Laptop (web)', 'web');`);
r = await db.query(
  `select revoked_at is null as active, session_id from public.user_devices where device_id = '${D2}'`
);
check(
  'signing in again on it clears the mark',
  r.rows[0].active === true && r.rows[0].session_id === S3
);

// Signing out on this device removes its own row and nothing else.
await db.exec(`${as(U1, S3)} select public.forget_this_device();`);
await db.exec('reset role');
r = await db.query(
  `select (select count(*) from public.user_devices where session_id = '${S3}')::int as own,
          (select count(*) from public.user_devices where user_id = '${U1}')::int as total`
);
check(
  'forget_this_device removes only the caller’s own row',
  r.rows[0].own === 0 && r.rows[0].total === 1,
  JSON.stringify(r.rows[0])
);
await expectError(
  'anon cannot call forget_this_device',
  `reset role; select set_config('request.jwt.claims', '', false); set role anon; select public.forget_this_device()`,
  /permission denied/
);
await db.exec(`${as(U1, S3)} select public.register_device('${D2}', 'Laptop (web)', 'web');`);

// A name that would render as another device's is cleaned before it is stored.
await db.exec(
  `${as(U1, S3)} select public.register_device('${D2}', E'Chrome\\u202E caM ep\\u200B', 'web');`
);
await db.exec('reset role');
r = await db.query(`select device_name from public.user_devices where device_id = '${D2}'`);
check(
  'control and direction characters are stripped from device names',
  r.rows[0].device_name === 'Chrome caM ep',
  JSON.stringify(r.rows[0].device_name)
);

// One session moving to another device id leaves one row, not two.
await db.exec(
  `${as(U1, S3)} select public.register_device('dddddddd-0000-0000-0000-0000000000ff', 'Laptop nou', 'web');`
);
await db.exec('reset role');
r = await db.query(`select count(*)::int as n from public.user_devices where session_id = '${S3}'`);
check('one session is one device', r.rows[0].n === 1);

// The cap: 25 sessions registering as 25 devices leave 20 rows, the newest included.
await db.exec(`reset role; delete from public.user_devices where user_id = '${U1}';`);
for (let i = 0; i < 25; i += 1) {
  const sid = `bbbbbbbb-0000-0000-0000-${String(i).padStart(12, '0')}`;
  const did = `cccccccc-0000-0000-0000-${String(i).padStart(12, '0')}`;
  await db.exec(`reset role; insert into auth.sessions values ('${sid}', '${U1}');`);
  await db.exec(
    `${as(U1, sid)} select public.register_device('${did}', 'Dispozitiv ${i}', 'web');`
  );
}
await db.exec('reset role');
r = await db.query(
  `select count(*)::int as n, bool_or(device_name = 'Dispozitiv 24') as newest, bool_or(device_name = 'Dispozitiv 0') as oldest from public.user_devices where user_id = '${U1}'`
);
check(
  'at most 20 devices, the newest kept, the oldest dropped',
  r.rows[0].n === 20 && r.rows[0].newest && !r.rows[0].oldest,
  JSON.stringify(r.rows[0])
);

await db.exec(`${as(U2, S3)}`);
r = await db.query(`select count(*)::int as n from public.user_devices`);
check("a user cannot read another user's devices", r.rows[0].n === 0);

// --- consents (0005, tightened by 0008) ---
await expectError(
  'a user cannot truncate consents',
  `${as(U1, S1)} truncate public.user_consents`,
  /permission denied/
);
await expectError(
  'the consent trigger function is not callable',
  `${as(U1, S1)} select public.record_signup_consent()`,
  /permission denied/
);
await expectError(
  'the profile trigger function is not callable',
  `${as(U1, S1)} select public.create_profile_from_metadata()`,
  /permission denied/
);

// --- plans: save only if unchanged (0009) ---
const save = (expected) =>
  `select status, updated_at::text as v from public.save_meal_plan_if_unchanged('{"days":[]}'::jsonb, '[]'::jsonb, null, ${expected === null ? 'null' : `'${expected}'`})`;
await db.exec(as(U1, S1));
r = await db.query(save(null));
check('first save of a plan is written', r.rows[0]?.status === 'saved', r.rows[0]?.status);
const v1 = r.rows[0].v;
r = await db.query(save(null));
check('a device that never saw the cloud plan gets a conflict', r.rows[0]?.status === 'conflict');
await db.exec('reset role');
await db.exec(
  `update public.user_meal_plans set updated_at = now() + interval '1 second' where user_id = '${U1}'`
);
await db.exec(as(U1, S1));
r = await db.query(save(v1));
check('a stale version gets a conflict, not an overwrite', r.rows[0]?.status === 'conflict');
const v2 = r.rows[0].v;
r = await db.query(save(v2));
check('the current version is written', r.rows[0]?.status === 'saved');
await db.exec(as(U2, S3));
r = await db.query(`select count(*)::int as n from public.user_meal_plans`);
check("a user cannot see another user's plan", r.rows[0].n === 0);
r = await db.query(save(null));
check('each user saves only their own row', r.rows[0]?.status === 'saved');
await expectError(
  'anon cannot call the plan save',
  `reset role; set role anon; ${save(null)}`,
  /permission denied/
);
await db.exec('reset role');

// --- recipe notes (0010) ---
await db.exec(
  `${as(U1, S1)} insert into public.user_recipe_notes (user_id, recipe_id, note) values ('${U1}', 'ciorba', 'leuștean')`
);
await db.exec(as(U2, S3));
r = await db.query(`select count(*)::int as n from public.user_recipe_notes`);
check("a user cannot read another user's notes", r.rows[0].n === 0);
await expectError(
  "a user cannot write a note into another user's account",
  `${as(U2, S3)} insert into public.user_recipe_notes (user_id, recipe_id, note) values ('${U1}', 'sarmale', 'x')`,
  /row-level security/
);
await expectError(
  'an empty note is refused',
  `${as(U1, S1)} insert into public.user_recipe_notes (user_id, recipe_id, note) values ('${U1}', 'sarmale', '   ')`,
  /check constraint/
);
await expectError(
  'a note over 2000 characters is refused',
  `${as(U1, S1)} insert into public.user_recipe_notes (user_id, recipe_id, note) values ('${U1}', 'sarmale', '${'x'.repeat(2001)}')`,
  /check constraint/
);
await expectError(
  'a recipe id that is not a slug is refused',
  `${as(U1, S1)} insert into public.user_recipe_notes (user_id, recipe_id, note) values ('${U1}', '../etc', 'x')`,
  /check constraint/
);
await expectError(
  'anon cannot read notes',
  `reset role; set role anon; select * from public.user_recipe_notes`,
  /permission denied/
);
await db.exec('reset role');

await db.exec(`reset role; delete from auth.users where id = '${U1}';`);
r = await db.query(`select (select count(*) from public.profiles where user_id = '${U1}')::int as p,
  (select count(*) from public.user_devices where user_id = '${U1}')::int as d,
  (select count(*) from public.user_recipe_notes where user_id = '${U1}')::int as n`);
check(
  'deleting the account cascades profile, devices and notes',
  r.rows[0].p === 0 && r.rows[0].d === 0 && r.rows[0].n === 0
);

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
