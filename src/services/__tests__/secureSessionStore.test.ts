import * as SecureStore from 'expo-secure-store';
import { secureSessionStore } from '../secureSessionStore';

// No DOM means native, which is where the keychain lives.
const realDocument = globalThis.document;
beforeAll(() => {
  // @ts-expect-error -- deleting the DOM is how this file asks for the native path.
  delete globalThis.document;
});
afterAll(() => {
  globalThis.document = realDocument;
});

jest.mock('expo-secure-store', () => {
  const vault: Record<string, string> = {};
  return {
    __vault: vault,
    getItemAsync: jest.fn(async (k: string) => (k in vault ? vault[k] : null)),
    setItemAsync: jest.fn(async (k: string, v: string) => {
      // Mirrors the platform limit that made chunking necessary.
      if (v.length > 2048) throw new Error('value too large');
      vault[k] = v;
    }),
    deleteItemAsync: jest.fn(async (k: string) => {
      delete vault[k];
    }),
  };
});

const vault = (SecureStore as unknown as { __vault: Record<string, string> }).__vault;

beforeEach(() => {
  Object.keys(vault).forEach((k) => delete vault[k]);
  jest.clearAllMocks();
});

/**
 * A Supabase session is an access token plus a refresh token. Kept in plain AsyncStorage it
 * ends up in iCloud and iTunes backups, so anyone with the backup has a working login.
 */
describe('sesiunea în seiful sistemului', () => {
  test('o sesiune scurtă se scrie și se citește întreagă', async () => {
    await secureSessionStore.setItem('sb-token', 'o-sesiune-scurta');

    expect(await secureSessionStore.getItem('sb-token')).toBe('o-sesiune-scurta');
  });

  test('o sesiune mai lungă decât limita platformei supraviețuiește', async () => {
    const long = 'x'.repeat(9000);

    await secureSessionStore.setItem('sb-token', long);

    expect(await secureSessionStore.getItem('sb-token')).toBe(long);
    // Nothing was written in one piece past the limit.
    Object.values(vault).forEach((v) => expect(v.length).toBeLessThanOrEqual(2048));
  });

  test('ștergerea nu lasă bucăți în urmă', async () => {
    await secureSessionStore.setItem('sb-token', 'y'.repeat(5000));

    await secureSessionStore.removeItem('sb-token');

    expect(await secureSessionStore.getItem('sb-token')).toBeNull();
    expect(Object.keys(vault)).toEqual([]);
  });

  test('rescrierea nu lasă bucăți din valoarea veche', async () => {
    await secureSessionStore.setItem('sb-token', 'z'.repeat(9000));
    await secureSessionStore.setItem('sb-token', 'scurt');

    expect(await secureSessionStore.getItem('sb-token')).toBe('scurt');
  });

  test('o bucată lipsă dă null, nu o sesiune pe jumătate', async () => {
    await secureSessionStore.setItem('sb-token', 'w'.repeat(5000));
    delete vault['sb-token_1'];

    expect(await secureSessionStore.getItem('sb-token')).toBeNull();
  });

  test('un seif care refuză să se deschidă nu blochează aplicația', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('keychain locked'));

    await expect(secureSessionStore.getItem('sb-token')).resolves.toBeNull();
  });

  test('cheile cu caractere neacceptate sunt normalizate', async () => {
    await secureSessionStore.setItem('sb-proiect.supabase.co/auth', 'valoare');

    expect(await secureSessionStore.getItem('sb-proiect.supabase.co/auth')).toBe('valoare');
    Object.keys(vault).forEach((k) => expect(k).toMatch(/^[A-Za-z0-9._-]+$/));
  });
});
