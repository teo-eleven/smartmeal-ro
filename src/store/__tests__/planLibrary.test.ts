import AsyncStorage from '@react-native-async-storage/async-storage';
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
  avoidedAllergens: [],
  mealSlots: ['dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

describe('undoing a destructive reset', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAppStore.setState({
      preferences: { ...CLEAN_PREFERENCES },
      currentPlan: null,
      groceryItems: [],
      activeNotice: null,
      confirmRequest: null,
      lastDiscardedPlan: null,
      savedPlans: [],
    });
    useAppStore.getState().generatePlan();
  });

  test('a reset keeps the discarded plan available for undo', () => {
    // Arrange
    const planBefore = useAppStore.getState().currentPlan;

    // Act
    useAppStore.getState().resetOnboarding();

    // Assert
    expect(useAppStore.getState().currentPlan).toBeNull();
    expect(useAppStore.getState().lastDiscardedPlan?.plan.id).toBe(planBefore!.id);
  });

  test('undo restores the plan, the list and the preferences', () => {
    // Arrange
    const planBefore = useAppStore.getState().currentPlan;
    const itemCountBefore = useAppStore.getState().groceryItems.length;
    useAppStore.getState().resetOnboarding();

    // Act
    useAppStore.getState().undoReset();

    // Assert
    const state = useAppStore.getState();
    expect(state.currentPlan?.id).toBe(planBefore!.id);
    expect(state.groceryItems).toHaveLength(itemCountBefore);
    expect(state.preferences.cookingDays).toEqual(CLEAN_PREFERENCES.cookingDays);
    expect(state.activeView).toBe('meals');
  });

  test('undo can only be used once', () => {
    // Arrange
    useAppStore.getState().resetOnboarding();
    useAppStore.getState().undoReset();

    // Act
    const planAfterFirstUndo = useAppStore.getState().currentPlan;
    useAppStore.getState().undoReset();

    // Assert
    expect(useAppStore.getState().lastDiscardedPlan).toBeNull();
    expect(useAppStore.getState().currentPlan).toBe(planAfterFirstUndo);
  });

  test('undo with nothing discarded is a harmless no-op', () => {
    // Arrange
    const planBefore = useAppStore.getState().currentPlan;

    // Act
    useAppStore.getState().undoReset();

    // Assert
    expect(useAppStore.getState().currentPlan).toBe(planBefore);
  });
});

describe('saving plans to a personal library', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAppStore.setState({
      preferences: { ...CLEAN_PREFERENCES },
      currentPlan: null,
      groceryItems: [],
      activeNotice: null,
      lastDiscardedPlan: null,
      savedPlans: [],
    });
    useAppStore.getState().generatePlan();
  });

  test('saving the current plan adds it to the library', () => {
    // Act
    useAppStore.getState().saveCurrentPlan('Săptămâna de test');

    // Assert
    const saved = useAppStore.getState().savedPlans;
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe('Săptămâna de test');
    expect(saved[0].plan.id).toBe(useAppStore.getState().currentPlan!.id);
  });

  test('a saved plan keeps the preferences it was built with', () => {
    // Act
    useAppStore.getState().saveCurrentPlan('Cu preferințe');

    // Assert
    expect(useAppStore.getState().savedPlans[0].preferences.peopleCount).toBe(
      CLEAN_PREFERENCES.peopleCount
    );
  });

  test('the newest saved plan comes first', () => {
    // Arrange
    useAppStore.getState().saveCurrentPlan('Prima');
    useAppStore.getState().reshufflePlan();

    // Act
    useAppStore.getState().saveCurrentPlan('A doua');

    // Assert
    expect(useAppStore.getState().savedPlans[0].name).toBe('A doua');
  });

  test('restoring a saved plan brings back its meals and preferences', () => {
    // Arrange
    useAppStore.getState().saveCurrentPlan('De restaurat');
    const savedId = useAppStore.getState().savedPlans[0].id;
    const savedRecipeIds = useAppStore
      .getState()
      .savedPlans[0].plan.days.flatMap((d) => d.meals.map((m) => m.recipe.id));
    useAppStore.getState().reshufflePlan();

    // Act
    useAppStore.getState().restoreSavedPlan(savedId);

    // Assert
    const restored = useAppStore
      .getState()
      .currentPlan!.days.flatMap((d) => d.meals.map((m) => m.recipe.id));
    expect(restored).toEqual(savedRecipeIds);
  });

  test('restoring recalculates the grocery list for the restored meals', () => {
    // Arrange
    useAppStore.getState().saveCurrentPlan('Listă');
    const savedId = useAppStore.getState().savedPlans[0].id;

    // Act
    useAppStore.getState().restoreSavedPlan(savedId);

    // Assert
    const state = useAppStore.getState();
    const sum = state.groceryItems.reduce((total, item) => total + item.estimatedPriceRon, 0);
    expect(state.currentPlan!.totalCartCostRon).toBeCloseTo(Math.round(sum * 100) / 100, 2);
  });

  test('deleting a saved plan removes only that one', () => {
    // Arrange
    useAppStore.getState().saveCurrentPlan('Păstrat');
    useAppStore.getState().reshufflePlan();
    useAppStore.getState().saveCurrentPlan('Șters');
    const toDelete = useAppStore.getState().savedPlans.find((p) => p.name === 'Șters')!.id;

    // Act
    useAppStore.getState().deleteSavedPlan(toDelete);

    // Assert
    const remaining = useAppStore.getState().savedPlans;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe('Păstrat');
  });

  test('the library survives a reload', async () => {
    // Arrange
    useAppStore.getState().saveCurrentPlan('Persistent');

    // Act
    useAppStore.setState({ savedPlans: [] });
    await useAppStore.getState().hydrateStorage();

    // Assert
    expect(useAppStore.getState().savedPlans.map((p) => p.name)).toContain('Persistent');
  });

  test('saving with no active plan does nothing', () => {
    // Arrange
    useAppStore.setState({ currentPlan: null });

    // Act
    useAppStore.getState().saveCurrentPlan('Fără plan');

    // Assert
    expect(useAppStore.getState().savedPlans).toHaveLength(0);
  });

  test('restoring an unknown id changes nothing', () => {
    // Arrange
    const planBefore = useAppStore.getState().currentPlan;

    // Act
    useAppStore.getState().restoreSavedPlan('nu-exista');

    // Assert
    expect(useAppStore.getState().currentPlan).toBe(planBefore);
  });
});
