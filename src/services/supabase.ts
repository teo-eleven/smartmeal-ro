import {
  createClient,
  isAuthRetryableFetchError,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { localAuthSimulation } from './localAuthSimulation';
import { secureSessionStore } from './secureSessionStore';
import { env } from '../../config/env';
import { PRIVACY_POLICY_VERSION } from '../../config/legal';
import {
  MealPlan,
  GroceryListItem,
  ReminderSettings,
  SignUpConsent,
  UserPreferences,
} from '../types';
import { parseReminderSettings } from '../utils/preferencesValidation';
import { describeMissingConsent } from '../utils/signUpConsent';
import { normalizeDisplayName } from '../utils/displayName';
import { describeAuthError, describeFailure } from './authErrors';
import { forgetAccountSecurity, recordVerification } from './reauth';
import { localDeviceSimulation } from './localDeviceSimulation';
import { signingOutOnPurpose } from './signOutIntent';

/**
 * Database errors come back in English and describe the server ("new row violates row-level
 * security policy"). The user gets this; the detail goes to the log.
 */
const CLOUD_SAVE_FAILED = 'Nu am putut salva în cloud. Încearcă din nou.';

/** Below the client's patience: a sync that hangs longer is reported as no connection. */
const VERIFY_USER_TIMEOUT_MS = 8000;

export interface VerifiedUser {
  user: User | null;
  reason: 'ok' | 'offline' | 'signed_out';
}

export interface SavePlanRequest {
  plan: MealPlan | null;
  groceryItems: GroceryListItem[];
  preferences?: UserPreferences;
  /** The cloud's updated_at this device last saw; null if it never saw one. */
  expectedUpdatedAt: string | null;
}

export interface SavePlanResult {
  status: 'saved' | 'conflict' | 'error';
  /** The cloud's version after the call: the new one when saved, the newer one on conflict. */
  updatedAt: string | null;
  error: string | null;
}

/** The RPC's answer comes over the network; only the two known shapes are believed. */
function parseSaveRow(data: unknown): Pick<SavePlanResult, 'status' | 'updatedAt'> | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (typeof row !== 'object' || row === null) return null;
  const { status, updated_at: updatedAt } = row as { status?: unknown; updated_at?: unknown };
  if ((status !== 'saved' && status !== 'conflict') || typeof updatedAt !== 'string') return null;
  return { status, updatedAt };
}
import { isWellFormedPlan } from './storage';

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return null;
  }

  try {
    supabaseClientInstance = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        // Keychain on iOS, Keystore on Android; localStorage on web, where there is no
        // equivalent. Plain AsyncStorage kept the access and refresh tokens in a file that
        // is included in iCloud and iTunes backups.
        storage: secureSessionStore,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    return supabaseClientInstance;
  } catch (e) {
    console.warn('[Supabase] Failed to initialize Supabase client:', e);
    return null;
  }
}

export interface SignUpResult {
  user: User | null;
  error: string | null;
  /** Set on success: true when the address must be confirmed before anyone can sign in. */
  needsConfirmation?: boolean;
}

/** A row of user_consents, as written by the sign-up trigger in migration 0005. */
export interface RecordedConsent {
  age_confirmed_16: boolean;
  health_data_consent: boolean;
  privacy_policy_version: string | null;
  consented_at: string | null;
}

/** What a cloud row turns into once it has been checked rather than merely cast. */
export interface CloudPlanResult {
  plan: MealPlan | null;
  groceryItems: GroceryListItem[];
  preferences: UserPreferences | null;
  /** When the other device last wrote this row, shown to the user so they can judge it. */
  updatedAt: string | null;
  error: string | null;
}

const EMPTY_CLOUD_PLAN: CloudPlanResult = {
  plan: null,
  groceryItems: [],
  preferences: null,
  updatedAt: null,
  error: null,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const cloudSyncService = {
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
    const user = await this.getCurrentUser();
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
   * Deletes the account and everything stored against it.
   *
   * Both stores require an in-app path to this, and the account holds declared allergies,
   * which is special-category data under GDPR. The work happens in the `delete-account`
   * edge function because removing a user needs the service-role key, which must never
   * reach the client; the function identifies the caller from their own token.
   */
  async deleteAccount(): Promise<{ success: boolean; error: string | null }> {
    return signingOutOnPurpose(() => this.deleteAccountNow());
  },

  async deleteAccountNow(): Promise<{ success: boolean; error: string | null }> {
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

      const response = await fetch(`${env.supabaseUrl}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

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

  /**
   * The consent recorded when the account was opened, from the table only the sign-up
   * trigger writes. Null when there is no record, never a guessed one.
   */
  async loadConsent(userId: string): Promise<RecordedConsent | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('user_consents')
        .select('age_confirmed_16, health_data_consent, privacy_policy_version, consented_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !isPlainObject(data)) return null;
      return {
        age_confirmed_16: data.age_confirmed_16 === true,
        health_data_consent: data.health_data_consent === true,
        privacy_policy_version:
          typeof data.privacy_policy_version === 'string' ? data.privacy_policy_version : null,
        consented_at: typeof data.consented_at === 'string' ? data.consented_at : null,
      };
    } catch (e) {
      console.warn('[Supabase] Could not read the consent record:', e);
      return null;
    }
  },

  /** Reads the reminder choices stored against the account, whitelisting every field. */
  async loadReminders(userId: string): Promise<ReminderSettings | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('user_reminders')
        .select(
          'cooking_enabled, cooking_time, shopping_enabled, shopping_weekday, shopping_time, email_enabled, email_frequency_days'
        )
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;

      // The table speaks snake_case; the app speaks camelCase. Mapping here keeps a single
      // validator rather than one parser trying to understand two spellings.
      return parseReminderSettings({
        cookingEnabled: data.cooking_enabled,
        cookingTime: data.cooking_time,
        shoppingEnabled: data.shopping_enabled,
        shoppingWeekday: data.shopping_weekday,
        shoppingTime: data.shopping_time,
        emailEnabled: data.email_enabled,
        emailFrequencyDays: data.email_frequency_days,
      });
    } catch (e) {
      console.warn('[Supabase] Could not read the reminder settings:', e);
      return null;
    }
  },

  /** Writes them back, keyed on the user so a second device picks them up. */
  async saveReminders(
    userId: string,
    reminders: ReminderSettings
  ): Promise<{ success: boolean; error: string | null }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Cloud neconfigurat.' };

    try {
      const { error } = await client.from('user_reminders').upsert(
        {
          user_id: userId,
          cooking_enabled: reminders.cookingEnabled,
          cooking_time: reminders.cookingTime,
          shopping_enabled: reminders.shoppingEnabled,
          shopping_weekday: reminders.shoppingWeekday,
          shopping_time: reminders.shoppingTime,
          email_enabled: reminders.emailEnabled,
          email_frequency_days: reminders.emailFrequencyDays,
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        console.warn('[Supabase] Could not save the reminder settings:', error.message);
        return { success: false, error: CLOUD_SAVE_FAILED };
      }
      return { success: true, error: null };
    } catch (e: unknown) {
      const message = describeFailure(e, 'Eroare la salvarea mementourilor.');
      return { success: false, error: message };
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

  /**
   * Saves the plan only if the cloud still holds the version this device last saw
   * (migration 0009). Otherwise nothing is written and the cloud's version comes back as a
   * conflict, so the app can ask before replacing a plan another device saved.
   */
  async saveMealPlan(request: SavePlanRequest): Promise<SavePlanResult> {
    if (!request.plan) {
      return { status: 'error', updatedAt: null, error: 'Nu ai niciun plan de urcat.' };
    }
    const client = getSupabaseClient();
    if (!client) {
      return { status: 'error', updatedAt: null, error: 'Cloud neconfigurat. Modul offline activ.' };
    }
    try {
      const { data, error } = await client.rpc('save_meal_plan_if_unchanged', {
        p_plan_data: request.plan,
        p_grocery_items: request.groceryItems,
        // Diet and allergies travel with the plan; null keeps what the row already holds.
        p_preferences: request.preferences ?? null,
        p_expected_updated_at: request.expectedUpdatedAt,
      });
      if (error) {
        console.warn('[Supabase] Could not save the plan:', error.message);
        return { status: 'error', updatedAt: null, error: CLOUD_SAVE_FAILED };
      }
      const row = parseSaveRow(data);
      if (!row) {
        console.warn('[Supabase] Unexpected answer from save_meal_plan_if_unchanged');
        return { status: 'error', updatedAt: null, error: CLOUD_SAVE_FAILED };
      }
      return { ...row, error: null };
    } catch (e: unknown) {
      const message = describeFailure(e, 'Eroare la salvarea în cloud.');
      return { status: 'error', updatedAt: null, error: message };
    }
  },

  async loadMealPlan(userId: string): Promise<CloudPlanResult> {
    const client = getSupabaseClient();
    if (!client) {
      return { ...EMPTY_CLOUD_PLAN, error: 'Cloud neconfigurat.' };
    }
    try {
      const { data, error } = await client
        .from('user_meal_plans')
        .select('plan_data, grocery_items, preferences, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[Supabase] Could not read the plan:', error.message);
        return { ...EMPTY_CLOUD_PLAN, error: 'Nu am putut citi planul din cloud.' };
      }
      if (!data) {
        return EMPTY_CLOUD_PLAN;
      }

      // The row came back over the network and was written by another copy of this app,
      // possibly an older one. It gets the same shape check as anything read from storage.
      if (!isWellFormedPlan(data.plan_data)) {
        return { ...EMPTY_CLOUD_PLAN, error: 'Planul din cloud nu poate fi citit.' };
      }

      return {
        plan: data.plan_data,
        groceryItems: Array.isArray(data.grocery_items)
          ? (data.grocery_items as GroceryListItem[])
          : [],
        preferences: isPlainObject(data.preferences)
          ? (data.preferences as unknown as UserPreferences)
          : null,
        updatedAt: typeof data.updated_at === 'string' ? data.updated_at : null,
        error: null,
      };
    } catch (e: unknown) {
      const message = describeFailure(e, 'Eroare la încărcarea din cloud.');
      return { ...EMPTY_CLOUD_PLAN, error: message };
    }
  },
};
