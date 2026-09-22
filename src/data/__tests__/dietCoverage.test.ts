import { RECIPES } from '../recipes';
import { INGREDIENTS } from '../ingredients';
import { isRecipeMatchingDiets } from '../../utils/dietCompatibility';
import { DietType, MealSlot, SupermarketId } from '../../types';

const ALL_MARKETS: SupermarketId[] = [
  'lidl',
  'kaufland',
  'carrefour',
  'mega_image',
  'auchan',
  'penny',
  'profi',
  'sezamo',
];

/** A week of 7 days with at most 2 repeats per recipe needs 4 distinct options per slot. */
const MINIMUM_OPTIONS_PER_SLOT = 4;

function countFor(diet: DietType, slot: MealSlot): number {
  return RECIPES.filter(
    (recipe) => isRecipeMatchingDiets(recipe, [diet]) && recipe.suitableSlots?.includes(slot)
  ).length;
}

describe('every diet can actually fill a week', () => {
  const dietsUnderTest: DietType[] = ['omnivore', 'vegetarian', 'vegan', 'pescatarian'];
  const mainSlots: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

  dietsUnderTest.forEach((diet) => {
    mainSlots.forEach((slot) => {
      test(`${diet} has at least ${MINIMUM_OPTIONS_PER_SLOT} options for ${slot}`, () => {
        expect(countFor(diet, slot)).toBeGreaterThanOrEqual(MINIMUM_OPTIONS_PER_SLOT);
      });
    });

    test(`${diet} has at least one dessert`, () => {
      expect(countFor(diet, 'dessert')).toBeGreaterThan(0);
    });
  });
});

describe('newly added recipes keep the catalog sound', () => {
  test('every recipe ingredient exists in the ingredient catalog', () => {
    const missing: string[] = [];
    RECIPES.forEach((recipe) =>
      recipe.ingredients.forEach((ing) => {
        if (!INGREDIENTS[ing.ingredientId]) missing.push(`${recipe.id} -> ${ing.ingredientId}`);
      })
    );
    expect(missing).toEqual([]);
  });

  test('recipe ids are unique', () => {
    const ids = RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every ingredient is priced at all 8 supermarkets', () => {
    const gaps: string[] = [];
    Object.values(INGREDIENTS).forEach((ingredient) =>
      ALL_MARKETS.forEach((market) => {
        const price = ingredient.typicalPriceRon[market];
        if (typeof price !== 'number' || price <= 0) gaps.push(`${ingredient.id}@${market}`);
      })
    );
    expect(gaps).toEqual([]);
  });

  test('every recipe has a tier, slots, steps and nutrition', () => {
    RECIPES.forEach((recipe) => {
      expect(recipe.tier).toBeTruthy();
      expect(recipe.suitableSlots?.length).toBeGreaterThan(0);
      expect(recipe.steps.length).toBeGreaterThan(0);
      expect(recipe.nutritionPerServing.calories).toBeGreaterThan(0);
    });
  });

  test('no recipe labelled vegan contains an animal ingredient', () => {
    // Matched on exact ids: a substring rule would flag unt_arahide (peanut butter, vegan)
    // alongside unt_82 (dairy butter).
    const ANIMAL_INGREDIENT_IDS = [
      'lapte_3_5',
      'branza_vaci_proaspata',
      'telemea_vaca',
      'cascaval_clasic',
      'smantana_20',
      'smantana_gatit',
      'unt_82',
      'iaurt_grecesc',
      'iaurt_grecesc_10',
      'oua_m',
      'miere_poliflora',
      'piept_pui_file',
      'pulpe_pui_dezosate',
      'carne_tocata_amestec',
      'muschiulet_porc',
      'antricot_vita_angus',
      'file_somon_proaspat',
      'somon_afumat',
      'ton_conserva',
      'dorada_proaspata',
      'creveti_decorticati',
      'sunca_praga',
      'bacon_afumat',
      'carnaciori_oltenesti',
      'parmezan_ras',
      'mozzarella_rasa',
      'crema_branza',
      'branza_feta',
    ];
    const violations: string[] = [];
    RECIPES.filter((r) => r.dietType === 'vegan').forEach((recipe) =>
      recipe.ingredients.forEach((ing) => {
        if (ANIMAL_INGREDIENT_IDS.includes(ing.ingredientId)) {
          violations.push(`${recipe.id} -> ${ing.ingredientId}`);
        }
      })
    );
    expect(violations).toEqual([]);
  });
});

describe('gluten-free filtering catches every wheat-based ingredient', () => {
  test('a recipe with wheat flour is never served to a gluten-free user', () => {
    const wheatRecipes = RECIPES.filter((recipe) =>
      recipe.ingredients.some(
        (ing) => ing.ingredientId === 'faina_grau' || ing.ingredientId === 'pesmet_auriu'
      )
    );
    wheatRecipes.forEach((recipe) => {
      expect(isRecipeMatchingDiets(recipe, ['gluten_free'])).toBe(false);
    });
  });
});
