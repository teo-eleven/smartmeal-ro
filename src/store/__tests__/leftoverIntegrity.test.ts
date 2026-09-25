import { useAppStore } from '../useAppStore';
import { compareBasketAcrossStores } from '../../engine/storeComparator';
import { RECIPES } from '../../data/recipes';
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

function bootWithLeftover(overrides: Partial<UserPreferences> = {}) {
  useAppStore.setState({
    preferences: { ...SAFE, ...overrides },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    activeNotice: null,
  });
  useAppStore.getState().generatePlan();
  const source = useAppStore.getState().currentPlan!.days[0].meals[0];
  useAppStore.getState().cookDoubleFor('monday', source.id);
  return source;
}

const days = () => useAppStore.getState().currentPlan!.days;
const cartSum = () =>
  Math.round(
    useAppStore.getState().groceryItems.reduce((t, i) => t + i.estimatedPriceRon, 0) * 100
  ) / 100;

/**
 * A reheated meal is the one thing on the board with no ingredients of its own. Anything that
 * changes it, or counts it, has to know that -- and several things did not.
 */
describe('integritatea meselor reîncălzite', () => {
  test('o masă reîncălzită nu poate fi schimbată cu alt fel', () => {
    bootWithLeftover();
    const before = days()[1].meals[0].recipe.id;

    useAppStore.getState().swapMeal('tuesday');

    const after = days()[1].meals[0];
    expect(after.recipe.id).toBe(before);
    expect(after.recipe.id).toBe(days()[0].meals[0].recipe.id);
  });

  test('nici prin înlocuire directă cu o rețetă anume', () => {
    bootWithLeftover();
    const other = RECIPES.find(
      (r) =>
        r.id !== days()[1].meals[0].recipe.id &&
        r.dietType === 'omnivore' &&
        r.appliances.every((a) => SAFE.appliances.includes(a))
    )!;

    useAppStore.getState().replaceMealWithRecipe('tuesday', other, 'dinner');

    expect(days()[1].meals[0].recipe.id).toBe(days()[0].meals[0].recipe.id);
  });

  test('comparația de magazine nu numără porția reîncălzită', () => {
    bootWithLeftover({ peopleCount: 6 });
    const state = useAppStore.getState();

    const quote = compareBasketAcrossStores(state.currentPlan!, state.preferences).quotes.find(
      (q) => q.supermarketId === state.preferences.supermarketId
    )!;

    expect(Math.abs(quote.totalCartCostRon - state.currentPlan!.totalCartCostRon)).toBeLessThan(0.02);
  });

  test('costul reîncălzirii rămâne zero când planul e revalidat', () => {
    bootWithLeftover();
    useAppStore.getState().saveCurrentPlan('p');
    const id = useAppStore.getState().savedPlans[0].id;
    useAppStore.setState((s) => ({
      preferences: { ...s.preferences, dietType: 'vegan', dietTypes: ['vegan'] },
    }));

    useAppStore.getState().restoreSavedPlan(id);

    const leftovers = days().flatMap((d) => d.meals).filter((m) => m.isLeftover);
    leftovers.forEach((m) => expect(m.estimatedCostRon).toBe(0));
  });

  test('costul reîncălzirii rămâne zero după schimbarea magazinului', () => {
    bootWithLeftover();

    useAppStore.getState().setSupermarket('kaufland');

    const leftovers = days().flatMap((d) => d.meals).filter((m) => m.isLeftover);
    expect(leftovers.length).toBeGreaterThan(0);
    leftovers.forEach((m) => expect(m.estimatedCostRon).toBe(0));
  });

  test('gătitul dublu nu se poate apăsa la nesfârșit', () => {
    const source = bootWithLeftover();
    const doubled = days()[0].meals.find((m) => m.id === source.id)!.servings;

    for (let i = 0; i < 5; i++) useAppStore.getState().cookDoubleFor('monday', source.id);

    expect(days()[0].meals.find((m) => m.id === source.id)!.servings).toBe(doubled);
  });

  test('anularea înjumătățește exact masa care a fost dublată', () => {
    useAppStore.setState({
      preferences: { ...SAFE, mealSlots: ['lunch', 'dinner'] },
      currentPlan: null,
      groceryItems: [],
      savedPlans: [],
      activeNotice: null,
    });
    useAppStore.getState().generatePlan();
    const dinner = days()[0].meals.find((m) => m.slot === 'dinner')!;
    const lunchBefore = days()[0].meals.find((m) => m.slot === 'lunch')!.servings;
    useAppStore.getState().cookDoubleFor('monday', dinner.id);

    const leftover = days()[1].meals.find((m) => m.isLeftover)!;
    useAppStore.getState().undoCookDouble('tuesday', leftover.id);

    expect(days()[0].meals.find((m) => m.slot === 'lunch')!.servings).toBe(lunchBefore);
    expect(days()[0].meals.find((m) => m.slot === 'dinner')!.servings).toBe(dinner.servings);
  });

  test('coșul rămâne egal cu lista pe tot parcursul', () => {
    bootWithLeftover();
    expect(Math.abs(cartSum() - useAppStore.getState().currentPlan!.totalCartCostRon)).toBeLessThan(0.02);

    useAppStore.getState().setSupermarket('penny');
    expect(Math.abs(cartSum() - useAppStore.getState().currentPlan!.totalCartCostRon)).toBeLessThan(0.02);
  });
});
