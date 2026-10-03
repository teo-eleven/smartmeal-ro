import { secureSessionStore } from './secureSessionStore';

/**
 * Asking a signed-in person to confirm it is them once a month.
 *
 * Supabase refreshes a session for as long as its refresh token is used, so without this a
 * phone signed in once stays signed in for good. The month is counted from the last real
 * sign-in — a password or an emailed code — and kept per account in the keychain (localStorage
 * on the web, as the session itself is).
 *
 * This is a lock on the device, not on the server: the session underneath stays valid. A
 * password or a code at the lock is a real sign-in again; Face ID or a fingerprint only
 * proves to this phone that its owner is holding it. See DECISIONS.md.
 */
export const REAUTH_INTERVAL_DAYS = 30;
const INTERVAL_MS = REAUTH_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
/** Clocks drift and time zones change; only a date further ahead than this is suspicious. */
const FUTURE_TOLERANCE_MS = 24 * 60 * 60 * 1000;

export interface AccountSecurity {
  lastFullAuthAt: number | null;
  biometricEnabled: boolean;
  /** The "Folosești Face ID data viitoare?" question has been answered, either way. */
  biometricAsked: boolean;
}

const NOTHING_SAVED: AccountSecurity = {
  lastFullAuthAt: null,
  biometricEnabled: false,
  biometricAsked: false,
};

export function isReauthDue(lastFullAuthAt: number | null, now: number): boolean {
  if (lastFullAuthAt === null) return true;
  // A clock set back would otherwise hold the lock off for as long as it stays wrong.
  if (lastFullAuthAt > now + FUTURE_TOLERANCE_MS) return true;
  return now - lastFullAuthAt >= INTERVAL_MS;
}

/**
 * The keychain key for an account. Hashed so the address itself is not written into key
 * names, and so it only uses the characters SecureStore accepts. Not a security measure.
 */
function keyFor(email: string): string {
  const text = email.trim().toLowerCase();
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `smartmeal.reauth.${(h2 >>> 0).toString(16)}${(h1 >>> 0).toString(16)}`;
}

function parse(raw: string | null): AccountSecurity {
  if (!raw) return NOTHING_SAVED;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return NOTHING_SAVED;
    const record = value as Record<string, unknown>;
    const at = record.lastFullAuthAt;
    // Anything malformed means nothing saved: the lock then comes sooner, never later.
    if (at !== null && (typeof at !== 'number' || !Number.isFinite(at))) return NOTHING_SAVED;
    return {
      lastFullAuthAt: at as number | null,
      biometricEnabled: record.biometricEnabled === true,
      biometricAsked: record.biometricAsked === true,
    };
  } catch {
    return NOTHING_SAVED;
  }
}

export async function readAccountSecurity(email: string): Promise<AccountSecurity> {
  return parse(await secureSessionStore.getItem(keyFor(email)));
}

async function update(email: string, change: Partial<AccountSecurity>): Promise<void> {
  const next = { ...(await readAccountSecurity(email)), ...change };
  await secureSessionStore.setItem(keyFor(email), JSON.stringify(next));
}

/** After a password, an emailed code, or a new account: the month starts again. */
export async function markFullAuth(email: string, now: number = Date.now()): Promise<void> {
  await update(email, { lastFullAuthAt: now });
}

export async function setBiometricEnabled(email: string, enabled: boolean): Promise<void> {
  await update(email, { biometricEnabled: enabled, biometricAsked: true });
}

export async function markBiometricAsked(email: string): Promise<void> {
  await update(email, { biometricAsked: true });
}

export async function forgetAccountSecurity(email: string): Promise<void> {
  await secureSessionStore.removeItem(keyFor(email));
}

/**
 * What the app does at start for a signed-in account. An account with no date saved was
 * signed in before this check existed; its month starts now rather than locking somebody
 * out because they updated the app.
 */
export async function checkReauth(email: string, now: number = Date.now()): Promise<'ok' | 'due'> {
  const { lastFullAuthAt } = await readAccountSecurity(email);
  if (lastFullAuthAt === null) {
    await markFullAuth(email, now);
    return 'ok';
  }
  return isReauthDue(lastFullAuthAt, now) ? 'due' : 'ok';
}
