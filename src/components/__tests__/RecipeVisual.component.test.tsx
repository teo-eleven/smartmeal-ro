import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { RecipeVisual } from '../RecipeVisual';
import { RECIPES, RECIPES_MAP } from '../../data/recipes';
import { LOCAL_RECIPE_IMAGES } from '../../../assets/recipes';
import { getRecipeHighlights } from '../../utils/recipeVisual';

const withPhoto = RECIPES.find((r) => LOCAL_RECIPE_IMAGES[r.id])!;
const withoutPhoto = RECIPES.find((r) => !LOCAL_RECIPE_IMAGES[r.id])!;

describe('RecipeVisual', () => {
  test('uses the real photograph when one of this dish exists', () => {
    const view = render(<RecipeVisual recipe={withPhoto} isDark={false} />);
    expect(view.toJSON()).toBeTruthy();
    expect(screen.queryByLabelText(/Ingrediente principale/i)).toBeNull();
  });

  test('builds a card from the ingredients when no photograph exists', () => {
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
    const remote = RECIPES.filter((r) => r.imageUrl && !LOCAL_RECIPE_IMAGES[r.id]);
    expect(remote.map((r) => r.id)).toEqual([]);
  });
});
