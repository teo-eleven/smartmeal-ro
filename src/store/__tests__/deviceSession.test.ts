import { useAppStore } from '../useAppStore';
import { cloudSyncService, getSupabaseClient } from '../../services/supabase';
import { registerThisDevice } from '../../services/devices';
import { signingOutOnPurpose } from '../../services/signOutIntent';
import {
  DEVICE_CHECK_INTERVAL_MS,
  resetDeviceSessionForTests,
  verifyDeviceSession,
  watchSessionEnd,
} from '../deviceSession';

jest.mock('../../services/devices', () => ({ registerThisDevice: jest.fn() }));
jest.mock('../../services/supabase', () => ({
  ...jest.requireActual('../../services/supabase'),
  getSupabaseClient: jest.fn(() => null),
}));

const register = registerThisDevice as jest.Mock;
const clientMock = getSupabaseClient as jest.Mock;
const NOW = Date.UTC(2026, 9, 3, 12);

beforeEach(() => {
  jest.clearAllMocks();
  resetDeviceSessionForTests();
  jest.spyOn(cloudSyncService, 'signOut').mockResolvedValue(undefined);
  useAppStore.setState({ userEmail: 'ana@b.ro', authStatus: 'signedIn', activeNotice: null });
  register.mockResolvedValue('ok');
});

/**
 * A phone signed out from another device finds out when it next checks in, and signs out
 * here too. Checking in is cheap but not free, so foreground checks are spaced out.
 */
describe('verificarea dispozitivului', () => {
  test('fără cont conectat nu se verifică nimic', async () => {
    useAppStore.setState({ userEmail: null, authStatus: 'guest' });

    await verifyDeviceSession({ now: NOW });

    expect(register).not.toHaveBeenCalled();
  });

  test('un dispozitiv încă conectat rămâne conectat', async () => {
    await verifyDeviceSession({ now: NOW });

    expect(register).toHaveBeenCalledTimes(1);
    expect(useAppStore.getState().authStatus).toBe('signedIn');
    expect(cloudSyncService.signOut).not.toHaveBeenCalled();
  });

  test('deconectat de pe alt dispozitiv: se deconectează și aici, și spune de ce', async () => {
    register.mockResolvedValue('revoked');

    await verifyDeviceSession({ now: NOW });

    expect(cloudSyncService.signOut).toHaveBeenCalled();
    expect(useAppStore.getState().userEmail).toBeNull();
    expect(useAppStore.getState().activeNotice?.message).toMatch(/alt dispozitiv/);
  });

  /** They did not choose to leave the account, so they land on sign-in, not as a guest. */
  test('după deconectarea de pe alt dispozitiv apare ecranul de conectare', async () => {
    register.mockResolvedValue('revoked');

    await verifyDeviceSession({ now: NOW });

    expect(useAppStore.getState().authStatus).toBe('checking');
  });

  test('un răspuns pentru contul vechi nu deconectează contul nou', async () => {
    let answer: (value: string) => void = () => undefined;
    register.mockReturnValue(new Promise((resolve) => (answer = resolve)));

    const pending = verifyDeviceSession({ now: NOW });
    useAppStore.setState({ userEmail: 'ion@b.ro' });
    answer('revoked');
    await pending;

    expect(useAppStore.getState().userEmail).toBe('ion@b.ro');
    expect(cloudSyncService.signOut).not.toHaveBeenCalled();
  });

  test('o verificare în curs pentru alt cont nu o înghite pe cea a contului nou', async () => {
    register.mockReturnValueOnce(new Promise(() => undefined)).mockResolvedValue('ok');

    void verifyDeviceSession({ now: NOW, force: true });
    useAppStore.setState({ userEmail: 'ion@b.ro' });
    await verifyDeviceSession({ now: NOW, force: true });

    expect(register).toHaveBeenCalledTimes(2);
  });

  test('și din ecranul de blocare', async () => {
    useAppStore.setState({ authStatus: 'locked' });
    register.mockResolvedValue('revoked');

    await verifyDeviceSession({ now: NOW });

    expect(useAppStore.getState().userEmail).toBeNull();
  });

  test('o verificare care n-a reușit nu deconectează pe nimeni', async () => {
    register.mockResolvedValue('skipped');

    await verifyDeviceSession({ now: NOW });

    expect(useAppStore.getState().userEmail).toBe('ana@b.ro');
  });

  test(`la revenirea în aplicație, cel mult o dată la ${DEVICE_CHECK_INTERVAL_MS / 60000} minute`, async () => {
    await verifyDeviceSession({ now: NOW });
    await verifyDeviceSession({ now: NOW + DEVICE_CHECK_INTERVAL_MS - 1 });
    expect(register).toHaveBeenCalledTimes(1);

    await verifyDeviceSession({ now: NOW + DEVICE_CHECK_INTERVAL_MS });
    expect(register).toHaveBeenCalledTimes(2);
  });

  test('la pornire și după conectare se verifică oricum', async () => {
    await verifyDeviceSession({ now: NOW });
    await verifyDeviceSession({ now: NOW + 1, force: true });

    expect(register).toHaveBeenCalledTimes(2);
  });

  test('două verificări în același timp fac un singur drum la server', async () => {
    await Promise.all([
      verifyDeviceSession({ now: NOW, force: true }),
      verifyDeviceSession({ now: NOW, force: true }),
    ]);

    expect(register).toHaveBeenCalledTimes(1);
  });
});

describe('sesiunea încheiată de server', () => {
  function fakeClient() {
    let listener: ((event: string) => void) | null = null;
    const unsubscribe = jest.fn();
    clientMock.mockReturnValue({
      auth: {
        onAuthStateChange: (cb: (event: string) => void) => {
          listener = cb;
          return { data: { subscription: { unsubscribe } } };
        },
      },
    });
    return { emit: (event: string) => listener?.(event), unsubscribe };
  }

  /** A refresh token that no longer works ends in SIGNED_OUT from supabase-js. */
  test('SIGNED_OUT deconectează aplicația', () => {
    const { emit } = fakeClient();
    watchSessionEnd();

    emit('SIGNED_OUT');

    expect(useAppStore.getState().userEmail).toBeNull();
    expect(useAppStore.getState().activeNotice?.message).toMatch(/Conectează-te din nou/);
  });

  test('alte evenimente nu schimbă nimic', () => {
    const { emit } = fakeClient();
    watchSessionEnd();

    emit('TOKEN_REFRESHED');

    expect(useAppStore.getState().userEmail).toBe('ana@b.ro');
  });

  /**
   * The real order: supabase-js fires SIGNED_OUT inside signOut(), while the app still shows
   * the account. "Deconectare" and deleting the account must not read as an expiry.
   */
  test('o deconectare voită nu e raportată ca sesiune expirată', async () => {
    const { emit } = fakeClient();
    watchSessionEnd();

    await signingOutOnPurpose(async () => {
      emit('SIGNED_OUT');
    });

    expect(useAppStore.getState().activeNotice).toBeNull();
    expect(useAppStore.getState().userEmail).toBe('ana@b.ro');
  });

  test('după deconectarea voită, ascultarea merge din nou ca înainte', async () => {
    const { emit } = fakeClient();
    watchSessionEnd();
    await signingOutOnPurpose(async () => undefined);

    emit('SIGNED_OUT');

    expect(useAppStore.getState().userEmail).toBeNull();
  });

  test('deja deconectat: niciun mesaj în plus', () => {
    const { emit } = fakeClient();
    watchSessionEnd();
    useAppStore.setState({ userEmail: null, authStatus: 'guest' });

    emit('SIGNED_OUT');

    expect(useAppStore.getState().activeNotice).toBeNull();
  });

  test('ascultarea se poate opri', () => {
    const { unsubscribe } = fakeClient();

    watchSessionEnd()();

    expect(unsubscribe).toHaveBeenCalled();
  });

  test('fără proiect Supabase nu se ascultă nimic', () => {
    clientMock.mockReturnValue(null);

    expect(() => watchSessionEnd()()).not.toThrow();
  });
});
