import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { WeekOverview } from '../../components/WeekOverview';
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

describe('vederea pe săptămână și afișarea curată zi cu zi', () => {
  beforeEach(boot);

  test('MealBoardScreen afișează exclusiv vederea zi cu zi (fără butonul de săptămână)', () => {
    render(<MealBoardScreen isDark={false} />);

    expect(screen.queryByLabelText('Vezi toată săptămâna')).toBeNull();
    expect(screen.getByText(/📅 LUNI/)).toBeTruthy();
  });

  test('WeekOverview afișează fiecare zi și fiecare masă', () => {
    const plan = useAppStore.getState().currentPlan!;
    const onPressMeal = jest.fn();

    render(<WeekOverview days={plan.days} onPressMeal={onPressMeal} isDark={false} />);

    const firstMeal = plan.days[0].meals[0];
    expect(
      screen.getByLabelText(new RegExp(`Luni, ${firstMeal.slotLabelRo}`, 'i'))
    ).toBeTruthy();
    expect(screen.getByText('Miercuri')).toBeTruthy();
  });

  test('o masă din WeekOverview apelează callback-ul onPressMeal', () => {
    const plan = useAppStore.getState().currentPlan!;
    const onPressMeal = jest.fn();

    render(<WeekOverview days={plan.days} onPressMeal={onPressMeal} isDark={false} />);

    const firstMeal = plan.days[0].meals[0];
    const button = screen.getByLabelText(new RegExp(`Luni, ${firstMeal.slotLabelRo}`, 'i'));
    fireEvent.press(button);

    expect(onPressMeal).toHaveBeenCalledWith('monday', firstMeal);
  });
});
