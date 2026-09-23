import { generateMealPlan, hasRequiredAppliances } from '../plannerEngine';
import { isRecipeMatchingDiets } from '../../utils/dietCompatibility';
import { DayOfWeek, UserPreferences } from '../../types';

const WORK_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const FULL_WEEK: DayOfWeek[] = [...WORK_WEEK, 'saturday', 'sunday'];

function buildPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    supermarketId: 'lidl',
    peopleCount: 2,
    cookingDays: WORK_WEEK,
    budgetRon: 300,
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

describe('budget is an actual constraint, not decoration', () => {
  test('a tighter budget produces a cheaper cart than a generous one', () => {
    // Arrange
    const generous = buildPreferences({
      budgetRon: 900,
      mealSlots: ['breakfast', 'lunch', 'dinner'],
    });
    const tight = buildPreferences({ budgetRon: 160, mealSlots: ['breakfast', 'lunch', 'dinner'] });

    // Act
    const generousPlan = generateMealPlan(generous);
    const tightPlan = generateMealPlan(tight);

    // Assert
    expect(tightPlan.totalCartCostRon).toBeLessThan(generousPlan.totalCartCostRon);
  });

  test('lands inside the budget when the budget is tight but reachable', () => {
    // Arrange
    const preferences = buildPreferences({ budgetRon: 220, peopleCount: 2, mealSlots: ['dinner'] });

    // Act
    const plan = generateMealPlan(preferences);

    // Assert
    expect(plan.totalCartCostRon).toBeLessThanOrEqual(preferences.budgetRon);
    expect(plan.budgetStatus?.isWithinBudget).toBe(true);
  });

  test('reports an honest minimum instead of pretending, when the budget cannot be met', () => {
    // Arrange: 4 people, 3 meals, 7 days on 100 RON is physically impossible
    const preferences = buildPreferences({
      budgetRon: 100,
      peopleCount: 4,
      cookingDays: FULL_WEEK,
      mealSlots: ['breakfast', 'lunch', 'dinner'],
    });

    // Act
    const plan = generateMealPlan(preferences);

    // Assert
    expect(plan.budgetStatus?.isWithinBudget).toBe(false);
    expect(plan.budgetStatus?.minimumAchievableRon).toBeGreaterThan(preferences.budgetRon);
    expect(plan.budgetStatus?.minimumAchievableRon).toBe(plan.totalCartCostRon);
  });

  test('an impossible budget still returns a complete, usable plan', () => {
    // Arrange
    const preferences = buildPreferences({
      budgetRon: 60,
      peopleCount: 4,
      cookingDays: FULL_WEEK,
      mealSlots: ['breakfast', 'lunch', 'dinner'],
    });

    // Act
    const plan = generateMealPlan(preferences);

    // Assert
    expect(plan.days).toHaveLength(FULL_WEEK.length);
    plan.days.forEach((day) => {
      expect(day.meals.length).toBe(3);
      day.meals.forEach((meal) => expect(meal.recipe).toBeTruthy());
    });
  });

  test('a generous budget is not downgraded needlessly', () => {
    // Arrange
    const preferences = buildPreferences({ budgetRon: 2000 });

    // Act
    const plan = generateMealPlan(preferences);

    // Assert
    expect(plan.budgetStatus?.swapsApplied).toBe(0);
    expect(plan.budgetStatus?.isWithinBudget).toBe(true);
  });

  test('cost-cutting never breaks the diet restriction', () => {
    // Arrange
    const preferences = buildPreferences({
      dietType: 'vegetarian',
      dietTypes: ['vegetarian'],
      budgetRon: 60,
      cookingDays: FULL_WEEK,
    });

    // Act
    const plan = generateMealPlan(preferences);

    // Assert
    plan.days.forEach((day) =>
      day.meals.forEach((meal) => {
        expect(isRecipeMatchingDiets(meal.recipe, ['vegetarian'])).toBe(true);
      })
    );
  });

  test('cost-cutting never breaks the appliance restriction', () => {
    // Arrange
    const preferences = buildPreferences({
      appliances: ['hob'],
      budgetRon: 50,
      cookingDays: FULL_WEEK,
    });

    // Act
    const plan = generateMealPlan(preferences);

    // Assert
    plan.days.forEach((day) =>
      day.meals.forEach((meal) => {
        expect(hasRequiredAppliances(meal.recipe.appliances, ['hob'])).toBe(true);
      })
    );
  });

  test('cost-cutting does not collapse the week into one repeated recipe', () => {
    // Arrange
    const preferences = buildPreferences({
      budgetRon: 70,
      cookingDays: FULL_WEEK,
      mealSlots: ['dinner'],
    });

    // Act
    const plan = generateMealPlan(preferences);

    // Assert
    const usage = new Map<string, number>();
    plan.days.forEach((day) =>
      day.meals.forEach((meal) => usage.set(meal.recipe.id, (usage.get(meal.recipe.id) || 0) + 1))
    );
    usage.forEach((count) => expect(count).toBeLessThanOrEqual(2));
  });

  test('day totals stay consistent with the meals they contain after optimization', () => {
    // Arrange
    const preferences = buildPreferences({ budgetRon: 120, cookingDays: FULL_WEEK });

    // Act
    const plan = generateMealPlan(preferences);

    // Assert
    plan.days.forEach((day) => {
      const sum = day.meals.reduce((total, meal) => total + meal.estimatedCostRon, 0);
      expect(day.estimatedCostRon).toBeCloseTo(Math.round(sum * 100) / 100, 2);
      expect(day.recipe).toBeTruthy();
    });
  });
});
