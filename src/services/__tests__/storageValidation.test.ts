import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageService, isWellFormedSavedPlan } from '../storage';
import { SavedPlan } from '../../types';

function validEntry(id: string): SavedPlan {
  return {
    id,
    name: 'Plan valid',
    savedAt: new Date().toISOString(),
    plan: {
      id: 'p1',
      createdAt: new Date().toISOString(),
      supermarketId: 'lidl',
      peopleCount: 2,
      totalBudgetRon: 200,
      totalRecipeCostRon: 100,
      totalCartCostRon: 150,
      days: [],
    },
    preferences: { supermarketId: 'lidl' } as never,
  };
}

describe('isWellFormedSavedPlan', () => {
  test('accepts a complete entry', () => {
    expect(isWellFormedSavedPlan(validEntry('a'))).toBe(true);
  });

  test('rejects anything that is not an object', () => {
    [null, undefined, 42, 'text', []].forEach((value) => {
      expect(isWellFormedSavedPlan(value)).toBe(false);
    });
  });

  test('rejects an entry with no plan', () => {
    expect(isWellFormedSavedPlan({ id: 'a', name: 'x', preferences: {} })).toBe(false);
  });

  test('rejects a plan with no days array', () => {
    expect(
      isWellFormedSavedPlan({ id: 'a', name: 'x', plan: { id: 'p' }, preferences: {} })
    ).toBe(false);
  });

  test('rejects an entry with no preferences', () => {
    expect(isWellFormedSavedPlan({ id: 'a', name: 'x', plan: { days: [] } })).toBe(false);
  });
});

describe('loadSavedPlans drops what it cannot trust', () => {
  beforeEach(async () => AsyncStorage.clear());

  test('keeps the good rows and discards the malformed ones', async () => {
    await AsyncStorage.setItem(
      '@smartmeal_saved_plans',
      JSON.stringify([validEntry('bun'), { id: 'rupt' }, null, validEntry('bun2')])
    );

    const loaded = await storageService.loadSavedPlans();

    expect(loaded.map((p) => p.id)).toEqual(['bun', 'bun2']);
  });

  test('returns an empty library rather than throwing on nonsense', async () => {
    await AsyncStorage.setItem('@smartmeal_saved_plans', '{nu e json');
    await expect(storageService.loadSavedPlans()).resolves.toEqual([]);
  });

  test('returns an empty library when the stored value is not a list', async () => {
    await AsyncStorage.setItem('@smartmeal_saved_plans', JSON.stringify({ nu: 'lista' }));
    await expect(storageService.loadSavedPlans()).resolves.toEqual([]);
  });
});
