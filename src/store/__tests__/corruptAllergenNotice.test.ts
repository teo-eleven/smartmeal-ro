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

/**
 * An unreadable allergen list is treated as "we no longer know what you avoid", which is
 * the only honest reading — but the user has to be told that, in those words. The notice
 * used to blame plan feasibility, which had nothing to do with it.
 */
describe('notificarea pentru o listă de alergii ilizibilă', () => {
  test('spune că lista de alergii s-a pierdut, nu că planul nu se putea genera', async () => {
    const state = await bootWithStoredPrefs({ ...BASE, avoidedAllergens: null });

    expect(state.activeNotice).not.toBeNull();
    expect(state.activeNotice!.message).toContain('alergii');
    expect(state.activeNotice!.message).not.toContain('nu permiteau generarea');
  });

  test('este o avertizare, nu o informare, pentru că e o chestiune de siguranță', async () => {
    const state = await bootWithStoredPrefs({ ...BASE, avoidedAllergens: 'lactate' });

    expect(state.activeNotice!.type).toBe('warning');
  });

  test('păstrează restul preferințelor salvate', async () => {
    const state = await bootWithStoredPrefs({
      ...BASE,
      peopleCount: 5,
      supermarketId: 'kaufland',
      avoidedAllergens: { lactate: true },
    });

    expect(state.preferences.peopleCount).toBe(5);
    expect(state.preferences.supermarketId).toBe('kaufland');
    expect(state.preferences.avoidedAllergens).toEqual([]);
  });

  test('păstrează alergenii pe care îi poate citi și le elimină doar pe cei necunoscuți', async () => {
    const state = await bootWithStoredPrefs({
      ...BASE,
      avoidedAllergens: ['lactate', 'inventat', 'gluten'],
    });

    expect(state.preferences.avoidedAllergens).toEqual(['lactate', 'gluten']);
    expect(state.activeNotice!.message).toContain('alergii');
  });

  test('nu inventează o notificare când lista este în regulă', async () => {
    const state = await bootWithStoredPrefs({ ...BASE, avoidedAllergens: ['lactate'] });

    expect(state.activeNotice).toBeNull();
    expect(state.preferences.avoidedAllergens).toEqual(['lactate']);
  });
});
