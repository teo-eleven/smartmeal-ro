import { useAppStore } from '../useAppStore';
import { UserPreferences } from '../../types';

const CLEAN_PREFERENCES: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
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
};

function sumGroceryItems(): number {
  return (
    Math.round(
      useAppStore
        .getState()
        .groceryItems.reduce((total, item) => total + item.estimatedPriceRon, 0) * 100
    ) / 100
  );
}

function priceOf(ingredientId: string): number | undefined {
  return useAppStore.getState().groceryItems.find((i) => i.ingredientId === ingredientId)
    ?.estimatedPriceRon;
}

describe('grocery cart stays consistent with the plan', () => {
  beforeEach(() => {
    useAppStore.setState({
      preferences: { ...CLEAN_PREFERENCES },
      currentPlan: null,
      groceryItems: [],
      activeNotice: null,
    });
  });

  test('plan total always matches the sum of the grocery list', () => {
    // Arrange
    useAppStore.getState().toggleSnackProduct('chipsuri_cartofi_sare');
    useAppStore.getState().toggleDrinkProduct('coca_cola_regular_2l');

    // Act
    useAppStore.getState().generatePlan();

    // Assert
    expect(useAppStore.getState().currentPlan!.totalCartCostRon).toBeCloseTo(sumGroceryItems(), 2);
  });

  test('chosen snacks and drinks are recorded on the plan itself', () => {
    // Arrange
    useAppStore.getState().toggleSnackProduct('chipsuri_cartofi_sare');
    useAppStore.getState().toggleDrinkProduct('coca_cola_regular_2l');

    // Act
    useAppStore.getState().generatePlan();

    // Assert
    const extras = useAppStore.getState().currentPlan!.extraProducts ?? [];
    expect(extras.map((p) => p.id).sort()).toEqual(
      ['chipsuri_cartofi_sare', 'coca_cola_regular_2l'].sort()
    );
  });

  test('an item marked as already at home survives a supermarket change', () => {
    // Arrange
    useAppStore.getState().generatePlan();
    const target = useAppStore.getState().groceryItems.find((i) => i.estimatedPriceRon > 0)!;
    useAppStore.getState().togglePantryItem(target.ingredientId);
    expect(priceOf(target.ingredientId)).toBe(0);

    // Act
    useAppStore.getState().setSupermarket('kaufland');

    // Assert
    const priceAfter = priceOf(target.ingredientId);
    if (priceAfter !== undefined) {
      expect(priceAfter).toBe(0);
    }
    expect(useAppStore.getState().preferences.pantryInventory).toContain(target.ingredientId);
  });

  test('an item marked as already at home survives a food tier change', () => {
    // Arrange
    useAppStore.getState().generatePlan();
    const target = useAppStore.getState().groceryItems.find((i) => i.estimatedPriceRon > 0)!;
    useAppStore.getState().togglePantryItem(target.ingredientId);

    // Act
    useAppStore.getState().setFoodTier('basic');

    // Assert
    const priceAfter = priceOf(target.ingredientId);
    if (priceAfter !== undefined) {
      expect(priceAfter).toBe(0);
    }
  });

  test('an item marked as already at home survives a meals-per-day change', () => {
    // Arrange
    useAppStore.getState().generatePlan();
    const target = useAppStore.getState().groceryItems.find((i) => i.estimatedPriceRon > 0)!;
    useAppStore.getState().togglePantryItem(target.ingredientId);

    // Act
    useAppStore.getState().setMealsPerDayCount(2);

    // Assert
    const priceAfter = priceOf(target.ingredientId);
    if (priceAfter !== undefined) {
      expect(priceAfter).toBe(0);
    }
  });

  test('pantry savings are never silently charged again by a reshuffle', () => {
    // Arrange
    useAppStore.getState().generatePlan();
    const everyIngredient = useAppStore
      .getState()
      .groceryItems.filter((i) => i.estimatedPriceRon > 0)
      .map((i) => i.ingredientId);
    useAppStore.getState().setPantryInventory(everyIngredient);

    // Act
    useAppStore.getState().reshufflePlan();

    // Assert: anything still on the list that we own must stay free
    useAppStore.getState().groceryItems.forEach((item) => {
      if (everyIngredient.includes(item.ingredientId)) {
        expect(item.estimatedPriceRon).toBe(0);
      }
    });
  });

  test('setPantryInventory updates the grocery list immediately', () => {
    // Arrange
    useAppStore.getState().generatePlan();
    const target = useAppStore.getState().groceryItems.find((i) => i.estimatedPriceRon > 0)!;

    // Act
    useAppStore.getState().setPantryInventory([target.ingredientId]);

    // Assert
    expect(priceOf(target.ingredientId)).toBe(0);
  });

  test('cart total still matches the list after snacks are added to an existing plan', () => {
    // Arrange
    useAppStore.getState().generatePlan();

    // Act
    useAppStore.getState().toggleSnackProduct('chipsuri_cartofi_sare');

    // Assert
    expect(useAppStore.getState().currentPlan!.totalCartCostRon).toBeCloseTo(sumGroceryItems(), 2);
  });
});
