import { summarizeBudget, buildBudgetMessageRo } from '../budgetMessaging';
import { MealPlan } from '../../types';

function buildPlan(overrides: Partial<MealPlan> = {}): MealPlan {
  return {
    id: 'plan-test',
    createdAt: new Date().toISOString(),
    supermarketId: 'lidl',
    peopleCount: 2,
    totalBudgetRon: 200,
    totalRecipeCostRon: 120,
    totalCartCostRon: 150,
    days: [],
    ...overrides,
  };
}

describe('summarizeBudget', () => {
  test('calls a comfortably-funded plan comfortable', () => {
    // Arrange
    const plan = buildPlan({
      totalCartCostRon: 150,
      budgetStatus: { isWithinBudget: true, minimumAchievableRon: 150, swapsApplied: 0 },
    });

    // Act
    const summary = summarizeBudget(plan);

    // Assert
    expect(summary.state).toBe('comfortable');
    expect(summary.isOverBudget).toBe(false);
  });

  test('reports how many meals were downgraded to fit the budget', () => {
    // Arrange
    const plan = buildPlan({
      totalCartCostRon: 195,
      budgetStatus: { isWithinBudget: true, minimumAchievableRon: 195, swapsApplied: 3 },
    });

    // Act
    const summary = summarizeBudget(plan);

    // Assert
    expect(summary.state).toBe('trimmed_to_fit');
    expect(summary.swapsApplied).toBe(3);
  });

  test('claims an honest minimum only while the cart still sits on it', () => {
    // Arrange
    const plan = buildPlan({
      totalBudgetRon: 100,
      totalCartCostRon: 182.4,
      budgetStatus: { isWithinBudget: false, minimumAchievableRon: 182.4, swapsApplied: 9 },
    });

    // Act
    const summary = summarizeBudget(plan);

    // Assert
    expect(summary.state).toBe('at_cheapest_possible');
    expect(summary.minimumAchievableRon).toBe(185);
  });

  test('refuses to claim a minimum after the user manually made the plan pricier', () => {
    // Arrange: engine floor was 182, but a manual swap pushed the cart to 240
    const plan = buildPlan({
      totalBudgetRon: 100,
      totalCartCostRon: 240,
      budgetStatus: { isWithinBudget: false, minimumAchievableRon: 182.4, swapsApplied: 9 },
    });

    // Act
    const summary = summarizeBudget(plan);

    // Assert
    expect(summary.state).toBe('over_after_manual_edits');
    expect(summary.minimumAchievableRon).toBeNull();
  });

  test('handles a plan produced before budgetStatus existed', () => {
    // Arrange
    const plan = buildPlan({ totalBudgetRon: 100, totalCartCostRon: 300, budgetStatus: undefined });

    // Act
    const summary = summarizeBudget(plan);

    // Assert
    expect(summary.state).toBe('over_after_manual_edits');
    expect(summary.minimumAchievableRon).toBeNull();
    expect(summary.overspendRon).toBe(200);
  });
});

describe('buildBudgetMessageRo', () => {
  test('never invents a minimum figure when none is known', () => {
    // Arrange
    const plan = buildPlan({ totalBudgetRon: 100, totalCartCostRon: 240, budgetStatus: undefined });

    // Act
    const message = buildBudgetMessageRo(summarizeBudget(plan), plan.totalBudgetRon);

    // Assert
    expect(message).toContain('depășește bugetul');
    expect(message).not.toContain('minimul realist');
  });

  test('no longer blames minimum package sizes for a planner shortfall', () => {
    // Arrange
    const plan = buildPlan({
      totalBudgetRon: 100,
      totalCartCostRon: 182.4,
      budgetStatus: { isWithinBudget: false, minimumAchievableRon: 182.4, swapsApplied: 9 },
    });

    // Act
    const message = buildBudgetMessageRo(summarizeBudget(plan), plan.totalBudgetRon);

    // Assert
    expect(message).not.toContain('pachetelor minime');
    expect(message).toContain('185');
  });
});
