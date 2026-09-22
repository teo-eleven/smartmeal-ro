import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ApplianceSelector } from '../ApplianceSelector';
import { BudgetSlider } from '../BudgetSlider';
import { PantryStapleToggle } from '../PantryStapleToggle';
import { MacroBar } from '../MacroBar';
import { GroceryAisleSection } from '../GroceryAisleSection';
import { InformativeNoticeModal } from '../InformativeNoticeModal';
import { GroceryListItem } from '../../types';

describe('ApplianceSelector', () => {
  test('marks the selected appliances as checked', () => {
    render(
      <ApplianceSelector
        selectedAppliances={['hob']}
        onToggleAppliance={jest.fn()}
        isDark={false}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.some((c) => c.props.accessibilityState.checked)).toBe(true);
  });

  test('reports the appliance that was tapped', () => {
    const onToggleAppliance = jest.fn();
    render(
      <ApplianceSelector selectedAppliances={[]} onToggleAppliance={onToggleAppliance} isDark />
    );
    fireEvent.press(screen.getAllByRole('checkbox')[0]);
    expect(onToggleAppliance).toHaveBeenCalled();
  });
});

describe('BudgetSlider', () => {
  const props = {
    budget: 200,
    onChangeBudget: jest.fn(),
    peopleCount: 2,
    daysCount: 5,
    supermarketId: 'lidl' as const,
    mealsPerDay: 1,
    foodTier: 'medium' as const,
    isDark: false,
  };

  test('renders the budget controls', () => {
    const view = render(<BudgetSlider {...props} />);
    expect(view.toJSON()).toBeTruthy();
    expect(screen.getByLabelText(/Folosește bugetul sugerat/i)).toBeTruthy();
  });

  test('suggesting a budget reports a number', () => {
    const onChangeBudget = jest.fn();
    render(<BudgetSlider {...props} onChangeBudget={onChangeBudget} />);
    fireEvent.press(screen.getByLabelText(/Folosește bugetul sugerat/i));
    expect(onChangeBudget).toHaveBeenCalledWith(expect.any(Number));
  });
});

describe('PantryStapleToggle', () => {
  test('announces its state as a switch', () => {
    render(<PantryStapleToggle excludeStaples onToggle={jest.fn()} isDark={false} />);
    expect(screen.getByRole('switch').props.accessibilityState.checked).toBe(true);
  });

  test('toggling reports the opposite value', () => {
    const onToggle = jest.fn();
    render(<PantryStapleToggle excludeStaples={false} onToggle={onToggle} isDark />);
    fireEvent.press(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledWith(true);
  });
});

describe('MacroBar', () => {
  test('renders the macro breakdown', () => {
    const view = render(
      <MacroBar
        nutrition={{ calories: 600, proteinGrams: 40, carbsGrams: 50, fatGrams: 20 }}
        isDark={false}
      />
    );
    expect(view.toJSON()).toBeTruthy();
  });
});

describe('GroceryAisleSection', () => {
  const item: GroceryListItem = {
    ingredientId: 'morcovi',
    name: 'Morcovi',
    category: 'produce',
    isPantryStaple: false,
    neededAmount: 300,
    unit: 'g',
    packsToBuy: 1,
    packSize: 500,
    estimatedPriceRon: 3.2,
    isPurchased: false,
  };

  test('lists the aisle and its items', () => {
    render(
      <GroceryAisleSection
        category="produce"
        items={[item]}
        onToggleItem={jest.fn()}
        isDark={false}
      />
    );
    expect(screen.getByText(/Morcovi/)).toBeTruthy();
  });
});

describe('InformativeNoticeModal', () => {
  test('renders nothing without a notice', () => {
    const view = render(
      <InformativeNoticeModal notice={null} onDismiss={jest.fn()} isDark={false} />
    );
    expect(view.toJSON()).toBeNull();
  });

  test('shows the notice and dismisses it', () => {
    const onDismiss = jest.fn();
    render(
      <InformativeNoticeModal
        notice={{ id: '1', title: 'Atenție', message: 'Ceva de știut', type: 'warning' }}
        onDismiss={onDismiss}
        isDark={false}
      />
    );
    expect(screen.getByText('Atenție')).toBeTruthy();
    fireEvent.press(screen.getAllByRole('button')[0]);
    expect(onDismiss).toHaveBeenCalled();
  });
});
