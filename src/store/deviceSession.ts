import { useAppStore } from './useAppStore';
import { cloudSyncService, getSupabaseClient } from '../services/supabase';
import { registerThisDevice } from '../services/devices';
import { isSigningOutOnPurpose } from '../services/signOutIntent';

/**
 * Keeps this device's sign-in honest with the account's device list (migration 0007).
 *
 * verifyDeviceSession checks in with register_device: at start and after signing in (forced),
 * and when the app comes back to the foreground (at most every few minutes). A refusal means
 * the account signed this device out from elsewhere, and the app signs out here too.
 *
 * watchSessionEnd covers the other way a session ends: supabase-js failing to refresh it,
 * which it reports as SIGNED_OUT. Without it the app would keep showing an account whose
 * every request now fails. A sign-out somebody asked for fires the same event; those run
 * inside signingOutOnPurpose (services/signOutIntent.ts) and are left alone.
 *
 * Either way the app goes back to the sign-in screen, not on as a guest: the person did not
 * choose to leave the account.
 */
export const DEVICE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

const REVOKED_MESSAGE =
  'Acest dispozitiv a fost deconectat din contul tău de pe alt dispozitiv (Cont → Dispozitive). Conectează-te din nou ca să continui.';
const EXPIRED_MESSAGE = 'Sesiunea a expirat. Conectează-te din nou.';

let lastCheckedAt: number | null = null;
let inFlight: { email: string; promise: Promise<void> } | null = null;

/** Tests only: module state would otherwise carry from one test into the next. */
export function resetDeviceSessionForTests(): void {
  lastCheckedAt = null;
  inFlight = null;
}

/**
 * Ends the account here and shows why. Nothing to do if it already ended. A revoked device
 * loses the account's data (it was signed out on purpose, perhaps because it was lost); an
 * expired session keeps it for the same person, and another account signing in wipes it.
 */
function endSessionHere(message: string, keepLocalData: boolean): void {
  if (!useAppStore.getState().userEmail) return;
  useAppStore.getState().setUserEmail(null, { keepLocalData });
  useAppStore.setState({ authStatus: 'checking' });
  // Through the store action, so it queues behind a safety warning instead of replacing it.
  useAppStore.getState().showNotice('Ai fost deconectat', message, 'warning');
}

async function checkIn(email: string): Promise<void> {
  const outcome = await registerThisDevice();
  // The answer is about the account that asked; somebody else may be signed in by now.
  if (outcome !== 'revoked' || useAppStore.getState().userEmail !== email) return;
  endSessionHere(REVOKED_MESSAGE, false);
  // The server already ended the session; this clears what the device still holds.
  await cloudSyncService.signOut();
}

export async function verifyDeviceSession(
  options: { now?: number; force?: boolean } = {}
): Promise<void> {
  const now = options.now ?? Date.now();
  const email = useAppStore.getState().userEmail;
  if (!email) return;
  if (inFlight?.email === email) return inFlight.promise;
  if (!options.force && lastCheckedAt !== null && now - lastCheckedAt < DEVICE_CHECK_INTERVAL_MS) {
    return;
  }

  lastCheckedAt = now;
  const promise = checkIn(email).finally(() => {
    if (inFlight?.promise === promise) inFlight = null;
  });
  inFlight = { email, promise };
  return promise;
}

/** Starts listening; returns the function that stops. */
export function watchSessionEnd(): () => void {
  const client = getSupabaseClient();
  if (!client) return () => undefined;

  const { data } = client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT' && !isSigningOutOnPurpose()) endSessionHere(EXPIRED_MESSAGE, true);
  });
  return () => data.subscription.unsubscribe();
}
