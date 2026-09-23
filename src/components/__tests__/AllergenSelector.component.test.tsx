import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AllergenSelector } from '../AllergenSelector';

describe('AllergenSelector', () => {
  test('offers every allergen the catalog can contain', () => {
    render(<AllergenSelector avoidedAllergens={[]} onToggleAllergen={jest.fn()} isDark={false} />);
    expect(screen.getByText('Gluten')).toBeTruthy();
    expect(screen.getByText('Lactate')).toBeTruthy();
    expect(screen.getByText('Arahide')).toBeTruthy();
  });

  test('reports the allergen that was tapped', () => {
    const onToggleAllergen = jest.fn();
    render(<AllergenSelector avoidedAllergens={[]} onToggleAllergen={onToggleAllergen} isDark={false} />);

    fireEvent.press(screen.getByLabelText(/Evită Lactate/i));
    expect(onToggleAllergen).toHaveBeenCalledWith('lactate');
  });

  test('announces an avoided allergen as checked', () => {
    render(
      <AllergenSelector avoidedAllergens={['nuci']} onToggleAllergen={jest.fn()} isDark={false} />
    );
    expect(screen.getByLabelText(/Evită Nuci/i).props.accessibilityState.checked).toBe(true);
    expect(screen.getByLabelText(/Evită Gluten/i).props.accessibilityState.checked).toBe(false);
  });
});
