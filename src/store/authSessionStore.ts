import { create } from 'zustand';
import { useAppStore } from './useAppStore';
import { getDisplayName } from '../services/profile';
import {
  authenticateWithBiometrics,
  BiometricResult,
  biometricLabel,
  isBiometricAvailable,
} from '../services/biometric';
import { warnSafely } from '../services/authErrors';
import {
  AccountSecurity,
  markBiometricAsked,
  markVerified,
  readAccountSecurity,
  setBiometricEnabled as saveBiometricEnabled,
} from '../services/reauth';

/**
 * What the screens need to know about the signed-in account beyond its address: the name it
 * gave, and how Face ID / the fingerprint is set up for it on this phone.
 *
 * Kept out of useAppStore, which is already far past the size it should be, like the
 * subscription store beside it.
 */
interface AuthSessionState {
  displayName: string | null;
  /** "Face ID", "Touch ID", "amprenta"... — the word used on the screens. */
  biometricLabel: string;
  isBiometricAvailable: boolean;
  biometricEnabled: boolean;
  /** "Folosești Face ID data viitoare?" is due: available here, and never answered. */
  shouldOfferBiometric: boolean;
  refresh: (email: string) => Promise<void>;
  answerBiometricOffer: (email: string, accepted: boolean) => Promise<void>;
  /**
   * Turning it on asks for Face ID first, so it is the owner's face that will open the lock
   * and the sensor is known to work. Turning it off asks nothing. Resolves with the reason
   * when it stayed off (null after a cancel, or on success).
   */
  setBiometricEnabled: (email: string, enabled: boolean) => Promise<{ error: string | null }>;
  setDisplayName: (name: string) => void;
  unlockWithBiometrics: (email: string) => Promise<BiometricResult>;
  clear: () => void;
}

const SIGNED_OUT = {
  displayName: null,
  biometricLabel: 'biometria',
  isBiometricAvailable: false,
  biometricEnabled: false,
  shouldOfferBiometric: false,
};

const NOT_TURNED_ON = 'Deblocarea cu biometrie nu e pornită pentru acest cont.';

export const useAuthSessionStore = create<AuthSessionState>((set) => ({
  ...SIGNED_OUT,

  refresh: async (email) => {
    let answers: [string | null, AccountSecurity, boolean, string];
    try {
      answers = await Promise.all([
        getDisplayName(),
        readAccountSecurity(email),
        isBiometricAvailable(),
        biometricLabel(),
      ]);
    } catch (e) {
      warnSafely('Datele contului nu au putut fi citite.', e);
      return;
    }
    // Signed out, or into another account, while this was being read: not ours to show.
    if (useAppStore.getState().userEmail !== email) return;
    const [name, security, available, label] = answers;
    set({
      displayName: name,
      biometricLabel: label,
      isBiometricAvailable: available,
      biometricEnabled: available && security.biometricEnabled,
      shouldOfferBiometric: available && !security.biometricAsked,
    });
  },

  answerBiometricOffer: async (email, accepted) => {
    // "Da" is confirmed with Face ID itself. Cancelled or failed, it counts as asked and
    // stays off; it can be turned on later in Cont.
    const confirmed = accepted && (await authenticateWithBiometrics()).success;
    if (confirmed) await saveBiometricEnabled(email, true);
    else await markBiometricAsked(email);
    set({ biometricEnabled: confirmed, shouldOfferBiometric: false });
  },

  setBiometricEnabled: async (email, enabled) => {
    if (enabled) {
      const check = await authenticateWithBiometrics();
      if (!check.success) return { error: check.cancelled ? null : check.error };
    }
    await saveBiometricEnabled(email, enabled);
    set({ biometricEnabled: enabled, shouldOfferBiometric: false });
    return { error: null };
  },

  setDisplayName: (name) => set({ displayName: name }),

  /**
   * Face ID at the monthly lock. Asks the keychain, not this store, whether it is turned on
   * for the account: the sensor alone must never open an account that did not opt in.
   */
  unlockWithBiometrics: async (email) => {
    const { biometricEnabled } = await readAccountSecurity(email);
    if (!biometricEnabled) return { success: false, cancelled: false, error: NOT_TURNED_ON };

    const result = await authenticateWithBiometrics();
    if (result.success) {
      await markVerified(email);
      await useAppStore.getState().unlock();
    }
    return result;
  },

  clear: () => set(SIGNED_OUT),
}));
