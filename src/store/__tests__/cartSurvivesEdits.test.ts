import { useAppStore } from '../useAppStore';
import { asSubscriber } from '../../__tests__/helpers/subscriber';
import { aggregateGroceryList } from '../../engine/groceryAggregator';
import { GroceryListItem } from '../../types';

/**
 * The 2026-10-21 audit: the cart was rebuilt from scratch on every edit, so ticking twenty
 * items in the shop and then changing a serving lost every tick, and most rebuilds skipped
 * only leftovers, so a meal marked "eaten out" was bought again after the next edit.
 */

const store = () => useAppStore.getState();
const purchasedIds = () =>
  store()
    .groceryItems.filter((item) => item.isPurchased && !item.isFromPantry)
    .map((item) => item.ingredientId)
    .sort();

/** Ticks the first `count` items that are actually to be bought. */
function tickItems(count: number): GroceryListItem[] {
  const toTick = store()
    .groceryItems.filter((item) => !item.isFromPantry && !item.isPurchased)
    .slice(0, count);
  toTick.forEach((item) => store().toggleGroceryItem(item.ingredientId));
  return toTick;
}

/** The cart a correct rebuild would produce: every meal except leftovers and eaten-out ones. */
function expectedCartTotal(): number {
  const { currentPlan, preferences } = store();
  const meals = currentPlan!.days.flatMap((day) =>
    day.meals
      .filter((meal) => !meal.isLeftover && !meal.isEatenOut)
      .map((meal) => ({ recipe: meal.recipe, servings: meal.servings }))
  );
  return aggregateGroceryList(
    meals,
    preferences.supermarketId,
    preferences.excludePantryStaples,
    [...(preferences.selectedSnackIds ?? []), ...(preferences.selectedDrinkIds ?? [])],
    preferences.pantryInventory ?? [],
    preferences.pantryStock ?? {}
  ).totalCartCostRon;
}

beforeEach(() => {
  asSubscriber();
  store().quickStart();
});

describe('bifele din lista de cumpărături supraviețuiesc editărilor', () => {
  test('după schimbarea porțiilor unei mese, bifele rămân (când nu trebuie cumpărat mai mult)', () => {
    const ticked = tickItems(3).map((item) => item.ingredientId);
    const day = store().currentPlan!.days[0];
    const meal = day.meals.find((m) => !m.isLeftover)!;

    store().setMealServings(day.dayOfWeek, meal.id, Math.max(1, meal.servings - 1));

    ticked.forEach((id) => {
      const item = store().groceryItems.find((i) => i.ingredientId === id);
      if (item) expect(item.isPurchased).toBe(true);
    });
  });

  test('după schimbarea magazinului, bifele rămân pe produsele care se cumpără la fel', () => {
    const ticked = tickItems(3);

    store().setSupermarket(store().preferences.supermarketId === 'lidl' ? 'kaufland' : 'lidl');

    ticked.forEach((before) => {
      const after = store().groceryItems.find((i) => i.ingredientId === before.ingredientId);
      if (after && after.packsToBuy <= before.packsToBuy) expect(after.isPurchased).toBe(true);
    });
  });

  test('după ce o masă e marcată „în oraș”, bifele celorlalte produse rămân', () => {
    tickItems(4);
    const before = purchasedIds();
    const day = store().currentPlan!.days[1];
    const meal = day.meals[0];

    store().toggleEatOut(day.dayOfWeek, meal.slot);

    const stillListed = before.filter((id) =>
      store().groceryItems.some((i) => i.ingredientId === id)
    );
    expect(purchasedIds()).toEqual(expect.arrayContaining(stillListed));
  });

  test('dacă acum trebuie cumpărate mai multe pachete, bifa se scoate', () => {
    const [item] = tickItems(1);
    const mealWithIt = store()
      .currentPlan!.days.flatMap((d) => d.meals.map((m) => ({ day: d.dayOfWeek, meal: m })))
      .find(({ meal }) =>
        meal.recipe.ingredients.some((ing) => ing.ingredientId === item.ingredientId)
      )!;

    store().setMealServings(mealWithIt.day, mealWithIt.meal.id, 12);

    const after = store().groceryItems.find((i) => i.ingredientId === item.ingredientId)!;
    if (after.packsToBuy > item.packsToBuy) expect(after.isPurchased).toBe(false);
  });
});

describe('o masă „în oraș” nu se mai cumpără după alte editări', () => {
  test('după marcarea „în oraș” și o schimbare de magazin, coșul nu o conține', () => {
    const day = store().currentPlan!.days[0];
    store().toggleEatOut(day.dayOfWeek, day.meals[0].slot);

    store().setSupermarket(store().preferences.supermarketId === 'lidl' ? 'kaufland' : 'lidl');

    expect(store().currentPlan!.totalCartCostRon).toBeCloseTo(expectedCartTotal(), 1);
  });

  test('după marcarea „în oraș” și schimbarea porțiilor altei mese, coșul nu o conține', () => {
    const [first, second] = store().currentPlan!.days;
    store().toggleEatOut(first.dayOfWeek, first.meals[0].slot);
    const other = second.meals.find((m) => !m.isLeftover)!;

    store().setMealServings(second.dayOfWeek, other.id, other.servings + 1);

    expect(store().currentPlan!.totalCartCostRon).toBeCloseTo(expectedCartTotal(), 1);
  });

  test('după marcarea „în oraș” și adăugarea unui desert, coșul nu o conține', () => {
    const [first, second] = store().currentPlan!.days;
    store().toggleEatOut(first.dayOfWeek, first.meals[0].slot);

    store().addExtraMealToDay(second.dayOfWeek, 'dessert');

    expect(store().currentPlan!.totalCartCostRon).toBeCloseTo(expectedCartTotal(), 1);
  });
});
