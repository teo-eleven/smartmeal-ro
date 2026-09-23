import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { QuickFiltersModal } from '../QuickFiltersModal';
import { DayOfWeek, UserPreferences } from '../../types';

const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const PREFS: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: WEEK,
  budgetRon: 400,
  moodTags: ['speedy'],
  dietType: 'omnivore',
  dietTypes: ['omnivore'],
  appliances: ['hob', 'oven'],
  excludePantryStaples: true,
  pantryInventory: [],
  avoidedAllergens: [],
  mealSlots: ['dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

function setup(overrides: Partial<UserPreferences> = {}) {
  const onApplyFilters = jest.fn();
  const onClose = jest.fn();
  const onResetOnboarding = jest.fn();
  render(
    <QuickFiltersModal
      visible
      onClose={onClose}
      preferences={{ ...PREFS, ...overrides }}
      onApplyFilters={onApplyFilters}
      onResetOnboarding={onResetOnboarding}
      isDark={false}
    />
  );
  return { onApplyFilters, onClose, onResetOnboarding };
}

const apply = () => fireEvent.press(screen.getByText('Aplică ✓'));

/**
 * The one screen where a live plan's preferences are edited. It holds its choices locally
 * and hands them over in a single batch, so nothing is rebuilt until the user says so.
 */
describe('QuickFiltersModal', () => {
  test('nu schimbă nimic până nu apeși Aplică', () => {
    const { onApplyFilters } = setup();

    fireEvent.press(screen.getByText('Proteic'));

    expect(onApplyFilters).not.toHaveBeenCalled();
  });

  test('trimite toate preferințele deodată și închide', () => {
    const { onApplyFilters, onClose } = setup();

    apply();

    expect(onApplyFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        cookingDays: WEEK,
        peopleCount: 2,
        budgetRon: 400,
        appliances: ['hob', 'oven'],
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  test('adaugă o preferință de gust aleasă', () => {
    const { onApplyFilters } = setup();

    fireEvent.press(screen.getByText('Proteic'));
    apply();

    expect(onApplyFilters.mock.calls[0][0].moodTags).toContain('high_protein');
  });

  test('adaugă un aparat bifat', () => {
    const { onApplyFilters } = setup();

    fireEvent.press(screen.getByText('Air Fryer'));
    apply();

    expect(onApplyFilters.mock.calls[0][0].appliances).toContain('air_fryer');
  });

  test('nu te lasă fără niciun aparat', () => {
    const { onApplyFilters } = setup({ appliances: ['hob'] });

    fireEvent.press(screen.getByText('Aragaz / Plită'));
    apply();

    expect(onApplyFilters.mock.calls[0][0].appliances).toEqual(['hob']);
  });

  test('un buget scris de mână sub minim este ridicat la minim', () => {
    const { onApplyFilters } = setup();

    fireEvent.changeText(screen.getByDisplayValue('400'), '10');
    apply();

    expect(onApplyFilters.mock.calls[0][0].budgetRon).toBe(50);
  });

  test('un buget gol păstrează valoarea dinainte', () => {
    const { onApplyFilters } = setup();

    fireEvent.changeText(screen.getByDisplayValue('400'), '');
    apply();

    expect(onApplyFilters.mock.calls[0][0].budgetRon).toBe(400);
  });

  test('reluarea configuratorului este predată aplicației', () => {
    const { onResetOnboarding } = setup();

    fireEvent.press(screen.getByText(/Reia Configuratorul/i));

    expect(onResetOnboarding).toHaveBeenCalled();
  });

  test('închiderea nu aplică nimic', () => {
    const { onApplyFilters, onClose } = setup();

    fireEvent.press(screen.getByLabelText('Închide'));

    expect(onClose).toHaveBeenCalled();
    expect(onApplyFilters).not.toHaveBeenCalled();
  });
});
