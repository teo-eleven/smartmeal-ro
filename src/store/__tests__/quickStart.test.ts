import { useHealthSafetyStore } from '../healthSafetyStore';
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

describe('quick start never drops what keeps the user safe (A.11f-8)', () => {
  beforeEach(() => {
    useAppStore.getState().resetOnboarding();
    useAppStore.getState().dismissUndo();
  });

  test.each([
    ['on Android and web', true],
    ['on iOS', false],
  ])('a declared allergy, diet and pork-free survive %s', (_platform, areGoalsShown) => {
    jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(areGoalsShown);
    useAppStore.setState((s) => ({
      preferences: {
        ...s.preferences,
        avoidedAllergens: ['gluten', 'lactate'],
        dietType: 'vegan',
        dietTypes: ['vegan'],
        healthGoalTags: ['pork_free'],
        dislikedRecipeIds: ['some_rejected_dish'],
      },
    }));

    useAppStore.getState().quickStart();

    const { preferences, currentPlan } = useAppStore.getState();
    expect(preferences.avoidedAllergens).toEqual(expect.arrayContaining(['gluten', 'lactate']));
    expect(preferences.dietType).toBe('vegan');
    expect(preferences.dietTypes).toEqual(['vegan']);
    expect(preferences.healthGoalTags).toContain('pork_free');
    expect(preferences.dislikedRecipeIds).toContain('some_rejected_dish');
    expect(currentPlan).not.toBeNull();
    jest.restoreAllMocks();
  });
});

describe('undoing a reset does not bring back goals the safety answer has blocked since (A.11f-9)', () => {
  test('reset, answer "Da", undo: health goals stay off, pork-free is kept', async () => {
    useAppStore.getState().resetOnboarding();
    useAppStore.getState().dismissUndo();
    useAppStore.getState().quickStart();
    useAppStore.getState().setHealthGoalTags(['heart_healthy', 'pork_free']);
    expect(useAppStore.getState().preferences.healthGoalTags).toContain('heart_healthy');
    useAppStore.getState().resetOnboarding();
    expect(useAppStore.getState().lastDiscardedPlan).not.toBeNull();

    await useHealthSafetyStore.getState().setAnswer('yes');
    useAppStore.getState().undoReset();

    const { healthGoalTags } = useAppStore.getState().preferences;
    expect(healthGoalTags).toEqual(['pork_free']);
    await useHealthSafetyStore.getState().reset();
  });
});
