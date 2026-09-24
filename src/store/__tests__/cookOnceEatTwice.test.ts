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
    preferences: { ...BASE },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    activeNotice: null,
  });
  useAppStore.getState().generatePlan();
}

const dayOf = (d: DayOfWeek) => useAppStore.getState().currentPlan!.days.find((x) => x.dayOfWeek === d)!;
const cartSum = () =>
  Math.round(useAppStore.getState().groceryItems.reduce((t, i) => t + i.estimatedPriceRon, 0) * 100) / 100;

/**
 * Cooking a double portion once and reheating it the next day is the cheapest thing a meal
 * planner can suggest. The reheated meal must not be shopped for twice, which is the whole
 * point and also the easiest thing to get wrong.
 */
describe('gătesc o dată, mănânc de două ori', () => {
  test('a doua zi primește același fel, marcat ca reîncălzit', () => {
    boot();
    const source = dayOf('monday').meals[0];

    useAppStore.getState().cookDoubleFor('monday', source.id);

    const next = dayOf('tuesday').meals[0];
    expect(next.recipe.id).toBe(source.recipe.id);
    expect(next.isLeftover).toBe(true);
  });

  test('porțiile se dublează în ziua în care gătești', () => {
    boot();
    const source = dayOf('monday').meals[0];
    const before = source.servings;

    useAppStore.getState().cookDoubleFor('monday', source.id);

    expect(dayOf('monday').meals[0].servings).toBe(before * 2);
  });

  test('masa reîncălzită nu costă nimic la casă', () => {
    boot();
    useAppStore.getState().cookDoubleFor('monday', dayOf('monday').meals[0].id);

    expect(dayOf('tuesday').meals[0].estimatedCostRon).toBe(0);
  });

  test('nu cumperi ingredientele de două ori', () => {
    boot();
    const before = cartSum();
    const mondayCost = dayOf('monday').meals[0].estimatedCostRon;

    useAppStore.getState().cookDoubleFor('monday', dayOf('monday').meals[0].id);
    const after = cartSum();

    // One extra portion of Monday's dish, never a second shop for Tuesday's.
    expect(after).toBeLessThan(before + mondayCost * 2);
    expect(after).toBeGreaterThan(0);
  });

  test('totalul coșului rămâne egal cu suma listei', () => {
    boot();
    useAppStore.getState().cookDoubleFor('monday', dayOf('monday').meals[0].id);

    const plan = useAppStore.getState().currentPlan!;
    expect(Math.abs(cartSum() - plan.totalCartCostRon)).toBeLessThan(0.02);
  });

  test('anulat, planul revine la o masă gătită normal', () => {
    boot();
    const source = dayOf('monday').meals[0];
    useAppStore.getState().cookDoubleFor('monday', source.id);

    useAppStore.getState().undoCookDouble('tuesday', dayOf('tuesday').meals[0].id);

    expect(dayOf('tuesday').meals[0].isLeftover).toBeFalsy();
    expect(dayOf('monday').meals[0].servings).toBe(source.servings);
  });

  test('ultima zi nu are unde să reporteze, deci refuză', () => {
    boot();
    const last = dayOf('friday').meals[0];

    useAppStore.getState().cookDoubleFor('friday', last.id);

    expect(dayOf('friday').meals[0].servings).toBe(last.servings);
    expect(useAppStore.getState().activeNotice).not.toBeNull();
  });
});
