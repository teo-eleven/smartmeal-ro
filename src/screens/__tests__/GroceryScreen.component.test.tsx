import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { GroceryScreen } from '../GroceryScreen';
import { useAppStore } from '../../store/useAppStore';
import { UserPreferences } from '../../types';

const PREFS: UserPreferences = {
  supermarketId: 'lidl', peopleCount: 2, cookingDays: ['monday', 'tuesday'], budgetRon: 600,
  moodTags: ['speedy'], dietType: 'omnivore', dietTypes: ['omnivore'],
  appliances: ['hob', 'oven', 'air_fryer'], excludePantryStaples: true,
  pantryInventory: [], avoidedAllergens: [], mealSlots: ['dinner'], foodTier: 'medium',
  selectedSnackIds: [], selectedDrinkIds: [], includeAlcohol: false,
};

function seedPlan() {
  useAppStore.setState({ preferences: { ...PREFS }, currentPlan: null, groceryItems: [] });
  useAppStore.getState().generatePlan();
}

describe('GroceryScreen', () => {
  test('invites the user to configure when no plan exists', () => {
    useAppStore.setState({ currentPlan: null, groceryItems: [] });
    render(<GroceryScreen isDark={false} />);
    expect(screen.getByText(/Niciun meniu activ/i)).toBeTruthy();
  });

  test('renders the aisles of an active plan', () => {
    seedPlan();
    render(<GroceryScreen isDark={false} />);
    expect(screen.queryByText(/Niciun meniu activ/i)).toBeNull();
  });

  test('ticking an item marks it as bought in the store', () => {
    seedPlan();
    render(<GroceryScreen isDark={false} />);
    const before = useAppStore.getState().groceryItems.filter((i) => i.isPurchased).length;

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.press(checkboxes[0]);

    const after = useAppStore.getState().groceryItems.filter((i) => i.isPurchased).length;
    expect(after).not.toBe(before);
  });

  test('renders in dark mode too', () => {
    seedPlan();
    render(<GroceryScreen isDark />);
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
  });
});
