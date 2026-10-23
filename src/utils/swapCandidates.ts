import { DayOfWeek, MealPlan, MealSlot, Recipe, UserPreferences } from '../types';
import { getEligibleDessertRecipes, getEligibleRecipes } from '../engine/plannerEngine';
import { calculateRecipePortionCost } from '../engine/budgetCalculator';

export interface RankedCandidate {
  recipe: Recipe;
  /** What the meal would cost for its servings. */
  mealCostRon: number;
  /** Change to the week's cost if this replaces the current dish (negative = cheaper). */
  costDeltaRon: number;
  /** True when the week still fits the budget after the swap. */
  fitsBudget: boolean;
  isUnusedThisWeek: boolean;
}

const roundRon = (value: number) => Math.round(value * 100) / 100;

/**
 * The replacements offered in the swap modal, best first: those that keep the week within
 * budget, then dishes not already on the plan, then the cheapest. The list used to start with
 * whatever came first in the catalog, so the first choice could push the cart over budget.
 */
export function rankSwapCandidates(
  plan: MealPlan,
  preferences: UserPreferences,
  dayOfWeek: DayOfWeek,
  slot?: MealSlot
): { currentRecipe: Recipe | undefined; candidates: RankedCandidate[] } {
  const day = plan.days.find((d) => d.dayOfWeek === dayOfWeek);
  const targetMeal = slot ? day?.meals.find((m) => m.slot === slot) : undefined;
  const currentRecipe = targetMeal?.recipe ?? day?.recipe;
  const servings = targetMeal?.servings ?? plan.peopleCount;
  const isDessert =
    slot === 'dessert' || Boolean(currentRecipe?.suitableSlots?.includes('dessert'));

  const eligible = isDessert
    ? getEligibleDessertRecipes(preferences)
    : getEligibleRecipes(preferences);
  const forSlot = isDessert
    ? eligible
    : eligible.filter((r) => (slot && r.suitableSlots ? r.suitableSlots.includes(slot) : true));
  const pool = (forSlot.length > 0 ? forSlot : eligible).filter((r) => r.id !== currentRecipe?.id);

  const usedIds = new Set(plan.days.flatMap((d) => d.meals.map((m) => m.recipe.id)));
  const costOf = (recipe: Recipe) =>
    calculateRecipePortionCost(
      recipe,
      servings,
      preferences.supermarketId,
      preferences.excludePantryStaples
    );
  const currentCost = currentRecipe ? costOf(currentRecipe) : 0;

  const candidates = pool.map((recipe): RankedCandidate => {
    const mealCostRon = costOf(recipe);
    const costDeltaRon = roundRon(mealCostRon - currentCost);
    return {
      recipe,
      mealCostRon,
      costDeltaRon,
      fitsBudget: plan.totalCartCostRon + costDeltaRon <= plan.totalBudgetRon,
      isUnusedThisWeek: !usedIds.has(recipe.id),
    };
  });

  const sorted = [...candidates].sort(
    (a, b) =>
      Number(b.fitsBudget) - Number(a.fitsBudget) ||
      Number(b.isUnusedThisWeek) - Number(a.isUnusedThisWeek) ||
      a.costDeltaRon - b.costDeltaRon
  );
  return { currentRecipe, candidates: sorted };
}

/** "+3,20 lei" / "−1,50 lei" / "același preț", for the badge next to each candidate. */
export function formatCostDelta(deltaRon: number): string {
  if (Math.abs(deltaRon) < 0.05) return 'același preț';
  const amount = Math.abs(deltaRon).toFixed(2).replace('.', ',');
  return `${deltaRon > 0 ? '+' : '−'}${amount} lei`;
}
