import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { localAuthSimulation } from '../localAuthSimulation';
import { env } from '../../../config/env';
import { describeAuthError, describeFailure } from '../authErrors';
import { forgetAccountSecurity, recordVerification } from '../reauth';
import { localDeviceSimulation } from '../localDeviceSimulation';
import { signingOutOnPurpose } from '../signOutIntent';
import { getSupabaseClient } from './client';

const REAUTH_FOR_DELETE =
  'Pentru siguranță, scrie parola contului și încearcă din nou. Dacă intri cu cod pe email, deconectează-te, conectează-te iar cu un cod nou și șterge contul în următoarele 5 minute.';

/** The `error` field of a function's JSON answer, or null if there is none to read. */
async function readErrorCode(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    const code = typeof body === 'object' && body !== null ? Reflect.get(body, 'error') : null;
    return typeof code === 'string' ? code : null;
  } catch {
    return null;
  }
}

export const accountMethods = {
  /**
   * Deletes the account and everything stored against it.
   *
   * Both stores require an in-app path to this, and the account holds declared allergies,
   * which is special-category data under GDPR. The work happens in the `delete-account`
   * edge function because removing a user needs the service-role key, which must never
   * reach the client; the function identifies the caller from their own token.
   */
  /**
   * `password` re-confirms who is asking: the server deletes only after an authentication
   * from the last few minutes (delete-account, reauth_required).
   */
  async deleteAccount(password?: string): Promise<{ success: boolean; error: string | null }> {
    // By name, not `this`: the method may be handed on as a callback (an onPress).
    return signingOutOnPurpose(() => accountMethods.deleteAccountNow(password));
  },

  async deleteAccountNow(password?: string): Promise<{ success: boolean; error: string | null }> {
    if (localAuthSimulation.isActive()) {
      const email = await localAuthSimulation.currentEmail();
      await localAuthSimulation.deleteAccount();
      // The server cascades devices with the account; the simulation has to say so.
      if (email) {
        await localDeviceSimulation.forget(email);
        await forgetAccountSecurity(email);
      }
      return { success: true, error: null };
    }

    const client = getSupabaseClient();
    if (!client || !env.supabaseUrl) {
      return { success: false, error: 'Ștergerea contului nu este disponibilă offline.' };
    }

    try {
      const {
        data: { session },
      } = await client.auth.getSession();

      if (!session?.access_token) {
        return { success: false, error: 'Autentifică-te din nou pentru a șterge contul.' };
      }

      let accessToken = session.access_token;
      if (password && session.user?.email) {
        // A fresh sign-in gives a token whose amr says "just now", which the server wants.
        const { error: reauthError } = await client.auth.signInWithPassword({
          email: session.user.email,
          password,
        });
        if (reauthError) {
          return { success: false, error: 'Parola nu este corectă. Contul nu a fost șters.' };
        }
        const { data: fresh } = await client.auth.getSession();
        accessToken = fresh.session?.access_token ?? accessToken;
      }

      const response = await fetch(`${env.supabaseUrl}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 403 && (await readErrorCode(response)) === 'reauth_required') {
        return { success: false, error: REAUTH_FOR_DELETE };
      }
      if (!response.ok) {
        return {
          success: false,
          error: 'Contul nu a putut fi șters. Încearcă din nou sau scrie-ne.',
        };
      }

      // The session is dead once the user is gone; clear it locally so the app does not go
      // on believing someone is signed in.
      const email = session.user?.email;
      await client.auth.signOut();
      if (email) await forgetAccountSecurity(email);
      return { success: true, error: null };
    } catch (e: unknown) {
      const message = describeFailure(e, 'Eroare la ștergerea contului.');
      return { success: false, error: message };
    }
  },

  /**
   * Starts a password reset by emailing a code (6 to 10 digits, per the project setting).
   *
   * Supabase calls this a "recovery OTP". The code is what the user types back in, and it is
   * the only way to prove they reach the mailbox — so the reply is deliberately identical
   * whether the address exists or not. Saying "no such account" would turn this endpoint
   * into a way to find out who has one.
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; error: string | null }> {
    if (localAuthSimulation.isActive()) {
      // No inbox to send to, so the code is fixed and the screen says which one it is.
      return { success: true, error: null };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Resetarea parolei nu este disponibilă offline.' };
    }

    try {
      // supabase-js hands a network failure back in `error` instead of throwing it, so the
      // catch below never saw one and an offline user was told a code was on its way.
      const { error } = await client.auth.resetPasswordForEmail(email.trim());
      if (isAuthRetryableFetchError(error)) {
        return {
          success: false,
          error: 'Nu am putut trimite codul. Verifică conexiunea la internet și încearcă din nou.',
        };
      }
      return { success: true, error: null };
    } catch (e: unknown) {
      // Network failures are worth reporting; a rejected address is not, for the reason above.
      const message = describeFailure(e, 'Eroare la trimiterea codului.');
      return { success: false, error: message };
    }
  },

  /**
   * Exchanges the emailed code for a session, which is what lets the next step set a new
   * password. A wrong or expired code fails here, before anything is changed.
   */
  async verifyPasswordResetCode(
    email: string,
    code: string
  ): Promise<{ success: boolean; error: string | null }> {
    if (localAuthSimulation.isActive()) {
      return code.trim() === localAuthSimulation.SIMULATED_RESET_CODE
        ? { success: true, error: null }
        : { success: false, error: 'Codul nu este valid sau a expirat. Cere altul.' };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Resetarea parolei nu este disponibilă offline.' };
    }

    try {
      const { error } = await client.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'recovery',
      });
      if (error) {
        return { success: false, error: 'Codul nu este valid sau a expirat. Cere altul.' };
      }
      return { success: true, error: null };
    } catch (e: unknown) {
      const message = describeFailure(e, 'Eroare la verificarea codului.');
      return { success: false, error: message };
    }
  },

  /** Sets a new password on the session the verified code produced. */
  async updatePassword(
    newPassword: string,
    emailForSimulation?: string
  ): Promise<{ success: boolean; error: string | null }> {
    if (localAuthSimulation.isActive()) {
      const done = await localAuthSimulation.resetPassword(emailForSimulation ?? '', newPassword);
      // A reset ends signed in, so it is a verification like any other.
      if (done) await recordVerification(emailForSimulation?.trim().toLowerCase());
      return done
        ? { success: true, error: null }
        : { success: false, error: 'Nu există un cont cu adresa aceasta.' };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Schimbarea parolei nu este disponibilă offline.' };
    }

    try {
      const { data, error } = await client.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: describeAuthError(error) };
      }
      await recordVerification(data?.user?.email);
      return { success: true, error: null };
    } catch (e: unknown) {
      const message = describeFailure(e, 'Eroare la schimbarea parolei.');
      return { success: false, error: message };
    }
  },
};
