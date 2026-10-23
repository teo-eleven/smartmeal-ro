import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { MealBoardScreen } from '../MealBoardScreen';
import { GeneratingPlanModal } from '../onboarding/GeneratingPlanModal';
import { useAppStore } from '../../store/useAppStore';
import { asSubscriber } from '../../__tests__/helpers/subscriber';

/**
 * Two prompts that misbehaved because their memory lived in a component: the budget-overrun
 * modal came back every time the Meals tab was reopened, and the generating screen restarted
 * its timer whenever App re-rendered.
 */

function overBudgetPlan() {
  asSubscriber();
  useAppStore.getState().quickStart();
  const plan = useAppStore.getState().currentPlan!;
  useAppStore.setState({
    currentPlan: { ...plan, totalBudgetRon: Math.floor(plan.totalCartCostRon / 2) },
    activeNotice: null,
    noticeQueue: [],
  });
}

describe('modalul „Buget depășit”', () => {
  test('odată închis, nu reapare la revenirea pe tab dacă nimic nu s-a schimbat', () => {
    overBudgetPlan();
    const first = render(<MealBoardScreen isDark />);
    fireEvent.press(screen.getByText(/Păstrează bugetul actual/));
    first.unmount();

    render(<MealBoardScreen isDark />);

    expect(screen.queryByText(/Păstrează bugetul actual/)).toBeNull();
  });
});

describe('ecranul „Construim meniul”', () => {
  test('un callback nou de la App nu repornește timer-ul', () => {
    const first = jest.fn();
    const second = jest.fn();
    const view = render(<GeneratingPlanModal onComplete={first} isDark />);

    act(() => jest.advanceTimersByTime(1000));
    view.rerender(<GeneratingPlanModal onComplete={second} isDark />);
    act(() => jest.advanceTimersByTime(700));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
