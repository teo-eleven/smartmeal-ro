import { useEffect } from 'react';
import { AppState } from 'react-native';
import { verifyDeviceSession, watchSessionEnd } from '../store/deviceSession';
import { useAuthSessionStore } from '../store/authSessionStore';
import { useAppStore } from '../store/useAppStore';
import { subscribeToSessionWriteFailures } from '../services/secureSessionStore';

/**
 * Keeps the signed-in account current while the app runs, once the stored session is known:
 *
 * - on sign-in (and at start, if already signed in): checks this device in, and reads the
 *   name and the Face ID setup;
 * - on sign-out: forgets them;
 * - back in the foreground: locks if the month ran out meanwhile, and checks in again (at
 *   most every few minutes);
 * - throughout: listens for supabase-js ending the session on its own.
 */
export function useAccountSession(isHydrated: boolean, userEmail: string | null): void {
  useEffect(() => {
    if (!isHydrated) return;
    return watchSessionEnd();
  }, [isHydrated]);

  // A keychain that refuses the session means signing in again at the next start; said once,
  // now, rather than discovered then (F12).
  useEffect(() => {
    let isTold = false;
    return subscribeToSessionWriteFailures(() => {
      if (isTold) return;
      isTold = true;
      useAppStore
        .getState()
        .showNotice(
          'Sesiunea nu a putut fi salvată',
          'Telefonul nu a permis păstrarea în siguranță a conectării. Aplicația merge acum, dar la următoarea pornire va trebui să te conectezi din nou.',
          'warning'
        );
    });
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const listener = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      // An app left open in the background past the month locks on its way back.
      void useAppStore.getState().recheckLock();
      void verifyDeviceSession();
      // An unsubscribe from the email link is respected without a restart.
      void useAppStore.getState().loadRemindersFromCloud();
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
    // Also behind the lock: the re-verification screen greets the person by name and needs
    // to know whether Face ID is on.
    void useAuthSessionStore.getState().refresh(userEmail);
  }, [isHydrated, userEmail]);
}
