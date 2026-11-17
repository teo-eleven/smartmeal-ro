import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { CardHero } from '../CardHero';
import { RECIPES } from '../../../data/recipes';
import { getAppTheme } from '../../../styles/theme';
import { getRecipeHighlights } from '../../../utils/recipeVisual';
import { MealPlanDay } from '../../../types';

const RECIPE = RECIPES[0];
const DAY = { dayOfWeek: 'monday', meals: [] } as unknown as MealPlanDay;

const renderHero = () =>
  render(
    <CardHero
      day={DAY}
      recipe={RECIPE}
      isDessert={false}
      costRon={20}
      servings={2}
      portionCost={10}
      theme={getAppTheme(false)}
      isDark={false}
      onPressRecipe={jest.fn()}
      onPressIn={jest.fn()}
      onPressOut={jest.fn()}
    />
  );

describe('the picture button of a meal card (WCAG 2.5.3 Label in Name)', () => {
  test('its name is the title, then the ingredients separated by commas, then the action', () => {
    renderHero();

    const expected = `${RECIPE.title}. ${getRecipeHighlights(RECIPE, 3).join(', ')}. Vezi rețeta.`;
    expect(screen.getByRole('button', { name: expected })).toBeTruthy();
  });
});

describe('the portion price on a meal card (A.11f-11)', () => {
  test('is written with a comma, two decimals', () => {
    render(
      <CardHero
        day={DAY}
        recipe={RECIPE}
        isDessert={false}
        costRon={20}
        servings={2}
        portionCost={7.9}
        theme={getAppTheme(false)}
        isDark={false}
        onPressRecipe={jest.fn()}
        onPressIn={jest.fn()}
        onPressOut={jest.fn()}
      />
    );

    expect(screen.getByText(/~7,90\/p/)).toBeTruthy();
  });
});
