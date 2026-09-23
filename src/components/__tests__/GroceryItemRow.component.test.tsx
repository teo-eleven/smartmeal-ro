import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { GroceryItemRow } from '../GroceryItemRow';
import { GroceryListItem } from '../../types';

function buildItem(overrides: Partial<GroceryListItem> = {}): GroceryListItem {
  return {
    ingredientId: 'piept_pui_file',
    name: 'Piept de pui file',
    category: 'meat_fish',
    isPantryStaple: false,
    neededAmount: 600,
    unit: 'g',
    packsToBuy: 2,
    packSize: 500,
    estimatedPriceRon: 65.97,
    isPurchased: false,
    ...overrides,
  };
}

describe('GroceryItemRow', () => {
  test('shows the product name and what it costs', () => {
    // Arrange & Act
    render(<GroceryItemRow item={buildItem()} onToggle={jest.fn()} isDark={false} />);

    // Assert
    expect(screen.getByText(/Piept de pui file/i)).toBeTruthy();
    expect(screen.getByText(/65[.,]97/)).toBeTruthy();
  });

  test('tapping the row reports the toggle once', () => {
    // Arrange
    const onToggle = jest.fn();
    render(<GroceryItemRow item={buildItem()} onToggle={onToggle} isDark={false} />);

    // Act
    fireEvent.press(screen.getByRole('checkbox'));

    // Assert
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test('announces itself as an unchecked checkbox before it is bought', () => {
    // Arrange & Act
    render(<GroceryItemRow item={buildItem()} onToggle={jest.fn()} isDark={false} />);

    // Assert
    const row = screen.getByRole('checkbox');
    expect(row.props.accessibilityState.checked).toBe(false);
    expect(row.props.accessibilityLabel).toContain('Piept de pui file');
    expect(row.props.accessibilityLabel).toContain('65.97');
  });

  test('announces itself as checked once bought', () => {
    // Arrange & Act
    render(
      <GroceryItemRow item={buildItem({ isPurchased: true })} onToggle={jest.fn()} isDark={false} />
    );

    // Assert
    expect(screen.getByRole('checkbox').props.accessibilityState.checked).toBe(true);
  });

  test('renders an item already at home without crashing', () => {
    // Arrange & Act
    render(
      <GroceryItemRow
        item={buildItem({ isFromPantry: true, estimatedPriceRon: 0, packsToBuy: 0 })}
        onToggle={jest.fn()}
        isDark={false}
      />
    );

    // Assert
    expect(screen.getByRole('checkbox')).toBeTruthy();
  });
});
