import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RecipeDetailModal } from '../RecipeDetailModal';
import { MealSwapModal } from '../MealSwapModal';
import { PantryInventoryModal } from '../PantryInventoryModal';
import { MealPrepModal } from '../MealPrepModal';
import { WeeklyMacroModal } from '../WeeklyMacroModal';
import { QuickFiltersModal } from '../QuickFiltersModal';
import { SnacksAndDrinksModal } from '../SnacksAndDrinksModal';
import { AuthModal } from '../AuthModal';
import { generateMealPlan } from '../../engine/plannerEngine';
import { getRecipeAllergens } from '../../utils/allergenFilter';
import { RECIPES } from '../../data/recipes';
import { useAppStore } from '../../store/useAppStore';
import { DayOfWeek, UserPreferences } from '../../types';

const PREFS: UserPreferences = {
  supermarketId: 'lidl', peopleCount: 2, cookingDays: ['monday', 'tuesday'] as DayOfWeek[],
  budgetRon: 900, moodTags: ['speedy'], dietType: 'omnivore', dietTypes: ['omnivore'],
  appliances: ['hob', 'oven', 'air_fryer'], excludePantryStaples: true,
  pantryInventory: [], avoidedAllergens: [], mealSlots: ['dinner'], foodTier: 'medium',
  selectedSnackIds: [], selectedDrinkIds: [], includeAlcohol: false,
};

const plan = generateMealPlan(PREFS);
const recipeWithAllergens = RECIPES.find((r) => getRecipeAllergens(r).length > 0)!;

beforeEach(() => {
  useAppStore.setState({ preferences: { ...PREFS }, currentPlan: plan, groceryItems: [] });
});

describe('RecipeDetailModal', () => {
  test('shows the dish, its steps and what it contains', () => {
    render(
      <RecipeDetailModal
        visible
        recipe={recipeWithAllergens}
        servings={2}
        onSwap={jest.fn()}
        onClose={jest.fn()}
        isDark={false}
      />
    );
    expect(screen.getAllByText(recipeWithAllergens.title).length).toBeGreaterThan(0);
    expect(screen.getByText(/Conține:/i)).toBeTruthy();
  });

  test('closes when asked', () => {
    const onClose = jest.fn();
    render(
      <RecipeDetailModal
        visible
        recipe={RECIPES[0]}
        servings={2}
        onSwap={jest.fn()}
        onClose={onClose}
        isDark
      />
    );
    fireEvent.press(screen.getAllByText(/Închide/i)[0]);
    expect(onClose).toHaveBeenCalled();
  });

  test('renders nothing without a recipe', () => {
    render(
      <RecipeDetailModal
        visible
        recipe={null}
        servings={2}
        onSwap={jest.fn()}
        onClose={jest.fn()}
        isDark={false}
      />
    );
    expect(screen.queryByText(/Ingrediente necesare/i)).toBeNull();
  });
});

describe('the remaining modals render and close', () => {
  test('MealSwapModal', () => {
    const onClose = jest.fn();
    render(
      <MealSwapModal
        visible
        dayOfWeek="monday"
        slot="dinner"
        currentPlan={plan}
        preferences={PREFS}
        onClose={onClose}
        onSelectReplacement={jest.fn()}
        isDark={false}
      />
    );
    fireEvent.press(screen.getByLabelText('Închide'));
    expect(onClose).toHaveBeenCalled();
  });

  test('PantryInventoryModal', () => {
    const onClose = jest.fn();
    render(<PantryInventoryModal visible onClose={onClose} isDark={false} />);
    fireEvent.press(screen.getByText(/Închide/i));
    expect(onClose).toHaveBeenCalled();
  });

  test('MealPrepModal', () => {
    const onClose = jest.fn();
    render(<MealPrepModal visible plan={plan} onClose={onClose} isDark={false} />);
    fireEvent.press(screen.getByText(/Închide/i));
    expect(onClose).toHaveBeenCalled();
  });

  test('WeeklyMacroModal', () => {
    const onClose = jest.fn();
    render(<WeeklyMacroModal visible plan={plan} onClose={onClose} isDark={false} />);
    fireEvent.press(screen.getAllByText(/Închide/i)[0]);
    expect(onClose).toHaveBeenCalled();
  });

  test('QuickFiltersModal', () => {
    const onClose = jest.fn();
    render(
      <QuickFiltersModal
        visible
        preferences={PREFS}
        onApplyFilters={jest.fn()}
        onResetOnboarding={jest.fn()}
        onClose={onClose}
        isDark={false}
      />
    );
    fireEvent.press(screen.getByLabelText('Închide'));
    expect(onClose).toHaveBeenCalled();
  });

  test('SnacksAndDrinksModal', () => {
    const onClose = jest.fn();
    render(<SnacksAndDrinksModal visible onClose={onClose} isDark={false} />);
    fireEvent.press(screen.getAllByLabelText('Închide')[0]);
    expect(onClose).toHaveBeenCalled();
  });

  test('AuthModal', () => {
    const onClose = jest.fn();
    render(
      <AuthModal
        visible
        onClose={onClose}
        isDark={false}
        userEmail={null}
        onUserChanged={jest.fn()}
        onSyncTriggered={jest.fn()}
        isSyncing={false}
        lastSyncedAt={null}
      />
    );
    fireEvent.press(screen.getAllByText(/Închide|Continuă fără cont/i)[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
