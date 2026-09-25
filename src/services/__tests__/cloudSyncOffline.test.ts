import { cloudSyncService, getSupabaseClient } from '../supabase';
import { MealPlan } from '../../types';

/**
 * The app is guest-first: Supabase is optional and unconfigured in development. These tests
 * pin the offline contract, so a missing backend degrades into a clear message instead of a
 * crash or a silent failure that looks like success.
 */

function buildPlan(): MealPlan {
  return {
    id: 'plan-1',
    createdAt: new Date().toISOString(),
    supermarketId: 'lidl',
    peopleCount: 2,
    totalBudgetRon: 200,
    totalRecipeCostRon: 120,
    totalCartCostRon: 150,
    days: [],
  };
}

describe('cloud sync without a configured backend', () => {
  test('reports itself as not configured', () => {
    expect(cloudSyncService.isConfigured()).toBe(false);
  });

  test('builds no client when credentials are absent', () => {
    expect(getSupabaseClient()).toBeNull();
  });

  test('has no current user rather than throwing', async () => {
    await expect(cloudSyncService.getCurrentUser()).resolves.toBeNull();
  });

  // In development with no project configured, the local simulation answers instead, so the
  // sign-in gate can be walked through on a laptop. It refuses to run in a production build.
  test('an unknown account is refused, without saying which part was wrong', async () => {
    const result = await cloudSyncService.signInWithEmail('nimeni@b.ro', 'parola123');
    expect(result.user).toBeNull();
    expect(result.error).toMatch(/adresa sau parola/i);
  });

  test('creating an account then signing in works against the simulation', async () => {
    const created = await cloudSyncService.signUpWithEmail('nou@b.ro', 'Muntele7Verde');
    expect(created.error).toBeNull();
    expect(created.user?.email).toBe('nou@b.ro');

    await cloudSyncService.signOut();

    const back = await cloudSyncService.signInWithEmail('nou@b.ro', 'Muntele7Verde');
    expect(back.user?.email).toBe('nou@b.ro');
  });

  test('the wrong password is refused', async () => {
    await cloudSyncService.signUpWithEmail('altul@b.ro', 'Muntele7Verde');
    await cloudSyncService.signOut();

    const result = await cloudSyncService.signInWithEmail('altul@b.ro', 'gresita123');
    expect(result.user).toBeNull();
  });

  test('signing out is safe even though nobody is signed in', async () => {
    await expect(cloudSyncService.signOut()).resolves.toBeUndefined();
  });

  test('saving reports failure instead of pretending it worked', async () => {
    const result = await cloudSyncService.saveMealPlan('a@b.ro', buildPlan(), []);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/neconfigurat/i);
  });

  test('saving a null plan is refused rather than wiping remote data', async () => {
    const result = await cloudSyncService.saveMealPlan('a@b.ro', null, []);
    expect(result.success).toBe(false);
  });

  test('loading returns empty data with an explanation', async () => {
    const result = await cloudSyncService.loadMealPlan('a@b.ro');
    expect(result.plan).toBeNull();
    expect(result.groceryItems).toEqual([]);
    expect(result.error).toMatch(/neconfigurat/i);
  });
});
