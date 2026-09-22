import { MealPlan, SupermarketId, UserPreferences } from '../types';
import { SUPERMARKETS } from '../data/supermarkets';
import { aggregateGroceryList } from './groceryAggregator';
import { isSupermarketCompatible } from './plannerEngine';

export interface StoreBasketQuote {
  supermarketId: SupermarketId;
  name: string;
  brandColor: string;
  totalCartCostRon: number;
  /** Difference against the cheapest store. 0 for the winner. */
  differenceVsCheapestRon: number;
  /** How much switching from the user's current store would save. Negative means costlier. */
  savingVsCurrentRon: number;
  isCurrent: boolean;
  isCheapest: boolean;
  /**
   * Recipes in the plan this store does not carry. The quote still prices the same basket,
   * so the figure stays comparable, but the user deserves to know before switching.
   */
  unavailableRecipeTitles: string[];
}

export interface StoreComparison {
  quotes: StoreBasketQuote[];
  cheapest: StoreBasketQuote;
  current: StoreBasketQuote;
  maxSavingRon: number;
}

const ALL_STORE_IDS = Object.keys(SUPERMARKETS) as SupermarketId[];

/**
 * Prices the exact same weekly basket at every supermarket.
 *
 * The meals are held fixed on purpose: the question the user is asking is "what would this
 * shop cost elsewhere?", not "what would a different plan cost?". Pantry stock and chosen
 * extras are carried across so the totals match what the grocery screen shows.
 */
export function compareBasketAcrossStores(
  plan: MealPlan,
  preferences: UserPreferences
): StoreComparison {
  const meals = plan.days.flatMap((day) =>
    day.meals.map((meal) => ({ recipe: meal.recipe, servings: meal.servings }))
  );
  const extraProductIds = [
    ...(preferences.selectedSnackIds || []),
    ...(preferences.selectedDrinkIds || []),
  ];

  const priced = ALL_STORE_IDS.map((supermarketId) => {
    const aggregated = aggregateGroceryList(
      meals,
      supermarketId,
      preferences.excludePantryStaples,
      extraProductIds,
      preferences.pantryInventory || []
    );

    const unavailableRecipeTitles = Array.from(
      new Set(
        plan.days
          .flatMap((day) => day.meals)
          .filter((meal) => !isSupermarketCompatible(meal.recipe, supermarketId))
          .map((meal) => meal.recipe.title)
      )
    );

    return {
      supermarketId,
      name: SUPERMARKETS[supermarketId].name,
      brandColor: SUPERMARKETS[supermarketId].brandColor,
      totalCartCostRon: aggregated.totalCartCostRon,
      unavailableRecipeTitles,
    };
  });

  const cheapestCost = Math.min(...priced.map((p) => p.totalCartCostRon));
  const currentCost =
    priced.find((p) => p.supermarketId === plan.supermarketId)?.totalCartCostRon ?? cheapestCost;

  const quotes: StoreBasketQuote[] = priced
    .map((entry) => ({
      ...entry,
      differenceVsCheapestRon: Math.round((entry.totalCartCostRon - cheapestCost) * 100) / 100,
      savingVsCurrentRon: Math.round((currentCost - entry.totalCartCostRon) * 100) / 100,
      isCurrent: entry.supermarketId === plan.supermarketId,
      isCheapest: entry.totalCartCostRon === cheapestCost,
    }))
    .sort((a, b) => a.totalCartCostRon - b.totalCartCostRon);

  const cheapest = quotes[0];
  const current = quotes.find((q) => q.isCurrent) ?? cheapest;

  return {
    quotes,
    cheapest,
    current,
    maxSavingRon: Math.round((current.totalCartCostRon - cheapest.totalCartCostRon) * 100) / 100,
  };
}
