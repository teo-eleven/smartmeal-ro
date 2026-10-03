import { useAppStore } from './useAppStore';
import { cloudSyncService, getSupabaseClient } from '../services/supabase';
import { registerThisDevice } from '../services/devices';

/**
 * Keeps this device's sign-in honest with the account's device list (migration 0007).
 *
 * verifyDeviceSession checks in with register_device: at start and after signing in (forced),
 * and when the app comes back to the foreground (at most every few minutes). A refusal means
 * the account signed this device out from elsewhere, and the app signs out here too.
 *
 * watchSessionEnd covers the other way a session ends: supabase-js failing to refresh it,
 * which it reports as SIGNED_OUT. Without it the app would keep showing an account whose
 * every request now fails.
 */
export const DEVICE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

let lastCheckedAt: number | null = null;
let inFlight: Promise<void> | null = null;

/** Tests only: module state would otherwise carry from one test into the next. */
export function resetDeviceSessionForTests(): void {
  lastCheckedAt = null;
  inFlight = null;
}

function signOutHere(message: string): void {
  const { setUserEmail } = useAppStore.getState();
  setUserEmail(null);
  useAppStore.setState({
    activeNotice: {
      id: Date.now().toString(),
      title: 'Ai fost deconectat',
      message,
      type: 'warning',
    },
  });
}

async function checkIn(): Promise<void> {
  const outcome = await registerThisDevice();
  if (outcome !== 'revoked') return;
  // The session is already gone on the server; only this device still holds it.
  await cloudSyncService.signOut();
  signOutHere('Contul a fost deconectat de pe acest dispozitiv din alt dispozitiv.');
}

export async function verifyDeviceSession(
  options: { now?: number; force?: boolean } = {}
): Promise<void> {
  const now = options.now ?? Date.now();
  if (!useAppStore.getState().userEmail) return;
  if (inFlight) return inFlight;
  if (!options.force && lastCheckedAt !== null && now - lastCheckedAt < DEVICE_CHECK_INTERVAL_MS) {
    return;
  }

  lastCheckedAt = now;
  inFlight = checkIn().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Starts listening; returns the function that stops. */
export function watchSessionEnd(): () => void {
  const client = getSupabaseClient();
  if (!client) return () => undefined;

  const { data } = client.auth.onAuthStateChange((event) => {
    // Signing out on purpose clears userEmail first, so this only speaks for the other kind.
    if (event === 'SIGNED_OUT' && useAppStore.getState().userEmail) {
      signOutHere('Sesiunea a expirat. Conectează-te din nou.');
    }
  });
  return () => data.subscription.unsubscribe();
}
