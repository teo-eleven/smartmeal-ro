import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { env } from '../../config/env';
import { MealPlan, GroceryListItem } from '../types';

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
        storage: AsyncStorage,
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
    groceryItems: GroceryListItem[]
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

  async loadMealPlan(userId: string): Promise<{
    plan: MealPlan | null;
    groceryItems: GroceryListItem[];
    error: string | null;
  }> {
    const client = getSupabaseClient();
    if (!client) {
      return { plan: null, groceryItems: [], error: 'Cloud neconfigurat.' };
    }
    try {
      const { data, error } = await client
        .from('user_meal_plans')
        .select('plan_data, grocery_items')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        return { plan: null, groceryItems: [], error: error.message };
      }
      if (!data) {
        return { plan: null, groceryItems: [], error: null };
      }
      return {
        plan: data.plan_data as MealPlan,
        groceryItems: (data.grocery_items as GroceryListItem[]) || [],
        error: null,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Eroare la încărcarea din cloud.';
      return { plan: null, groceryItems: [], error: message };
    }
  },
};
