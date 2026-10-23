import { RECIPES, RECIPES_MAP } from '../../data/recipes';
import { INGREDIENTS } from '../../data/ingredients';
import { INGREDIENT_NUTRITION } from '../../data/ingredientNutrition';
import {
  computeRecipeNutrition,
  shoppingAmount,
  toCatalogAmount,
  toGrams,
} from '../ingredientUnits';
import { calculateRecipePortionCost } from '../budgetCalculator';

/**
 * The 2026-10-21 audit: 26 recipe lines used a different unit from the catalog and the
 * shopping maths added them up raw, so 150 g of avocado was bought as 150 avocados (about
 * 674 RON a serving), and declared calories were up to half the real value. Nutrition is now
 * computed from the gramajes and every line converts to the catalog's unit.
 */

describe('valorile nutriționale ale ingredientelor', () => {
  test('fiecare ingredient din catalog are valori la 100 g', () => {
    const missing = Object.keys(INGREDIENTS).filter((id) => !INGREDIENT_NUTRITION[id]);

    expect(missing).toEqual([]);
  });

  test('nicio intrare nu aparține unui ingredient inexistent', () => {
    const orphans = Object.keys(INGREDIENT_NUTRITION).filter((id) => !INGREDIENTS[id]);

    expect(orphans).toEqual([]);
  });

  /**
   * Atwater check: calories should match 4 kcal/g protein, 4 kcal/g digestible carbohydrate,
   * 2 kcal/g fibre and 9 kcal/g fat. It catches a misplaced decimal in a hand-typed table.
   */
  test('caloriile fiecărui ingredient se potrivesc cu macronutrienții (fără greșeli de tastare)', () => {
    const implausible = Object.entries(INGREDIENT_NUTRITION).filter(([, n]) => {
      const atwater = 4 * n.proteinG + 4 * (n.carbsG - n.fiberG) + 2 * n.fiberG + 9 * n.fatG;
      return Math.abs(atwater - n.kcal) > Math.max(25, n.kcal * 0.15);
    });

    expect(implausible.map(([id, n]) => `${id}: ${n.kcal} kcal`)).toEqual([]);
  });

  test('fibrele nu depășesc carbohidrații și nimic nu e negativ', () => {
    const broken = Object.entries(INGREDIENT_NUTRITION).filter(
      ([, n]) =>
        n.fiberG > n.carbsG || [n.kcal, n.proteinG, n.carbsG, n.fatG, n.fiberG].some((v) => v < 0)
    );

    expect(broken.map(([id]) => id)).toEqual([]);
  });
});

describe('unitățile din rețete', () => {
  const lines = RECIPES.flatMap((recipe) =>
    recipe.ingredients.map((line) => ({ recipe: recipe.id, line }))
  );

  test('fiecare linie se poate converti în unitatea din catalog', () => {
    const unconvertible = lines.filter(
      ({ line }) => toCatalogAmount(line, INGREDIENTS[line.ingredientId]) === null
    );

    expect(
      unconvertible.map(({ recipe, line }) => `${recipe}: ${line.ingredientId} ${line.unit}`)
    ).toEqual([]);
  });

  test('fiecare linie se poate converti în grame, pentru calculul nutrițional', () => {
    const unconvertible = lines.filter(
      ({ line }) => toGrams(line, INGREDIENTS[line.ingredientId]) === null
    );

    expect(
      unconvertible.map(({ recipe, line }) => `${recipe}: ${line.ingredientId} ${line.unit}`)
    ).toEqual([]);
  });

  test('150 g de avocado înseamnă cam un avocado, nu 150', () => {
    const amount = toCatalogAmount(
      { ingredientId: 'avocado', amountPerServing: 150, unit: 'g' },
      INGREDIENTS.avocado
    );

    expect(amount).toBeGreaterThan(0.5);
    expect(amount).toBeLessThan(1.5);
  });

  test('o linie în aceeași unitate ca în catalog rămâne neschimbată', () => {
    expect(
      toCatalogAmount(
        { ingredientId: 'oua_m', amountPerServing: 2, unit: 'buc' },
        INGREDIENTS.oua_m
      )
    ).toBe(2);
  });

  test.each([
    ['guacamole_chips_nachos', 25],
    ['salata_caesar_pui_parmezan', 25],
    ['bowl_curcan_quinoa_avocado', 25],
  ])('%s costă sub %d RON pe porție, nu sute', (recipeId, maxRon) => {
    const cost = calculateRecipePortionCost(RECIPES_MAP[recipeId], 1, 'lidl', false);

    expect(cost).toBeLessThan(maxRon);
  });

  test('nicio rețetă nu costă absurd de mult pe porție', () => {
    const absurd = RECIPES.filter(
      (recipe) => calculateRecipePortionCost(recipe, 1, 'lidl', false) > 60
    );

    expect(absurd.map((r) => r.id)).toEqual([]);
  });
});

describe('valorile nutriționale ale rețetelor', () => {
  test('ce se afișează este exact ce rezultă din ingrediente', () => {
    const drifted = RECIPES.filter((recipe) => {
      const computed = computeRecipeNutrition(recipe.ingredients);
      return JSON.stringify(computed) !== JSON.stringify(recipe.nutritionPerServing);
    });

    expect(drifted.map((r) => r.id)).toEqual([]);
  });

  test('fiecare rețetă are o valoare calorică plauzibilă pentru o porție', () => {
    const implausible = RECIPES.filter(
      (recipe) =>
        recipe.nutritionPerServing.calories < 80 || recipe.nutritionPerServing.calories > 1400
    );

    expect(implausible.map((r) => `${r.id}: ${r.nutritionPerServing.calories}`)).toEqual([]);
  });

  test('salamul de biscuiți nu mai pretinde 380 kcal', () => {
    expect(RECIPES_MAP.salam_de_biscuiti_clasic.nutritionPerServing.calories).toBeGreaterThan(600);
  });
});

describe('o linie neconvertibilă nu dispare din lista de cumpărături', () => {
  test('shoppingAmount păstrează cantitatea brută când conversia nu e posibilă', () => {
    const line = { ingredientId: 'faina_alba', amountPerServing: 2, unit: 'buc' as const };

    expect(toCatalogAmount(line, INGREDIENTS.faina_alba)).toBeNull();
    expect(shoppingAmount(line, INGREDIENTS.faina_alba)).toBe(2);
  });
});
