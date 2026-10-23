import { computeRecipeNutrition } from '../engine/ingredientUnits';
import { FoodTier, MealSlot, Recipe, RecipeSource } from '../types';
import { EXTENDED_RECIPES } from './extendedRecipes';
import { HEALTH_SPECIALTY_RECIPES } from './healthSpecialtyRecipes';
import { getRecipeHealthTags } from './healthTags';
import { CLASSIC_RECIPES_PART_1 } from './catalog/classicRecipesPart1';
import { CLASSIC_RECIPES_PART_2 } from './catalog/classicRecipesPart2';
import { BREAKFASTS_AND_SNACKS } from './catalog/breakfastsAndSnacks';
import { HOMEMADE_DESSERTS } from './catalog/homemadeDesserts';
import { ROMANIAN_MAINS } from './catalog/romanianMains';
import { LIGHT_BREAKFASTS_AND_DESSERTS } from './catalog/lightBreakfastsAndDesserts';
import { VEGAN_GLUTEN_FREE_RECIPES } from './catalog/veganGlutenFreeRecipes';
import {
  RECIPE_HEALTH_TAGS_MAP,
  RECIPE_SLOTS_MAP,
  RECIPE_STORE_SPEC_MAP,
  RECIPE_TIERS_MAP,
} from './catalog/catalogMaps';
import { enrichRecipeMoodTags } from './catalog/moodTags';

export { RECIPE_HEALTH_TAGS_MAP } from './catalog/catalogMaps';
export { enrichRecipeMoodTags } from './catalog/moodTags';

/**
 * The recipe catalog, assembled from the files in ./catalog in their original order.
 * The base recipes take their slots and tiers from catalogMaps; the newer ones carry their own.
 */
const BASE_RECIPES: RecipeSource[] = [...CLASSIC_RECIPES_PART_1, ...CLASSIC_RECIPES_PART_2];

const NEW_RECIPES: RecipeSource[] = [
  ...BREAKFASTS_AND_SNACKS,
  ...HOMEMADE_DESSERTS,
  ...ROMANIAN_MAINS,
  ...LIGHT_BREAKFASTS_AND_DESSERTS,
  ...VEGAN_GLUTEN_FREE_RECIPES,
];

/**
 * One catalog recipe, completed: slots and tier defaults, store data, derived health tags,
 * nutrition computed from the ingredients, and mood tags read from that finished recipe.
 */
function buildRecipe(
  recipe: RecipeSource,
  defaults: { suitableSlots: MealSlot[] | undefined; tier: FoodTier }
): Recipe {
  const storeSpec = RECIPE_STORE_SPEC_MAP[recipe.id];
  const explicitHealth = RECIPE_HEALTH_TAGS_MAP[recipe.id] ?? recipe.healthTags;
  const completed: Recipe = {
    ...recipe,
    suitableSlots: defaults.suitableSlots,
    tier: defaults.tier,
    healthTags: getRecipeHealthTags({ ...recipe, healthTags: explicitHealth }),
    nutritionPerServing: computeRecipeNutrition(recipe.ingredients),
    availableSupermarkets: recipe.availableSupermarkets ?? storeSpec?.availableSupermarkets,
    storeSignature: recipe.storeSignature ?? storeSpec?.storeSignature,
    storeBadgeLabel: recipe.storeBadgeLabel ?? storeSpec?.storeBadgeLabel,
  };
  return { ...completed, moodTags: enrichRecipeMoodTags(completed) };
}

export const RECIPES: Recipe[] = [
  ...BASE_RECIPES.map((recipe) =>
    buildRecipe(recipe, {
      suitableSlots: recipe.suitableSlots ?? RECIPE_SLOTS_MAP[recipe.id] ?? ['dinner', 'lunch'],
      tier: recipe.tier ?? RECIPE_TIERS_MAP[recipe.id] ?? 'medium',
    })
  ),
  ...NEW_RECIPES.map((recipe) =>
    buildRecipe(recipe, {
      suitableSlots: recipe.suitableSlots,
      tier: recipe.tier ?? RECIPE_TIERS_MAP[recipe.id] ?? 'medium',
    })
  ),
  ...EXTENDED_RECIPES.map((recipe) =>
    buildRecipe(recipe, {
      suitableSlots: recipe.suitableSlots ?? ['lunch', 'dinner'],
      tier: recipe.tier ?? RECIPE_TIERS_MAP[recipe.id] ?? 'basic',
    })
  ),
  ...HEALTH_SPECIALTY_RECIPES.map((recipe) =>
    buildRecipe(recipe, {
      suitableSlots: recipe.suitableSlots ?? ['lunch', 'dinner'],
      tier: recipe.tier ?? 'medium',
    })
  ),
];

export const RECIPES_MAP: Record<string, Recipe> = RECIPES.reduce(
  (acc, recipe) => {
    acc[recipe.id] = recipe;
    return acc;
  },
  {} as Record<string, Recipe>
);
