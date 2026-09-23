import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../useAppStore';
import { getRecipeAllergens } from '../../utils/allergenFilter';
import { isRecipeMatchingDiets } from '../../utils/dietCompatibility';
import { hasRequiredAppliances } from '../../engine/plannerEngine';
import { Allergen, UserPreferences } from '../../types';

const BASE: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  budgetRon: 900,
  moodTags: ['family_fav'],
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
};

function reset(overrides: Partial<UserPreferences> = {}) {
  useAppStore.setState({
    preferences: { ...BASE, ...overrides },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    lastDiscardedPlan: null,
    activeNotice: null,
  });
}

function mealsCarrying(allergen: Allergen) {
  return useAppStore
    .getState()
    .currentPlan!.days.flatMap((day) => day.meals)
    .filter((meal) => getRecipeAllergens(meal.recipe).includes(allergen));
}

/**
 * Allergens are enforced when a plan is generated. Restoring an older plan is a second way
 * meals reach the user, and it must not be a way around that guarantee.
 */
describe('restoring a saved plan never lowers the user protections', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    reset();
  });

  test('an allergy declared after saving still applies to the restored plan', () => {
    // Arrange: save a plan built before the allergy existed
    useAppStore.getState().generatePlan();
    useAppStore.getState().saveCurrentPlan('Înainte de alergie');
    const savedId = useAppStore.getState().savedPlans[0].id;
    expect(mealsCarrying('lactate').length).toBeGreaterThan(0);

    // Act: declare the allergy, then go back to the old plan
    useAppStore.getState().toggleAvoidedAllergen('lactate');
    useAppStore.getState().restoreSavedPlan(savedId);

    // Assert
    expect(mealsCarrying('lactate')).toHaveLength(0);
  });

  test('the allergy itself survives the restore', () => {
    // Arrange
    useAppStore.getState().generatePlan();
    useAppStore.getState().saveCurrentPlan('Plan vechi');
    const savedId = useAppStore.getState().savedPlans[0].id;
    useAppStore.getState().toggleAvoidedAllergen('lactate');

    // Act
    useAppStore.getState().restoreSavedPlan(savedId);

    // Assert
    expect(useAppStore.getState().preferences.avoidedAllergens).toContain('lactate');
  });

  test('allergies recorded in the saved plan are kept too, never dropped', () => {
    // Arrange: saved while avoiding nuts, now avoiding dairy
    reset({ avoidedAllergens: ['nuci'] });
    useAppStore.getState().generatePlan();
    useAppStore.getState().saveCurrentPlan('Cu alergie la nuci');
    const savedId = useAppStore.getState().savedPlans[0].id;
    useAppStore.setState({
      preferences: { ...useAppStore.getState().preferences, avoidedAllergens: ['lactate'] },
    });

    // Act
    useAppStore.getState().restoreSavedPlan(savedId);

    // Assert: protection is the union, never the smaller set
    const after = useAppStore.getState().preferences.avoidedAllergens ?? [];
    expect(after).toEqual(expect.arrayContaining(['nuci', 'lactate']));
    expect(mealsCarrying('nuci')).toHaveLength(0);
    expect(mealsCarrying('lactate')).toHaveLength(0);
  });

  test('the user is told when meals had to be replaced', () => {
    // Arrange
    useAppStore.getState().generatePlan();
    useAppStore.getState().saveCurrentPlan('Plan cu lactate');
    const savedId = useAppStore.getState().savedPlans[0].id;
    useAppStore.getState().toggleAvoidedAllergen('lactate');
    useAppStore.setState({ activeNotice: null });

    // Act
    useAppStore.getState().restoreSavedPlan(savedId);

    // Assert
    expect(useAppStore.getState().activeNotice).not.toBeNull();
    expect(useAppStore.getState().activeNotice?.message).toMatch(/lactate/i);
  });

  test('a diet adopted after saving is respected on restore', () => {
    // Arrange: omnivore plan saved, user turns vegetarian
    useAppStore.getState().generatePlan();
    useAppStore.getState().saveCurrentPlan('Plan omnivor');
    const savedId = useAppStore.getState().savedPlans[0].id;
    useAppStore.getState().setDietTypes(['vegetarian']);

    // Act
    useAppStore.getState().restoreSavedPlan(savedId);

    // Assert
    useAppStore
      .getState()
      .currentPlan!.days.flatMap((day) => day.meals)
      .forEach((meal) => {
        expect(isRecipeMatchingDiets(meal.recipe, ['vegetarian'])).toBe(true);
      });
  });

  test('a kitchen that lost an appliance does not get dishes needing it', () => {
    // Arrange
    useAppStore.getState().generatePlan();
    useAppStore.getState().saveCurrentPlan('Plan cu cuptor');
    const savedId = useAppStore.getState().savedPlans[0].id;
    useAppStore.setState({
      preferences: { ...useAppStore.getState().preferences, appliances: ['hob'] },
    });

    // Act
    useAppStore.getState().restoreSavedPlan(savedId);

    // Assert
    useAppStore
      .getState()
      .currentPlan!.days.flatMap((day) => day.meals)
      .forEach((meal) => {
        expect(hasRequiredAppliances(meal.recipe.appliances, ['hob'])).toBe(true);
      });
  });

  test('a plan restored with nothing to change is left exactly as it was', () => {
    // Arrange
    useAppStore.getState().generatePlan();
    useAppStore.getState().saveCurrentPlan('Neschimbat');
    const savedId = useAppStore.getState().savedPlans[0].id;
    const before = useAppStore
      .getState()
      .savedPlans[0].plan.days.flatMap((d) => d.meals.map((m) => m.recipe.id));

    // Act
    useAppStore.getState().restoreSavedPlan(savedId);

    // Assert
    const after = useAppStore
      .getState()
      .currentPlan!.days.flatMap((d) => d.meals.map((m) => m.recipe.id));
    expect(after).toEqual(before);
  });

  test('a corrupt entry in the library is refused instead of crashing', () => {
    // Arrange
    useAppStore.getState().generatePlan();
    const planBefore = useAppStore.getState().currentPlan;
    useAppStore.setState({
      savedPlans: [{ id: 'corupt', name: 'rupt', savedAt: new Date().toISOString() } as never],
    });

    // Act & Assert
    expect(() => useAppStore.getState().restoreSavedPlan('corupt')).not.toThrow();
    expect(useAppStore.getState().currentPlan).toBe(planBefore);
    expect(useAppStore.getState().activeNotice).not.toBeNull();
  });
});

describe('preferences read back from storage are validated, not trusted', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    reset();
  });

  test('a malformed allergen list does not discard the rest of the preferences', async () => {
    // Arrange
    await AsyncStorage.setItem(
      '@smartmeal_preferences',
      JSON.stringify({ ...BASE, peopleCount: 7, budgetRon: 555, avoidedAllergens: null })
    );

    // Act
    await useAppStore.getState().hydrateStorage();

    // Assert
    const prefs = useAppStore.getState().preferences;
    expect(prefs.peopleCount).toBe(7);
    expect(prefs.budgetRon).toBe(555);
    expect(prefs.avoidedAllergens).toEqual([]);
  });

  test('an unknown allergen value is dropped rather than trusted', async () => {
    // Arrange
    await AsyncStorage.setItem(
      '@smartmeal_preferences',
      JSON.stringify({ ...BASE, avoidedAllergens: ['lactate', 'inventat', 42] })
    );

    // Act
    await useAppStore.getState().hydrateStorage();

    // Assert
    expect(useAppStore.getState().preferences.avoidedAllergens).toEqual(['lactate']);
  });

  test('the user is told when a stored allergy list had to be repaired', async () => {
    // Arrange
    await AsyncStorage.setItem(
      '@smartmeal_preferences',
      JSON.stringify({ ...BASE, avoidedAllergens: ['lactate', 'inventat'] })
    );

    // Act
    await useAppStore.getState().hydrateStorage();

    // Assert
    expect(useAppStore.getState().activeNotice).not.toBeNull();
  });
});
