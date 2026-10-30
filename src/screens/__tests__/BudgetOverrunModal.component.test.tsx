import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BudgetOverrunModal } from '../BudgetOverrunModal';

function show(cost: number, budget: number) {
  const onConfirmIncrease = jest.fn();
  const onDismiss = jest.fn();
  render(
    <BudgetOverrunModal
      visible
      currentCostRon={cost}
      currentBudgetRon={budget}
      onConfirmIncrease={onConfirmIncrease}
      onDismiss={onDismiss}
      isDark
    />
  );
  return { onConfirmIncrease, onDismiss };
}

describe('meniul a ieșit peste buget', () => {
  test('propune un buget rotund care acoperă costul', () => {
    const { onConfirmIncrease } = show(214.4, 200);

    fireEvent.press(screen.getByText(/Mărește bugetul la 220 lei/));

    expect(onConfirmIncrease).toHaveBeenCalledWith(220);
  });

  test('lasă cel puțin 3 lei de rezervă: 218 lei cer 230, nu 220', () => {
    const { onConfirmIncrease } = show(218, 200);

    fireEvent.press(screen.getByText(/Mărește bugetul la 230 lei/));

    expect(onConfirmIncrease).toHaveBeenCalledWith(230);
  });

  test('„Păstrează bugetul” închide fără să schimbe nimic', () => {
    const { onConfirmIncrease, onDismiss } = show(214.4, 200);

    fireEvent.press(screen.getByText(/Păstrează bugetul actual \(200 lei\)/));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onConfirmIncrease).not.toHaveBeenCalled();
  });

  test('ascuns, nu desenează nimic', () => {
    render(
      <BudgetOverrunModal
        visible={false}
        currentCostRon={250}
        currentBudgetRon={200}
        onConfirmIncrease={jest.fn()}
        onDismiss={jest.fn()}
        isDark
      />
    );

    expect(screen.queryByText(/Mărește bugetul/)).toBeNull();
  });
});
