import { Allergen, Recipe } from '../types';
import { getIngredientAllergens } from '../data/allergens';

/**
 * Every allergen a recipe carries, derived from its ingredients.
 */
export function getRecipeAllergens(recipe: Recipe): Allergen[] {
  const found = new Set<Allergen>();
  recipe.ingredients.forEach((ing) =>
    getIngredientAllergens(ing.ingredientId).forEach((allergen) => found.add(allergen))
  );
  return Array.from(found);
}

/**
 * True when the recipe contains none of the allergens the user avoids.
 *
 * This is a safety filter, not a preference: it is applied as a hard constraint alongside
 * diet, and is never relaxed by any fallback path.
 */
export function isRecipeSafeForAllergies(recipe: Recipe, avoided: Allergen[] = []): boolean {
  if (avoided.length === 0) return true;
  const recipeAllergens = getRecipeAllergens(recipe);
  return !avoided.some((allergen) => recipeAllergens.includes(allergen));
}
