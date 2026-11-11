import * as platformHealth from '../../utils/platformHealth';
import { useAppStore } from '../useAppStore';
import { checkPlanFeasibility } from '../../engine/plannerEngine';

describe('quick start skips the questionnaire without breaking anything', () => {
  beforeEach(() => {
    useAppStore.getState().resetOnboarding();
    useAppStore.getState().dismissUndo();
  });

  test('produces a usable plan straight away', () => {
    // Act
    useAppStore.getState().quickStart();

    // Assert
    const state = useAppStore.getState();
    expect(state.currentPlan).not.toBeNull();
    expect(state.groceryItems.length).toBeGreaterThan(0);
    expect(state.activeView).toBe('meals');
  });

  test('its defaults are always feasible', () => {
    // Act
    useAppStore.getState().quickStart();

    // Assert
    expect(checkPlanFeasibility(useAppStore.getState().preferences).isFeasible).toBe(true);
  });

  test('keeps the supermarket the user already picked', () => {
    // Arrange
    useAppStore.getState().setSupermarket('penny');

    // Act
    useAppStore.getState().quickStart();

    // Assert
    expect(useAppStore.getState().preferences.supermarketId).toBe('penny');
    expect(useAppStore.getState().currentPlan!.supermarketId).toBe('penny');
  });

  test('the resulting plan respects its own budget', () => {
    // Act
    useAppStore.getState().quickStart();

    // Assert
    const plan = useAppStore.getState().currentPlan!;
    expect(plan.budgetStatus?.isWithinBudget).toBe(true);
  });

  test('every wizard step counts as visited, so nothing is locked afterwards', () => {
    // Act
    useAppStore.getState().quickStart();

    // Assert
    const state = useAppStore.getState();
    expect(state.maxVisitedStep).toBe(state.totalSteps);
  });
});

describe('quick start on iOS keeps the health goals it cannot show (A.8)', () => {
  beforeEach(() => {
    useAppStore.getState().resetOnboarding();
    useAppStore.getState().dismissUndo();
  });
  afterEach(() => jest.restoreAllMocks());

  test('stored goals survive, so a later platform or step can still use them', () => {
    jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(false);
    useAppStore.setState((s) => ({
      preferences: { ...s.preferences, healthGoalTags: ['high_fiber', 'pork_free'] },
    }));

    useAppStore.getState().quickStart();

    expect(useAppStore.getState().preferences.healthGoalTags).toEqual(['high_fiber', 'pork_free']);
    expect(useAppStore.getState().currentPlan).not.toBeNull();
  });
});
