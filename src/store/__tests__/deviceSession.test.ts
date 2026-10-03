import { useAppStore } from '../useAppStore';
import { cloudSyncService, getSupabaseClient } from '../../services/supabase';
import { registerThisDevice } from '../../services/devices';
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

  test('după o deconectare voită nu apare niciun mesaj', () => {
    const { emit } = fakeClient();
    watchSessionEnd();
    useAppStore.getState().setUserEmail(null);

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
