import { DietType, MealPlan, MealPlanDay, MealSlot, PlannedMeal, Recipe, UserPreferences } from '../types';
import { calculateRecipePortionCost } from './budgetCalculator';
import { aggregateGroceryList } from './groceryAggregator';

import { collectDayMeals, getExtraProductIds, optimizeDaysForBudget } from './budgetOptimizer';
import { getEligibleRecipes, getSlotLabelRo } from './eligibility';
import { GenerateMealPlanOptions } from './plannerConstants';
import { scoreRecipesForPlan } from './recipeScoring';
import { createSlotPicker } from './slotPicker';

// The planner's parts live in their own modules; everything is re-exported from here so
// existing imports of '../engine/plannerEngine' keep working.
export { collectDayMeals, optimizeDaysForBudget } from './budgetOptimizer';
export { selectOptimalDessertForDay } from './dessertSelector';
export * from './eligibility';
export * from './plannerConstants';

/** Breakfast, lunch, dinner, then dessert: the order meals appear in within a day. */
const CANONICAL_SLOT_ORDER: Record<string, number> = {
  breakfast: 1,
  lunch: 2,
  dinner: 3,
  snack: 4,
  dessert: 5,
};

/** Board slots in canonical order; snacks are handled outside the meal plan. */
function orderedSlots(slots: MealSlot[]): MealSlot[] {
  return slots
    .filter((s) => s !== 'snack')
    .sort((a, b) => (CANONICAL_SLOT_ORDER[a] ?? 99) - (CANONICAL_SLOT_ORDER[b] ?? 99));
}

/** Throws on inputs no plan can be built from; checkPlanFeasibility explains them to users. */
function assertPlannable(preferences: UserPreferences, eligibleRecipes: Recipe[]): void {
  if (!preferences.cookingDays || preferences.cookingDays.length === 0) {
    throw new Error('[PlannerEngine] At least one cooking day must be selected.');
  }
  if (preferences.peopleCount <= 0) {
    throw new Error('[PlannerEngine] peopleCount must be at least 1.');
  }
  if (preferences.budgetRon <= 0) {
    throw new Error('[PlannerEngine] budgetRon must be greater than 0.');
  }
  if (!preferences.appliances || preferences.appliances.length === 0) {
    throw new Error('[PlannerEngine] At least one kitchen appliance must be selected.');
  }
  if (eligibleRecipes.length === 0) {
    throw new Error(
      `[PlannerEngine] Nu s-au găsit rețete compatibile pentru dieta "${preferences.dietType}" și electrocasnicele selectate: [${preferences.appliances.join(', ')}].`
    );
  }
}

type SlotPicker = ReturnType<typeof createSlotPicker>;

/** One planned day, or null when none of its slots could be filled. */
function planDay(
  dayOfWeek: MealPlanDay['dayOfWeek'],
  dayIndex: number,
  defaultSlots: MealSlot[],
  preferences: UserPreferences,
  pickBestRecipeForSlot: SlotPicker
): MealPlanDay | null {
  const daySlots = orderedSlots([...(preferences.dailyMealSlots?.[dayOfWeek] ?? defaultSlots)]);

  // Rotate spotlight mood across all user-selected moods so every craving gets dedicated focus!
  const daySpotlightMood =
    preferences.moodTags && preferences.moodTags.length > 0
      ? preferences.moodTags[dayIndex % preferences.moodTags.length]
      : undefined;

  const dayMeals: PlannedMeal[] = daySlots.flatMap((slot): PlannedMeal[] => {
    const recipe = pickBestRecipeForSlot(slot, daySpotlightMood);
    if (!recipe) return [];
    const cost = calculateRecipePortionCost(
      recipe,
      preferences.peopleCount,
      preferences.supermarketId,
      preferences.excludePantryStaples
    );
    return [
      {
        id: `${dayOfWeek}-${slot}`,
        slot,
        slotLabelRo: getSlotLabelRo(slot),
        recipe,
        servings: preferences.peopleCount,
        estimatedCostRon: cost,
      },
    ];
  });

  // A day whose only slots could not be filled is left out rather than shown empty.
  if (dayMeals.length === 0) return null;
  const primaryMeal = dayMeals.find((m) => m.slot === 'dinner') || dayMeals[0];
  const dayCostSum = dayMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0);

  return {
    dayOfWeek,
    meals: dayMeals,
    recipe: primaryMeal.recipe,
    servings: preferences.peopleCount,
    estimatedCostRon: Math.round(dayCostSum * 100) / 100,
  };
}

/** The plan around its days: cart totals from the aggregated list and the budget outcome. */
function assemblePlan(
  preferences: UserPreferences,
  days: MealPlanDay[],
  swapsApplied: number
): MealPlan {
  const groceryList = aggregateGroceryList(
    collectDayMeals(days),
    preferences.supermarketId,
    preferences.excludePantryStaples,
    getExtraProductIds(preferences),
    preferences.pantryInventory || [],
    preferences.pantryStock || {}
  );

  return {
    id: `plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    supermarketId: preferences.supermarketId,
    peopleCount: preferences.peopleCount,
    totalBudgetRon: preferences.budgetRon,
    totalRecipeCostRon: groceryList.totalRecipePortionCostRon,
    totalCartCostRon: groceryList.totalCartCostRon,
    days,
    budgetStatus: {
      isWithinBudget: groceryList.totalCartCostRon <= preferences.budgetRon,
      minimumAchievableRon: groceryList.totalCartCostRon,
      swapsApplied,
    },
  };
}

/**
 * Generates an optimized weekly meal plan strictly respecting constraints, target budget,
 * meal slot compatibility (e.g. no burgers at breakfast), and ingredient synergies.
 */
export function generateMealPlan(
  preferences: UserPreferences,
  options?: GenerateMealPlanOptions
): MealPlan {
  const eligibleRecipes = getEligibleRecipes(preferences);
  assertPlannable(preferences, eligibleRecipes);

  const activeDiets: DietType[] =
    preferences.dietTypes && preferences.dietTypes.length > 0
      ? preferences.dietTypes
      : [preferences.dietType];
  const slots = orderedSlots(
    preferences.mealSlots && preferences.mealSlots.length > 0 ? preferences.mealSlots : ['dinner']
  );
  const effectiveTier = preferences.foodTier || 'medium';

  // The relaxation ladder rebuilds candidates from the whole catalog when a slot runs dry.
  // It relaxes the store and the slot -- never a dish the user asked never to see again.
  const pickBestRecipeForSlot = createSlotPicker({
    preferences,
    scoredRecipes: scoreRecipesForPlan(eligibleRecipes, preferences, effectiveTier),
    activeDiets,
    rejectedIds: new Set(preferences.dislikedRecipeIds ?? []),
    requirePorkFree: preferences.healthGoalTags?.includes('pork_free'),
    activeHealthGoals: (preferences.healthGoalTags || []).filter((g) => g !== 'pork_free'),
    effectiveTier,
    options,
  });

  const days = preferences.cookingDays
    .map((dayOfWeek, dayIndex) =>
      planDay(dayOfWeek, dayIndex, slots, preferences, pickBestRecipeForSlot)
    )
    .filter((day): day is MealPlanDay => day !== null);

  // Bring the cart down to the user's budget before the plan is handed back.
  const { days: budgetedDays, swapsApplied } = optimizeDaysForBudget(
    days,
    preferences,
    eligibleRecipes,
    options
  );
  return assemblePlan(preferences, budgetedDays, swapsApplied);
}
