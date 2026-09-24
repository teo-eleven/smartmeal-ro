import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { GroceryScreen } from '../GroceryScreen';
import { useAppStore } from '../../store/useAppStore';
import { DayOfWeek, UserPreferences } from '../../types';

const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

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
  mealSlots: ['breakfast', 'lunch', 'dinner'],
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

/** The surplus is worth more than the trip, so it has to be visible on the list itself. */
describe('surplusul pe ecranul de cumpărături', () => {
  beforeEach(boot);

  test('spune câte ingrediente rămân și cât valorează', () => {
    render(<GroceryScreen isDark={false} />);

    expect(screen.getByText(/Îți rămân \d+ ingrediente? după săptămâna asta/i)).toBeTruthy();
    expect(screen.getByText(/Cam \d+ lei/i)).toBeTruthy();
  });

  test('apăsarea mută surplusul în cămară', () => {
    render(<GroceryScreen isDark={false} />);

    fireEvent.press(screen.getByLabelText('Pune surplusul în cămară'));

    const stock = useAppStore.getState().preferences.pantryStock!;
    expect(Object.keys(stock).length).toBeGreaterThan(0);
  });

  test('un rând spune ce rămâne din el', () => {
    render(<GroceryScreen isDark={false} />);

    expect(screen.getAllByText(/îți rămân .* pentru săptămâna viitoare/i).length).toBeGreaterThan(0);
  });

  test('fără surplus, butonul nu apare deloc', () => {
    useAppStore.setState((s) => ({
      groceryItems: s.groceryItems.map((item) => ({ ...item, leftoverAmount: 0 })),
    }));
    render(<GroceryScreen isDark={false} />);

    expect(screen.queryByLabelText('Pune surplusul în cămară')).toBeNull();
  });
});
