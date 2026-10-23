import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BudgetSlider } from '../BudgetSlider';
import { useAppStore } from '../../store/useAppStore';

/**
 * B1 from the 2026-10-21 audit: every keystroke went to the store, the store clamped "1" to
 * 20, and the effect wrote "20" back into the field while the user was still typing, so
 * typing 150 produced 2050. The old test mocked onChangeBudget and never saw the round trip.
 */

function WiredSlider() {
  const budget = useAppStore((s) => s.preferences.budgetRon);
  const setBudget = useAppStore((s) => s.setBudget);
  return (
    <BudgetSlider
      budget={budget}
      peopleCount={2}
      daysCount={7}
      supermarketId="lidl"
      onChangeBudget={setBudget}
      isDark
    />
  );
}

beforeEach(() => {
  useAppStore.setState({ preferences: { ...useAppStore.getState().preferences, budgetRon: 400 } });
});

describe('câmpul de buget cu store-ul real', () => {
  test('tastând 1, 5, 0 rezultă 150, nu 2050', () => {
    render(<WiredSlider />);
    const input = screen.getByLabelText('Buget săptămânal în lei');

    fireEvent(input, 'focus');
    fireEvent.changeText(input, '1');
    fireEvent.changeText(input, '15');
    fireEvent.changeText(input, '150');

    expect(input.props.value).toBe('150');
    fireEvent(input, 'blur');
    expect(useAppStore.getState().preferences.budgetRon).toBe(150);
  });

  test('nu scrie în store la fiecare tastă, doar la final', () => {
    render(<WiredSlider />);
    const input = screen.getByLabelText('Buget săptămânal în lei');

    fireEvent(input, 'focus');
    fireEvent.changeText(input, '3');
    fireEvent.changeText(input, '35');

    expect(useAppStore.getState().preferences.budgetRon).toBe(400);
    fireEvent(input, 'submitEditing');
    expect(useAppStore.getState().preferences.budgetRon).toBe(35);
  });

  test('butoanele − și + actualizează câmpul când nu e în editare', () => {
    render(<WiredSlider />);
    const input = screen.getByLabelText('Buget săptămânal în lei');

    fireEvent.press(screen.getByLabelText('Crește bugetul'));

    expect(input.props.value).toBe(String(useAppStore.getState().preferences.budgetRon));
  });
});
