import { useAppStore } from '../useAppStore';
import { UserPreferences } from '../../types';

const CLEAN_PREFERENCES: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: ['monday', 'tuesday', 'wednesday'],
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

describe('destructive actions ask before destroying anything', () => {
  beforeEach(() => {
    useAppStore.setState({
      preferences: { ...CLEAN_PREFERENCES },
      currentPlan: null,
      groceryItems: [],
      activeNotice: null,
      confirmRequest: null,
    });
    useAppStore.getState().generatePlan();
  });

  test('requesting a reset does not delete the plan yet', () => {
    // Arrange
    const planBefore = useAppStore.getState().currentPlan;

    // Act
    useAppStore.getState().requestConfirm('reset_onboarding');

    // Assert
    expect(useAppStore.getState().confirmRequest).toBe('reset_onboarding');
    expect(useAppStore.getState().currentPlan).toBe(planBefore);
  });

  test('cancelling leaves the plan and the preferences untouched', () => {
    // Arrange
    const planBefore = useAppStore.getState().currentPlan;
    const itemsBefore = useAppStore.getState().groceryItems;
    useAppStore.getState().requestConfirm('reset_onboarding');

    // Act
    useAppStore.getState().cancelConfirm();

    // Assert
    expect(useAppStore.getState().confirmRequest).toBeNull();
    expect(useAppStore.getState().currentPlan).toBe(planBefore);
    expect(useAppStore.getState().groceryItems).toBe(itemsBefore);
  });

  test('confirming actually performs the reset', () => {
    // Arrange
    useAppStore.getState().requestConfirm('reset_onboarding');

    // Act
    useAppStore.getState().confirmPending();

    // Assert
    const state = useAppStore.getState();
    expect(state.confirmRequest).toBeNull();
    expect(state.currentPlan).toBeNull();
    expect(state.groceryItems).toEqual([]);
    expect(state.activeView).toBe('onboarding');
  });

  test('confirming with nothing pending is a harmless no-op', () => {
    // Arrange
    const planBefore = useAppStore.getState().currentPlan;

    // Act
    useAppStore.getState().confirmPending();

    // Assert
    expect(useAppStore.getState().currentPlan).toBe(planBefore);
  });

  test('resetOnboarding stays available for flows that already confirmed', () => {
    // Act
    useAppStore.getState().resetOnboarding();

    // Assert
    expect(useAppStore.getState().currentPlan).toBeNull();
  });
});
