import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MealBoardScreen } from '../MealBoardScreen';
import { useAppStore } from '../../store/useAppStore';
import { UserPreferences } from '../../types';

const PREFS: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: ['monday', 'tuesday'],
  budgetRon: 900,
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

function seedPlan() {
  useAppStore.setState({
    preferences: { ...PREFS },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    lastDiscardedPlan: null,
    confirmRequest: null,
  });
  useAppStore.getState().generatePlan();
}

describe('MealBoardScreen', () => {
  beforeEach(seedPlan);

  test('shows the weekly plan with its financial header', () => {
    render(<MealBoardScreen isDark={false} />);
    expect(screen.getByText(/COST TOTAL ESTIMAT/i)).toBeTruthy();
  });

  test('offers the supermarket comparison', () => {
    render(<MealBoardScreen isDark={false} />);
    expect(screen.getByText('Compară Magazine')).toBeTruthy();
  });

  test('offers the saved plan library', () => {
    render(<MealBoardScreen isDark={false} />);
    expect(screen.getByText('Planurile Mele')).toBeTruthy();
  });

  test('opening the comparison shows the chains', () => {
    render(<MealBoardScreen isDark={false} />);
    fireEvent.press(screen.getByLabelText(/Compară prețul coșului/i));
    expect(screen.getByText(/Același coș, alt magazin/i)).toBeTruthy();
  });

  test('reshuffling produces a plan again', () => {
    render(<MealBoardScreen isDark={false} />);
    fireEvent.press(screen.getByText(/Amestecă/i));
    expect(useAppStore.getState().currentPlan).not.toBeNull();
  });

  test('asking for a new plan requests confirmation rather than deleting', () => {
    render(<MealBoardScreen isDark={false} />);
    const planBefore = useAppStore.getState().currentPlan;
    fireEvent.press(screen.getByText(/Filtre/i));
    expect(useAppStore.getState().currentPlan).toBe(planBefore);
  });

  test('adjusting servings on a card updates the plan', () => {
    render(<MealBoardScreen isDark={false} />);
    const before = useAppStore.getState().currentPlan!.days[0].meals[0].servings;
    fireEvent.press(screen.getAllByLabelText('Adaugă o porție')[0]);
    expect(useAppStore.getState().currentPlan!.days[0].meals[0].servings).toBe(before + 1);
  });

  test('renders in dark mode', () => {
    render(<MealBoardScreen isDark />);
    expect(screen.getByText(/COST TOTAL ESTIMAT/i)).toBeTruthy();
  });
});

/**
 * The board's quick actions. Each one either changes the week or opens a screen about it,
 * and none of them had ever been pressed by a test: a handler wired to the wrong setter would
 * have shipped with the suite green.
 */
describe('MealBoardScreen, acțiunile rapide', () => {
  beforeEach(seedPlan);

  test('„adaugă desert" pune un desert în ziua aceea', () => {
    render(<MealBoardScreen isDark={false} />);
    const firstDay = useAppStore.getState().currentPlan!.days[0];
    expect(firstDay.meals.some((m) => m.slot === 'dessert')).toBe(false);

    fireEvent.press(screen.getAllByText(/Adaugă Desert de Casă/)[0]);

    const day = useAppStore
      .getState()
      .currentPlan!.days.find((d) => d.dayOfWeek === firstDay.dayOfWeek)!;
    expect(day.meals.some((m) => m.slot === 'dessert')).toBe(true);
  });

  test('nivelul mâncării se schimbă din ecranul principal', () => {
    render(<MealBoardScreen isDark={false} />);

    fireEvent.press(screen.getByText('🥇 Prem'));

    expect(useAppStore.getState().preferences.foodTier).toBe('premium');
  });

  test('cămara se deschide și se închide', () => {
    render(<MealBoardScreen isDark={false} />);

    fireEvent.press(screen.getByText('Ce am în Cămară'));
    expect(screen.getByText(/Ce am deja în Cămară & Frigider/)).toBeTruthy();

    fireEvent.press(screen.getByText(/✕ Închide/));
    expect(screen.queryByText(/Ce am deja în Cămară & Frigider/)).toBeNull();
  });

  test('macronutrienții săptămânii se deschid', () => {
    render(<MealBoardScreen isDark={false} />);

    fireEvent.press(screen.getByText('Macro Săptămână'));

    expect(screen.getByText(/Nutriție & Macro Săptămânale/)).toBeTruthy();
  });

  test('ghidul de meal prep se deschide', () => {
    render(<MealBoardScreen isDark={false} />);

    fireEvent.press(screen.getByText('Ghid Meal Prep'));

    expect(screen.getByText(/Ghid Meal Prep Săptămânal/)).toBeTruthy();
  });
});
