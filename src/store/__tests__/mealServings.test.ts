import { useAppStore } from '../useAppStore';
import { UserPreferences } from '../../types';

const CLEAN_PREFERENCES: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: ['monday', 'tuesday', 'wednesday'],
  budgetRon: 600,
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
};

function firstMeal() {
  const day = useAppStore.getState().currentPlan!.days[0];
  return { dayOfWeek: day.dayOfWeek, meal: day.meals[0] };
}

describe('servings can be adjusted for a single meal', () => {
  beforeEach(() => {
    useAppStore.setState({
      preferences: { ...CLEAN_PREFERENCES },
      currentPlan: null,
      groceryItems: [],
      activeNotice: null,
    });
    useAppStore.getState().generatePlan();
  });

  test('a meal starts at the household size', () => {
    // Assert
    expect(firstMeal().meal.servings).toBe(CLEAN_PREFERENCES.peopleCount);
  });

  test('raising servings for one meal leaves the other meals alone', () => {
    // Arrange
    const { dayOfWeek, meal } = firstMeal();
    const otherDayBefore = useAppStore.getState().currentPlan!.days[1].meals[0].servings;

    // Act
    useAppStore.getState().setMealServings(dayOfWeek, meal.id, 6);

    // Assert
    expect(firstMeal().meal.servings).toBe(6);
    expect(useAppStore.getState().currentPlan!.days[1].meals[0].servings).toBe(otherDayBefore);
  });

  test('raising servings makes that meal and the cart more expensive', () => {
    // Arrange
    const { dayOfWeek, meal } = firstMeal();
    const mealCostBefore = meal.estimatedCostRon;
    const cartBefore = useAppStore.getState().currentPlan!.totalCartCostRon;

    // Act
    useAppStore.getState().setMealServings(dayOfWeek, meal.id, 8);

    // Assert
    expect(firstMeal().meal.estimatedCostRon).toBeGreaterThan(mealCostBefore);
    expect(useAppStore.getState().currentPlan!.totalCartCostRon).toBeGreaterThan(cartBefore);
  });

  test('the grocery list reflects the larger portion', () => {
    // Arrange
    const { dayOfWeek, meal } = firstMeal();
    const ingredientId = meal.recipe.ingredients[0].ingredientId;
    const amountBefore = useAppStore
      .getState()
      .groceryItems.find((i) => i.ingredientId === ingredientId)!.neededAmount;

    // Act
    useAppStore.getState().setMealServings(dayOfWeek, meal.id, 8);

    // Assert
    const amountAfter = useAppStore
      .getState()
      .groceryItems.find((i) => i.ingredientId === ingredientId)!.neededAmount;
    expect(amountAfter).toBeGreaterThan(amountBefore);
  });

  test('the day total matches the sum of its meals afterwards', () => {
    // Arrange
    const { dayOfWeek, meal } = firstMeal();

    // Act
    useAppStore.getState().setMealServings(dayOfWeek, meal.id, 5);

    // Assert
    const day = useAppStore.getState().currentPlan!.days.find((d) => d.dayOfWeek === dayOfWeek)!;
    const sum = day.meals.reduce((total, m) => total + m.estimatedCostRon, 0);
    expect(day.estimatedCostRon).toBeCloseTo(Math.round(sum * 100) / 100, 2);
  });

  test('servings are clamped to a sane range', () => {
    // Arrange
    const { dayOfWeek, meal } = firstMeal();

    // Act & Assert
    useAppStore.getState().setMealServings(dayOfWeek, meal.id, 0);
    expect(firstMeal().meal.servings).toBe(1);

    useAppStore.getState().setMealServings(dayOfWeek, meal.id, 99);
    expect(firstMeal().meal.servings).toBe(12);
  });

  test('an unknown meal id changes nothing', () => {
    // Arrange
    const planBefore = useAppStore.getState().currentPlan;

    // Act
    useAppStore.getState().setMealServings('monday', 'nu-exista', 5);

    // Assert
    expect(useAppStore.getState().currentPlan).toBe(planBefore);
  });
});
