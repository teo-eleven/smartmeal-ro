// Adds a Content-Security-Policy to the exported web build: `npm run build:web`.
//
// Not in public/index.html itself: that template also serves `expo start --web`, whose hot
// reload talks to a localhost websocket the policy would block. The policy goes into the
// files that ship, after `expo export`, and the build fails if a page carries an inline
// script, which script-src 'self' would silently break.
//
// Usage: node scripts/injectCsp.mjs <dist-dir>
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';

/** EXPO_PUBLIC_SUPABASE_URL from the environment or .env; any Supabase project otherwise. */
function supabaseOrigin() {
  let raw = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!raw && existsSync('.env')) {
    const line = readFileSync('.env', 'utf8')
      .split('\n')
      .find((l) => l.startsWith('EXPO_PUBLIC_SUPABASE_URL='));
    raw = line?.slice('EXPO_PUBLIC_SUPABASE_URL='.length).trim();
  }
  try {
    return raw ? new URL(raw).origin : null;
  } catch {
    return null;
  }
}

// Without a project the app runs locally and talks to no server. Never a wildcard such as
// https://*.supabase.co: that would let an injected script post data to anyone's project.
const supabase = supabaseOrigin();
if (!supabase)
  console.warn('WARN  EXPO_PUBLIC_SUPABASE_URL is not set: connect-src stays self only.');
const realtime = supabase ? supabase.replace(/^https:/, 'wss:') : '';
const servers = supabase ? ` ${supabase} ${realtime}` : '';

const APP_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  // react-native-web writes component styles into <style> tags at runtime.
  "style-src 'self' 'unsafe-inline'",
  // Recipe photos are hotlinked from Wikimedia Commons (ADR-20); a few archetypes from Unsplash.
  "img-src 'self' data: blob: https://upload.wikimedia.org https://images.unsplash.com",
  "font-src 'self' data:",
  `connect-src 'self'${servers}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const STATIC_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'unsafe-inline'",
  "img-src 'self' data:",
  supabase ? `connect-src ${supabase}` : "connect-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const PAGES = {
  'index.html': APP_POLICY,
  'delete-account.html': STATIC_POLICY,
  'unsubscribe.html': STATIC_POLICY,
};

let failed = false;
for (const [page, policy] of Object.entries(PAGES)) {
  const file = join(dist, page);
  if (!existsSync(file)) {
    console.error(`FAIL  ${file} is missing`);
    failed = true;
    continue;
  }
  let html = readFileSync(file, 'utf8');
  const inline = html.match(/<script(?![^>]*\bsrc=)[^>]*>/gi);
  if (inline) {
    console.error(`FAIL  ${page} has an inline script, which the policy would block: ${inline[0]}`);
    failed = true;
    continue;
  }
  html = html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/i, '');
  html = html.replace(
    /<head(\s[^>]*)?>/i,
    (head) => `${head}\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`
  );
  if (!html.includes(`content="${policy}"`)) {
    console.error(`FAIL  ${page}: no <head> to put the policy in`);
    failed = true;
    continue;
  }
  writeFileSync(file, html);
  console.log(`OK    ${page}`);
}
process.exit(failed ? 1 : 0);
