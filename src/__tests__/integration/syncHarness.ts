/* eslint-disable @typescript-eslint/no-require-imports */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_PREFERENCES } from '../../store/defaults';
import { generateMealPlan } from '../../engine/plannerEngine';
import type { MealPlan, SignUpConsent, UserPreferences } from '../../types';

type CloudSyncService = typeof import('../../services/supabase').cloudSyncService;
type RecipeNotesCloud = typeof import('../../services/recipeNotesCloud').recipeNotesCloud;

/** The services one phone uses, sharing that phone's client and session. */
export interface DeviceKit {
  sync: CloudSyncService;
  notes: RecipeNotesCloud;
}

export const FULL_CONSENT: SignUpConsent = { isAtLeast16: true, healthDataConsent: true };
export const TEST_PASSWORD = 'Sync-test-parola-1!';
const TEST_EMAIL_DOMAIN = 'smartmeal.test';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} lipsește din .env.test`);
  return value;
}

/** Full access to the local database, for creating and removing test users only. */
export function adminClient(): SupabaseClient {
  return createClient(
    requiredEnv('EXPO_PUBLIC_SUPABASE_URL'),
    requiredEnv('SUPABASE_TEST_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/** Fails the whole file with one clear sentence when the local database is not running. */
export async function assertLocalDatabaseIsUp(): Promise<void> {
  const url = `${requiredEnv('EXPO_PUBLIC_SUPABASE_URL')}/auth/v1/health`;
  try {
    const response = await fetch(url, {
      headers: { apikey: requiredEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY') },
    });
    if (response.ok) return;
    throw new Error(`HTTP ${response.status}`);
  } catch (e) {
    throw new Error(`Baza locală nu răspunde (${String(e)}). Pornește-o: npm run db:start`);
  }
}

export function uniqueEmail(label: string): string {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `sync-${label}-${stamp}@${TEST_EMAIL_DOMAIN}`;
}

/**
 * One phone running the app: its own copy of the service, Supabase client and session vault
 * (expo-secure-store is mocked per module registry). Two devices never share a session.
 */
export function newDeviceKit(): DeviceKit {
  let kit: DeviceKit | undefined;
  jest.isolateModules(() => {
    kit = {
      sync: require('../../services/supabase').cloudSyncService,
      notes: require('../../services/recipeNotesCloud').recipeNotesCloud,
    };
  });
  if (!kit) throw new Error('Serviciile dispozitivului nu s-au încărcat');
  return kit;
}

export function newDevice(): CloudSyncService {
  return newDeviceKit().sync;
}

/** Signs up through the app's own code, the way the sign-up screen does. */
export async function signUpOnDevice(device: CloudSyncService, email: string): Promise<string> {
  const result = await device.signUpWithEmail(email, TEST_PASSWORD, FULL_CONSENT, 'Tester');
  if (result.error || !result.user) throw new Error(`Înregistrarea a eșuat: ${result.error}`);
  return result.user.id;
}

export async function signInOnDevice(device: CloudSyncService, email: string): Promise<void> {
  const result = await device.signInWithEmail(email, TEST_PASSWORD);
  if (result.error) throw new Error(`Conectarea a eșuat: ${result.error}`);
}

/** A real plan from the app's planner, so the shape checks on load see what users save. */
export function makePlan(preferences: UserPreferences = DEFAULT_PREFERENCES): MealPlan {
  return generateMealPlan(preferences);
}

/** Removes every account a test file created; their rows go with them (ON DELETE CASCADE). */
export async function deleteUsers(userIds: string[]): Promise<void> {
  const admin = adminClient();
  for (const id of userIds) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw new Error(`Nu am putut șterge contul de test ${id}: ${error.message}`);
  }
}
