import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../useAppStore';
import { cloudSyncService } from '../../services/supabase';
import { markVerified } from '../../services/reauth';

const DAY = 24 * 60 * 60 * 1000;
const CONSENT = { isAtLeast16: true, healthDataConsent: true };

/** Reopens the app: the stored session is read again, as on a cold start. */
async function reopen() {
  useAppStore.setState({ isHydrated: false, authStatus: 'checking', userEmail: null });
  await useAppStore.getState().hydrateStorage();
  return useAppStore.getState();
}

/**
 * The monthly lock, through the real store and the local simulation: a session that is still
 * valid but was last verified more than thirty days ago opens on the lock, not on the plan.
 */
describe('blocarea lunară la pornire', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await cloudSyncService.signUpWithEmail('ana@b.ro', 'Muntele7Verde', CONSENT);
  });

  test('verificat acum 3 zile: aplicația se deschide direct', async () => {
    await markVerified('ana@b.ro', Date.now() - 3 * DAY);

    const state = await reopen();

    expect(state.authStatus).toBe('signedIn');
    expect(state.userEmail).toBe('ana@b.ro');
  });

  test('verificat acum 31 de zile: aplicația se deschide blocată, dar știe al cui e contul', async () => {
    await markVerified('ana@b.ro', Date.now() - 31 * DAY);

    const state = await reopen();

    expect(state.authStatus).toBe('locked');
    expect(state.userEmail).toBe('ana@b.ro');
  });

  test('fără sesiune: ecranul de intrare, ca înainte', async () => {
    await cloudSyncService.signOut();

    const state = await reopen();

    expect(state.authStatus).toBe('checking');
    expect(state.userEmail).toBeNull();
  });

  test('deblocarea deschide aplicația', async () => {
    await markVerified('ana@b.ro', Date.now() - 31 * DAY);
    await reopen();

    useAppStore.getState().unlock();

    expect(useAppStore.getState().authStatus).toBe('signedIn');
  });

  /** unlock is the way out of the lock, not a way into an account. */
  test('deblocarea nu face nimic dacă aplicația nu e blocată', () => {
    useAppStore.setState({ authStatus: 'guest', userEmail: null });

    useAppStore.getState().unlock();

    expect(useAppStore.getState().authStatus).toBe('guest');
  });

  test('conectarea cu parola la blocare deschide aplicația', async () => {
    await markVerified('ana@b.ro', Date.now() - 31 * DAY);
    await reopen();

    const { user } = await cloudSyncService.signInWithEmail('ana@b.ro', 'Muntele7Verde');
    useAppStore.getState().setUserEmail(user?.email ?? null);

    expect(useAppStore.getState().authStatus).toBe('signedIn');
    // And the month starts again, so the next start is not locked.
    expect((await reopen()).authStatus).toBe('signedIn');
  });

  /** The lock must not have a side door: without an account means without this account. */
  test('„Continuă fără cont” din blocare deconectează contul', async () => {
    await markVerified('ana@b.ro', Date.now() - 31 * DAY);
    await reopen();

    useAppStore.getState().continueAsGuest();

    expect(useAppStore.getState()).toMatchObject({ authStatus: 'guest', userEmail: null });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await cloudSyncService.currentEmail()).toBeNull();
  });
});
