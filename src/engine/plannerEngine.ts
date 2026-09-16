import {
  DayOfWeek,
  DietType,
  MealPlan,
  MealPlanDay,
  Recipe,
  UserPreferences,
} from '../types';
import { RECIPES } from '../data/recipes';
import { calculateRecipePortionCost } from './budgetCalculator';
import { aggregateGroceryList } from './groceryAggregator';

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
 * Generates an optimized weekly meal plan strictly respecting constraints and target budget.
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

  // Calculate score for each recipe
  const scoredRecipes = eligibleRecipes.map((recipe) => {
    let score = 0;

    // Mood match bonus
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

  // Sort by score descending, then by portion cost ascending
  scoredRecipes.sort((a, b) => b.score - a.score || a.portionCost - b.portionCost);

  const neededDaysCount = preferences.cookingDays.length;
  const selectedRecipes: Recipe[] = [];

  // Pick unique recipes matching needed days count
  for (let i = 0; i < neededDaysCount; i++) {
    if (i < scoredRecipes.length) {
      selectedRecipes.push(scoredRecipes[i].recipe);
    } else {
      // If fewer recipes than days, repeat with lowest repetition
      selectedRecipes.push(scoredRecipes[i % scoredRecipes.length].recipe);
    }
  }

  // Optimize for budget if needed
  let aggregated = aggregateGroceryList(
    selectedRecipes.map((r) => ({ recipe: r, servings: preferences.peopleCount })),
    preferences.supermarketId,
    preferences.excludePantryStaples
  );

  // If over budget and alternative cheaper recipes exist, greedily replace most expensive recipes
  if (aggregated.totalCartCostRon > preferences.budgetRon && scoredRecipes.length > neededDaysCount) {
    const economicalPool = [...scoredRecipes].sort((a, b) => a.portionCost - b.portionCost);

    for (let i = 0; i < selectedRecipes.length; i++) {
      if (aggregated.totalCartCostRon <= preferences.budgetRon) break;

      // Find a cheaper candidate not yet in the plan
      const candidate = economicalPool.find(
        (c) => !selectedRecipes.some((sr) => sr.id === c.recipe.id)
      );

      if (candidate) {
        selectedRecipes[i] = candidate.recipe;
        aggregated = aggregateGroceryList(
          selectedRecipes.map((r) => ({ recipe: r, servings: preferences.peopleCount })),
          preferences.supermarketId,
          preferences.excludePantryStaples
        );
      }
    }
  }

  // Construct MealPlanDay entries
  const days: MealPlanDay[] = preferences.cookingDays.map((dayOfWeek, idx) => {
    const recipe = selectedRecipes[idx];
    const cost = calculateRecipePortionCost(
      recipe,
      preferences.peopleCount,
      preferences.supermarketId,
      preferences.excludePantryStaples
    );

    return {
      dayOfWeek,
      recipe,
      servings: preferences.peopleCount,
      estimatedCostRon: cost,
    };
  });

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
 * Intelligently swaps a single recipe in an existing plan for a compatible alternative.
 */
export function swapMealInPlan(
  currentPlan: MealPlan,
  dayToSwap: DayOfWeek,
  preferences: UserPreferences
): MealPlan {
  const dayIndex = currentPlan.days.findIndex((d) => d.dayOfWeek === dayToSwap);
  if (dayIndex === -1) {
    throw new Error(`[PlannerEngine] Ziua "${dayToSwap}" nu se găsește în planul curent.`);
  }

  const existingRecipeIds = new Set(currentPlan.days.map((d) => d.recipe.id));
  const eligible = getEligibleRecipes(preferences);

  // Candidates not already in this week's plan
  let availableCandidates = eligible.filter((r) => !existingRecipeIds.has(r.id));

  // Fallback to any eligible recipe except the current one if all recipes are used
  if (availableCandidates.length === 0) {
    availableCandidates = eligible.filter(
      (r) => r.id !== currentPlan.days[dayIndex].recipe.id
    );
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
  updatedDays[dayIndex] = {
    ...updatedDays[dayIndex],
    recipe: replacementRecipe,
    estimatedCostRon: newCost,
  };

  const reaggregated = aggregateGroceryList(
    updatedDays.map((d) => ({ recipe: d.recipe, servings: d.servings })),
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
