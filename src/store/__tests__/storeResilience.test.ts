import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../useAppStore';
import { Appliance } from '../../types';

const PREFERENCES_KEY = '@smartmeal_preferences';

async function readPersistedAppliances(): Promise<Appliance[] | null> {
  const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
  return raw ? JSON.parse(raw).appliances : null;
}

describe('store resilience against infeasible preferences', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAppStore.setState({
      preferences: {
        supermarketId: 'lidl',
        peopleCount: 2,
        cookingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
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
      },
      currentPlan: null,
      groceryItems: [],
      activeNotice: null,
    });
  });

  test('generatePlan surfaces a notice instead of throwing when nothing is cookable', () => {
    // Arrange
    useAppStore.setState({
      preferences: { ...useAppStore.getState().preferences, appliances: [] },
    });

    // Act & Assert
    expect(() => useAppStore.getState().generatePlan()).not.toThrow();
    expect(useAppStore.getState().activeNotice).not.toBeNull();
  });

  test('updatePreferencesAndRebuild does not persist preferences the app refuses to enter', async () => {
    // Arrange
    useAppStore.getState().generatePlan();
    const applianceBefore = useAppStore.getState().preferences.appliances;

    // Act
    useAppStore.getState().updatePreferencesAndRebuild({ appliances: [] });

    // Assert
    const applianceAfter = useAppStore.getState().preferences.appliances;
    const persisted = await readPersistedAppliances();
    expect(applianceAfter).toEqual(applianceBefore);
    expect(persisted).not.toEqual([]);
    expect(useAppStore.getState().activeNotice).not.toBeNull();
  });

  test('a rejected rebuild keeps the previous plan intact', () => {
    // Arrange
    useAppStore.getState().generatePlan();
    const planBefore = useAppStore.getState().currentPlan;

    // Act
    useAppStore.getState().updatePreferencesAndRebuild({ appliances: [] });

    // Assert
    expect(useAppStore.getState().currentPlan).toBe(planBefore);
  });

  test('setMealsPerDayCount never throws on an infeasible setup', () => {
    // Arrange
    useAppStore.getState().generatePlan();
    useAppStore.setState({
      preferences: { ...useAppStore.getState().preferences, appliances: [] },
    });

    // Act & Assert
    expect(() => useAppStore.getState().setMealsPerDayCount(3)).not.toThrow();
  });

  test('reshufflePlan never throws on an infeasible setup', () => {
    // Arrange
    useAppStore.getState().generatePlan();
    useAppStore.setState({
      preferences: { ...useAppStore.getState().preferences, appliances: [] },
    });

    // Act & Assert
    expect(() => useAppStore.getState().reshufflePlan()).not.toThrow();
  });

  test('hydrateStorage repairs an already-bricked stored state so the app can start', async () => {
    // Arrange: a user whose storage was corrupted by an older build
    const bricked = {
      ...useAppStore.getState().preferences,
      appliances: [] as Appliance[],
    };
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(bricked));

    // Act
    await useAppStore.getState().hydrateStorage();

    // Assert
    const repaired = useAppStore.getState().preferences.appliances;
    expect(repaired.length).toBeGreaterThan(0);
    expect(() => useAppStore.getState().generatePlan()).not.toThrow();
    expect(useAppStore.getState().currentPlan).not.toBeNull();
  });

  test('preferences kept in memory always match what was written to storage', async () => {
    // Arrange
    useAppStore.getState().generatePlan();

    // Act
    useAppStore.getState().updatePreferencesAndRebuild({ appliances: [] });
    useAppStore.getState().updatePreferencesAndRebuild({ peopleCount: 4 });

    // Assert
    const inMemory = useAppStore.getState().preferences;
    const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
    const persisted = raw ? JSON.parse(raw) : null;
    expect(persisted.appliances).toEqual(inMemory.appliances);
    expect(persisted.peopleCount).toEqual(inMemory.peopleCount);
  });
});
