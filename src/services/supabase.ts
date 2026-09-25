import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { secureSessionStore } from './secureSessionStore';
import { env } from '../../config/env';
import { MealPlan, GroceryListItem, UserPreferences } from '../types';
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

  async getCurrentUser(): Promise<User | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    try {
      const {
        data: { user },
      } = await client.auth.getUser();
      return user;
    } catch {
      return null;
    }
  },

  async signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    const client = getSupabaseClient();
    if (!client) {
      return { user: null, error: 'Sincronizarea Cloud nu este configurată pe acest server.' };
    }
    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        return { user: null, error: error.message };
      }
      return { user: data.user, error: null };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Eroare neașteptată la autentificare.';
      return { user: null, error: message };
    }
  },

  async signUpWithEmail(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    const client = getSupabaseClient();
    if (!client) {
      return { user: null, error: 'Sincronizarea Cloud nu este configurată pe acest server.' };
    }
    try {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) {
        return { user: null, error: error.message };
      }
      return { user: data.user, error: null };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Eroare neașteptată la înregistrare.';
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
      await client.auth.signOut();
      return { success: true, error: null };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Eroare la ștergerea contului.';
      return { success: false, error: message };
    }
  },

  async signOut(): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await client.auth.signOut();
    } catch (e) {
      console.warn('[Supabase] Error during sign out:', e);
    }
  },

  async saveMealPlan(
    userId: string,
    plan: MealPlan | null,
    groceryItems: GroceryListItem[],
    preferences?: UserPreferences
  ): Promise<{ success: boolean; error: string | null }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Cloud neconfigurat. Modul offline activ.' };
    }
    try {
      const { error } = await client
        .from('user_meal_plans')
        .upsert(
          {
            user_id: userId,
            plan_data: plan,
            grocery_items: groceryItems,
            // Diet and allergies travel with the plan; an allergy that lives on one device
            // only is exactly the gap this closes.
            ...(preferences ? { preferences } : {}),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, error: null };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Eroare la salvarea în cloud.';
      return { success: false, error: message };
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
        return { ...EMPTY_CLOUD_PLAN, error: error.message };
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
      const message = e instanceof Error ? e.message : 'Eroare la încărcarea din cloud.';
      return { ...EMPTY_CLOUD_PLAN, error: message };
    }
  },
};
