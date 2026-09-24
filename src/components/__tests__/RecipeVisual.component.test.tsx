import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { RecipeVisual } from '../RecipeVisual';
import { RECIPES, RECIPES_MAP } from '../../data/recipes';
import { getRecipeHighlights } from '../../utils/recipeVisual';

/** Two recipes that used to be treated differently: one once owned a photograph. */
const oncePhotographed = RECIPES_MAP['snitele_pui_cuptor'];
const withoutPhoto = RECIPES[0];

describe('RecipeVisual', () => {
  test('trateaza la fel si o reteta care avea candva fotografie proprie', () => {
    render(<RecipeVisual recipe={oncePhotographed} isDark={false} />);
    expect(screen.getByLabelText(/Ingrediente principale/i)).toBeTruthy();
    expect(screen.getByText(oncePhotographed.title)).toBeTruthy();
  });

  test('builds a card from the ingredients for every recipe', () => {
    render(<RecipeVisual recipe={withoutPhoto} isDark={false} />);
    expect(screen.getByLabelText(/Ingrediente principale/i)).toBeTruthy();
  });

  test('the card names only ingredients the dish contains', () => {
    render(<RecipeVisual recipe={withoutPhoto} isDark={false} />);
    const line = getRecipeHighlights(withoutPhoto, 3).join(' · ').toUpperCase();
    expect(screen.getByText(line)).toBeTruthy();
  });

  test('the dish name is the subject of the card', () => {
    render(<RecipeVisual recipe={withoutPhoto} isDark={false} />);
    expect(screen.getByText(withoutPhoto.title)).toBeTruthy();
  });

  test('its accessible description matches the dish, not a stock photo', () => {
    render(<RecipeVisual recipe={withoutPhoto} isDark={false} />);
    const label = screen.getByLabelText(/Ingrediente principale/i).props.accessibilityLabel;
    expect(label).toContain('min');
    getRecipeHighlights(withoutPhoto, 3).forEach((name) => expect(label).toContain(name));
  });

  test('shows the cooking time on the card', () => {
    const recipe = RECIPES_MAP[withoutPhoto.id];
    render(<RecipeVisual recipe={recipe} isDark />);
    const total = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
    expect(screen.getByText(`⏱ ${total} min`)).toBeTruthy();
  });

  test('the compact variant keeps the name but drops the ingredient line', () => {
    render(<RecipeVisual recipe={withoutPhoto} isDark={false} compact />);
    const line = getRecipeHighlights(withoutPhoto, 3).join(' · ').toUpperCase();
    expect(screen.getByText(withoutPhoto.title)).toBeTruthy();
    expect(screen.queryByText(line)).toBeNull();
  });

  test('renders every recipe in the catalog without crashing', () => {
    RECIPES.forEach((recipe) => {
      const view = render(<RecipeVisual recipe={recipe} isDark={false} />);
      expect(view.toJSON()).toBeTruthy();
      view.unmount();
    });
  });
});

describe('no stock photography is left anywhere', () => {
  test('no recipe points at an unverified remote image', () => {
    const remote = RECIPES.filter((r) => r.imageUrl);
    expect(remote.map((r) => r.id)).toEqual([]);
  });
});
