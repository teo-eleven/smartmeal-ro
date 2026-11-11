import { GroceryListItem, ReminderSettings, UserPreferences } from '../../types';
import { parseReminderSettings } from '../../utils/preferencesValidation';
import { describeFailure } from '../authErrors';
import { isWellFormedPlan } from '../storage';
import { getSupabaseClient } from './client';
import { CloudPlanResult, RecordedConsent, SavePlanRequest, SavePlanResult } from './types';

/**
 * Database errors come back in English and describe the server ("new row violates row-level
 * security policy"). The user gets this; the detail goes to the log.
 */
const CLOUD_SAVE_FAILED = 'Nu am putut salva în cloud. Încearcă din nou.';

/** The app's reminder fields and the columns of user_reminders they live in. */
const REMINDER_COLUMNS: Record<keyof ReminderSettings, string> = {
  cookingEnabled: 'cooking_enabled',
  cookingTime: 'cooking_time',
  shoppingEnabled: 'shopping_enabled',
  shoppingWeekday: 'shopping_weekday',
  shoppingTime: 'shopping_time',
  emailEnabled: 'email_enabled',
  emailFrequencyDays: 'email_frequency_days',
};

/** The RPC's answer comes over the network; only the two known shapes are believed. */
function parseSaveRow(data: unknown): Pick<SavePlanResult, 'status' | 'updatedAt'> | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (typeof row !== 'object' || row === null) return null;
  const { status, updated_at: updatedAt } = row as { status?: unknown; updated_at?: unknown };
  if ((status !== 'saved' && status !== 'conflict') || typeof updatedAt !== 'string') return null;
  return { status, updatedAt };
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

export const cloudDataMethods = {
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
  /**
   * Writes only the fields that changed. Sending the whole row re-subscribed somebody who
   * had unsubscribed from the emails by link the next time they touched any reminder (F3).
   */
  async saveReminders(
    userId: string,
    patch: Partial<ReminderSettings>
  ): Promise<{ success: boolean; error: string | null }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Cloud neconfigurat.' };

    const columns = Object.fromEntries(
      (Object.keys(patch) as (keyof ReminderSettings)[])
        .filter((key) => key in REMINDER_COLUMNS && patch[key] !== undefined)
        .map((key) => [REMINDER_COLUMNS[key], patch[key]])
    );

    try {
      const { error } = await client
        .from('user_reminders')
        .upsert({ user_id: userId, ...columns }, { onConflict: 'user_id' });

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
      return {
        status: 'error',
        updatedAt: null,
        error: 'Cloud neconfigurat. Modul offline activ.',
      };
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
