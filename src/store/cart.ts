import { GroceryListItem, MealPlan, MealPlanDay, RetailProduct, UserPreferences } from '../types';
import { RETAIL_PRODUCTS_MAP } from '../data/retailProducts';
import { aggregateGroceryList } from '../engine/groceryAggregator';
import { collectDayMeals } from '../engine/plannerEngine';

/**
 * The shopping cart, rebuilt in one place.
 *
 * It used to be rebuilt in 21 places, each with its own copy of the meal filter: most skipped
 * leftovers but not meals eaten out, so a meal marked "în oraș" was bought again after the
 * next edit, and none kept the ticks, so changing one serving cleared everything already in
 * the basket.
 */

/** The meals the cart buys for: everything except reheated leftovers and meals eaten out. */
export { collectDayMeals as collectMealsFromDays } from '../engine/plannerEngine';

export function getActiveExtraProductIds(prefs: UserPreferences): string[] {
  return [...(prefs.selectedSnackIds || []), ...(prefs.selectedDrinkIds || [])];
}

/** The chosen snacks and drinks as full products, so a saved plan carries its own extras. */
export function getActiveExtraProducts(prefs: UserPreferences): RetailProduct[] {
  return getActiveExtraProductIds(prefs)
    .map((id) => RETAIL_PRODUCTS_MAP[id])
    .filter((product): product is RetailProduct => Boolean(product));
}

/**
 * Keeps a tick across a rebuild when the item is still to be bought in no greater quantity.
 * An item that now needs more packs is unticked: the basket no longer holds enough of it.
 */
export function mergePurchased(
  previous: GroceryListItem[],
  next: GroceryListItem[]
): GroceryListItem[] {
  const before = new Map(previous.map((item) => [item.ingredientId, item]));
  return next.map((item) => {
    const old = before.get(item.ingredientId);
    const keepTick =
      old !== undefined &&
      old.isPurchased &&
      !old.isFromPantry &&
      item.packsToBuy <= old.packsToBuy;
    return keepTick && !item.isPurchased ? { ...item, isPurchased: true } : item;
  });
}

export interface RebuiltCart {
  plan: MealPlan;
  items: GroceryListItem[];
}

/**
 * The plan with these days and a cart rebuilt for them. Pass the current items to keep the
 * user's ticks; pass nothing for a new week, which starts with an empty basket.
 */
export function rebuildCart(
  plan: MealPlan,
  days: MealPlanDay[],
  prefs: UserPreferences,
  previousItems?: GroceryListItem[]
): RebuiltCart {
  const aggregated = aggregateGroceryList(
    collectDayMeals(days),
    prefs.supermarketId,
    prefs.excludePantryStaples,
    getActiveExtraProductIds(prefs),
    prefs.pantryInventory || [],
    prefs.pantryStock || {}
  );

  return {
    plan: {
      ...plan,
      days,
      totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
      totalCartCostRon: aggregated.totalCartCostRon,
      extraProducts: getActiveExtraProducts(prefs),
    },
    items: previousItems ? mergePurchased(previousItems, aggregated.items) : aggregated.items,
  };
}
