import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import { localAuthSimulation } from './localAuthSimulation';
import { describeAuthError, describeFailure } from './authErrors';

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
const NETWORK = 'Nu am putut trimite codul. Verifică conexiunea la internet și încearcă din nou.';

/** Errors worth showing. Anything else — notably "no such user" — is answered as success. */
const SHOWN_ON_REQUEST = new Set([
  'over_email_send_rate_limit',
  'over_request_rate_limit',
  'email_address_invalid',
]);

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
    const result = await localAuthSimulation.signInWithCode(email, code);
    return result.email ? result : { email: null, error: LOGIN_CODE_INVALID };
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
      return { email: null, error: 'Nu am putut verifica codul. Verifică conexiunea la internet.' };
    }
    if (error || !data.user) return { email: null, error: LOGIN_CODE_INVALID };
    return { email: data.user.email ?? email.trim().toLowerCase(), error: null };
  } catch (e: unknown) {
    return { email: null, error: describeFailure(e, 'Eroare la verificarea codului.') };
  }
}
