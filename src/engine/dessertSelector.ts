import { DayOfWeek, MealPlan, Recipe, UserPreferences } from '../types';

import { getEligibleDessertRecipes } from './eligibility';

export function selectOptimalDessertForDay(
  dayOfWeek: DayOfWeek,
  currentPlan: MealPlan,
  preferences: UserPreferences
): Recipe | null {
  const day = currentPlan.days.find((d) => d.dayOfWeek === dayOfWeek);
  if (!day) return null;

  // All recipes eligible by diet, appliances, and allergens with 'dessert' suitability
  const eligible = getEligibleDessertRecipes(preferences);

  if (eligible.length === 0) return null;

  // 1. Desserts already used across the ENTIRE plan
  const existingDessertRecipeIdsInPlan = new Set<string>();
  currentPlan.days.forEach((d) => {
    (d.meals || []).forEach((m) => {
      if (m.slot === 'dessert') {
        existingDessertRecipeIdsInPlan.add(m.recipe.id);
      }
    });
  });

  // 2. Recipes on THIS specific day
  const recipeIdsInThisDay = new Set<string>((day.meals || []).map((m) => m.recipe.id));

  // 3. Frequency count of all recipes across the plan
  const planRecipeUsage = new Map<string, number>();
  currentPlan.days.forEach((d) => {
    (d.meals || []).forEach((m) => {
      planRecipeUsage.set(m.recipe.id, (planRecipeUsage.get(m.recipe.id) || 0) + 1);
    });
  });

  // Day context metrics
  const dayCalories = (day.meals || []).reduce(
    (sum, m) => sum + (m.recipe?.nutritionPerServing?.calories || 0),
    0
  );
  const dayIngredients = new Set<string>(
    (day.meals || []).flatMap((m) => m.recipe.ingredients.map((i) => i.ingredientId))
  );
  const dayHasHeavyDairy = Array.from(dayIngredients).some(
    (id) => id.includes('branza') || id.includes('telemea') || id.includes('cascaval')
  );

  // All ingredients in plan for shopping cart synergy
  const allPlanIngredients = new Set<string>(
    currentPlan.days.flatMap((d) =>
      (d.meals || []).flatMap((m) => m.recipe.ingredients.map((i) => i.ingredientId))
    )
  );

  // Score each candidate dessert
  const scored = eligible.map((candidate) => {
    let score = 100;

    // RULE 1: Ensure DIFFERENT desserts across days!
    if (existingDessertRecipeIdsInPlan.has(candidate.id)) {
      score -= 300; // Heavy penalty if already added as dessert on another day
    }

    // RULE 2: Never repeat a recipe cooked on the SAME day
    if (recipeIdsInThisDay.has(candidate.id)) {
      score -= 600; // Hard penalty
    }

    // Penalize general repetition across the week
    const generalUses = planRecipeUsage.get(candidate.id) || 0;
    score -= generalUses * 50;

    // RULE 3: Caloric and richness balance
    const candCalories = candidate.nutritionPerServing?.calories || 300;
    if (dayCalories > 1150) {
      // Heavy day: favor lighter, fresher desserts
      if (candCalories <= 320) {
        score += 40;
      } else if (candCalories >= 450) {
        score -= 30;
      }
    } else if (dayCalories > 0 && dayCalories < 850) {
      // Light day: favor rich/satisfying desserts
      if (candCalories >= 350) {
        score += 35;
      }
    }

    // RULE 4: Dairy/Cheese fatigue
    const candIngs = candidate.ingredients.map((i) => i.ingredientId);
    const candHasCheese = candIngs.some((id) => id.includes('branza') || id.includes('telemea'));
    if (dayHasHeavyDairy && candHasCheese) {
      score -= 25;
    }

    // RULE 5: Mood tag synergy
    (preferences.moodTags || []).forEach((tag) => {
      if (candidate.moodTags.includes(tag)) {
        score += 30;
      }
    });

    // RULE 6: Food Tier synergy
    if (preferences.foodTier && candidate.tier === preferences.foodTier) {
      score += 20;
    }

    // RULE 8: dishes the user said they liked. Large enough to be felt, small enough that it
    // cannot drag a dish past the variety and budget rules that follow.
    if ((preferences.favouriteRecipeIds ?? []).includes(candidate.id)) {
      score += 40;
    }

    // RULE 7: Shopping cart ingredient overlap (economical synergy)
    const overlapping = candIngs.filter((id) => allPlanIngredients.has(id));
    score += overlapping.length * 6;

    return { candidate, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored[0]?.candidate || eligible[0];
}
