import {
  REAUTH_INTERVAL_DAYS,
  checkReauth,
  forgetAccountSecurity,
  isReauthDue,
  markBiometricAsked,
  markFullAuth,
  readAccountSecurity,
  setBiometricEnabled,
} from '../reauth';

/** The keychain, as a map this file can empty between tests and corrupt on purpose. */
const mockVault = new Map<string, string>();
jest.mock('../secureSessionStore', () => ({
  secureSessionStore: {
    getItem: async (key: string) => mockVault.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      mockVault.set(key, value);
    },
    removeItem: async (key: string) => {
      mockVault.delete(key);
    },
  },
}));

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 3, 12, 0, 0);
const EMAIL = 'ana@exemplu.ro';

/**
 * Every 30 days since the last real sign-in (password or emailed code) the app asks the
 * person to confirm it is them. Supabase keeps a session alive indefinitely, so the month is
 * counted here.
 */
describe('cât de des se cere reverificarea', () => {
  test('intervalul este de 30 de zile', () => {
    expect(REAUTH_INTERVAL_DAYS).toBe(30);
  });

  test('la 29 de zile și 23 de ore nu se cere încă', () => {
    expect(isReauthDue(NOW - (30 * DAY - 60 * 60 * 1000), NOW)).toBe(false);
  });

  test('la fix 30 de zile se cere', () => {
    expect(isReauthDue(NOW - 30 * DAY, NOW)).toBe(true);
  });

  test('la 31 de zile se cere', () => {
    expect(isReauthDue(NOW - 31 * DAY, NOW)).toBe(true);
  });

  test('fără o dată cunoscută se cere', () => {
    expect(isReauthDue(null, NOW)).toBe(true);
  });

  /** A clock moved back would otherwise keep the lock away for as long as it stays wrong. */
  test('o dată din viitor (ceas dat înapoi) cere reverificare', () => {
    expect(isReauthDue(NOW + 2 * DAY, NOW)).toBe(true);
  });
});

describe('ce se ține minte pentru fiecare cont', () => {
  beforeEach(() => {
    mockVault.clear();
  });

  test('un cont nou nu are nimic salvat și biometria e oprită', async () => {
    expect(await readAccountSecurity(EMAIL)).toEqual({
      lastFullAuthAt: null,
      biometricEnabled: false,
      biometricAsked: false,
    });
  });

  test('conectarea completă salvează momentul', async () => {
    await markFullAuth(EMAIL, NOW);

    expect((await readAccountSecurity(EMAIL)).lastFullAuthAt).toBe(NOW);
  });

  test('adresa e aceeași indiferent de majuscule și spații', async () => {
    await markFullAuth('  Ana@Exemplu.RO ', NOW);

    expect((await readAccountSecurity(EMAIL)).lastFullAuthAt).toBe(NOW);
  });

  test('conturile diferite nu se amestecă', async () => {
    await markFullAuth(EMAIL, NOW);

    expect((await readAccountSecurity('altcineva@exemplu.ro')).lastFullAuthAt).toBeNull();
  });

  test('pornirea biometriei înseamnă și că întrebarea a fost pusă', async () => {
    await setBiometricEnabled(EMAIL, true);

    expect(await readAccountSecurity(EMAIL)).toMatchObject({
      biometricEnabled: true,
      biometricAsked: true,
    });
  });

  test('„Nu acum” ține minte întrebarea, dar lasă biometria oprită', async () => {
    await markBiometricAsked(EMAIL);

    expect(await readAccountSecurity(EMAIL)).toMatchObject({
      biometricEnabled: false,
      biometricAsked: true,
    });
  });

  test('o schimbare nu le șterge pe celelalte', async () => {
    await markFullAuth(EMAIL, NOW);
    await setBiometricEnabled(EMAIL, true);
    await markFullAuth(EMAIL, NOW + DAY);

    expect(await readAccountSecurity(EMAIL)).toEqual({
      lastFullAuthAt: NOW + DAY,
      biometricEnabled: true,
      biometricAsked: true,
    });
  });

  test('o valoare stricată în memorie e tratată ca nimic salvat, nu ca eroare', async () => {
    await markFullAuth(EMAIL, NOW);
    const [key] = [...mockVault.keys()];
    mockVault.set(key, '{"lastFullAuthAt":"ieri","biometricEnabled":"da"}');

    expect(await readAccountSecurity(EMAIL)).toEqual({
      lastFullAuthAt: null,
      biometricEnabled: false,
      biometricAsked: false,
    });
  });

  test('o valoare care nu e JSON e tratată la fel', async () => {
    await markFullAuth(EMAIL, NOW);
    const [key] = [...mockVault.keys()];
    mockVault.set(key, 'nu e json');

    expect((await readAccountSecurity(EMAIL)).lastFullAuthAt).toBeNull();
  });

  test('cheia din keychain nu conține adresa de email', async () => {
    await markFullAuth(EMAIL, NOW);

    const [key] = [...mockVault.keys()];
    expect(key).not.toMatch(/ana|exemplu/);
    expect(key).toMatch(/^[A-Za-z0-9._-]+$/);
  });

  test('ștergerea contului uită tot', async () => {
    await markFullAuth(EMAIL, NOW);
    await setBiometricEnabled(EMAIL, true);

    await forgetAccountSecurity(EMAIL);

    expect(mockVault.size).toBe(0);
  });
});

describe('verificarea de la pornire', () => {
  beforeEach(() => {
    mockVault.clear();
  });

  test('o conectare recentă nu blochează', async () => {
    await markFullAuth(EMAIL, NOW - 3 * DAY);

    expect(await checkReauth(EMAIL, NOW)).toBe('ok');
  });

  test('după 30 de zile aplicația se blochează', async () => {
    await markFullAuth(EMAIL, NOW - 31 * DAY);

    expect(await checkReauth(EMAIL, NOW)).toBe('due');
  });

  /**
   * Somebody signed in before this version shipped has no date saved. Locking them out on
   * the first start after the update would punish them for an upgrade; the month starts now.
   */
  test('un cont conectat înainte de actualizare primește o lună de acum', async () => {
    expect(await checkReauth(EMAIL, NOW)).toBe('ok');
    expect((await readAccountSecurity(EMAIL)).lastFullAuthAt).toBe(NOW);
  });
});
