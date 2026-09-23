import { getRecipeAllergens, isRecipeSafeForAllergies } from '../allergenFilter';
import { generateMealPlan, checkPlanFeasibility } from '../../engine/plannerEngine';
import { RECIPES } from '../../data/recipes';
import { INGREDIENTS } from '../../data/ingredients';
import { INGREDIENT_ALLERGENS, ALLERGEN_CATALOG } from '../../data/allergens';
import { Allergen, DayOfWeek, UserPreferences } from '../../types';

const FULL_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

function buildPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    supermarketId: 'lidl',
    peopleCount: 2,
    cookingDays: FULL_WEEK,
    budgetRon: 600,
    moodTags: ['speedy'],
    dietType: 'omnivore',
    dietTypes: ['omnivore'],
    appliances: ['hob', 'oven', 'air_fryer'],
    excludePantryStaples: true,
    pantryInventory: [],
    avoidedAllergens: [],
    mealSlots: ['breakfast', 'lunch', 'dinner'],
    foodTier: 'medium',
    selectedSnackIds: [],
    selectedDrinkIds: [],
    includeAlcohol: false,
    ...overrides,
  };
}

describe('allergen data is trustworthy', () => {
  test('every mapped ingredient actually exists', () => {
    const unknown = Object.keys(INGREDIENT_ALLERGENS).filter((id) => !INGREDIENTS[id]);
    expect(unknown).toEqual([]);
  });

  test('every mapped allergen is offered in the catalog', () => {
    const offered = ALLERGEN_CATALOG.map((a) => a.id);
    const used = new Set(Object.values(INGREDIENT_ALLERGENS).flat());
    used.forEach((allergen) => expect(offered).toContain(allergen));
  });

  test('obvious carriers are not missing from the map', () => {
    // A gap here means an allergic user is served the allergen anyway.
    expect(getRecipeAllergens({ ingredients: [{ ingredientId: 'lapte_3_5' }] } as never)).toContain(
      'lactate'
    );
    expect(getRecipeAllergens({ ingredients: [{ ingredientId: 'oua_m' }] } as never)).toContain(
      'oua'
    );
    expect(
      getRecipeAllergens({ ingredients: [{ ingredientId: 'paste_penne' }] } as never)
    ).toContain('gluten');
    expect(
      getRecipeAllergens({ ingredients: [{ ingredientId: 'creveti_decorticati' }] } as never)
    ).toContain('crustacee');
    expect(
      getRecipeAllergens({ ingredients: [{ ingredientId: 'unt_arahide' }] } as never)
    ).toContain('arahide');
  });
});

describe('an allergy is a hard constraint', () => {
  const allergensToTest: Allergen[] = ['gluten', 'lactate', 'oua', 'peste', 'nuci', 'arahide'];

  allergensToTest.forEach((allergen) => {
    test(`no plan ever serves ${allergen} to someone avoiding it`, () => {
      // Arrange
      const preferences = buildPreferences({ avoidedAllergens: [allergen] });
      if (!checkPlanFeasibility(preferences).isFeasible) return;

      // Act
      const plan = generateMealPlan(preferences);

      // Assert
      plan.days.forEach((day) =>
        day.meals.forEach((meal) => {
          expect(getRecipeAllergens(meal.recipe)).not.toContain(allergen);
        })
      );
    });
  });

  test('several allergies at once are all respected', () => {
    // Arrange
    const avoided: Allergen[] = ['lactate', 'oua'];
    const preferences = buildPreferences({ avoidedAllergens: avoided });

    // Act
    const plan = generateMealPlan(preferences);

    // Assert
    plan.days.forEach((day) =>
      day.meals.forEach((meal) => {
        avoided.forEach((allergen) =>
          expect(getRecipeAllergens(meal.recipe)).not.toContain(allergen)
        );
      })
    );
  });

  test('an impossible allergy combination is reported, never served unsafely', () => {
    // Arrange: avoiding everything leaves almost nothing
    const preferences = buildPreferences({
      avoidedAllergens: ALLERGEN_CATALOG.map((a) => a.id),
    });

    // Act
    const feasibility = checkPlanFeasibility(preferences);

    // Assert
    if (feasibility.isFeasible) {
      const plan = generateMealPlan(preferences);
      plan.days.forEach((day) =>
        day.meals.forEach((meal) => {
          expect(getRecipeAllergens(meal.recipe)).toEqual([]);
        })
      );
    } else {
      expect(feasibility.reasonRo).toBeTruthy();
    }
  });

  test('no allergies means nothing is filtered out', () => {
    expect(isRecipeSafeForAllergies(RECIPES[0], [])).toBe(true);
    expect(isRecipeSafeForAllergies(RECIPES[0], undefined)).toBe(true);
  });
});
