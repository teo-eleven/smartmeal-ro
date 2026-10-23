import { MealPlanDay, Recipe, UserPreferences } from '../types';
import { calculateRecipePortionCost } from './budgetCalculator';
import { aggregateGroceryList } from './groceryAggregator';

import { GenerateMealPlanOptions, MAX_RECIPE_REPEATS } from './plannerConstants';

/** Guard against pathological loops; a week of meals never needs more than a few dozen swaps. */
const MAX_BUDGET_SWAPS = 60;
/**
 * Candidates within this fraction of the cheapest option count as equal, leaving room for
 * variety. Proportional rather than absolute so it still works for a 10-person household,
 * where every portion cost is an order of magnitude larger.
 */
const BUDGET_TIE_TOLERANCE_RATIO = 0.15;

export function collectDayMeals(days: MealPlanDay[]): { recipe: Recipe; servings: number }[] {
  const meals: { recipe: Recipe; servings: number }[] = [];
  days.forEach((day) =>
    day.meals.forEach((meal) => {
      // A reheated portion was already shopped for on the day it was cooked, and a meal
      // eaten out is not shopped for at all. Every cart in the app is built from this.
      if (!meal.isLeftover && !meal.isEatenOut) {
        meals.push({ recipe: meal.recipe, servings: meal.servings });
      }
    })
  );
  return meals;
}

export function getExtraProductIds(preferences: UserPreferences): string[] {
  return [...(preferences.selectedSnackIds || []), ...(preferences.selectedDrinkIds || [])];
}

/** The real number the user is judged against: whole packages, extras and pantry included. */
function computeCartCost(days: MealPlanDay[], preferences: UserPreferences): number {
  return aggregateGroceryList(
    collectDayMeals(days),
    preferences.supermarketId,
    preferences.excludePantryStaples,
    getExtraProductIds(preferences),
    preferences.pantryInventory || [],
    preferences.pantryStock || {}
  ).totalCartCostRon;
}

function countRecipeUsage(days: MealPlanDay[]): Map<string, number> {
  const usage = new Map<string, number>();
  days.forEach((day) =>
    day.meals.forEach((meal) => usage.set(meal.recipe.id, (usage.get(meal.recipe.id) || 0) + 1))
  );
  return usage;
}

function rebuildDayTotals(day: MealPlanDay): MealPlanDay {
  const primaryMeal = day.meals.find((m) => m.slot === 'dinner') || day.meals[0];
  const sum = day.meals.reduce((total, meal) => total + meal.estimatedCostRon, 0);
  return {
    ...day,
    recipe: primaryMeal ? primaryMeal.recipe : day.recipe,
    estimatedCostRon: Math.round(sum * 100) / 100,
  };
}

/**
 * Brings an over-budget plan down by repeatedly replacing the single most expensive meal
 * with the cheapest alternative that is still legal for that slot.
 *
 * Hard constraints (diet, appliances, supermarket, slot) come from `eligibleRecipes` and are
 * never relaxed — a cheaper cart is worthless if it serves a vegan a steak. Repetition is
 * capped so the week does not collapse onto the single cheapest dish. Stops as soon as the
 * cart fits, or when no swap can improve it further; the caller reports that floor honestly.
 */
export function optimizeDaysForBudget(
  days: MealPlanDay[],
  preferences: UserPreferences,
  eligibleRecipes: Recipe[],
  options?: GenerateMealPlanOptions
): { days: MealPlanDay[]; swapsApplied: number } {
  let workingDays = days;
  let swapsApplied = 0;

  if (computeCartCost(workingDays, preferences) <= preferences.budgetRon) {
    return { days: workingDays, swapsApplied: 0 };
  }

  // Meals we have already tried and could not improve; prevents re-picking the same target.
  const exhausted = new Set<string>();

  while (swapsApplied < MAX_BUDGET_SWAPS) {
    if (computeCartCost(workingDays, preferences) <= preferences.budgetRon) break;

    let targetDayIndex = -1;
    let targetMealIndex = -1;
    let targetCost = -Infinity;

    workingDays.forEach((day, dayIndex) => {
      day.meals.forEach((meal, mealIndex) => {
        if (exhausted.has(meal.id)) return;
        if (meal.estimatedCostRon > targetCost) {
          targetCost = meal.estimatedCostRon;
          targetDayIndex = dayIndex;
          targetMealIndex = mealIndex;
        }
      });
    });

    if (targetDayIndex === -1) break;

    const targetDay = workingDays[targetDayIndex];
    const targetMeal = targetDay.meals[targetMealIndex];
    const usage = countRecipeUsage(workingDays);

    const cheaperCandidate = eligibleRecipes
      .filter((candidate) => {
        if (candidate.id === targetMeal.recipe.id) return false;
        if (candidate.suitableSlots && candidate.suitableSlots.length > 0) {
          if (!candidate.suitableSlots.includes(targetMeal.slot)) return false;
        }
        return (usage.get(candidate.id) || 0) < MAX_RECIPE_REPEATS;
      })
      .map((candidate) => ({
        candidate,
        cost: calculateRecipePortionCost(
          candidate,
          preferences.peopleCount,
          preferences.supermarketId,
          preferences.excludePantryStaples
        ),
      }))
      .filter((entry) => entry.cost < targetMeal.estimatedCostRon)
      .sort((a, b) => a.cost - b.cost);

    // A hard budget must not freeze the week: among options that cost practically the same,
    // prefer one the previous plan did not use, so "Amestecă" still visibly reshuffles.
    const cheapest = cheaperCandidate[0];
    const bestCandidate =
      options?.reshuffle && cheapest
        ? cheaperCandidate.find(
            (entry) =>
              entry.cost <= cheapest.cost * (1 + BUDGET_TIE_TOLERANCE_RATIO) &&
              !options.excludedRecipeIds?.has(entry.candidate.id)
          ) || cheapest
        : cheapest;

    if (!bestCandidate) {
      exhausted.add(targetMeal.id);
      continue;
    }

    const updatedMeals = targetDay.meals.map((meal, index) =>
      index === targetMealIndex
        ? { ...meal, recipe: bestCandidate.candidate, estimatedCostRon: bestCandidate.cost }
        : meal
    );

    workingDays = workingDays.map((day, index) =>
      index === targetDayIndex ? rebuildDayTotals({ ...day, meals: updatedMeals }) : day
    );

    swapsApplied += 1;
  }

  return { days: workingDays, swapsApplied };
}
