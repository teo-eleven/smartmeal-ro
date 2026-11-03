// Writes .env.test from the running local test database (`npm run db:start`), so the sync
// tests (`npm run test:sync`) reach it and nothing else. Used on this machine and in CI.
// The keys are the Supabase CLI's fixed local development keys, never a real project's.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../.env.test', import.meta.url));
const LOOPBACK_URL = /^http:\/\/(127\.0\.0\.1|localhost):\d+$/;

const raw = execFileSync('npx', ['supabase', 'status', '-o', 'json'], { encoding: 'utf8' });
const status = JSON.parse(raw.slice(raw.indexOf('{')));

if (!LOOPBACK_URL.test(status.API_URL ?? '')) {
  throw new Error(
    `Refusing to write .env.test for a database that is not local: ${status.API_URL}`
  );
}

const lines = [
  '# Local test database only (npm run db:start). Never put the real project keys here.',
  '# Written by scripts/writeTestEnv.mjs from `supabase status`.',
  'EXPO_PUBLIC_APP_ENV=development',
  `EXPO_PUBLIC_SUPABASE_URL=${status.API_URL}`,
  `EXPO_PUBLIC_SUPABASE_ANON_KEY=${status.ANON_KEY}`,
  '# For the sync tests to create and delete test users. Not EXPO_PUBLIC_: never bundled.',
  `SUPABASE_TEST_SERVICE_ROLE_KEY=${status.SERVICE_ROLE_KEY}`,
  `SUPABASE_TEST_DB_URL=${status.DB_URL}`,
  `SUPABASE_TEST_MAILPIT_URL=${status.MAILPIT_URL}`,
  '',
];

writeFileSync(OUT, lines.join('\n'), { mode: 0o600 });
console.log(`.env.test written for ${status.API_URL}`);
