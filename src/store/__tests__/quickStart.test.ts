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
