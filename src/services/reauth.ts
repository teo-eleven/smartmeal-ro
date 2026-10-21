import { secureSessionStore } from './secureSessionStore';
import { warnSafely } from './authErrors';

/**
 * Asking a signed-in person to confirm it is them once a month.
 *
 * Supabase refreshes a session for as long as its refresh token is used, so without this a
 * phone signed in once stays signed in for good. The month is counted from the last
 * verification — a password, an emailed code, a new account, or Face ID / a fingerprint at
 * the monthly lock — and kept per account in the keychain (localStorage on the web, as the
 * session itself is).
 *
 * Biometrics renew the month on purpose: the point of turning them on is not typing the
 * password every thirty days. It is a lock on the device, not on the server; the session
 * underneath stays valid throughout. See docs/DECISIONS.md.
 *
 * The services that sign somebody in call markVerified themselves (supabase.ts, authCode.ts),
 * so no screen can open a session without starting the count.
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

/**
 * 'absent': nothing was ever stored — an account signed in before this check existed.
 * 'unusable': something is stored but cannot be trusted, or the keychain would not open.
 * The two must not be confused: only the first earns a fresh month.
 */
type Stored =
  { status: 'saved'; value: AccountSecurity } | { status: 'absent' } | { status: 'unusable' };

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
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `smartmeal.reauth.${hex(h2)}${hex(h1)}`;
}

function parse(raw: string): AccountSecurity | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const record = value as Record<string, unknown>;
    const at = record.lastFullAuthAt;
    if (at !== null && (typeof at !== 'number' || !Number.isFinite(at))) return null;
    return {
      lastFullAuthAt: at,
      biometricEnabled: record.biometricEnabled === true,
      biometricAsked: record.biometricAsked === true,
    };
  } catch {
    return null;
  }
}

async function readStored(email: string): Promise<Stored> {
  try {
    const raw = await secureSessionStore.getItemOrThrow(keyFor(email));
    if (raw === null) return { status: 'absent' };
    const value = parse(raw);
    return value ? { status: 'saved', value } : { status: 'unusable' };
  } catch (e) {
    warnSafely('Datele de reverificare nu au putut fi citite.', e);
    return { status: 'unusable' };
  }
}

/** For the screens: what to show. Anything unreadable shows as nothing saved. */
export async function readAccountSecurity(email: string): Promise<AccountSecurity> {
  const stored = await readStored(email);
  return stored.status === 'saved' ? stored.value : NOTHING_SAVED;
}

/**
 * Read, merge and write for one account at a time. Without the queue, a verification and a
 * biometric choice saved at the same moment could each overwrite the other's field.
 */
const pending = new Map<string, Promise<void>>();

function update(email: string, change: Partial<AccountSecurity>): Promise<void> {
  const key = keyFor(email);
  const previous = pending.get(key) ?? Promise.resolve();
  const next = previous.then(async () => {
    const current = await readAccountSecurity(email);
    await secureSessionStore.setItem(key, JSON.stringify({ ...current, ...change }));
  });
  const settled = next.catch(() => undefined);
  pending.set(key, settled);
  void settled.then(() => {
    if (pending.get(key) === settled) pending.delete(key);
  });
  return next;
}

/**
 * Verifications made while the app is running, by account key. The keychain is the record;
 * this only covers a keychain that cannot be read back, where a correct password would
 * otherwise leave the lock in place for good. It is gone at the next start, so it never
 * extends the month on its own.
 */
const verifiedThisRun = new Map<string, number>();

/** Tests only: what a restart of the app does to verifiedThisRun. */
export function forgetThisRunForTests(): void {
  verifiedThisRun.clear();
}

/** A password, an emailed code, a new account, or biometrics at the lock: the month restarts. */
export async function markVerified(email: string, now: number = Date.now()): Promise<void> {
  verifiedThisRun.set(keyFor(email), now);
  await update(email, { lastFullAuthAt: now });
}

/**
 * markVerified for the sign-in services: a keychain that will not write is logged, never
 * allowed to fail the sign-in itself. The next start then finds nothing stored and starts the
 * month there.
 */
export async function recordVerification(email: string | null | undefined): Promise<void> {
  if (!email) return;
  try {
    await markVerified(email);
  } catch (e) {
    warnSafely('Data verificării nu a putut fi salvată.', e);
  }
}

export async function setBiometricEnabled(email: string, enabled: boolean): Promise<void> {
  await update(email, { biometricEnabled: enabled, biometricAsked: true });
}

export async function markBiometricAsked(email: string): Promise<void> {
  await update(email, { biometricAsked: true });
}

export async function forgetAccountSecurity(email: string): Promise<void> {
  verifiedThisRun.delete(keyFor(email));
  await secureSessionStore.removeItem(keyFor(email));
}

/**
 * What the app does at start for a signed-in account. Nothing stored means an account signed
 * in before this check existed: its month starts now, rather than locking somebody out for
 * updating the app. Anything stored but unusable — or a keychain that will not open — locks:
 * a damaged record must never be a way past the check.
 */
export async function checkReauth(email: string, now: number = Date.now()): Promise<'ok' | 'due'> {
  const stored = await readStored(email);
  if (stored.status === 'absent') {
    // A keychain that reads but will not write would lock this account for good if this
    // answered 'due': no verification could ever be saved to lift it. Let it through, and
    // say so in the log.
    await markVerified(email, now).catch((e) =>
      warnSafely('Data verificării nu a putut fi salvată.', e)
    );
    return 'ok';
  }
  const inMemory = verifiedThisRun.get(keyFor(email)) ?? null;
  if (inMemory !== null && !isReauthDue(inMemory, now)) return 'ok';
  if (stored.status === 'unusable') return 'due';
  return isReauthDue(stored.value.lastFullAuthAt, now) ? 'due' : 'ok';
}
