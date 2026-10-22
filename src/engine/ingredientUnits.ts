import { Ingredient, MeasurementUnit, RecipeIngredient, RecipeNutrition } from '../types';
import { GRAMS_PER_ML, GRAMS_PER_UNIT, INGREDIENT_NUTRITION } from '../data/ingredientNutrition';
import { INGREDIENTS } from '../data/ingredients';

/**
 * One place that turns a recipe line into grams and into the catalog's own unit.
 *
 * The shopping list, the budget and the recipe cost used to add recipe amounts up raw, in
 * whatever unit the recipe used, and read the total in the catalog's unit: 150 g of avocado
 * became 150 avocados. Everything that needs an amount now goes through here.
 */

const ML_PER_SPOON: Partial<Record<MeasurementUnit, number>> = {
  lingura: 15,
  lingurita: 5,
};

const PER_100_GRAMS = 100;

function gramsPerMl(ingredientId: string): number {
  return GRAMS_PER_ML[ingredientId] ?? 1;
}

/** Grams of `amount` in `unit` of this ingredient, or null when no conversion is known. */
function amountToGrams(ingredientId: string, amount: number, unit: MeasurementUnit): number | null {
  if (unit === 'g') return amount;
  if (unit === 'ml') return amount * gramsPerMl(ingredientId);
  const spoonMl = ML_PER_SPOON[unit];
  if (spoonMl !== undefined) return amount * spoonMl * gramsPerMl(ingredientId);
  const pieceGrams = GRAMS_PER_UNIT[ingredientId];
  return pieceGrams === undefined ? null : amount * pieceGrams;
}

/** The inverse: how many of `unit` make up these grams, or null when unknown. */
function gramsToAmount(ingredientId: string, grams: number, unit: MeasurementUnit): number | null {
  if (unit === 'g') return grams;
  if (unit === 'ml') return grams / gramsPerMl(ingredientId);
  const spoonMl = ML_PER_SPOON[unit];
  if (spoonMl !== undefined) return grams / gramsPerMl(ingredientId) / spoonMl;
  const pieceGrams = GRAMS_PER_UNIT[ingredientId];
  return pieceGrams === undefined ? null : grams / pieceGrams;
}

export function toGrams(line: RecipeIngredient, ingredient: Ingredient | undefined): number | null {
  if (!ingredient) return null;
  return amountToGrams(ingredient.id, line.amountPerServing, line.unit);
}

/**
 * The line's amount in the unit the catalog sells and prices the ingredient in, or null when
 * the two units cannot be related. Same unit: returned unchanged.
 */
export function toCatalogAmount(
  line: RecipeIngredient,
  ingredient: Ingredient | undefined
): number | null {
  if (!ingredient) return null;
  if (line.unit === ingredient.unit) return line.amountPerServing;
  const grams = toGrams(line, ingredient);
  return grams === null ? null : gramsToAmount(ingredient.id, grams, ingredient.unit);
}

/**
 * A serving's nutrition, summed from its ingredients' grams and the reference table. Lines
 * that cannot be converted contribute nothing; the catalog tests forbid such lines.
 */
export function computeRecipeNutrition(lines: RecipeIngredient[]): RecipeNutrition {
  const totals = lines.reduce(
    (sum, line) => {
      const per100 = INGREDIENT_NUTRITION[line.ingredientId];
      const grams = toGrams(line, INGREDIENTS[line.ingredientId]);
      if (!per100 || grams === null) return sum;
      const factor = grams / PER_100_GRAMS;
      return {
        kcal: sum.kcal + per100.kcal * factor,
        protein: sum.protein + per100.proteinG * factor,
        carbs: sum.carbs + per100.carbsG * factor,
        fat: sum.fat + per100.fatG * factor,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    calories: Math.round(totals.kcal),
    proteinGrams: Math.round(totals.protein),
    carbsGrams: Math.round(totals.carbs),
    fatGrams: Math.round(totals.fat),
  };
}
