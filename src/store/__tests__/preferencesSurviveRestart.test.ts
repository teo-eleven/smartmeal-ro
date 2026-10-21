import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../useAppStore';
import { DayOfWeek, UserPreferences } from '../../types';

const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const BASE: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: WEEK,
  budgetRon: 900,
  moodTags: ['family_fav'],
  dietType: 'omnivore',
  dietTypes: ['omnivore'],
  appliances: ['hob', 'oven', 'air_fryer'],
  excludePantryStaples: true,
  pantryInventory: [],
  avoidedAllergens: [],
  mealSlots: ['breakfast', 'lunch', 'dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

async function bootWithStoredPrefs(stored: unknown) {
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@smartmeal_preferences', JSON.stringify(stored));
  useAppStore.setState({
    preferences: { ...BASE },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    isHydrated: false,
    activeNotice: null,
  });
  await useAppStore.getState().hydrateStorage();
  return useAppStore.getState();
}

describe('preferințele de sănătate supraviețuiesc repornirii', () => {
  test('„Fără porc” e încă activ după repornire', async () => {
    const state = await bootWithStoredPrefs({ ...BASE, healthGoalTags: ['pork_free'] });

    expect(state.preferences.healthGoalTags).toEqual(['pork_free']);
  });

  test('sloturile pe zile și surplusul parcat supraviețuiesc', async () => {
    const state = await bootWithStoredPrefs({
      ...BASE,
      dailyMealSlots: { monday: ['dinner'] },
      pendingPantryStock: { orez_basmati: 250 },
    });

    expect(state.preferences.dailyMealSlots).toEqual({ monday: ['dinner'] });
    expect(state.preferences.pendingPantryStock).toEqual({ orez_basmati: 250 });
  });
});

describe('o dietă salvată ilizibilă e semnalată', () => {
  test('avertizează în loc să servească în tăcere un meniu omnivor', async () => {
    const state = await bootWithStoredPrefs({ ...BASE, dietType: 'vegann', dietTypes: ['vegann'] });

    expect(state.activeNotice).not.toBeNull();
    expect(state.activeNotice!.type).toBe('warning');
    expect(state.activeNotice!.message).toContain('dieta');
  });

  test('o dietă validă nu produce nicio avertizare', async () => {
    const state = await bootWithStoredPrefs({ ...BASE, dietType: 'vegan', dietTypes: ['vegan'] });

    expect(state.activeNotice).toBeNull();
  });
});
