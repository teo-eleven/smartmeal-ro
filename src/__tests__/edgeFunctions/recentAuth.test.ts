import {
  isRecentlyAuthenticated,
  RECENT_AUTH_SECONDS,
} from '../../../supabase/functions/_shared/recentAuth';

/**
 * delete-account used to accept any valid token, so anyone holding an unlocked phone could
 * erase the account. It now wants an authentication (password or emailed code) from the last
 * few minutes, read from the token's amr claim: when the person actually authenticated, not
 * when the token was last refreshed (iat), which happens on its own every hour.
 */
const NOW = 1_800_000_000;

function token(payload: Record<string, unknown>): string {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.signature`;
}

test('o autentificare de acum 2 minute e recentă', () => {
  const jwt = token({ iat: NOW, amr: [{ method: 'password', timestamp: NOW - 120 }] });

  expect(isRecentlyAuthenticated(jwt, NOW)).toBe(true);
});

test('una de acum o oră nu e, chiar dacă token-ul tocmai s-a reîmprospătat', () => {
  const jwt = token({ iat: NOW, amr: [{ method: 'password', timestamp: NOW - 3600 }] });

  expect(isRecentlyAuthenticated(jwt, NOW)).toBe(false);
});

test('contează cea mai nouă dintre metode (de exemplu codul pe email)', () => {
  const jwt = token({
    amr: [
      { method: 'password', timestamp: NOW - 7200 },
      { method: 'otp', timestamp: NOW - 60 },
    ],
  });

  expect(isRecentlyAuthenticated(jwt, NOW)).toBe(true);
});

test('chiar la limită e încă recentă, o secundă după nu', () => {
  const at = (age: number) => token({ amr: [{ method: 'password', timestamp: NOW - age }] });

  expect(isRecentlyAuthenticated(at(RECENT_AUTH_SECONDS), NOW)).toBe(true);
  expect(isRecentlyAuthenticated(at(RECENT_AUTH_SECONDS + 1), NOW)).toBe(false);
});

test('fără amr, cu amr stricat sau cu un token care nu e JWT: nu e recentă', () => {
  expect(isRecentlyAuthenticated(token({ iat: NOW }), NOW)).toBe(false);
  expect(isRecentlyAuthenticated(token({ amr: 'password' }), NOW)).toBe(false);
  expect(isRecentlyAuthenticated(token({ amr: [{ timestamp: 'ieri' }] }), NOW)).toBe(false);
  expect(isRecentlyAuthenticated('nu-e-un-jwt', NOW)).toBe(false);
});

test('o dată din viitor nu e acceptată', () => {
  const jwt = token({ amr: [{ method: 'password', timestamp: NOW + 600 }] });

  expect(isRecentlyAuthenticated(jwt, NOW)).toBe(false);
});
