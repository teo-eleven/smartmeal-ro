import { localAuthSimulation } from './localAuthSimulation';
import { signedInContext } from './authContext';
import { warnSafely } from './authErrors';
import { normalizeDisplayName } from '../utils/displayName';

/**
 * The signed-in person's name, from the profiles table (migration 0006). Its owner may read
 * it and change the name; the row itself is created by the sign-up trigger.
 */
const SAVE_FAILED = 'Nu am putut salva numele. Încearcă din nou.';
const NOT_SIGNED_IN = 'Conectează-te ca să-ți poți schimba numele.';

/** Null when nobody is signed in, the account has no name yet, or the read failed. */
export async function getDisplayName(): Promise<string | null> {
  try {
    const context = await signedInContext();
    if (!context) return null;
    if (context.kind === 'simulation') return localAuthSimulation.displayNameOf(context.email);

    const { data, error } = await context.client
      .from('profiles')
      .select('display_name')
      .eq('user_id', context.user.id)
      .maybeSingle();
    if (error) {
      warnSafely('Numele nu a putut fi citit.', error);
      return null;
    }
    // From the network: held to the same rules as a name typed into the form.
    const raw =
      typeof data === 'object' && data !== null ? Reflect.get(data, 'display_name') : null;
    return normalizeDisplayName(raw).name;
  } catch (e) {
    warnSafely('Numele nu a putut fi citit.', e);
    return null;
  }
}

export async function updateDisplayName(
  raw: string
): Promise<{ name: string | null; error: string | null }> {
  const { name, error } = normalizeDisplayName(raw);
  if (!name) return { name: null, error };

  try {
    const context = await signedInContext();
    if (!context) return { name: null, error: NOT_SIGNED_IN };
    if (context.kind === 'simulation') {
      const saved = await localAuthSimulation.setDisplayName(context.email, name);
      return saved ? { name, error: null } : { name: null, error: NOT_SIGNED_IN };
    }

    // Asking for the updated row back: an update that matched nothing — no profile row, or
    // one the policy hid — is not an error to PostgREST, and must not show as saved.
    const { data, error: saveError } = await context.client
      .from('profiles')
      .update({ display_name: name })
      .eq('user_id', context.user.id)
      .select('user_id');
    if (saveError || !Array.isArray(data) || data.length !== 1) {
      warnSafely('Numele nu a putut fi salvat.', saveError ?? { message: 'no row updated' });
      return { name: null, error: SAVE_FAILED };
    }
    return { name, error: null };
  } catch (e) {
    warnSafely('Numele nu a putut fi salvat.', e);
    return { name: null, error: SAVE_FAILED };
  }
}
