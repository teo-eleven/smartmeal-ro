import type { SupabaseClient, User } from '@supabase/supabase-js';
import { cloudSyncService, getSupabaseClient } from './supabase';
import { localAuthSimulation } from './localAuthSimulation';

/**
 * Who is signed in, and where: the local simulation (a laptop with no project configured) or
 * a real Supabase project. Every account feature branches on this, so it is asked in one
 * place rather than re-derived in each service.
 */
export type SignedInContext =
  { kind: 'simulation'; email: string } | { kind: 'cloud'; client: SupabaseClient; user: User };

/** Null when nobody is signed in, or when there is neither a simulation nor a project. */
export async function signedInContext(): Promise<SignedInContext | null> {
  if (localAuthSimulation.isActive()) {
    const email = await localAuthSimulation.currentEmail();
    return email ? { kind: 'simulation', email } : null;
  }
  const client = getSupabaseClient();
  if (!client) return null;
  const user = await cloudSyncService.getCurrentUser();
  return user ? { kind: 'cloud', client, user } : null;
}
