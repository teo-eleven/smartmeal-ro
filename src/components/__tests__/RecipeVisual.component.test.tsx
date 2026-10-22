import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RECIPE_PHOTO_MANIFEST } from '../../data/recipePhotoManifest';
import { RecipeVisual } from '../RecipeVisual';
import { RECIPES, RECIPES_MAP } from '../../data/recipes';
import {
  getArchetypePalette,
  getRecipeArchetype,
  getRecipeHighlights,
} from '../../utils/recipeVisual';

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

  /**
   * Every screen that shows this picture lays its own badges over it, time included, in the
   * same bottom corners. Drawing corners here as well put "20 min" on the card twice and a
   * second label under the first; on the 74 px week cards they ran into the title.
   */
  test('leaves the corner badges to the card that holds it', () => {
    const recipe = RECIPES_MAP[withoutPhoto.id];
    render(<RecipeVisual recipe={recipe} isDark />);
    expect(screen.queryByText(/⏱ \d+ min/)).toBeNull();
    expect(screen.queryByText(getArchetypePalette(getRecipeArchetype(recipe)).labelRo)).toBeNull();
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

describe('fotografia și rezerva ei', () => {
  const photographedId = Object.keys(RECIPE_PHOTO_MANIFEST)[0];
  const photographed = RECIPES_MAP[photographedId];
  const unphotographed = RECIPES.find((r) => !RECIPE_PHOTO_MANIFEST[r.id] && !r.imageUrl)!;

  test('o rețetă cu poză verificată o afișează, din cache pe disc', () => {
    render(<RecipeVisual recipe={photographed} isDark />);
    const photo = screen.getByTestId('recipe-photo');

    expect(photo.props.source).toEqual({ uri: RECIPE_PHOTO_MANIFEST[photographedId].url });
    expect(photo.props.cachePolicy).toBe('memory-disk');
  });

  test('dacă poza nu se încarcă (offline, 404), cardul trece pe fundalul local, nu rămâne gol', () => {
    render(<RecipeVisual recipe={photographed} isDark />);

    fireEvent(screen.getByTestId('recipe-photo'), 'error');

    expect(screen.queryByTestId('recipe-photo')).toBeNull();
    expect(screen.getByText(photographed.title)).toBeTruthy();
  });

  test('o rețetă fără poză verificată primește cardul generat, nu o poză ghicită', () => {
    render(<RecipeVisual recipe={unphotographed} isDark />);

    expect(screen.queryByTestId('recipe-photo')).toBeNull();
    expect(screen.getByText(unphotographed.title)).toBeTruthy();
  });
});

test('cardul e anunțat ca imagine de cititorul de ecran, cu descrierea felului de mâncare', () => {
  render(<RecipeVisual recipe={RECIPES[0]} isDark />);
  const card = screen.getByLabelText(/Ingrediente principale/i);

  expect(card.props.accessible).toBe(true);
  expect(card.props.accessibilityRole).toBe('image');
});
