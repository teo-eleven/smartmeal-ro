import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Where the Supabase session lives.
 *
 * The session holds an access token and a refresh token. Kept in AsyncStorage they sit in
 * plaintext: on iOS in `Documents/RCTAsyncLocalStorage_V1`, which is included in iCloud and
 * iTunes backups, and on Android in a plain SQLite file. Anyone with the backup, or with the
 * device unlocked, has a working login. The platform keychain and keystore exist for exactly
 * this, and `expo-secure-store` is the way to reach them.
 *
 * On the web there is no keychain. The session stays in localStorage there, which is what
 * every browser-based Supabase app does; the protection on that side is the Content-Security
 * -Policy and having no third-party scripts, not storage.
 */

/**
 * SecureStore refuses values over 2048 bytes on some Android devices, and a Supabase session
 * with a long JWT goes past that. The value is split into numbered chunks with a small header
 * saying how many there are, so it survives whatever length a token grows to.
 */
const CHUNK_SIZE = 1800;
const COUNT_SUFFIX = '__count';

/** SecureStore keys may only contain letters, digits, dots, dashes and underscores. */
function safeKey(key: string): string {
  return key.replace(/[^A-Za-z0-9._-]/g, '_');
}

/**
 * Web is identified by having a DOM rather than by importing `Platform`, which drags all of
 * react-native into environments that only need this module's logic.
 */
const isWeb = typeof document !== 'undefined';

async function secureGet(key: string): Promise<string | null> {
  const base = safeKey(key);
  const rawCount = await SecureStore.getItemAsync(`${base}${COUNT_SUFFIX}`);
  if (!rawCount) {
    // Written before chunking existed, or never written at all.
    return SecureStore.getItemAsync(base);
  }

  const count = Number(rawCount);
  if (!Number.isFinite(count) || count <= 0) return null;

  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const part = await SecureStore.getItemAsync(`${base}_${i}`);
    // A missing chunk means the value is unusable; a half session is worse than none.
    if (part === null) return null;
    parts.push(part);
  }
  return parts.join('');
}

async function secureSet(key: string, value: string): Promise<void> {
  const base = safeKey(key);
  await secureRemove(key);

  const count = Math.ceil(value.length / CHUNK_SIZE);
  try {
    for (let i = 0; i < count; i += 1) {
      await SecureStore.setItemAsync(`${base}_${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${base}${COUNT_SUFFIX}`, String(count));
  } catch (e) {
    // The count is written last, so secureRemove cannot find these: clear them by number.
    for (let i = 0; i < count; i += 1) {
      await SecureStore.deleteItemAsync(`${base}_${i}`).catch(() => undefined);
    }
    throw e;
  }
}

async function secureRemove(key: string): Promise<void> {
  const base = safeKey(key);
  const rawCount = await SecureStore.getItemAsync(`${base}${COUNT_SUFFIX}`);
  const count = Number(rawCount);

  if (Number.isFinite(count) && count > 0) {
    for (let i = 0; i < count; i += 1) {
      await SecureStore.deleteItemAsync(`${base}_${i}`);
    }
  }
  await SecureStore.deleteItemAsync(`${base}${COUNT_SUFFIX}`);
  await SecureStore.deleteItemAsync(base);
}

const writeFailureListeners = new Set<() => void>();

/** Called whenever the session could not be stored; returns the function that unsubscribes. */
export function subscribeToSessionWriteFailures(listener: () => void): () => void {
  writeFailureListeners.add(listener);
  return () => {
    writeFailureListeners.delete(listener);
  };
}

export const secureSessionStore = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb) return AsyncStorage.getItem(key);
    try {
      return await secureGet(key);
    } catch (e) {
      // A keychain that will not open must not lock the user out of the whole app; they end
      // up signed out, which is recoverable, rather than looking at a crash.
      console.warn('[secureSessionStore] Could not read the session:', e);
      return null;
    }
  },

  /**
   * Like getItem, but a keychain that will not open throws instead of reading as empty. For
   * callers where "nothing stored" and "could not read" must lead to different answers.
   */
  async getItemOrThrow(key: string): Promise<string | null> {
    return isWeb ? AsyncStorage.getItem(key) : secureGet(key);
  },

  /**
   * Never throws: supabase-js would fail the sign-in or the token refresh. A failed write is
   * cleaned up (no half session left behind) and reported to the app, which tells the person
   * they will have to sign in again (F12).
   */
  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) return AsyncStorage.setItem(key, value);
    try {
      await secureSet(key, value);
    } catch (e) {
      console.warn('[secureSessionStore] Could not store the session:', e);
      writeFailureListeners.forEach((listener) => listener());
    }
  },

  async removeItem(key: string): Promise<void> {
    if (isWeb) return AsyncStorage.removeItem(key);
    try {
      await secureRemove(key);
    } catch (e) {
      console.warn('[secureSessionStore] Could not clear the session:', e);
    }
  },
};
