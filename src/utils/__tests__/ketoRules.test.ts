import { RECIPES } from '../../data/recipes';
import { INGREDIENTS } from '../../data/ingredients';
import { generateMealPlan, getEligibleDessertRecipes } from '../../engine/plannerEngine';
import { UserPreferences } from '../../types';
import {
  isRecipeMatchingDiets,
  KETO_EXCLUDED_INGREDIENT_IDS,
  KETO_MAX_CARBS_PER_SERVING,
} from '../dietCompatibility';

/**
 * Keto used to reject only ingredient ids containing cartofi, orez, malai, paste or spaghete,
 * so 87 recipes counted as keto and 54 of them had over 30 g of carbs: pancakes, burgers,
 * bean stews, every dessert. A keto recipe now has to pass BOTH a carb ceiling and an
 * explicit list of high-carb ingredients.
 */

const ketoRecipes = RECIPES.filter((recipe) => isRecipeMatchingDiets(recipe, ['keto']));

describe('dieta keto', () => {
  test('nicio rețetă keto nu depășește plafonul de carbohidrați pe porție', () => {
    const overCeiling = ketoRecipes.filter(
      (recipe) => recipe.nutritionPerServing.carbsGrams > KETO_MAX_CARBS_PER_SERVING
    );

    expect(overCeiling.map((r) => `${r.id} (${r.nutritionPerServing.carbsGrams}g)`)).toEqual([]);
  });

  test.each([
    'snitele_pui_cuptor',
    'toast_ou_avocado',
    'burger_pui_crocant',
    'quesadilla_pui_cascaval',
    'terci_ovaz_fructe_miere',
    'clatite_pufoase_americane',
    'negresa_de_casa_glazura_ciocolata',
    'tocanita_fasole_boabe_boia',
    'mancare_linte_verde_vegan',
    'bowl_curcan_quinoa_avocado',
  ])('%s nu mai trece drept keto', (recipeId) => {
    const recipe = RECIPES.find((r) => r.id === recipeId);

    expect(recipe).toBeDefined();
    expect(isRecipeMatchingDiets(recipe!, ['keto'])).toBe(false);
  });

  test('rețetele cu carbohidrați puțini dar cu ingredient interzis sunt respinse', () => {
    const lowCarbWithBread = {
      ...RECIPES.find((r) => r.id === 'omleta_taraneasca_telemea')!,
      ingredients: [{ ingredientId: 'paine_toast', amountPerServing: 10, unit: 'g' as const }],
    };

    expect(isRecipeMatchingDiets(lowCarbWithBread, ['keto'])).toBe(false);
  });

  test('keto rămâne utilizabil: destule rețete pentru mic dejun, prânz și cină', () => {
    const countFor = (slot: string) =>
      ketoRecipes.filter((recipe) => (recipe.suitableSlots ?? []).includes(slot as never)).length;

    expect(countFor('breakfast')).toBeGreaterThanOrEqual(4);
    expect(countFor('lunch')).toBeGreaterThanOrEqual(10);
    expect(countFor('dinner')).toBeGreaterThanOrEqual(10);
  });
});

describe('lista de ingrediente interzise la keto', () => {
  test('fiecare ID din listă există în catalog', () => {
    const unknown = [...KETO_EXCLUDED_INGREDIENT_IDS].filter((id) => !(id in INGREDIENTS));

    expect(unknown).toEqual([]);
  });
});

describe('planificatorul cu keto și desert', () => {
  const ketoWithDessert: UserPreferences = {
    supermarketId: 'lidl',
    peopleCount: 2,
    cookingDays: ['monday', 'tuesday', 'wednesday'],
    budgetRon: 900,
    moodTags: ['family_fav'],
    dietType: 'keto',
    dietTypes: ['keto'],
    appliances: ['hob', 'oven', 'air_fryer'],
    excludePantryStaples: true,
    avoidedAllergens: [],
    mealSlots: ['breakfast', 'lunch', 'dinner', 'dessert'],
    foodTier: 'medium',
  };

  test('nu există niciun desert keto, iar planul se generează fără desert, nu cade', () => {
    expect(getEligibleDessertRecipes(ketoWithDessert)).toEqual([]);

    const plan = generateMealPlan(ketoWithDessert);
    const slots = plan.days.flatMap((day) => day.meals.map((meal) => meal.slot));

    expect(plan.days).toHaveLength(3);
    expect(slots).not.toContain('dessert');
    expect(slots.filter((slot) => slot === 'dinner')).toHaveLength(3);
  });

  test('o zi care are doar desert și niciun desert posibil nu apare goală în plan', () => {
    const plan = generateMealPlan({
      ...ketoWithDessert,
      dailyMealSlots: { monday: ['dessert'] },
    });

    plan.days.forEach((day) => {
      expect(day.meals.length).toBeGreaterThan(0);
      expect(day.recipe).toBeDefined();
    });
  });
});
