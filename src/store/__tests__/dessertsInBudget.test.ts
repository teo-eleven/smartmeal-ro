import { useAppStore } from '../useAppStore';
import { asSubscriber } from '../../__tests__/helpers/subscriber';
import { generateMealPlan } from '../../engine/plannerEngine';

/**
 * Regenerating a week kept the user's desserts by appending them AFTER the budget pass, so
 * the plan could end over budget while its budgetStatus still said "within budget". The days
 * that had a dessert now ask the planner for one up front, and the budget pass sees it.
 */

const store = () => useAppStore.getState();
const dessertDays = () =>
  store()
    .currentPlan!.days.filter((day) => day.meals.some((meal) => meal.slot === 'dessert'))
    .map((day) => day.dayOfWeek)
    .sort();

function addDessertsToFirstTwoDays() {
  const [first, second] = store().currentPlan!.days;
  store().addExtraMealToDay(first.dayOfWeek, 'dessert');
  store().addExtraMealToDay(second.dayOfWeek, 'dessert');
  return [first.dayOfWeek, second.dayOfWeek].sort();
}

function expectStatusMatchesCart() {
  const plan = store().currentPlan!;
  expect(plan.budgetStatus?.isWithinBudget).toBe(plan.totalCartCostRon <= plan.totalBudgetRon);
}

beforeEach(() => {
  asSubscriber();
  store().quickStart();
});

describe('deserturile păstrate la regenerare intră în calculul bugetului', () => {
  test('„Regenerează” păstrează deserturile pe aceleași zile, iar starea bugetului e corectă', () => {
    const days = addDessertsToFirstTwoDays();

    store().reshufflePlan();

    expect(dessertDays()).toEqual(expect.arrayContaining(days));
    expectStatusMatchesCart();
  });

  test('o schimbare de preferințe păstrează deserturile, iar starea bugetului e corectă', () => {
    const days = addDessertsToFirstTwoDays();

    store().updatePreferencesAndRebuild({ peopleCount: store().preferences.peopleCount + 1 });

    expect(dessertDays()).toEqual(expect.arrayContaining(days));
    expectStatusMatchesCart();
  });

  test('cu un buget strâns, starea nu pretinde că planul se încadrează', () => {
    addDessertsToFirstTwoDays();
    useAppStore.setState({ preferences: { ...store().preferences, budgetRon: 40 } });

    store().reshufflePlan();

    expectStatusMatchesCart();
  });

  test('deserturile preluate nu se scriu în preferințele salvate', () => {
    addDessertsToFirstTwoDays();
    const slotsBefore = store().preferences.dailyMealSlots;

    store().reshufflePlan();

    expect(store().preferences.dailyMealSlots).toEqual(slotsBefore);
  });
});

describe('cazul exact din audit', () => {
  test('bugetul acoperă meniul fără deserturi; deserturile nu pot face planul să pară „în buget”', () => {
    addDessertsToFirstTwoDays();
    const withoutDesserts = generateMealPlan({ ...store().preferences, budgetRon: 100000 });
    const justAboveMenuCost = Math.ceil(withoutDesserts.totalCartCostRon) + 1;

    store().updatePreferencesAndRebuild({ budgetRon: justAboveMenuCost });

    expectStatusMatchesCart();
  });
});
