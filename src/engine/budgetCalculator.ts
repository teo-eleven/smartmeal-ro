import { shoppingAmount } from './ingredientUnits';
import { FoodTier, Recipe, SupermarketId } from '../types';
import { INGREDIENTS } from '../data/ingredients';
import { RECIPES } from '../data/recipes';

/**
 * Calculates the exact theoretical ingredient cost consumed by a recipe for a given number of people.
 */
export function calculateRecipePortionCost(
  recipe: Recipe,
  peopleCount: number,
  supermarketId: SupermarketId,
  excludePantryStaples: boolean = true
): number {
  if (peopleCount <= 0) {
    throw new Error(`[BudgetCalculator] Invalid peopleCount: ${peopleCount}. Must be >= 1.`);
  }

  let totalCost = 0;

  for (const item of recipe.ingredients) {
    const ingredient = INGREDIENTS[item.ingredientId];
    if (!ingredient) continue;
    if (excludePantryStaples && ingredient.isPantryStaple) continue;

    const packPrice = ingredient.typicalPriceRon[supermarketId];
    if (!packPrice || packPrice <= 0) continue;

    // Needed for the whole meal, in the unit the catalog prices the ingredient in
    const totalNeeded = shoppingAmount(item, ingredient) * peopleCount;
    // Fractional cost of ingredient consumed
    const portionFraction = totalNeeded / ingredient.standardPackSize;
    totalCost += portionFraction * packPrice;
  }

  return Math.round(totalCost * 100) / 100;
}

/**
 * Calculates dynamic minimum viable budget for the onboarding slider.
 * Gives user realistic feedback so they don't enter an impossible figure.
 */
export function calculateMinimumViableBudget(
  peopleCount: number,
  daysCount: number,
  supermarketId: SupermarketId = 'lidl',
  excludePantryStaples: boolean = true,
  mealsPerDay: number = 1,
  foodTier: FoodTier = 'medium'
): number {
  if (peopleCount <= 0) {
    throw new Error(`[BudgetCalculator] Invalid peopleCount: ${peopleCount}. Must be >= 1.`);
  }
  if (daysCount <= 0 || daysCount > 7) {
    throw new Error(`[BudgetCalculator] Invalid daysCount: ${daysCount}. Must be between 1 and 7.`);
  }

  const safeMealsPerDay = Math.max(1, Math.min(3, mealsPerDay));

  // Calculate costs of main meal recipes (lunch/dinner) filtered by food tier
  const mainRecipes = RECIPES.filter((r) =>
    !r.suitableSlots || r.suitableSlots.includes('lunch') || r.suitableSlots.includes('dinner')
  );

  let tierFiltered = mainRecipes;
  if (foodTier === 'basic') {
    tierFiltered = mainRecipes.filter((r) => r.tier === 'basic');
  } else if (foodTier === 'medium') {
    tierFiltered = mainRecipes.filter((r) => r.tier === 'medium');
  } else if (foodTier === 'premium') {
    tierFiltered = mainRecipes.filter((r) => r.tier === 'premium');
  }
  const recipesToEvaluate = tierFiltered.length >= 3 ? tierFiltered : mainRecipes;

  const sortedCosts = recipesToEvaluate
    .map((r) => calculateRecipePortionCost(r, peopleCount, supermarketId, excludePantryStaples))
    .sort((a, b) => a - b);

  // Take the realistic central distribution (25th to 65th percentile) representing typical meals picked by the planner
  const startIdx = Math.floor(sortedCosts.length * 0.25);
  const endIdx = Math.max(startIdx + 1, Math.floor(sortedCosts.length * 0.65));
  const realisticSlice = sortedCosts.slice(startIdx, endIdx);
  const avgRealisticMealCost =
    realisticSlice.reduce((sum, cost) => sum + cost, 0) / realisticSlice.length;

  // Real-world packaging factor at Romanian supermarkets: when buying whole packs (meat 500g, veggies 1kg, oils, spices),
  // small baskets incur an overhead between 1.25x and 1.38x
  const basketOverhead = peopleCount === 1 ? 1.38 : peopleCount === 2 ? 1.30 : 1.24;
  const baseline = avgRealisticMealCost * daysCount * safeMealsPerDay * basketOverhead;

  // Round up to nearest 5 RON for clean UI slider display
  return Math.max(30 * safeMealsPerDay, Math.ceil(baseline / 5) * 5);
}
