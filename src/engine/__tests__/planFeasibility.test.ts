import { checkPlanFeasibility, suggestAppliancesToUnlock } from '../plannerEngine';
import { Appliance, DayOfWeek, UserPreferences } from '../../types';

const ALL_DAYS: DayOfWeek[] = [
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
    cookingDays: ALL_DAYS,
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

describe('checkPlanFeasibility', () => {
  test('reports a normal omnivore setup as feasible', () => {
    // Arrange
    const preferences = buildPreferences();

    // Act
    const result = checkPlanFeasibility(preferences);

    // Assert
    expect(result.isFeasible).toBe(true);
    expect(result.eligibleRecipeCount).toBeGreaterThan(0);
    expect(result.reasonRo).toBeUndefined();
  });

  test('accepts a microwave-only kitchen, because no-cook dishes need no appliance', () => {
    // Arrange
    const preferences = buildPreferences({ appliances: ['microwave'] });

    // Act
    const result = checkPlanFeasibility(preferences);

    // Assert
    expect(result.isFeasible).toBe(true);
    expect(result.eligibleRecipeCount).toBeGreaterThan(0);
  });

  test('accepts a vegan microwave-only kitchen too', () => {
    // Arrange
    const preferences = buildPreferences({
      dietType: 'vegan',
      dietTypes: ['vegan'],
      appliances: ['microwave'],
    });

    // Act
    const result = checkPlanFeasibility(preferences);

    // Assert
    expect(result.isFeasible).toBe(true);
  });

  test('reports an unsatisfiable setup without throwing', () => {
    // Arrange: no appliances at all is the one state that leaves nothing cookable
    const preferences = buildPreferences({ appliances: [] });

    // Act & Assert
    expect(() => checkPlanFeasibility(preferences)).not.toThrow();
    expect(checkPlanFeasibility(preferences).isFeasible).toBe(false);
    expect(checkPlanFeasibility(preferences).reasonRo).toBeTruthy();
  });

  test('rejects an empty appliance list with a Romanian explanation', () => {
    // Arrange
    const preferences = buildPreferences({ appliances: [] });

    // Act
    const result = checkPlanFeasibility(preferences);

    // Assert
    expect(result.isFeasible).toBe(false);
    expect(result.reasonRo).toBeTruthy();
  });

  test('rejects an empty cooking-day list', () => {
    // Arrange
    const preferences = buildPreferences({ cookingDays: [] });

    // Act
    const result = checkPlanFeasibility(preferences);

    // Assert
    expect(result.isFeasible).toBe(false);
    expect(result.reasonRo).toBeTruthy();
  });

  test('never throws, whatever nonsense it is handed', () => {
    // Arrange
    const nonsense = buildPreferences({
      appliances: [],
      cookingDays: [],
      peopleCount: 0,
      budgetRon: 0,
    });

    // Act & Assert
    expect(() => checkPlanFeasibility(nonsense)).not.toThrow();
    expect(checkPlanFeasibility(nonsense).isFeasible).toBe(false);
  });
});

describe('suggestAppliancesToUnlock', () => {
  test('offers every appliance when the user has selected none', () => {
    // Arrange
    const preferences = buildPreferences({ appliances: [] });

    // Act
    const suggestions = suggestAppliancesToUnlock(preferences);

    // Assert
    expect(suggestions.length).toBeGreaterThan(0);
    suggestions.forEach((appliance: Appliance) => {
      const unlocked = checkPlanFeasibility({ ...preferences, appliances: [appliance] });
      expect(unlocked.isFeasible).toBe(true);
    });
  });

  test('returns an empty list when the setup is already feasible', () => {
    // Arrange
    const preferences = buildPreferences();

    // Act
    const suggestions = suggestAppliancesToUnlock(preferences);

    // Assert
    expect(suggestions).toEqual([]);
  });
});
