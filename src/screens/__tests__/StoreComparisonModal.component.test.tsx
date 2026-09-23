import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StoreComparisonModal } from '../StoreComparisonModal';
import { generateMealPlan } from '../../engine/plannerEngine';
import { DayOfWeek, UserPreferences } from '../../types';

const WORK_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday'];

function buildPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    supermarketId: 'lidl',
    peopleCount: 2,
    cookingDays: WORK_WEEK,
    budgetRon: 600,
    moodTags: ['speedy'],
    dietType: 'omnivore',
    dietTypes: ['omnivore'],
    appliances: ['hob', 'oven', 'air_fryer'],
    excludePantryStaples: true,
    pantryInventory: [],
    avoidedAllergens: [],
    mealSlots: ['dinner'],
    foodTier: 'medium',
    selectedSnackIds: [],
    selectedDrinkIds: [],
    includeAlcohol: false,
    ...overrides,
  };
}

describe('StoreComparisonModal', () => {
  test('lists every chain with a price', () => {
    // Arrange
    const preferences = buildPreferences();
    const plan = generateMealPlan(preferences);

    // Act
    render(
      <StoreComparisonModal
        visible
        plan={plan}
        preferences={preferences}
        onClose={jest.fn()}
        onSwitchStore={jest.fn()}
        isDark={false}
      />
    );

    // Assert
    ['Lidl', 'Kaufland', 'Penny', 'Carrefour', 'Auchan', 'Profi'].forEach((name) => {
      expect(screen.getByText(name)).toBeTruthy();
    });
  });

  test('names the saving when a cheaper chain exists', () => {
    // Arrange: Mega Image is the priciest in the index, so a saving must exist
    const preferences = buildPreferences({ supermarketId: 'mega_image' });
    const plan = generateMealPlan(preferences);

    // Act
    render(
      <StoreComparisonModal
        visible
        plan={plan}
        preferences={preferences}
        onClose={jest.fn()}
        onSwitchStore={jest.fn()}
        isDark={false}
      />
    );

    // Assert
    expect(screen.getByText(/Ai economisi/i)).toBeTruthy();
  });

  test('switching chains reports the choice and closes', () => {
    // Arrange
    const preferences = buildPreferences({ supermarketId: 'mega_image' });
    const plan = generateMealPlan(preferences);
    const onSwitchStore = jest.fn();
    const onClose = jest.fn();
    render(
      <StoreComparisonModal
        visible
        plan={plan}
        preferences={preferences}
        onClose={onClose}
        onSwitchStore={onSwitchStore}
        isDark={false}
      />
    );

    // Act
    fireEvent.press(screen.getByLabelText(/Mută cumpărăturile la Kaufland/i));

    // Assert
    expect(onSwitchStore).toHaveBeenCalledWith('kaufland');
    expect(onClose).toHaveBeenCalled();
  });

  test('says plainly that these are estimates, not live offers', () => {
    // Arrange
    const preferences = buildPreferences();
    const plan = generateMealPlan(preferences);

    // Act
    render(
      <StoreComparisonModal
        visible
        plan={plan}
        preferences={preferences}
        onClose={jest.fn()}
        onSwitchStore={jest.fn()}
        isDark
      />
    );

    // Assert
    expect(screen.getByText(/nu oferte live/i)).toBeTruthy();
  });

  test('renders nothing without a plan', () => {
    // Act
    render(
      <StoreComparisonModal
        visible
        plan={null}
        preferences={buildPreferences()}
        onClose={jest.fn()}
        onSwitchStore={jest.fn()}
        isDark={false}
      />
    );

    // Assert
    expect(screen.queryByText(/Același coș/i)).toBeNull();
  });

  test('closing reaches the caller', () => {
    // Arrange
    const preferences = buildPreferences();
    const plan = generateMealPlan(preferences);
    const onClose = jest.fn();
    render(
      <StoreComparisonModal
        visible
        plan={plan}
        preferences={preferences}
        onClose={onClose}
        onSwitchStore={jest.fn()}
        isDark={false}
      />
    );

    // Act
    fireEvent.press(screen.getByLabelText('Închide'));

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
