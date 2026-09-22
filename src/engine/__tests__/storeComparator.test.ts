import { compareBasketAcrossStores } from '../storeComparator';
import { generateMealPlan } from '../plannerEngine';
import { aggregateGroceryList } from '../groceryAggregator';
import { DayOfWeek, UserPreferences } from '../../types';

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

describe('comparing the same basket across stores', () => {
  test('quotes every one of the 8 supermarkets', () => {
    // Arrange
    const preferences = buildPreferences();
    const plan = generateMealPlan(preferences);

    // Act
    const comparison = compareBasketAcrossStores(plan, preferences);

    // Assert
    expect(comparison.quotes).toHaveLength(8);
    comparison.quotes.forEach((quote) => expect(quote.totalCartCostRon).toBeGreaterThan(0));
  });

  test('orders quotes from cheapest to priciest', () => {
    // Arrange
    const preferences = buildPreferences();
    const plan = generateMealPlan(preferences);

    // Act
    const { quotes } = compareBasketAcrossStores(plan, preferences);

    // Assert
    const costs = quotes.map((q) => q.totalCartCostRon);
    expect([...costs].sort((a, b) => a - b)).toEqual(costs);
    expect(quotes[0].isCheapest).toBe(true);
  });

  test("the current store's quote matches what the grocery screen shows", () => {
    // Arrange
    const preferences = buildPreferences({ supermarketId: 'carrefour' });
    const plan = generateMealPlan(preferences);
    const meals = plan.days.flatMap((d) =>
      d.meals.map((m) => ({ recipe: m.recipe, servings: m.servings }))
    );
    const expected = aggregateGroceryList(
      meals,
      'carrefour',
      preferences.excludePantryStaples,
      [],
      []
    ).totalCartCostRon;

    // Act
    const comparison = compareBasketAcrossStores(plan, preferences);

    // Assert
    expect(comparison.current.supermarketId).toBe('carrefour');
    expect(comparison.current.totalCartCostRon).toBeCloseTo(expected, 2);
  });

  test('reports a real saving when the current store is not the cheapest', () => {
    // Arrange: Mega Image is the priciest chain in the index
    const preferences = buildPreferences({ supermarketId: 'mega_image' });
    const plan = generateMealPlan(preferences);

    // Act
    const comparison = compareBasketAcrossStores(plan, preferences);

    // Assert
    expect(comparison.maxSavingRon).toBeGreaterThan(0);
    expect(comparison.cheapest.supermarketId).not.toBe('mega_image');
    expect(comparison.cheapest.savingVsCurrentRon).toBeCloseTo(comparison.maxSavingRon, 2);
  });

  test('reports no saving when the user already shops at the cheapest store', () => {
    // Arrange
    const preferences = buildPreferences();
    const plan = generateMealPlan(preferences);
    const cheapestId = compareBasketAcrossStores(plan, preferences).cheapest.supermarketId;

    // Act
    const atCheapest = compareBasketAcrossStores(
      { ...plan, supermarketId: cheapestId },
      { ...preferences, supermarketId: cheapestId }
    );

    // Assert
    expect(atCheapest.maxSavingRon).toBe(0);
    expect(atCheapest.current.isCheapest).toBe(true);
  });

  test('flags recipes a store does not carry instead of hiding the mismatch', () => {
    // Arrange
    const preferences = buildPreferences();
    const plan = generateMealPlan(preferences);

    // Act
    const { quotes } = compareBasketAcrossStores(plan, preferences);

    // Assert
    quotes.forEach((quote) => {
      expect(Array.isArray(quote.unavailableRecipeTitles)).toBe(true);
    });
  });

  test('pantry stock lowers every quote, not just the current store', () => {
    // Arrange
    const preferences = buildPreferences();
    const plan = generateMealPlan(preferences);
    const baseline = compareBasketAcrossStores(plan, preferences);
    const someIngredients = plan.days[0].meals[0].recipe.ingredients.map((i) => i.ingredientId);

    // Act
    const withPantry = compareBasketAcrossStores(plan, {
      ...preferences,
      pantryInventory: someIngredients,
    });

    // Assert
    withPantry.quotes.forEach((quote) => {
      const before = baseline.quotes.find((q) => q.supermarketId === quote.supermarketId)!;
      expect(quote.totalCartCostRon).toBeLessThanOrEqual(before.totalCartCostRon);
    });
  });
});
