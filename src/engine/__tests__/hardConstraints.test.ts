import { generateMealPlan, hasRequiredAppliances, checkPlanFeasibility } from '../plannerEngine';
import { isRecipeMatchingDiets } from '../../utils/dietCompatibility';
import {
  Appliance,
  DayOfWeek,
  DietType,
  MealSlot,
  SupermarketId,
  UserPreferences,
} from '../../types';

const FULL_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const ALL_DIETS: DietType[] = [
  'omnivore',
  'vegetarian',
  'vegan',
  'pescatarian',
  'gluten_free',
  'keto',
];

const APPLIANCE_SETS: Appliance[][] = [
  ['hob'],
  ['oven'],
  ['air_fryer'],
  ['microwave'],
  ['hob', 'oven'],
  ['oven', 'air_fryer'],
  ['hob', 'oven', 'air_fryer', 'microwave'],
];

const SLOT_SETS: MealSlot[][] = [['dinner'], ['lunch', 'dinner'], ['breakfast', 'lunch', 'dinner']];

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

function buildPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    supermarketId: 'lidl',
    peopleCount: 2,
    cookingDays: FULL_WEEK,
    budgetRon: 400,
    moodTags: ['speedy'],
    dietType: 'omnivore',
    dietTypes: ['omnivore'],
    appliances: ['hob', 'oven', 'air_fryer'],
    excludePantryStaples: true,
    pantryInventory: [],
    mealSlots: ['dinner'],
    foodTier: 'medium',
    selectedSnackIds: [],
    selectedDrinkIds: [],
    includeAlcohol: false,
    ...overrides,
  };
}

describe('hard constraints survive every fallback path', () => {
  test('no generated plan ever requires an appliance the user does not own', () => {
    // Arrange
    const violations: string[] = [];

    // Act
    ALL_DIETS.forEach((diet) =>
      APPLIANCE_SETS.forEach((appliances) =>
        SLOT_SETS.forEach((mealSlots) => {
          const preferences = buildPreferences({
            dietType: diet,
            dietTypes: [diet],
            appliances,
            mealSlots,
          });
          if (!checkPlanFeasibility(preferences).isFeasible) return;

          const plan = generateMealPlan(preferences);
          plan.days.forEach((day) =>
            day.meals.forEach((meal) => {
              if (!hasRequiredAppliances(meal.recipe.appliances, appliances)) {
                violations.push(
                  `${diet}/[${appliances.join('+')}]/${meal.slot}: ${meal.recipe.id} needs [${meal.recipe.appliances.join('+')}]`
                );
              }
            })
          );
        })
      )
    );

    // Assert
    expect(violations).toEqual([]);
  });

  test('no generated plan ever breaks the diet restriction', () => {
    // Arrange
    const violations: string[] = [];

    // Act
    ALL_DIETS.forEach((diet) =>
      APPLIANCE_SETS.forEach((appliances) =>
        SLOT_SETS.forEach((mealSlots) => {
          const preferences = buildPreferences({
            dietType: diet,
            dietTypes: [diet],
            appliances,
            mealSlots,
          });
          if (!checkPlanFeasibility(preferences).isFeasible) return;

          const plan = generateMealPlan(preferences);
          plan.days.forEach((day) =>
            day.meals.forEach((meal) => {
              if (!isRecipeMatchingDiets(meal.recipe, [diet])) {
                violations.push(`${diet}: ${meal.recipe.id} is ${meal.recipe.dietType}`);
              }
            })
          );
        })
      )
    );

    // Assert
    expect(violations).toEqual([]);
  });

  test('constraints hold across every supermarket', () => {
    // Arrange
    const violations: string[] = [];

    // Act
    ALL_MARKETS.forEach((supermarketId) => {
      const preferences = buildPreferences({
        supermarketId,
        appliances: ['hob'],
        mealSlots: ['breakfast', 'lunch', 'dinner'],
      });
      if (!checkPlanFeasibility(preferences).isFeasible) return;

      const plan = generateMealPlan(preferences);
      plan.days.forEach((day) =>
        day.meals.forEach((meal) => {
          if (!hasRequiredAppliances(meal.recipe.appliances, ['hob'])) {
            violations.push(`${supermarketId}: ${meal.recipe.id}`);
          }
        })
      );
    });

    // Assert
    expect(violations).toEqual([]);
  });

  test('a vegan with no vegan breakfast still gets a vegan, cookable breakfast dish', () => {
    // Arrange: the catalog has zero recipes tagged breakfast + vegan
    const preferences = buildPreferences({
      dietType: 'vegan',
      dietTypes: ['vegan'],
      mealSlots: ['breakfast', 'lunch', 'dinner'],
      appliances: ['hob', 'oven'],
    });

    // Act
    const plan = generateMealPlan(preferences);

    // Assert
    const breakfasts = plan.days.flatMap((day) =>
      day.meals.filter((meal) => meal.slot === 'breakfast')
    );
    expect(breakfasts.length).toBeGreaterThan(0);
    breakfasts.forEach((meal) => {
      expect(isRecipeMatchingDiets(meal.recipe, ['vegan'])).toBe(true);
      expect(hasRequiredAppliances(meal.recipe.appliances, ['hob', 'oven'])).toBe(true);
    });
  });

  test('slot suitability is still respected whenever the catalog allows it', () => {
    // Arrange
    const preferences = buildPreferences({
      mealSlots: ['breakfast', 'lunch', 'dinner'],
      appliances: ['hob', 'oven', 'air_fryer'],
    });

    // Act
    const plan = generateMealPlan(preferences);

    // Assert
    plan.days.forEach((day) =>
      day.meals.forEach((meal) => {
        if (meal.recipe.suitableSlots && meal.recipe.suitableSlots.length > 0) {
          expect(meal.recipe.suitableSlots).toContain(meal.slot);
        }
      })
    );
  });

  test('meal costs are real, never a placeholder figure', () => {
    // Arrange: a narrow setup that forces the fallback ladder
    const preferences = buildPreferences({
      dietType: 'vegan',
      dietTypes: ['vegan'],
      mealSlots: ['breakfast', 'lunch', 'dinner'],
      appliances: ['hob'],
    });

    // Act
    const plan = generateMealPlan(preferences);

    // Assert
    plan.days.forEach((day) =>
      day.meals.forEach((meal) => {
        expect(meal.estimatedCostRon).toBeGreaterThan(0);
      })
    );
  });
});
