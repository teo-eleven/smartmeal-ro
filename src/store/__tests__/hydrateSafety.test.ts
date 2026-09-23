import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageService } from '../../services/storage';
import { useAppStore } from '../useAppStore';
import { getRecipeAllergens } from '../../utils/allergenFilter';
import { isRecipeMatchingDiets } from '../../utils/dietCompatibility';
import { hasRequiredAppliances } from '../../engine/plannerEngine';
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

const prefs = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
  ...BASE,
  ...overrides,
});

/** Generates a plan under `planPrefs`, then stores it next to `storedPrefs` and reboots. */
async function bootWith(planPrefs: UserPreferences, storedPrefs: UserPreferences) {
  useAppStore.setState({ preferences: planPrefs, currentPlan: null, groceryItems: [], savedPlans: [] });
  useAppStore.getState().generatePlan();

  await storageService.savePlanAndGrocery(
    useAppStore.getState().currentPlan,
    useAppStore.getState().groceryItems
  );
  await storageService.savePreferences(storedPrefs);

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
 * Reopening the app is the first and most common door a meal comes through. Restoring an
 * archived plan was already guarded; hydration was not, so a stored plan was shown verbatim
 * however far the preferences beside it had moved on.
 */
describe('hidratarea revalidează planul salvat', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('nu servește mese cu un alergen declarat în preferințele salvate', async () => {
    const state = await bootWith(prefs(), prefs({ avoidedAllergens: ['lactate'] }));
    const meals = state.currentPlan!.days.flatMap((day) => day.meals);

    expect(meals.filter((m) => getRecipeAllergens(m.recipe).includes('lactate'))).toEqual([]);
    expect(state.preferences.avoidedAllergens).toEqual(['lactate']);
  });

  test('nu servește mese care contrazic dieta salvată', async () => {
    const state = await bootWith(prefs(), prefs({ dietType: 'vegan', dietTypes: ['vegan'] }));
    const meals = state.currentPlan!.days.flatMap((day) => day.meals);

    expect(meals.filter((m) => !isRecipeMatchingDiets(m.recipe, ['vegan']))).toEqual([]);
  });

  test('nu servește mese care cer un aparat pe care utilizatorul nu îl mai are', async () => {
    const state = await bootWith(prefs(), prefs({ appliances: ['hob'] }));
    const meals = state.currentPlan!.days.flatMap((day) => day.meals);

    expect(meals.filter((m) => !hasRequiredAppliances(m.recipe.appliances, ['hob']))).toEqual([]);
  });

  test('spune utilizatorului când a schimbat ceva în plan', async () => {
    const state = await bootWith(prefs(), prefs({ avoidedAllergens: ['lactate'] }));

    expect(state.activeNotice).not.toBeNull();
    expect(state.activeNotice!.message).toContain('lactate');
  });

  test('lasă planul neatins când nimic nu îl contrazice', async () => {
    useAppStore.setState({ preferences: prefs(), currentPlan: null, groceryItems: [], savedPlans: [] });
    useAppStore.getState().generatePlan();
    const before = useAppStore.getState().currentPlan!.days.flatMap((d) => d.meals).map((m) => m.recipe.id);

    const state = await bootWith(prefs(), prefs());
    const after = state.currentPlan!.days.flatMap((d) => d.meals).map((m) => m.recipe.id);

    expect(after).toEqual(before);
    expect(state.activeNotice).toBeNull();
  });

  test('totalul coșului rămâne egal cu suma listei de cumpărături', async () => {
    const state = await bootWith(prefs(), prefs({ avoidedAllergens: ['lactate'] }));
    const sum = state.groceryItems.reduce((total, item) => total + item.estimatedPriceRon, 0);

    expect(Math.abs(sum - state.currentPlan!.totalCartCostRon)).toBeLessThan(0.02);
  });
});
