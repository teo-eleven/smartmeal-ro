import { RECIPES } from '../../data/recipes';
import { getIngredientAllergens } from '../../data/allergens';
import { isRecipeMatchingDiets } from '../dietCompatibility';
import { Recipe } from '../../types';

/**
 * The "Fără Gluten" diet and the "gluten" allergen must agree.
 *
 * They used to be two hand-written lists, and they drifted: the diet list missed oats,
 * soy sauce and borscht, which `INGREDIENT_ALLERGENS` correctly tags as gluten. A user who
 * picked the diet without also ticking the allergen was served gluten in every plan.
 */
function carriesGluten(recipe: Recipe): boolean {
  return recipe.ingredients.some((ing) => getIngredientAllergens(ing.ingredientId).includes('gluten'));
}

describe('dieta „Fără Gluten" și alergenul gluten', () => {
  test('nicio rețetă cu gluten nu trece de dieta gluten_free', () => {
    const leaks = RECIPES.filter(
      (recipe) => carriesGluten(recipe) && isRecipeMatchingDiets(recipe, ['gluten_free'])
    );

    expect(leaks.map((r) => r.id)).toEqual([]);
  });

  test('dieta nu respinge rețete pe care datele de alergeni le consideră fără gluten', () => {
    const overblocked = RECIPES.filter(
      (recipe) => !carriesGluten(recipe) && !isRecipeMatchingDiets(recipe, ['gluten_free'])
    );

    expect(overblocked.map((r) => r.id)).toEqual([]);
  });
});

describe('dieta rămâne utilizabilă după restrângere', () => {
  test('„Fără Gluten" are destule rețete pentru o săptămână completă', () => {
    const glutenFree = RECIPES.filter((recipe) => isRecipeMatchingDiets(recipe, ['gluten_free']));

    // Seven days across three slots, with the variety rule allowing at most two repeats.
    expect(glutenFree.length).toBeGreaterThanOrEqual(21);
  });
});
