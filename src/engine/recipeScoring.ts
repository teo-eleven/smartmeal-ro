import { FoodTier, Recipe, UserPreferences } from '../types';
import { calculateRecipePortionCost } from './budgetCalculator';

/** A recipe with the planner's preference score and its cost for the household. */
export interface ScoredRecipe {
  recipe: Recipe;
  score: number;
  portionCost: number;
}

/** Scores the eligible recipes by favourites, moods, health goals, tier and store signature. */
export function scoreRecipesForPlan(
  eligibleRecipes: Recipe[],
  preferences: UserPreferences,
  effectiveTier: FoodTier
): ScoredRecipe[] {
  return eligibleRecipes.map((recipe) => {
    let score = 0;

    // Dishes the user said they liked, weighted strongly so they regularly make it into plans.
    if ((preferences.favouriteRecipeIds ?? []).includes(recipe.id)) {
      score += 65;
    }

    if (preferences.moodTags && preferences.moodTags.length > 0) {
      let moodMatchCount = 0;
      recipe.moodTags.forEach((tag) => {
        if (preferences.moodTags.includes(tag)) {
          score += 30;
          moodMatchCount++;
        }
      });
      if (moodMatchCount > 1) {
        score += 15;
      }
    }

    if (preferences.healthGoalTags && preferences.healthGoalTags.length > 0) {
      recipe.healthTags?.forEach((tag) => {
        if (preferences.healthGoalTags?.includes(tag)) {
          score += 25;
        }
      });
    }

    // Food Tier preference scoring
    if (recipe.tier === effectiveTier) {
      score += 35;
    } else if (effectiveTier === 'basic') {
      if (recipe.tier === 'medium') score -= 10;
      if (recipe.tier === 'premium') score -= 50;
    } else if (effectiveTier === 'medium') {
      if (recipe.tier === 'basic') score += 5;
      if (recipe.tier === 'premium') score -= 15;
    } else if (effectiveTier === 'premium') {
      if (recipe.tier === 'basic') score -= 30;
      if (recipe.tier === 'medium') score += 5;
    }

    // Supermarket signature boost: prioritize store specialties
    if (preferences.supermarketId && recipe.storeSignature === preferences.supermarketId) {
      score += 25;
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
}

/** Recipes reached by the relaxation ladder: a flat score and their real cost. */
export function scoreFallbackRecipes(
  recipes: Recipe[],
  preferences: UserPreferences
): ScoredRecipe[] {
  return recipes.map((recipe) => ({
    recipe,
    score: 100,
    // Real cost, never a placeholder: the budget optimizer picks its targets by this number.
    portionCost: calculateRecipePortionCost(
      recipe,
      preferences.peopleCount,
      preferences.supermarketId,
      preferences.excludePantryStaples
    ),
  }));
}
