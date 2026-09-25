import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../useAppStore';
import { cloudSyncService } from '../../services/supabase';
import { isRecipeMatchingDiets } from '../../utils/dietCompatibility';
import { DayOfWeek, UserPreferences } from '../../types';

jest.mock('../../services/supabase', () => ({
  cloudSyncService: {
    getCurrentUser: jest.fn(),
    loadMealPlan: jest.fn(),
    saveMealPlan: jest.fn(),
    // Hydration asks who is signed in before anything renders, so the mock has to answer.
    // Without it the call threw and every stored preference fell back to the defaults --
    // which is exactly what these tests check has stopped happening.
    currentEmail: jest.fn(async () => null),
    loadReminders: jest.fn(async () => null),
    saveReminders: jest.fn(async () => ({ success: true, error: null })),
  },
}));

const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const SAFE: UserPreferences = {
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
  pantryStock: {},
  avoidedAllergens: [],
  mealSlots: ['dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

async function bootWithStoredPrefs(stored: unknown) {
  await AsyncStorage.clear();
  await AsyncStorage.setItem('@smartmeal_preferences', JSON.stringify(stored));
  useAppStore.setState({
    preferences: { ...SAFE },
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
 * Each of these replays an attack that used to succeed. Preferences reach the app from local
 * storage, from a cloud row and from older builds of itself; none of the three was validated.
 */
describe('preferințele venite din storage sunt verificate', () => {
  test('o dietă trimisă ca șir nu mai dezactivează dieta', async () => {
    const state = await bootWithStoredPrefs({ ...SAFE, dietType: 'vegan', dietTypes: 'vegan' });
    state.generatePlan();

    const meals = useAppStore.getState().currentPlan!.days.flatMap((d) => d.meals);
    const active = useAppStore.getState().preferences.dietTypes ?? ['vegan'];
    expect(meals.filter((m) => !isRecipeMatchingDiets(m.recipe, active))).toEqual([]);
    expect(meals.filter((m) => m.recipe.dietType === 'omnivore')).toEqual([]);
  });

  test('o cămară cu o cantitate nenumerică nu mai șterge produse din listă', async () => {
    const state = await bootWithStoredPrefs({ ...SAFE, pantryStock: { paine_toast: 'plin' } });
    state.generatePlan();

    const broken = useAppStore
      .getState()
      .groceryItems.filter(
        (i) => !Number.isFinite(i.leftoverAmount ?? 0) || !Number.isFinite(i.fromStockAmount ?? 0)
      );
    expect(broken).toEqual([]);
  });

  test('preferințe care nu sunt nici măcar un obiect nu strică pornirea', async () => {
    const state = await bootWithStoredPrefs('nonsens');

    expect(state.preferences.moodTags).toEqual(expect.any(Array));
    expect(() => state.generatePlan()).not.toThrow();
    expect(() => state.swapMeal('monday')).not.toThrow();
  });

  test('un număr de persoane imposibil e adus între limite la pornire', async () => {
    const state = await bootWithStoredPrefs({ ...SAFE, peopleCount: -3 });

    expect(state.preferences.peopleCount).toBeGreaterThanOrEqual(1);
    expect(() => state.generatePlan()).not.toThrow();
  });
});

describe('preferințele venite din cloud sunt verificate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (cloudSyncService.getCurrentUser as jest.Mock).mockResolvedValue({ id: 'u', email: 'a@b.ro' });
  });

  async function pullCloudPrefs(preferences: unknown) {
    useAppStore.setState({
      preferences: { ...SAFE },
      currentPlan: null,
      groceryItems: [],
      savedPlans: [],
      activeNotice: null,
      userEmail: 'a@b.ro',
    });
    useAppStore.getState().generatePlan();
    const plan = useAppStore.getState().currentPlan!;

    (cloudSyncService.loadMealPlan as jest.Mock).mockResolvedValue({
      plan,
      groceryItems: [],
      preferences,
      updatedAt: '2026-09-24T10:00:00Z',
      error: null,
    });

    await useAppStore.getState().syncFromCloud();
    useAppStore.getState().confirmPending();
    return useAppStore.getState();
  }

  test('un rând cu un număr de persoane negativ nu mai arunca din buton', async () => {
    const state = await pullCloudPrefs({ ...SAFE, peopleCount: -3 });

    expect(state.preferences.peopleCount).toBeGreaterThanOrEqual(1);
    expect(() => state.swapMeal('monday')).not.toThrow();
  });

  test('un rând gol nu mai arunca', async () => {
    const state = await pullCloudPrefs({});

    expect(state.preferences.appliances.length).toBeGreaterThan(0);
    expect(() => state.swapMeal('monday')).not.toThrow();
  });

  test('alergiile din cloud nu mai ajung litere în preferințe', async () => {
    const state = await pullCloudPrefs({ ...SAFE, avoidedAllergens: 'arahide' });

    expect(state.preferences.avoidedAllergens).toEqual([]);
  });

  test('preferințe din cloud care nu permit niciun meniu sunt refuzate', async () => {
    const state = await pullCloudPrefs({ ...SAFE, appliances: [], cookingDays: [] });

    // The local week survives rather than being replaced by an unusable one.
    expect(state.currentPlan).not.toBeNull();
    expect(state.preferences.appliances.length).toBeGreaterThan(0);
  });
});
