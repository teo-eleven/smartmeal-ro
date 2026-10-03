import * as LocalAuthentication from 'expo-local-authentication';
import { currentOs } from './platformOs';
import { warnSafely } from './authErrors';

/**
 * Face ID, Touch ID or a fingerprint, used to get past the monthly lock (see reauth.ts)
 * without typing the password. Phones only: a browser has no such sensor, and on the web the
 * native module is never touched.
 *
 * The phone's own passcode is not accepted in place of the biometric. Cancelling leads to
 * the account's password or an emailed code instead, which prove more than a PIN that
 * whoever holds the phone may well know.
 */
export interface BiometricResult {
  success: boolean;
  /** The person chose the password or the code instead. Not an error. */
  cancelled: boolean;
  error: string | null;
}

const CANCELLED_CODES = new Set(['user_cancel', 'system_cancel', 'app_cancel', 'user_fallback']);
/** Biometrics switched off or removed in the phone's settings since they were turned on here. */
const NOT_SET_UP_CODES = new Set(['not_enrolled', 'passcode_not_set', 'not_available']);
const LOCKED_OUT = 'Prea multe încercări. Folosește parola sau un cod pe email.';
const NOT_SET_UP =
  'Biometria nu mai e configurată pe telefon. Folosește parola sau un cod pe email.';
const NOT_RECOGNISED = 'Nu te-am putut recunoaște. Încearcă din nou sau folosește parola.';
const WEB_ONLY_PASSWORD = 'Pe web, conectează-te cu parola sau cu un cod.';

function isNative(): boolean {
  const os = currentOs();
  return os === 'ios' || os === 'android';
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    return (
      (await LocalAuthentication.hasHardwareAsync()) &&
      (await LocalAuthentication.isEnrolledAsync())
    );
  } catch (e) {
    warnSafely('Biometria nu a putut fi verificată.', e);
    return false;
  }
}

/** The word the screens use: "Folosești Face ID data viitoare?" */
export async function biometricLabel(): Promise<string> {
  const { FINGERPRINT, FACIAL_RECOGNITION } = LocalAuthentication.AuthenticationType;
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const isIos = currentOs() === 'ios';
    // Fingerprint first on Android: where a phone has both, it is the one people set up.
    if (!isIos && types.includes(FINGERPRINT)) return 'amprenta';
    if (types.includes(FACIAL_RECOGNITION)) return isIos ? 'Face ID' : 'recunoașterea feței';
    if (types.includes(FINGERPRINT)) return 'Touch ID';
  } catch (e) {
    warnSafely('Tipul de biometrie nu a putut fi citit.', e);
  }
  return 'biometria';
}

export async function authenticateWithBiometrics(): Promise<BiometricResult> {
  if (!isNative()) {
    return {
      success: false,
      cancelled: false,
      error: WEB_ONLY_PASSWORD,
    };
  }
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirmă că ești tu',
      cancelLabel: 'Folosește parola',
      disableDeviceFallback: true,
      // Android otherwise accepts "weak" (Class 2) face unlock, which a photo can fool.
      biometricsSecurityLevel: 'strong',
    });
    if (result.success) return { success: true, cancelled: false, error: null };
    if (CANCELLED_CODES.has(result.error)) return { success: false, cancelled: true, error: null };
    if (result.error === 'lockout') return { success: false, cancelled: false, error: LOCKED_OUT };
    if (NOT_SET_UP_CODES.has(result.error)) {
      return { success: false, cancelled: false, error: NOT_SET_UP };
    }
    return { success: false, cancelled: false, error: NOT_RECOGNISED };
  } catch (e) {
    warnSafely('Confirmarea biometrică a eșuat.', e);
    return { success: false, cancelled: false, error: NOT_RECOGNISED };
  }
}
