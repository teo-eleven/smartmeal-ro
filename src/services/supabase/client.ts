import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { secureSessionStore } from '../secureSessionStore';
import { env } from '../../../config/env';

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
