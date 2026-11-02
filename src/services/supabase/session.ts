import { isAuthRetryableFetchError, User } from '@supabase/supabase-js';
import { localAuthSimulation } from '../localAuthSimulation';
import { env } from '../../../config/env';
import { PRIVACY_POLICY_VERSION } from '../../../config/legal';
import { SignUpConsent } from '../../types';
import { describeMissingConsent } from '../../utils/signUpConsent';
import { normalizeDisplayName } from '../../utils/displayName';
import { describeAuthError, describeFailure } from '../authErrors';
import { recordVerification } from '../reauth';
import { localDeviceSimulation } from '../localDeviceSimulation';
import { signingOutOnPurpose } from '../signOutIntent';
import { getSupabaseClient } from './client';
import { SignUpResult, VerifiedUser } from './types';

/** Below the client's patience: a sync that hangs longer is reported as no connection. */
const VERIFY_USER_TIMEOUT_MS = 8000;

export const sessionMethods = {
  isConfigured(): boolean {
    return env.isCloudSyncConfigured && getSupabaseClient() !== null;
  },

  /**
   * The signed-in address, or null. Answers from the simulation when there is no project.
   *
   * Supabase refreshes its own session as long as the refresh token is valid, so "stay signed
   * in for thirty days" is a project setting (Authentication → Sessions), not something the
   * client can decide. The simulation honours the same thirty days locally.
   */
  /** From the session stored on the phone: works offline (F1). */
  async currentEmail(): Promise<string | null> {
    if (localAuthSimulation.isActive()) {
      return localAuthSimulation.currentEmail();
    }
    // By name, not `this`: the method may be handed on as a callback (an onPress).
    const user = await sessionMethods.getCurrentUser();
    return user?.email ?? null;
  },

  /**
   * The signed-in user as the stored session knows it, without asking the server. Starting
   * offline used to look like being signed out, because this called getUser(). Requests
   * still carry the token, and the server still checks it.
   */
  async getCurrentUser(): Promise<User | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const {
        data: { session },
      } = await client.auth.getSession();
      return session?.user ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Asks the server whether the session is still good, before a sync. Tells a phone with no
   * connection ('offline') apart from a session the server refused ('signed_out').
   */
  async verifyUser(timeoutMs = VERIFY_USER_TIMEOUT_MS): Promise<VerifiedUser> {
    const client = getSupabaseClient();
    if (!client) return { user: null, reason: 'signed_out' };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), timeoutMs);
    });
    try {
      const answer = await Promise.race([client.auth.getUser(), timeout]);
      if (answer === 'timeout') return { user: null, reason: 'offline' };
      const { data, error } = answer;
      if (data?.user) return { user: data.user, reason: 'ok' };
      return { user: null, reason: isAuthRetryableFetchError(error) ? 'offline' : 'signed_out' };
    } catch (e) {
      return { user: null, reason: isAuthRetryableFetchError(e) ? 'offline' : 'signed_out' };
    } finally {
      clearTimeout(timer);
    }
  },

  async signInWithEmail(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: string | null }> {
    // With no project configured, the sign-in gate would be a screen nobody can get past.
    // The simulation refuses to run in a production build; see localAuthSimulation.
    if (localAuthSimulation.isActive()) {
      const { email: signedIn, error } = await localAuthSimulation.signIn(email, password);
      await recordVerification(signedIn);
      return { user: signedIn ? ({ email: signedIn } as User) : null, error };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { user: null, error: 'Sincronizarea Cloud nu este configurată pe acest server.' };
    }
    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        return { user: null, error: describeAuthError(error) };
      }
      await recordVerification(data.user?.email);
      return { user: data.user, error: null };
    } catch (e: unknown) {
      const message = describeFailure(e, 'Eroare neașteptată la autentificare.');
      return { user: null, error: message };
    }
  },

  async signUpWithEmail(
    email: string,
    password: string,
    consent: SignUpConsent,
    displayName?: string
  ): Promise<SignUpResult> {
    // The screen checks this too. Checking again here means no other path can open an
    // account holding health data without it.
    const missing = describeMissingConsent(consent);
    if (missing) {
      return { user: null, error: missing };
    }
    // Optional here, required by the form; when given it must be one the database accepts.
    const named = displayName === undefined ? null : normalizeDisplayName(displayName);
    if (named?.error) {
      return { user: null, error: named.error };
    }

    if (localAuthSimulation.isActive()) {
      const { email: created, error } = await localAuthSimulation.signUp(
        email,
        password,
        named?.name
      );
      if (!created) return { user: null, error };
      // The simulation has no inbox, so there is nothing to confirm.
      await recordVerification(created);
      return { user: { email: created } as User, error: null, needsConfirmation: false };
    }

    const client = getSupabaseClient();
    if (!client) {
      return { user: null, error: 'Sincronizarea Cloud nu este configurată pe acest server.' };
    }
    try {
      // Sign-up metadata is the only channel before the account exists. It stays editable by
      // its owner, so it is not the record: migration 0005 copies it into user_consents at
      // creation, stamped with the server's clock, where the user can read but never change
      // it. No time is sent from here for the same reason.
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            age_confirmed_16: true,
            health_data_consent: true,
            privacy_policy_version: PRIVACY_POLICY_VERSION,
            // Copied into profiles by migration 0006's trigger.
            ...(named?.name ? { display_name: named.name } : {}),
          },
        },
      });
      if (error) {
        return { user: null, error: describeAuthError(error) };
      }
      // With "Confirm email" on, Supabase creates the user but opens no session until the
      // address is confirmed. Reporting that is what stops the app from treating an account
      // it cannot use yet as signed in.
      // No session yet means nobody is signed in; the count starts at the first sign-in.
      if (data.session) await recordVerification(data.user?.email);
      return { user: data.user, error: null, needsConfirmation: !data.session };
    } catch (e: unknown) {
      const message = describeFailure(e, 'Eroare neașteptată la înregistrare.');
      return { user: null, error: message };
    }
  },

  /**
   * Signs this device out, and takes it off the account's device list first so the list
   * never shows it as signed in afterwards (migration 0007, forget_this_device).
   */
  async signOut(): Promise<void> {
    await signingOutOnPurpose(async () => {
      if (localAuthSimulation.isActive()) {
        const email = await localAuthSimulation.currentEmail();
        const sessionId = await localAuthSimulation.currentSessionId();
        if (email && sessionId) await localDeviceSimulation.forgetSession(email, sessionId);
        await localAuthSimulation.signOut();
        return;
      }

      const client = getSupabaseClient();
      if (!client) return;
      try {
        // Best effort: a list entry left behind is tidied by the 20-device cap, while a
        // sign-out that failed because of it would leave somebody signed in.
        await client.rpc('forget_this_device').then(undefined, () => undefined);
        // This device only. Supabase's default ends every session of the account, which made
        // "Deconectare" on a phone sign the laptop out too; other devices are signed out from
        // Cont → Dispozitive instead.
        await client.auth.signOut({ scope: 'local' });
      } catch (e) {
        console.warn('[Supabase] Error during sign out:', e);
      }
    });
  },
};
