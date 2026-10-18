import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RecipeDetailModal } from '../RecipeDetailModal';
import { useAppStore } from '../../store/useAppStore';
import { RECIPES } from '../../data/recipes';
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

const recipe = RECIPES[0];

function show() {
  useAppStore.setState({
    preferences: { ...PREFS },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    activeNotice: null,
  });
  useAppStore.getState().generatePlan();
  render(
    <RecipeDetailModal
      visible
      recipe={recipe}
      servings={2}
      onClose={jest.fn()}
      onSwap={jest.fn()}
      isDark={false}
    />
  );
}

/** The two buttons that let the planner learn something from a week that has been cooked. */
describe('verdictul asupra unei rețete', () => {
  test('„nu mai propune" o scoate din propuneri', () => {
    show();

    fireEvent.press(screen.getByLabelText('Nu mai propune rețeta'));

    expect(useAppStore.getState().preferences.dislikedRecipeIds).toContain(recipe.id);
  });

  test('după respingere, butonul oferă revenirea', () => {
    show();
    fireEvent.press(screen.getByLabelText('Nu mai propune rețeta'));

    expect(screen.getByLabelText('Adu rețeta înapoi în propuneri')).toBeTruthy();
  });

  test('„îmi place" o marchează ca preferată', () => {
    show();

    fireEvent.press(screen.getByLabelText('Marchează ca preferat'));

    expect(useAppStore.getState().preferences.favouriteRecipeIds).toContain(recipe.id);
  });

  test('cele două verdicte se exclud reciproc', () => {
    show();

    fireEvent.press(screen.getByLabelText('Marchează ca preferat'));
    fireEvent.press(screen.getByLabelText('Nu mai propune rețeta'));

    const prefs = useAppStore.getState().preferences;
    expect(prefs.favouriteRecipeIds ?? []).not.toContain(recipe.id);
    expect(prefs.dislikedRecipeIds ?? []).toContain(recipe.id);
  });

  test('la apăsarea pe „nu mai propune", apare sugestia de înlocuire automată și permite înlocuirea', () => {
    useAppStore.setState({
      preferences: { ...PREFS },
      currentPlan: null,
      groceryItems: [],
      savedPlans: [],
      activeNotice: null,
    });
    useAppStore.getState().generatePlan();

    const plan = useAppStore.getState().currentPlan!;
    const targetMeal = plan.days[0].meals[0];

    const mockClose = jest.fn();
    render(
      <RecipeDetailModal
        visible
        recipe={targetMeal.recipe}
        servings={2}
        targetDay={plan.days[0].dayOfWeek}
        targetSlot={targetMeal.slot}
        onClose={mockClose}
        onSwap={jest.fn()}
        isDark={false}
      />
    );

    fireEvent.press(screen.getByLabelText('Nu mai propune rețeta'));

    // Sugestia automată este afișată
    expect(screen.getByText('💡 Sugestie de înlocuire recomandată')).toBeTruthy();
    expect(screen.getByText('✓ Înlocuiește cu această rețetă')).toBeTruthy();

    // Apăsăm pe înlocuire
    fireEvent.press(screen.getByText('✓ Înlocuiește cu această rețetă'));

    // Modalul se închide și rețeta din acea zi a fost înlocuită
    expect(mockClose).toHaveBeenCalled();
    const updatedDay = useAppStore.getState().currentPlan!.days[0];
    expect(updatedDay.meals[0].recipe.id).not.toBe(targetMeal.recipe.id);
  });
});
