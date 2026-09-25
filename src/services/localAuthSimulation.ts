import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '../../config/env';

/**
 * A stand-in for Supabase auth, so the sign-in gate can be walked through on a laptop with no
 * project configured.
 *
 * Accounts live in AsyncStorage on this device and go no further. It exists because the gate
 * is the first thing a user sees, and a screen nobody can get past is a screen nobody tests.
 *
 * It refuses to run in a production build, and refuses to run at all once real credentials
 * are present — a simulation that could take over from the real thing is a back door, not a
 * convenience.
 *
 * The password is stored hashed rather than in the clear. That is not a security claim: this
 * is a laptop simulation and anyone who can read the storage can do anything. It is here so
 * that nobody copies this file believing plaintext passwords are ever acceptable.
 */

const ACCOUNTS_KEY = '@smartmeal_sim_accounts';
const SESSION_KEY = '@smartmeal_sim_session';

/** The whole point of the request: signing in lasts a month. */
export const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

interface SimAccount {
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface SimSession {
  email: string;
  expiresAt: number;
}

/**
 * Not a password hash in any real sense — a real one needs bcrypt or argon2 and a server.
 * Enough that the stored value is not the password itself.
 */
function weakHash(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return `sim-${h}`;
}

async function readAccounts(): Promise<Record<string, SimAccount>> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, SimAccount>)
      : {};
  } catch {
    return {};
  }
}

async function writeAccounts(accounts: Record<string, SimAccount>): Promise<void> {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export const localAuthSimulation = {
  /**
   * Only when there is no real backend and this is not a production build. Both conditions,
   * so a missing environment variable in a release can never silently open the simulation.
   */
  isActive(): boolean {
    return !env.isCloudSyncConfigured && env.appEnv !== 'production';
  },

  async signUp(email: string, password: string): Promise<{ email: string | null; error: string | null }> {
    const key = email.trim().toLowerCase();
    const accounts = await readAccounts();

    if (accounts[key]) {
      return { email: null, error: 'Există deja un cont cu această adresă. Conectează-te.' };
    }

    accounts[key] = { email: key, passwordHash: weakHash(password), createdAt: new Date().toISOString() };
    await writeAccounts(accounts);
    await this.startSession(key);
    return { email: key, error: null };
  },

  async signIn(email: string, password: string): Promise<{ email: string | null; error: string | null }> {
    const key = email.trim().toLowerCase();
    const account = (await readAccounts())[key];

    // One message for both cases, so the form cannot be used to find out which addresses
    // have accounts.
    if (!account || account.passwordHash !== weakHash(password)) {
      return { email: null, error: 'Adresa sau parola nu sunt corecte.' };
    }

    await this.startSession(key);
    return { email: key, error: null };
  },

  async startSession(email: string): Promise<void> {
    const session: SimSession = { email, expiresAt: Date.now() + SESSION_MS };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  /** The signed-in address, or null when nobody is signed in or the month has passed. */
  async currentEmail(): Promise<string | null> {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) return null;

      const session = JSON.parse(raw) as Partial<SimSession>;
      if (typeof session.email !== 'string' || typeof session.expiresAt !== 'number') return null;

      if (Date.now() > session.expiresAt) {
        await AsyncStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session.email;
    } catch {
      return null;
    }
  },

  async signOut(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY);
  },

  /** Used by the account-deletion flow, so the simulation behaves like the real thing. */
  async deleteAccount(): Promise<void> {
    const email = await this.currentEmail();
    if (email) {
      const accounts = await readAccounts();
      delete accounts[email];
      await writeAccounts(accounts);
    }
    await this.signOut();
  },

  /** Resetting a password without an inbox: the code is always the same six digits. */
  SIMULATED_RESET_CODE: '123456',

  async resetPassword(email: string, newPassword: string): Promise<boolean> {
    const key = email.trim().toLowerCase();
    const accounts = await readAccounts();
    if (!accounts[key]) return false;

    accounts[key] = { ...accounts[key], passwordHash: weakHash(newPassword) };
    await writeAccounts(accounts);
    await this.startSession(key);
    return true;
  },
};
