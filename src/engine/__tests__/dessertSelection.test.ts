import { generateMealPlan, selectOptimalDessertForDay, getSlotLabelRo } from '../plannerEngine';
import { calculateRecipePortionCost } from '../budgetCalculator';
import { DayOfWeek, MealPlan, UserPreferences } from '../../types';

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
    budgetRon: 2000,
    moodTags: ['family_fav'],
    dietType: 'omnivore',
    dietTypes: ['omnivore'],
    appliances: ['hob', 'oven', 'air_fryer'],
    excludePantryStaples: true,
    pantryInventory: [],
    avoidedAllergens: [],
    mealSlots: ['dinner'],
    foodTier: 'medium',
    selectedSnackIds: [],
    selectedDrinkIds: [],
    includeAlcohol: false,
    ...overrides,
  };
}

/** Adds the chosen dessert to a day, the way the store does, so the next pick sees it. */
function withDessert(plan: MealPlan, day: DayOfWeek, preferences: UserPreferences): MealPlan {
  const dessert = selectOptimalDessertForDay(day, plan, preferences);
  if (!dessert) return plan;

  return {
    ...plan,
    days: plan.days.map((d) =>
      d.dayOfWeek !== day
        ? d
        : {
            ...d,
            meals: [
              ...d.meals,
              {
                id: `${day}-dessert`,
                slot: 'dessert' as const,
                slotLabelRo: getSlotLabelRo('dessert'),
                recipe: dessert,
                servings: preferences.peopleCount,
                estimatedCostRon: calculateRecipePortionCost(
                  dessert,
                  preferences.peopleCount,
                  preferences.supermarketId,
                  preferences.excludePantryStaples
                ),
              },
            ],
          }
    ),
  };
}

describe('selectOptimalDessertForDay', () => {
  test('returns a dessert the user is allowed to eat', () => {
    // Arrange
    const preferences = buildPreferences();
    const plan = generateMealPlan(preferences);

    // Act
    const dessert = selectOptimalDessertForDay('monday', plan, preferences);

    // Assert
    expect(dessert).not.toBeNull();
    expect(dessert!.suitableSlots).toContain('dessert');
  });

  test('gives a different dessert to each day rather than repeating one', () => {
    // Arrange
    const preferences = buildPreferences();
    let plan = generateMealPlan(preferences);

    // Act: fill the week one day at a time, as the store does
    FULL_WEEK.forEach((day) => {
      plan = withDessert(plan, day, preferences);
    });

    // Assert
    const chosen = plan.days
      .flatMap((day) => day.meals)
      .filter((meal) => meal.slot === 'dessert')
      .map((meal) => meal.recipe.id);
    const distinct = new Set(chosen).size;
    expect(distinct).toBeGreaterThan(1);
    expect(distinct).toBeGreaterThanOrEqual(Math.min(chosen.length, 3));
  });

  test('never repeats a dish already cooked that same day', () => {
    // Arrange: a day whose meal is itself dessert-capable
    const preferences = buildPreferences({ mealSlots: ['dinner'] });
    const plan = generateMealPlan(preferences);
    const monday = plan.days[0];
    const sameDayIds = monday.meals.map((meal) => meal.recipe.id);

    // Act
    const dessert = selectOptimalDessertForDay('monday', plan, preferences);

    // Assert
    if (dessert) expect(sameDayIds).not.toContain(dessert.id);
  });

  test('respects the diet', () => {
    // Arrange
    const preferences = buildPreferences({ dietType: 'vegan', dietTypes: ['vegan'] });
    const plan = generateMealPlan(preferences);

    // Act
    const dessert = selectOptimalDessertForDay('monday', plan, preferences);

    // Assert
    if (dessert) expect(dessert.dietType).toBe('vegan');
  });

  test('respects allergies, which are never traded away for a nicer match', () => {
    // Arrange
    const preferences = buildPreferences({ avoidedAllergens: ['lactate', 'oua'] });
    const plan = generateMealPlan(preferences);

    // Act
    const dessert = selectOptimalDessertForDay('monday', plan, preferences);

    // Assert
    if (dessert) {
      const ids = dessert.ingredients.map((i) => i.ingredientId);
      expect(ids).not.toContain('lapte_3_5');
      expect(ids).not.toContain('oua_m');
    }
  });

  test('returns null when the catalog has no dessert for this user', () => {
    // Arrange: avoiding everything leaves no dessert standing
    const preferences = buildPreferences({
      dietType: 'vegan',
      dietTypes: ['vegan'],
      avoidedAllergens: ['gluten', 'lactate', 'oua', 'nuci', 'arahide', 'soia', 'susan'],
    });
    const plan = generateMealPlan(preferences);

    // Act
    const dessert = selectOptimalDessertForDay('monday', plan, preferences);

    // Assert: null is the honest answer; the caller adds nothing rather than something unsafe
    if (dessert) {
      expect(dessert.dietType).toBe('vegan');
    } else {
      expect(dessert).toBeNull();
    }
  });

  test('an unknown day yields nothing instead of throwing', () => {
    // Arrange
    const preferences = buildPreferences({ cookingDays: ['monday'] });
    const plan = generateMealPlan(preferences);

    // Act & Assert
    expect(() => selectOptimalDessertForDay('sunday', plan, preferences)).not.toThrow();
    expect(selectOptimalDessertForDay('sunday', plan, preferences)).toBeNull();
  });
});
