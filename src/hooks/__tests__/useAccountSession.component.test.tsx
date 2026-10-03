import { renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useAccountSession } from '../useAccountSession';
import { verifyDeviceSession, watchSessionEnd } from '../../store/deviceSession';
import { useAuthSessionStore } from '../../store/authSessionStore';
import { useAppStore } from '../../store/useAppStore';

jest.mock('../../store/deviceSession', () => ({
  verifyDeviceSession: jest.fn(async () => undefined),
  watchSessionEnd: jest.fn(() => jest.fn()),
}));

const verify = verifyDeviceSession as jest.Mock;
const watch = watchSessionEnd as jest.Mock;
let onAppState: (state: string) => void = () => undefined;
const removeListener = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    onAppState = handler as (state: string) => void;
    return { remove: removeListener } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
  jest.spyOn(useAuthSessionStore.getState(), 'refresh').mockResolvedValue(undefined);
  jest.spyOn(useAuthSessionStore.getState(), 'clear');
  jest.spyOn(useAppStore.getState(), 'recheckLock').mockResolvedValue(undefined);
});

/** What runs while the app is open, for whoever is signed in. */
describe('sesiunea contului cât timp aplicația e deschisă', () => {
  test('nimic înainte să fie citită sesiunea salvată', () => {
    renderHook(() => useAccountSession(false, 'ana@b.ro'));

    expect(watch).not.toHaveBeenCalled();
    expect(verify).not.toHaveBeenCalled();
  });

  test('conectat: verifică dispozitivul și citește numele și Face ID', () => {
    renderHook(() => useAccountSession(true, 'ana@b.ro'));

    expect(watch).toHaveBeenCalledTimes(1);
    expect(verify).toHaveBeenCalledWith({ force: true });
    expect(useAuthSessionStore.getState().refresh).toHaveBeenCalledWith('ana@b.ro');
  });

  test('deconectat: uită numele și Face ID, fără drum la server', () => {
    renderHook(() => useAccountSession(true, null));

    expect(useAuthSessionStore.getState().clear).toHaveBeenCalled();
    expect(verify).not.toHaveBeenCalled();
  });

  test('la revenirea în aplicație: verifică luna și dispozitivul', () => {
    renderHook(() => useAccountSession(true, 'ana@b.ro'));
    verify.mockClear();

    onAppState('active');

    expect(useAppStore.getState().recheckLock).toHaveBeenCalled();
    expect(verify).toHaveBeenCalledWith();
  });

  test('trecerea în fundal nu verifică nimic', () => {
    renderHook(() => useAccountSession(true, 'ana@b.ro'));
    verify.mockClear();

    onAppState('background');

    expect(verify).not.toHaveBeenCalled();
  });

  test('alt cont: verifică din nou, pentru contul nou', () => {
    const { rerender } = renderHook(
      ({ email }: { email: string | null }) => useAccountSession(true, email),
      { initialProps: { email: 'ana@b.ro' as string | null } }
    );
    verify.mockClear();

    rerender({ email: 'ion@b.ro' });

    expect(verify).toHaveBeenCalledWith({ force: true });
    expect(useAuthSessionStore.getState().refresh).toHaveBeenCalledWith('ion@b.ro');
  });

  test('la închidere, ascultătorii se opresc', () => {
    const stop = jest.fn();
    watch.mockReturnValue(stop);
    const { unmount } = renderHook(() => useAccountSession(true, 'ana@b.ro'));

    unmount();

    expect(stop).toHaveBeenCalled();
    expect(removeListener).toHaveBeenCalled();
  });
});
