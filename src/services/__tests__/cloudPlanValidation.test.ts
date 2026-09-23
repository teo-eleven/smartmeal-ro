import { createClient } from '@supabase/supabase-js';
import { cloudSyncService } from '../supabase';
import { RECIPES } from '../../data/recipes';
import { MealPlan } from '../../types';

jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));
jest.mock('../../../config/env', () => ({
  env: {
    supabaseUrl: 'https://proiect.supabase.co',
    supabaseAnonKey: 'anon-public-key',
    isCloudSyncConfigured: true,
    isAiProxyConfigured: false,
  },
}));

/**
 * One client for the whole file, because getSupabaseClient caches the instance after the
 * first call; each test changes only the row it hands back.
 */
let nextRow: unknown = null;
let nextError: unknown = null;

const maybeSingle = jest.fn(() => Promise.resolve({ data: nextRow, error: nextError }));
const eq = jest.fn(() => ({ maybeSingle }));
const select = jest.fn((_columns: string) => ({ eq }));
const from = jest.fn(() => ({ select }));

(createClient as jest.Mock).mockReturnValue({ from, auth: {} });

function cloudRowIs(row: unknown, error: unknown = null) {
  nextRow = row;
  nextError = error;
}

const goodPlan: MealPlan = {
  id: 'p1',
  createdAt: '2026-09-20T08:00:00Z',
  supermarketId: 'lidl',
  peopleCount: 2,
  totalBudgetRon: 400,
  totalRecipeCostRon: 200,
  totalCartCostRon: 260,
  days: [
    {
      dayOfWeek: 'monday',
      recipe: RECIPES[0],
      servings: 2,
      estimatedCostRon: 20,
      meals: [
        {
        id: 'monday-dinner',
        slot: 'dinner',
        slotLabelRo: 'Cină',
        recipe: RECIPES[0],
        servings: 2,
        estimatedCostRon: 20,
      },
      ],
    },
  ],
};

beforeEach(() => {
  from.mockClear();
  select.mockClear();
  eq.mockClear();
  maybeSingle.mockClear();
  cloudRowIs(null, null);
});

/**
 * The row crossed a network and was written by another copy of this app, possibly an older
 * one. It gets the same treatment as anything read from local storage: checked, not cast.
 */
describe('cloudSyncService.loadMealPlan', () => {
  test('întoarce planul și data scrierii când rândul este întreg', async () => {
    cloudRowIs({
      plan_data: goodPlan,
      grocery_items: [],
      preferences: { supermarketId: 'lidl' },
      updated_at: '2026-09-23T10:00:00Z',
    });

    const result = await cloudSyncService.loadMealPlan('uuid-1');

    expect(result.error).toBeNull();
    expect(result.plan!.id).toBe('p1');
    expect(result.updatedAt).toBe('2026-09-23T10:00:00Z');
  });

  test('cere coloana updated_at, altfel nu ar avea ce arăta utilizatorului', async () => {
    cloudRowIs(null);

    await cloudSyncService.loadMealPlan('uuid-1');

    expect(select.mock.calls[0][0]).toContain('updated_at');
  });

  test('refuză un plan fără zile în loc să-l dea mai departe', async () => {
    cloudRowIs({ plan_data: { id: 'x' }, grocery_items: [], preferences: {}, updated_at: null });

    const result = await cloudSyncService.loadMealPlan('uuid-1');

    expect(result.plan).toBeNull();
    expect(result.error).toMatch(/nu poate fi citit/i);
  });

  test('refuză un plan cu o zi fără mese', async () => {
    cloudRowIs({
      plan_data: { id: 'x', days: [{ dayOfWeek: 'monday' }] },
      grocery_items: [],
      preferences: {},
      updated_at: null,
    });

    const result = await cloudSyncService.loadMealPlan('uuid-1');

    expect(result.plan).toBeNull();
  });

  test('o listă de cumpărături care nu este listă devine listă goală', async () => {
    cloudRowIs({ plan_data: goodPlan, grocery_items: 'nu sunt o listă', preferences: {}, updated_at: null });

    const result = await cloudSyncService.loadMealPlan('uuid-1');

    expect(result.groceryItems).toEqual([]);
    expect(result.plan).not.toBeNull();
  });

  test('preferințe care nu sunt obiect devin null, fără să piardă planul', async () => {
    cloudRowIs({ plan_data: goodPlan, grocery_items: [], preferences: ['nu', 'obiect'], updated_at: null });

    const result = await cloudSyncService.loadMealPlan('uuid-1');

    expect(result.preferences).toBeNull();
    expect(result.plan).not.toBeNull();
  });

  test('un rând inexistent nu este o eroare', async () => {
    cloudRowIs(null);

    const result = await cloudSyncService.loadMealPlan('uuid-1');

    expect(result.plan).toBeNull();
    expect(result.error).toBeNull();
  });

  test('o eroare de la Postgres este raportată cu mesajul ei', async () => {
    cloudRowIs(null, { message: 'permission denied for table user_meal_plans' });

    const result = await cloudSyncService.loadMealPlan('uuid-1');

    expect(result.error).toContain('permission denied');
  });

  test('citește rândul utilizatorului autentificat, nu altul', async () => {
    cloudRowIs(null);

    await cloudSyncService.loadMealPlan('uuid-al-meu');

    expect(eq).toHaveBeenCalledWith('user_id', 'uuid-al-meu');
    expect(from).toHaveBeenCalledWith('user_meal_plans');
  });
});
