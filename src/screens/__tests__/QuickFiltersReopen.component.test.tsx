import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { QuickFiltersModal } from '../QuickFiltersModal';
import { UserPreferences } from '../../types';

/**
 * B2 from the 2026-10-21 audit: the modal copied the preferences once, on mount, and stays
 * mounted while hidden. Reopened after the budget changed elsewhere, it showed the old values
 * and "Aplică" wrote all of them back over the newer ones.
 */

const base: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: ['monday', 'tuesday', 'wednesday'],
  budgetRon: 400,
  moodTags: ['family_fav'],
  dietType: 'omnivore',
  appliances: ['hob', 'oven'],
  excludePantryStaples: true,
  mealSlots: ['dinner'],
};

describe('filtrele rapide la redeschidere', () => {
  test('arată și aplică preferințele curente, nu cele de la prima deschidere', () => {
    const onApply = jest.fn();
    const props = {
      onClose: jest.fn(),
      onApplyFilters: onApply,
      onResetOnboarding: jest.fn(),
      isDark: true,
    };
    const { rerender } = render(<QuickFiltersModal visible preferences={base} {...props} />);
    rerender(<QuickFiltersModal visible={false} preferences={base} {...props} />);

    // Meanwhile the budget and household changed from another screen.
    const newer = { ...base, budgetRon: 700, peopleCount: 4 };
    rerender(<QuickFiltersModal visible={false} preferences={newer} {...props} />);
    rerender(<QuickFiltersModal visible preferences={newer} {...props} />);

    expect(screen.getAllByText(/700 LEI/).length).toBeGreaterThan(0);
    fireEvent.press(screen.getAllByText(/Aplică/)[0]);
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ budgetRon: 700, peopleCount: 4 })
    );
  });
});
