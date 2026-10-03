import { useEffect } from 'react';
import { AppState } from 'react-native';
import { verifyDeviceSession, watchSessionEnd } from '../store/deviceSession';
import { useAuthSessionStore } from '../store/authSessionStore';

/**
 * Keeps the signed-in account current while the app runs, once the stored session is known:
 *
 * - on sign-in (and at start, if already signed in): checks this device in, and reads the
 *   name and the Face ID setup;
 * - on sign-out: forgets them;
 * - back in the foreground: checks in again, at most every few minutes;
 * - throughout: listens for supabase-js ending the session on its own.
 */
export function useAccountSession(isHydrated: boolean, userEmail: string | null): void {
  useEffect(() => {
    if (!isHydrated) return;
    return watchSessionEnd();
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void verifyDeviceSession();
    });
    return () => listener.remove();
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!userEmail) {
      useAuthSessionStore.getState().clear();
      return;
    }
    void verifyDeviceSession({ force: true });
    void useAuthSessionStore.getState().refresh(userEmail);
  }, [isHydrated, userEmail]);
}
