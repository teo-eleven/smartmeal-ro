import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import { localAuthSimulation } from './localAuthSimulation';
import { describeAuthError, describeFailure } from './authErrors';
import { recordVerification } from './reauth';

/**
 * Signing in with a code emailed to the address, instead of the password.
 *
 * Only for accounts that exist (`shouldCreateUser: false`): a new account goes through
 * "Cont nou", which is where the consent and the name are collected. The emailed template is
 * supabase/templates/magic_link.html, which sends the code rather than a link.
 *
 * Both steps answer an unknown address exactly as they answer a known one, for the same
 * reason the password reset does: otherwise the form tells anyone who has an account.
 */
export const LOGIN_CODE_INVALID = 'Codul nu este valid sau a expirat. Cere altul.';
const NOT_AVAILABLE = 'Conectarea cu cod nu este disponibilă offline.';
const VERIFY_NETWORK = 'Nu am putut verifica codul. Verifică conexiunea la internet.';
const NETWORK = 'Nu am putut trimite codul. Verifică conexiunea la internet și încearcă din nou.';

/**
 * Errors worth showing. Anything else — notably "no such user" — is answered as success.
 * The per-address email limit is answered as success too: it only trips for an address a
 * code was really sent to, so showing it would tell a repeat caller the account exists. The
 * per-device request limit says nothing about the address and is shown.
 */
const SHOWN_ON_REQUEST = new Set(['over_request_rate_limit', 'email_address_invalid']);

/** Supabase sends 6 digits by default and up to 10 if the project says so. */
export function isCodeShaped(code: string): boolean {
  return /^\d{6,10}$/.test(code.trim());
}

export async function requestLoginCode(
  email: string
): Promise<{ success: boolean; error: string | null }> {
  if (localAuthSimulation.isActive()) return { success: true, error: null };

  const client = getSupabaseClient();
  if (!client) return { success: false, error: NOT_AVAILABLE };

  try {
    const { error } = await client.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    if (isAuthRetryableFetchError(error)) return { success: false, error: NETWORK };
    if (error?.code && SHOWN_ON_REQUEST.has(error.code)) {
      return { success: false, error: describeAuthError(error) };
    }
    return { success: true, error: null };
  } catch (e: unknown) {
    return { success: false, error: describeFailure(e, 'Eroare la trimiterea codului.') };
  }
}

export async function verifyLoginCode(
  email: string,
  code: string
): Promise<{ email: string | null; error: string | null }> {
  if (!isCodeShaped(code)) return { email: null, error: LOGIN_CODE_INVALID };

  if (localAuthSimulation.isActive()) {
    const { email: signedIn } = await localAuthSimulation.signInWithCode(email, code);
    if (!signedIn) return { email: null, error: LOGIN_CODE_INVALID };
    await recordVerification(signedIn);
    return { email: signedIn, error: null };
  }

  const client = getSupabaseClient();
  if (!client) return { email: null, error: NOT_AVAILABLE };

  try {
    const { data, error } = await client.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    if (isAuthRetryableFetchError(error)) {
      return { email: null, error: VERIFY_NETWORK };
    }
    if (error || !data.user) return { email: null, error: LOGIN_CODE_INVALID };
    const signedIn = data.user.email ?? email.trim().toLowerCase();
    await recordVerification(signedIn);
    return { email: signedIn, error: null };
  } catch (e: unknown) {
    return { email: null, error: describeFailure(e, 'Eroare la verificarea codului.') };
  }
}
