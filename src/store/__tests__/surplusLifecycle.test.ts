import { useAppStore } from '../useAppStore';
import { DayOfWeek, UserPreferences } from '../../types';

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

function boot() {
  useAppStore.setState({
    preferences: { ...SAFE },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    lastDiscardedPlan: null,
    activeNotice: null,
  });
  useAppStore.getState().generatePlan();
}

const cart = () => useAppStore.getState().currentPlan!.totalCartCostRon;

/**
 * The surplus is meant to pay off next week. Applying it to the week the user is still
 * shopping for made eleven items vanish from the list mid-shop, and starting the next week
 * was the very action that erased it.
 */
describe('ciclul de viață al surplusului', () => {
  test('lista săptămânii curente nu se schimbă când pui surplusul deoparte', () => {
    boot();
    const before = cart();
    const linesBefore = useAppStore.getState().groceryItems.length;

    useAppStore.getState().carryOverSurplus();

    expect(cart()).toBe(before);
    expect(useAppStore.getState().groceryItems).toHaveLength(linesBefore);
  });

  test('nici după o reagregare a aceleiași săptămâni', () => {
    boot();
    const before = cart();

    useAppStore.getState().carryOverSurplus();
    useAppStore.getState().togglePantryItem('morcovi');
    useAppStore.getState().togglePantryItem('morcovi');

    expect(Math.abs(cart() - before)).toBeLessThan(0.02);
  });

  test('dar săptămâna următoare chiar costă mai puțin', () => {
    boot();
    const first = cart();

    useAppStore.getState().carryOverSurplus();
    useAppStore.getState().generatePlan();

    expect(cart()).toBeLessThan(first);
  });

  test('apăsat de două ori nu dublează stocul', () => {
    boot();
    useAppStore.getState().carryOverSurplus();
    useAppStore.getState().generatePlan();
    const after = { ...useAppStore.getState().preferences.pantryStock };

    useAppStore.getState().carryOverSurplus();
    useAppStore.getState().carryOverSurplus();
    useAppStore.getState().generatePlan();

    Object.entries(useAppStore.getState().preferences.pantryStock ?? {}).forEach(([id, amount]) => {
      expect(amount).toBeLessThanOrEqual((after[id] ?? 0) * 2 + 1);
    });
  });

  test('„+ Plan Nou" nu mai șterge cămara și ce a învățat planificatorul', () => {
    boot();
    const victim = useAppStore.getState().currentPlan!.days[0].meals[0].recipe.id;
    useAppStore.getState().toggleDislikedRecipe(victim);
    useAppStore.getState().carryOverSurplus();
    useAppStore.getState().generatePlan();
    const stockBefore = Object.keys(useAppStore.getState().preferences.pantryStock ?? {}).length;
    expect(stockBefore).toBeGreaterThan(0);

    useAppStore.getState().resetOnboarding();

    const prefs = useAppStore.getState().preferences;
    expect(Object.keys(prefs.pantryStock ?? {})).toHaveLength(stockBefore);
    expect(prefs.dislikedRecipeIds).toContain(victim);
  });
});
