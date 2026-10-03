import { cloudSyncService, getSupabaseClient } from './supabase';
import { localAuthSimulation } from './localAuthSimulation';
import { normalizeDisplayName } from '../utils/displayName';

/**
 * The signed-in person's name, from the profiles table (migration 0006). Its owner may read
 * it and change the name; the row itself is created by the sign-up trigger.
 */
const SAVE_FAILED = 'Nu am putut salva numele. Încearcă din nou.';
const NOT_SIGNED_IN = 'Conectează-te ca să-ți poți schimba numele.';

/** Null when nobody is signed in, the account has no name yet, or the read failed. */
export async function getDisplayName(): Promise<string | null> {
  if (localAuthSimulation.isActive()) {
    const email = await localAuthSimulation.currentEmail();
    return email ? localAuthSimulation.displayNameOf(email) : null;
  }

  const client = getSupabaseClient();
  const user = client ? await cloudSyncService.getCurrentUser() : null;
  if (!client || !user) return null;

  try {
    const { data, error } = await client
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) {
      console.warn('[SmartMeal] Numele nu a putut fi citit.', error);
      return null;
    }
    // The row comes from the network; only a string is a name.
    const name: unknown = (data as { display_name?: unknown } | null)?.display_name;
    return typeof name === 'string' && name.trim() ? name : null;
  } catch (e) {
    console.warn('[SmartMeal] Numele nu a putut fi citit.', e);
    return null;
  }
}

export async function updateDisplayName(
  raw: string
): Promise<{ name: string | null; error: string | null }> {
  const { name, error } = normalizeDisplayName(raw);
  if (!name) return { name: null, error };

  if (localAuthSimulation.isActive()) {
    const email = await localAuthSimulation.currentEmail();
    const saved = email ? await localAuthSimulation.setDisplayName(email, name) : false;
    return saved ? { name, error: null } : { name: null, error: NOT_SIGNED_IN };
  }

  const client = getSupabaseClient();
  const user = client ? await cloudSyncService.getCurrentUser() : null;
  if (!client || !user) return { name: null, error: NOT_SIGNED_IN };

  try {
    const { error: saveError } = await client
      .from('profiles')
      .update({ display_name: name })
      .eq('user_id', user.id);
    if (saveError) {
      console.warn('[SmartMeal] Numele nu a putut fi salvat.', saveError);
      return { name: null, error: SAVE_FAILED };
    }
    return { name, error: null };
  } catch (e) {
    console.warn('[SmartMeal] Numele nu a putut fi salvat.', e);
    return { name: null, error: SAVE_FAILED };
  }
}
