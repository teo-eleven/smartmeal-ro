import {
  DayOfWeek,
  DietType,
  MealPlan,
  MealPlanDay,
  MealSlot,
  PlannedMeal,
  Recipe,
  UserPreferences,
} from '../types';
import { RECIPES } from '../data/recipes';
import { calculateRecipePortionCost } from './budgetCalculator';
import { aggregateGroceryList } from './groceryAggregator';

export function getSlotLabelRo(slot: MealSlot): string {
  switch (slot) {
    case 'breakfast':
      return 'Mic Dejun';
    case 'lunch':
      return 'Prânz';
    case 'dinner':
      return 'Cină';
  }
}

/**
 * Checks if a recipe's diet type is compatible with user's diet restrictions.
 */
export function isDietCompatible(recipeDiet: DietType, userDiet: DietType): boolean {
  if (userDiet === 'omnivore') return true;
  if (userDiet === 'pescatarian') {
    return recipeDiet === 'pescatarian' || recipeDiet === 'vegetarian' || recipeDiet === 'vegan';
  }
  if (userDiet === 'vegetarian') {
    return recipeDiet === 'vegetarian' || recipeDiet === 'vegan';
  }
  if (userDiet === 'vegan') {
    return recipeDiet === 'vegan';
  }
  return false;
}

/**
 * Checks if user has all appliances required to cook the recipe.
 */
export function hasRequiredAppliances(
  recipeAppliances: string[],
  userAppliances: string[]
): boolean {
  if (recipeAppliances.length === 0) return true;
  return recipeAppliances.every((app) => userAppliances.includes(app));
}

/**
 * Filters the master catalog down to recipes satisfying hard constraints (diet & appliances).
 */
export function getEligibleRecipes(preferences: UserPreferences): Recipe[] {
  return RECIPES.filter(
    (recipe) =>
      isDietCompatible(recipe.dietType, preferences.dietType) &&
      hasRequiredAppliances(recipe.appliances, preferences.appliances)
  );
}

const BREAKFAST_IDS = new Set([
  'omleta_taraneasca_telemea',
  'toast_ou_avocado',
  'shakshuka_oua_rosii',
  'mamaliga_branza_smantana',
  'paste_cremoase_spanac',
]);

const LUNCH_IDS = new Set([
  'salata_greceasca_telemea',
  'quesadilla_pui_cascaval',
  'wrap_ton_avocado',
  'supa_crema_legume_crutoane',
  'ciorba_radauteana_rapida',
  'salata_calda_pui_crutoane',
  'paste_ton_rosii',
  'dovlecei_pane_cuptor',
]);

/**
 * Generates an optimized weekly meal plan strictly respecting constraints, target budget,
 * and desired meals per day (1, 2, or 3 meals: Mic Dejun, Prânz, Cină).
 */
export function generateMealPlan(preferences: UserPreferences): MealPlan {
  // Input Validations
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

  const eligibleRecipes = getEligibleRecipes(preferences);

  if (eligibleRecipes.length === 0) {
    throw new Error(
      `[PlannerEngine] Nu s-au găsit rețete compatibile pentru dieta "${preferences.dietType}" și electrocasnicele selectate: [${preferences.appliances.join(', ')}].`
    );
  }

  const slots: MealSlot[] =
    preferences.mealSlots && preferences.mealSlots.length > 0
      ? preferences.mealSlots
      : ['dinner'];

  // Score each recipe based on mood tags and portion cost
  const scoredRecipes = eligibleRecipes.map((recipe) => {
    let score = 0;

    if (preferences.moodTags && preferences.moodTags.length > 0) {
      recipe.moodTags.forEach((tag) => {
        if (preferences.moodTags.includes(tag)) {
          score += 15;
        }
      });
    }

    const portionCost = calculateRecipePortionCost(
      recipe,
      preferences.peopleCount,
      preferences.supermarketId,
      preferences.excludePantryStaples
    );

    return {
      recipe,
      score,
      portionCost,
    };
  });

  scoredRecipes.sort((a, b) => b.score - a.score || a.portionCost - b.portionCost);

  const usedRecipeIds = new Set<string>();

  function pickBestRecipeForSlot(slot: MealSlot): Recipe {
    let candidates = scoredRecipes;
    if (slot === 'breakfast') {
      const breakfastCandidates = scoredRecipes.filter((s) => BREAKFAST_IDS.has(s.recipe.id));
      if (breakfastCandidates.length > 0) candidates = breakfastCandidates;
    } else if (slot === 'lunch') {
      const lunchCandidates = scoredRecipes.filter((s) => LUNCH_IDS.has(s.recipe.id));
      if (lunchCandidates.length > 0) candidates = lunchCandidates;
    }

    // Prefer unused first
    const unused = candidates.find((c) => !usedRecipeIds.has(c.recipe.id));
    if (unused) {
      usedRecipeIds.add(unused.recipe.id);
      return unused.recipe;
    }

    // Fallback to least recently used candidate
    const fallback = candidates[0].recipe;
    return fallback;
  }

  // Construct MealPlanDay entries
  const days: MealPlanDay[] = preferences.cookingDays.map((dayOfWeek) => {
    const dayMeals: PlannedMeal[] = slots.map((slot) => {
      const recipe = pickBestRecipeForSlot(slot);
      const cost = calculateRecipePortionCost(
        recipe,
        preferences.peopleCount,
        preferences.supermarketId,
        preferences.excludePantryStaples
      );

      return {
        id: `${dayOfWeek}-${slot}`,
        slot,
        slotLabelRo: getSlotLabelRo(slot),
        recipe,
        servings: preferences.peopleCount,
        estimatedCostRon: cost,
      };
    });

    const primaryMeal = dayMeals.find((m) => m.slot === 'dinner') || dayMeals[0];
    const dayCostSum = dayMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0);

    return {
      dayOfWeek,
      meals: dayMeals,
      recipe: primaryMeal.recipe,
      servings: preferences.peopleCount,
      estimatedCostRon: Math.round(dayCostSum * 10) / 10,
    };
  });

  // Collect all meals for grocery list aggregation
  const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
  days.forEach((d) => {
    d.meals.forEach((m) => {
      allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings });
    });
  });

  const aggregated = aggregateGroceryList(
    allMealsToAggregate,
    preferences.supermarketId,
    preferences.excludePantryStaples
  );

  return {
    id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    supermarketId: preferences.supermarketId,
    peopleCount: preferences.peopleCount,
    totalBudgetRon: preferences.budgetRon,
    totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
    totalCartCostRon: aggregated.totalCartCostRon,
    days,
  };
}

/**
 * Intelligently swaps a meal in an existing plan for a compatible alternative.
 * Supports swapping specific slots (breakfast, lunch, dinner) when multiple meals per day exist.
 */
export function swapMealInPlan(
  currentPlan: MealPlan,
  dayToSwap: DayOfWeek,
  preferences: UserPreferences,
  targetSlot?: MealSlot
): MealPlan {
  const dayIndex = currentPlan.days.findIndex((d) => d.dayOfWeek === dayToSwap);
  if (dayIndex === -1) {
    throw new Error(`[PlannerEngine] Ziua "${dayToSwap}" nu se găsește în planul curent.`);
  }

  const targetDay = currentPlan.days[dayIndex];
  const slotToSwap: MealSlot =
    targetSlot || (targetDay.meals && targetDay.meals.length > 0 ? targetDay.meals[0].slot : 'dinner');

  // Collect existing recipe IDs in the plan
  const existingRecipeIds = new Set<string>();
  currentPlan.days.forEach((d) => {
    if (d.meals && d.meals.length > 0) {
      d.meals.forEach((m) => existingRecipeIds.add(m.recipe.id));
    } else {
      existingRecipeIds.add(d.recipe.id);
    }
  });

  const eligible = getEligibleRecipes(preferences);

  // Filter candidates matching slot preference if possible
  let slotFiltered = eligible;
  if (slotToSwap === 'breakfast') {
    const bf = eligible.filter((r) => BREAKFAST_IDS.has(r.id));
    if (bf.length > 0) slotFiltered = bf;
  } else if (slotToSwap === 'lunch') {
    const ln = eligible.filter((r) => LUNCH_IDS.has(r.id));
    if (ln.length > 0) slotFiltered = ln;
  }

  // Candidates not already in this week's plan
  let availableCandidates = slotFiltered.filter((r) => !existingRecipeIds.has(r.id));

  // Fallback to any eligible recipe except the current one if all recipes are used
  const currentMealObj = targetDay.meals?.find((m) => m.slot === slotToSwap);
  const currentRecipeId = currentMealObj ? currentMealObj.recipe.id : targetDay.recipe.id;

  if (availableCandidates.length === 0) {
    availableCandidates = eligible.filter((r) => r.id !== currentRecipeId);
  }

  if (availableCandidates.length === 0) {
    throw new Error('[PlannerEngine] Nu există alte rețete compatibile pentru swap.');
  }

  // Pick the best replacement matching mood preferences
  availableCandidates.sort((a, b) => {
    const aMatches = a.moodTags.filter((t) => preferences.moodTags.includes(t)).length;
    const bMatches = b.moodTags.filter((t) => preferences.moodTags.includes(t)).length;
    return bMatches - aMatches;
  });

  const replacementRecipe = availableCandidates[0];
  const newCost = calculateRecipePortionCost(
    replacementRecipe,
    currentPlan.peopleCount,
    preferences.supermarketId,
    preferences.excludePantryStaples
  );

  const updatedDays = [...currentPlan.days];
  const updatedMeals = (targetDay.meals || []).map((m) => {
    if (m.slot === slotToSwap) {
      return {
        ...m,
        recipe: replacementRecipe,
        estimatedCostRon: newCost,
      };
    }
    return m;
  });

  const primaryMeal = updatedMeals.find((m) => m.slot === 'dinner') || updatedMeals[0] || {
    recipe: replacementRecipe,
    estimatedCostRon: newCost,
  };
  const dayCostSum = updatedMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0);

  updatedDays[dayIndex] = {
    ...targetDay,
    meals: updatedMeals,
    recipe: primaryMeal.recipe,
    estimatedCostRon: Math.round(dayCostSum * 10) / 10,
  };

  // Re-aggregate full grocery list
  const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
  updatedDays.forEach((d) => {
    d.meals.forEach((m) => {
      allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings });
    });
  });

  const reaggregated = aggregateGroceryList(
    allMealsToAggregate,
    preferences.supermarketId,
    preferences.excludePantryStaples
  );

  return {
    ...currentPlan,
    totalRecipeCostRon: reaggregated.totalRecipePortionCostRon,
    totalCartCostRon: reaggregated.totalCartCostRon,
    days: updatedDays,
  };
}
