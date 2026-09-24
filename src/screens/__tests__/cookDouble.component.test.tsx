import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MealBoardScreen } from '../MealBoardScreen';
import { useAppStore } from '../../store/useAppStore';
import { DayOfWeek, UserPreferences } from '../../types';

const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday'];

const PREFS: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: WEEK,
  budgetRon: 900,
  moodTags: ['family_fav'],
  dietType: 'omnivore',
  dietTypes: ['omnivore'],
  appliances: ['hob', 'oven', 'air_fryer'],
  excludePantryStaples: true,
  pantryInventory: [],
  pantryStock: {},
  avoidedAllergens: [],
  mealSlots: ['dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

function boot() {
  useAppStore.setState({
    preferences: { ...PREFS },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    activeNotice: null,
  });
  useAppStore.getState().generatePlan();
}

describe('gătitul dublu de pe tablă', () => {
  beforeEach(boot);

  test('fiecare zi în afară de ultima oferă porția dublă', () => {
    render(<MealBoardScreen isDark={false} />);

    // Three cooking days, so two of them have a next day to reheat on.
    expect(screen.getAllByLabelText('Gătesc porție dublă și reîncălzesc mâine')).toHaveLength(2);
  });

  test('apăsarea marchează ziua următoare ca reîncălzită', () => {
    render(<MealBoardScreen isDark={false} />);

    fireEvent.press(screen.getAllByLabelText('Gătesc porție dublă și reîncălzesc mâine')[0]);

    const tuesday = useAppStore.getState().currentPlan!.days[1];
    expect(tuesday.meals[0].isLeftover).toBe(true);
  });

  test('ziua reîncălzită oferă întoarcerea', () => {
    render(<MealBoardScreen isDark={false} />);
    fireEvent.press(screen.getAllByLabelText('Gătesc porție dublă și reîncălzesc mâine')[0]);

    expect(screen.getByLabelText('Gătesc din nou în ziua asta')).toBeTruthy();
  });
});
