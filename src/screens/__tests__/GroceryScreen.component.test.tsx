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
  test('„bifează tot" marchează toate produsele ca luate', () => {
    seedPlan();
    render(<GroceryScreen isDark={false} />);

    fireEvent.press(screen.getByText(/Bifează tot/));

    const items = useAppStore.getState().groceryItems;
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.isPurchased)).toBe(true);
  });

  test('„deselectează" le aduce pe toate înapoi', () => {
    seedPlan();
    render(<GroceryScreen isDark={false} />);
    fireEvent.press(screen.getByText(/Bifează tot/));

    fireEvent.press(screen.getByText(/Deselectează/));

    expect(useAppStore.getState().groceryItems.every((i) => !i.isPurchased)).toBe(true);
  });

  /**
   * Copying is the one action that leaves the app, so it is worth knowing what it puts on the
   * clipboard: only what is still to buy, and never a bare heading when nothing is left.
   */
  test('copierea listei pune pe clipboard doar ce mai e de cumpărat', async () => {
    seedPlan();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      configurable: true,
      writable: true,
    });
    const bought = useAppStore.getState().groceryItems[0];
    useAppStore.getState().toggleGroceryItem(bought.ingredientId);
    render(<GroceryScreen isDark={false} />);

    fireEvent.press(screen.getByText(/Trimite \/ Copiază/));
    await screen.findByText(/Copiat în Clipboard/);

    const text = writeText.mock.calls[0][0] as string;
    expect(text).not.toContain(`[ ] ${bought.name}`);
    const stillToBuy = useAppStore.getState().groceryItems.filter((i) => !i.isPurchased);
    stillToBuy.forEach((i) => expect(text).toContain(i.name));
  });

  test('nu copiază nimic când lista e deja completă', () => {
    seedPlan();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, 'navigator', {
      value: { clipboard: { writeText } },
      configurable: true,
      writable: true,
    });
    render(<GroceryScreen isDark={false} />);
    fireEvent.press(screen.getByText(/Bifează tot/));

    fireEvent.press(screen.getByText(/Trimite \/ Copiază/));

    expect(writeText).not.toHaveBeenCalled();
  });
});
