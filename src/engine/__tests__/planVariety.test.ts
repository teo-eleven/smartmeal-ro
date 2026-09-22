import { generateMealPlan, getEligibleRecipes } from '../plannerEngine';
import { DayOfWeek, MealSlot, UserPreferences } from '../../types';

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
    // Generous on purpose: this file is about variety, not cost-cutting.
    budgetRon: 2000,
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

function availableFor(preferences: UserPreferences, slot: MealSlot): number {
  return getEligibleRecipes(preferences).filter((r) => r.suitableSlots?.includes(slot)).length;
}

describe('a week does not repeat while an unused dish is available', () => {
  const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

  slots.forEach((slot) => {
    test(`${slot} uses as many distinct recipes as the catalog allows`, () => {
      // Arrange
      const preferences = buildPreferences();
      const expectedUnique = Math.min(FULL_WEEK.length, availableFor(preferences, slot));

      // Act
      const plan = generateMealPlan(preferences);

      // Assert
      const ids = plan.days.flatMap((day) =>
        day.meals.filter((meal) => meal.slot === slot).map((meal) => meal.recipe.id)
      );
      expect(new Set(ids).size).toBe(expectedUnique);
    });
  });

  test('repeats only once the catalog is exhausted', () => {
    // Arrange: a narrow diet leaves fewer dishes than days
    const preferences = buildPreferences({
      dietType: 'vegan',
      dietTypes: ['vegan'],
      mealSlots: ['dinner'],
    });
    const available = availableFor(preferences, 'dinner');

    // Act
    const plan = generateMealPlan(preferences);

    // Assert
    const ids = plan.days.flatMap((day) => day.meals.map((meal) => meal.recipe.id));
    expect(new Set(ids).size).toBe(Math.min(FULL_WEEK.length, available));
    const counts = new Map<string, number>();
    ids.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
    counts.forEach((count) => expect(count).toBeLessThanOrEqual(2));
  });

  test('the same dish never lands on two days in a row', () => {
    // Arrange
    const preferences = buildPreferences({ mealSlots: ['dinner'] });

    // Act
    const plan = generateMealPlan(preferences);

    // Assert
    const ids = plan.days.map((day) => day.meals[0].recipe.id);
    ids.forEach((id, index) => {
      if (index > 0) expect(id).not.toBe(ids[index - 1]);
    });
  });
});
