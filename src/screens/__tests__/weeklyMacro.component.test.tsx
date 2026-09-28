import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { WeeklyMacroModal } from '../WeeklyMacroModal';
import { generateMealPlan } from '../../engine/plannerEngine';
import { UserPreferences } from '../../types';

const PREFS: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: ['monday', 'tuesday'],
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
};

function show() {
  render(
    <WeeklyMacroModal visible onClose={jest.fn()} plan={generateMealPlan(PREFS)} isDark={false} />
  );
}

/**
 * The screen read a dinner-only plan as "calorii medii zilnice / persoană: ~528 kcal", which
 * reads as a day's intake and a dangerously low one. It also showed a "nutrition score"
 * clamped so it could never drop below 65, and three fixed health claims that were the same
 * for every plan. Health information has to be true of the plan shown, or not shown at all
 * (Apple 1.4.1).
 */
describe('ecranul de macronutrienți', () => {
  test('spune că e vorba doar de mesele planificate, nu de toată ziua', () => {
    show();

    expect(screen.queryByText(/CALORII MEDII ZILNICE/)).toBeNull();
    expect(screen.getByText(/din mesele planificate/i)).toBeTruthy();
    expect(screen.getByText(/nu e tot ce mănânci/i)).toBeTruthy();
  });

  test('nu mai arată un scor de nutriție inventat', () => {
    show();

    expect(screen.queryByText(/Scor Nutriție/i)).toBeNull();
  });

  test('nu mai face afirmații de sănătate fixe, aceleași pentru orice plan', () => {
    show();

    expect(screen.queryByText(/grăsimi hidrogenate/i)).toBeNull();
    expect(screen.queryByText(/energie susținută/i)).toBeNull();
  });

  test('spune că valorile sunt estimate și nu înlocuiesc sfatul medical', () => {
    show();

    expect(screen.getByText(/estimate/i)).toBeTruthy();
    expect(screen.getByText(/nu înlocuiesc sfatul/i)).toBeTruthy();
  });
});
