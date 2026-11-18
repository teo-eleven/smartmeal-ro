import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { RecipeDetailModal } from '../RecipeDetailModal';
import { estimateRecipeCost } from '../recipeDetail/recipeContent';
import { useAppStore } from '../../store/useAppStore';
import { RECIPES } from '../../data/recipes';

const recipe = RECIPES[0];

describe('the recipe sheet shows what one serving costs (A.11f-7)', () => {
  beforeEach(() => {
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
  });

  test('a chip next to the time and calories reads the estimated cost per serving', () => {
    const { supermarketId } = useAppStore.getState().preferences;
    const { formattedCostPerServing } = estimateRecipeCost(recipe, supermarketId, 2);

    expect(formattedCostPerServing).toMatch(/^\d+,\d{2}$/);
    expect(screen.getByText(`💰 ~${formattedCostPerServing} lei/porție`)).toBeTruthy();
  });

  test('its accessible name says it in Romanian words', () => {
    expect(
      screen.getByLabelText(/^Cost estimat: aproximativ \d+,\d{2} lei pe porție$/)
    ).toBeTruthy();
  });

  test('the total time is still shown once, as prep plus cook', () => {
    const total = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

    expect(screen.getAllByText(`⏱️ ${total} min`)).toHaveLength(1);
  });
});
