import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PlanHeader } from '../PlanHeader';
import { MealPlan } from '../../types';

function buildPlan(overrides: Partial<MealPlan> = {}): MealPlan {
  return {
    id: 'plan-1',
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

const noop = () => undefined;

describe('PlanHeader budget messaging', () => {
  test('celebrates a plan that fits without any downgrade', () => {
    // Arrange & Act
    render(
      <PlanHeader
        plan={buildPlan({
          budgetStatus: { isWithinBudget: true, minimumAchievableRon: 150, swapsApplied: 0 },
        })}
        onRebuildPlan={noop}
        onResetOnboarding={noop}
        isDark={false}
      />
    );

    // Assert
    expect(screen.getByText(/Plan optimizat/i)).toBeTruthy();
  });

  test('says how many meals were swapped to fit the budget', () => {
    // Arrange & Act
    render(
      <PlanHeader
        plan={buildPlan({
          totalCartCostRon: 195,
          budgetStatus: { isWithinBudget: true, minimumAchievableRon: 195, swapsApplied: 3 },
        })}
        onRebuildPlan={noop}
        onResetOnboarding={noop}
        isDark={false}
      />
    );

    // Assert
    expect(screen.getByText(/Am înlocuit 3 mese/i)).toBeTruthy();
  });

  test('offers to raise the budget to the honest minimum', () => {
    // Arrange
    const onRaiseBudget = jest.fn();
    render(
      <PlanHeader
        plan={buildPlan({
          totalBudgetRon: 100,
          totalCartCostRon: 182.4,
          budgetStatus: { isWithinBudget: false, minimumAchievableRon: 182.4, swapsApplied: 9 },
        })}
        onRebuildPlan={noop}
        onResetOnboarding={noop}
        onRaiseBudget={onRaiseBudget}
        isDark={false}
      />
    );

    // Act
    fireEvent.press(screen.getByLabelText(/Ridică bugetul la 185 lei/i));

    // Assert
    expect(onRaiseBudget).toHaveBeenCalledWith(185);
  });

  test('never blames minimum pack sizes for a planner shortfall', () => {
    // Arrange & Act
    render(
      <PlanHeader
        plan={buildPlan({
          totalBudgetRon: 100,
          totalCartCostRon: 182.4,
          budgetStatus: { isWithinBudget: false, minimumAchievableRon: 182.4, swapsApplied: 9 },
        })}
        onRebuildPlan={noop}
        onResetOnboarding={noop}
        isDark={false}
      />
    );

    // Assert
    expect(screen.queryByText(/pachetelor minime/i)).toBeNull();
  });

  test('claims no minimum after manual edits pushed the cart up', () => {
    // Arrange & Act
    render(
      <PlanHeader
        plan={buildPlan({
          totalBudgetRon: 100,
          totalCartCostRon: 240,
          budgetStatus: { isWithinBudget: false, minimumAchievableRon: 182.4, swapsApplied: 9 },
        })}
        onRebuildPlan={noop}
        onResetOnboarding={noop}
        onRaiseBudget={jest.fn()}
        isDark={false}
      />
    );

    // Assert
    expect(screen.getByText(/după modificările tale/i)).toBeTruthy();
    expect(screen.queryByText(/minimul realist/i)).toBeNull();
  });

  test('rebuilding the plan reaches the store', () => {
    // Arrange
    const onRebuildPlan = jest.fn();
    render(
      <PlanHeader
        plan={buildPlan()}
        onRebuildPlan={onRebuildPlan}
        onResetOnboarding={noop}
        isDark={false}
      />
    );

    // Act
    fireEvent.press(screen.getByText(/Amestecă/i));

    // Assert
    expect(onRebuildPlan).toHaveBeenCalledTimes(1);
  });
});
