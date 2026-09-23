import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { EligibilityMeter } from '../EligibilityMeter';
import { UserPreferences } from '../../types';

function buildPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    supermarketId: 'lidl',
    peopleCount: 2,
    cookingDays: ['monday', 'tuesday', 'wednesday'],
    budgetRon: 400,
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

describe('EligibilityMeter', () => {
  test('reports a healthy catalog for a normal setup', () => {
    render(<EligibilityMeter preferences={buildPreferences()} isDark={false} />);
    expect(screen.getByText(/rețete disponibile/i)).toBeTruthy();
  });

  test('warns, and says what would unblock it, when nothing is cookable', () => {
    render(<EligibilityMeter preferences={buildPreferences({ appliances: [] })} isDark={false} />);
    expect(screen.getByText(/⚠️/)).toBeTruthy();
  });

  test('flags a thin catalog rather than pretending it is fine', () => {
    render(
      <EligibilityMeter
        preferences={buildPreferences({ dietType: 'vegan', dietTypes: ['vegan'], appliances: ['air_fryer'] })}
        isDark={false}
      />
    );
    expect(screen.getByText(/puține/i)).toBeTruthy();
  });
});
