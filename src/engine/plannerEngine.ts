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
    case 'snack':
      return 'Ronțăială (Film & Meci)';
    case 'dessert':
      return 'Desert de Casă';
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

/**
 * Returns alternative recipes suitable for a specific meal slot.
 */
export function getAlternativeRecipes(
  currentRecipe: Recipe,
  preferences: UserPreferences,
  slot?: MealSlot
): Recipe[] {
  const eligible = getEligibleRecipes(preferences);
  return eligible.filter((r) => {
    if (r.id === currentRecipe.id) return false;
    if (slot && r.suitableSlots && r.suitableSlots.length > 0) {
      return r.suitableSlots.includes(slot);
    }
    return true;
  });
}

/**
 * Generates an optimized weekly meal plan strictly respecting constraints, target budget,
 * meal slot compatibility (e.g. no burgers at breakfast), and ingredient synergies.
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

  const usedRecipeIds = new Set<string>();
  const usedIngredientsInPlan = new Set<string>();

  function pickBestRecipeForSlot(slot: MealSlot): Recipe {
    // Strictly filter recipes suitable for this meal moment (never a burger at breakfast!)
    let candidates = scoredRecipes.filter((s) =>
      s.recipe.suitableSlots ? s.recipe.suitableSlots.includes(slot) : true
    );
    if (candidates.length === 0) candidates = scoredRecipes;

    // Sort candidates using mood score, ingredient synergy bonus, and portion cost
    const sorted = [...candidates].sort((a, b) => {
      // Synergy bonus: recipes sharing purchased ingredients with existing meals
      const aShared = a.recipe.ingredients.filter((ing) =>
        usedIngredientsInPlan.has(ing.ingredientId)
      ).length;
      const bShared = b.recipe.ingredients.filter((ing) =>
        usedIngredientsInPlan.has(ing.ingredientId)
      ).length;

      const aTotalScore = a.score + aShared * 8 - a.portionCost * 0.2;
      const bTotalScore = b.score + bShared * 8 - b.portionCost * 0.2;

      return bTotalScore - aTotalScore;
    });

    // Prefer unused first to provide variety
    const unused = sorted.find((c) => !usedRecipeIds.has(c.recipe.id));
    const chosen = unused ? unused.recipe : sorted[0].recipe;

    usedRecipeIds.add(chosen.id);
    chosen.ingredients.forEach((ing) => usedIngredientsInPlan.add(ing.ingredientId));

    return chosen;
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
      estimatedCostRon: Math.round(dayCostSum * 100) / 100,
    };
  });

  // Calculate master grocery list
  const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
  days.forEach((day) => {
    day.meals.forEach((m) => {
      allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings });
    });
  });

  const groceryList = aggregateGroceryList(
    allMealsToAggregate,
    preferences.supermarketId,
    preferences.excludePantryStaples
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
  };
}

/**
 * Swaps a specific meal or slot in an existing plan with a valid alternative suitable for that slot.
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

  // Filter candidates strictly matching slot compatibility
  let slotFiltered = eligible.filter((r) =>
    r.suitableSlots ? r.suitableSlots.includes(slotToSwap) : true
  );
  if (slotFiltered.length === 0) slotFiltered = eligible;

  // Candidates not already in this week's plan
  let availableCandidates = slotFiltered.filter((r) => !existingRecipeIds.has(r.id));

  // Fallback to any slot-compatible recipe except the current one if all recipes are used
  const currentMealObj = targetDay.meals?.find((m) => m.slot === slotToSwap);
  const currentRecipeId = currentMealObj ? currentMealObj.recipe.id : targetDay.recipe.id;

  if (availableCandidates.length === 0) {
    availableCandidates = slotFiltered.filter((r) => r.id !== currentRecipeId);
  }

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
    estimatedCostRon: Math.round(dayCostSum * 100) / 100,
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
