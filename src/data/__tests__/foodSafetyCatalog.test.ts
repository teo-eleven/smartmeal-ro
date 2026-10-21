import { RECIPES } from '../recipes';
import { INGREDIENTS } from '../ingredients';
import {
  ALLERGEN_FREE_INGREDIENT_IDS,
  INGREDIENT_ALLERGENS,
  getIngredientAllergens,
} from '../allergens';
import { recipeContainsPork } from '../healthTags';
import { getRecipeAllergens } from '../../utils/allergenFilter';
import { Allergen } from '../../types';

/**
 * Safety audit of the whole catalog, not of a sample.
 *
 * The 2026-10-21 audit found fish, soy, nut and gluten ingredients that carried no allergen,
 * and three pork products the "Fără porc" filter did not recognise. Every one of them was a
 * new ingredient that nobody checked against the maps, so these tests force the check.
 */

const usedIngredientIds = Array.from(
  new Set(RECIPES.flatMap((recipe) => recipe.ingredients.map((ing) => ing.ingredientId)))
);

describe('harta de alergeni acoperă tot catalogul', () => {
  test('fiecare ingredient folosit are alergeni declarați sau e marcat explicit ca fără alergeni', () => {
    const unclassified = usedIngredientIds.filter(
      (id) => !(id in INGREDIENT_ALLERGENS) && !ALLERGEN_FREE_INGREDIENT_IDS.has(id)
    );

    expect(unclassified).toEqual([]);
  });

  test('niciun ingredient nu e în același timp cu alergeni și „fără alergeni”', () => {
    const contradictory = Object.keys(INGREDIENT_ALLERGENS).filter((id) =>
      ALLERGEN_FREE_INGREDIENT_IDS.has(id)
    );

    expect(contradictory).toEqual([]);
  });

  test('fiecare ID din hărți există în catalogul de ingrediente', () => {
    const unknown = [...Object.keys(INGREDIENT_ALLERGENS), ...ALLERGEN_FREE_INGREDIENT_IDS].filter(
      (id) => !(id in INGREDIENTS)
    );

    expect(unknown).toEqual([]);
  });

  test.each<[string, Allergen]>([
    ['file_cod_congelat', 'peste'],
    ['pastrav_proaspat', 'peste'],
    ['tofu_clasic', 'soia'],
    ['lapte_migdale_fara_zahar', 'nuci'],
    ['lapte_vegetal_ovaz', 'gluten'],
    ['chifle_burger', 'susan'],
    ['lapte_cocos', 'nuci'],
    ['tortilla_chips_nachos', 'gluten'],
  ])('%s poartă alergenul %s', (ingredientId, allergen) => {
    expect(getIngredientAllergens(ingredientId)).toContain(allergen);
  });

  test('năutul nu mai e marcat cu susan (nu există tahini în catalog)', () => {
    expect(getIngredientAllergens('naut_conserva')).not.toContain('susan');
  });

  test.each<[string, Allergen]>([
    ['cod_cuptor_dovlecei_ierburi', 'peste'],
    ['pastrav_gratar_marar_lamaie', 'peste'],
    ['smoothie_bowl_ghimbir_afine', 'nuci'],
    ['crema_banane_chia_arahide', 'gluten'],
    ['burger_pui_crocant', 'susan'],
  ])('rețeta %s e ascunsă celor care evită %s', (recipeId, allergen) => {
    const recipe = RECIPES.find((r) => r.id === recipeId);

    expect(recipe).toBeDefined();
    expect(getRecipeAllergens(recipe!)).toContain(allergen);
  });
});

describe('filtrul „Fără porc” recunoaște toate produsele din porc', () => {
  // "cârnaci"/"cârnaț" rather than "cârna": the risotto rice is sold as "Arborio / Carnaroli".
  const PORK_NAME_PATTERN =
    /porc|bacon|șunc|sunc|cârnaci|carnaci|cârnaț|carnat|slănin|slanin|costiț|costit/i;

  test('orice ingredient al cărui nume sugerează porc e marcat containsPork', () => {
    const unflagged = Object.values(INGREDIENTS).filter(
      (ingredient) => PORK_NAME_PATTERN.test(ingredient.name) && ingredient.containsPork !== true
    );

    expect(unflagged.map((i) => i.id)).toEqual([]);
  });

  test.each([
    'paste_bolognese_clasice',
    'chiftelute_marinate_sos',
    'chili_con_carne_rapid',
    'musaca_cartofi_carne_tocata',
    'ciorba_perisoare_acrita_bors',
    'tacos_vita_salsa_rosii',
    'sandvis_cald_cascaval_sunca',
    'mic_dejun_englezesc_romanesc',
    'tocanita_cartofi_carnaciori',
  ])('%s e recunoscută ca rețetă cu porc', (recipeId) => {
    const recipe = RECIPES.find((r) => r.id === recipeId);

    expect(recipe).toBeDefined();
    expect(recipeContainsPork(recipe!)).toBe(true);
  });

  test('o rețetă e cu porc dacă și numai dacă are un ingredient marcat containsPork', () => {
    const mismatched = RECIPES.filter((recipe) => {
      const hasFlaggedIngredient = recipe.ingredients.some(
        (ing) => INGREDIENTS[ing.ingredientId]?.containsPork === true
      );
      return hasFlaggedIngredient !== recipeContainsPork(recipe);
    });

    expect(mismatched.map((r) => r.id)).toEqual([]);
  });
});

describe('rețetele vegane nu conțin produse animale', () => {
  test('nicio rețetă vegană nu conține lactate sau ouă', () => {
    const leaks = RECIPES.filter((recipe) => {
      if (recipe.dietType !== 'vegan') return false;
      const allergens = getRecipeAllergens(recipe);
      return allergens.includes('lactate') || allergens.includes('oua');
    });

    expect(leaks.map((r) => r.id)).toEqual([]);
  });

  test('nicio rețetă vegană nu conține miere', () => {
    const leaks = RECIPES.filter(
      (recipe) =>
        recipe.dietType === 'vegan' &&
        recipe.ingredients.some((ing) => ing.ingredientId === 'miere_poliflora')
    );

    expect(leaks.map((r) => r.id)).toEqual([]);
  });
});
