/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Loads `.env.test`, the local test database's keys (written from `supabase status`), before
 * any app module reads process.env. Refuses to run against anything but this machine, so a
 * mistyped file can never point the sync tests at a real project.
 */
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '..', '..', '..', '.env.test');
const LOOPBACK_URL = /^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/;

if (!fs.existsSync(ENV_FILE)) {
  throw new Error(
    '.env.test lipsește. Pornește baza locală (npm run db:start) și generează fișierul ' +
      'după pasul 0.3 din docs/HEALTH_CRAVINGS_STEPS.md.'
  );
}

fs.readFileSync(ENV_FILE, 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .forEach((line) => {
    const at = line.indexOf('=');
    process.env[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  });

if (!LOOPBACK_URL.test(process.env.EXPO_PUBLIC_SUPABASE_URL || '')) {
  throw new Error(
    'Testele de sync rulează doar pe baza locală (http://127.0.0.1:54321), nu pe ' +
      `"${process.env.EXPO_PUBLIC_SUPABASE_URL}".`
  );
}
