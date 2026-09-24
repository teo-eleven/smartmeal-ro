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
  mealSlots: ['lunch', 'dinner'],
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

/** Twenty-one full cards is a long scroll; the overview is for judging the week at once. */
describe('vederea pe săptămână', () => {
  beforeEach(boot);

  test('tabla pornește zi cu zi', () => {
    render(<MealBoardScreen isDark={false} />);

    expect(screen.getByLabelText('Vezi toată săptămâna')).toBeTruthy();
  });

  test('comutată, arată fiecare zi și fiecare masă', () => {
    render(<MealBoardScreen isDark={false} />);

    fireEvent.press(screen.getByLabelText('Vezi toată săptămâna'));

    const plan = useAppStore.getState().currentPlan!;
    const firstMeal = plan.days[0].meals[0];
    expect(
      screen.getByLabelText(new RegExp(`Luni, ${firstMeal.slotLabelRo}`, 'i'))
    ).toBeTruthy();
    expect(screen.getByText('Miercuri')).toBeTruthy();
  });

  test('o masă din vedere deschide rețeta ei', () => {
    render(<MealBoardScreen isDark={false} />);
    fireEvent.press(screen.getByLabelText('Vezi toată săptămâna'));

    const meal = useAppStore.getState().currentPlan!.days[0].meals[0];
    fireEvent.press(screen.getByLabelText(new RegExp(`Luni, ${meal.slotLabelRo}`, 'i')));

    expect(screen.getByText(/Schimbă cu alt preparat/i)).toBeTruthy();
  });

  test('se poate reveni la zi cu zi', () => {
    render(<MealBoardScreen isDark={false} />);

    fireEvent.press(screen.getByLabelText('Vezi toată săptămâna'));
    fireEvent.press(screen.getByLabelText('Vezi zi cu zi'));

    expect(screen.getByLabelText('Vezi toată săptămâna')).toBeTruthy();
  });
});
