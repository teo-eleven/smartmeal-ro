import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RecipeVisual } from '../RecipeVisual';
import { RECIPES } from '../../data/recipes';
import { RECIPE_PHOTO_MANIFEST } from '../../data/recipePhotoManifest';
import { getArchetypePalette, getRecipeArchetype } from '../../utils/recipeVisual';
import { Recipe } from '../../types';

/**
 * When the photo fails to load the card is drawn from the dish's colours, and the title must
 * stay readable on every one of them (A.11f-13): white on the colour under the scrim and the
 * title's own dark plate, at the middle of the card where the title sits.
 */
type Rgb = [number, number, number];
const MIN_CONTRAST = 4.5;
const WHITE: Rgb = [255, 255, 255];

function parseColour(css: string): { rgb: Rgb; alpha: number } {
  const hex = /^#([0-9a-f]{6})$/i.exec(css.trim());
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: 1 };
  }
  const rgba = /^rgba?\(([^)]+)\)$/.exec(css.trim());
  if (!rgba) throw new Error(`unreadable colour ${css}`);
  const [r, g, b, a] = rgba[1].split(',').map(Number);
  return { rgb: [r, g, b], alpha: a ?? 1 };
}

const over = (top: { rgb: Rgb; alpha: number }, under: Rgb): Rgb =>
  top.rgb.map((c, i) => c * top.alpha + under[i] * (1 - top.alpha)) as Rgb;

const mean = (a: Rgb, b: Rgb): Rgb => a.map((c, i) => (c + b[i]) / 2) as Rgb;

function luminance([r, g, b]: Rgb): number {
  const lin = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The first recipe of each dish archetype that ships. */
const ONE_PER_ARCHETYPE: Recipe[] = Array.from(
  new Map(RECIPES.map((recipe) => [getRecipeArchetype(recipe), recipe])).values()
);
const PHOTOGRAPHED = RECIPES.find((r) => RECIPE_PHOTO_MANIFEST[r.id]);

interface GradientNode {
  props: { colors?: string[] };
  children?: unknown;
}

function gradients(node: unknown, found: string[][] = []): string[][] {
  if (!node || typeof node !== 'object') return found;
  if (Array.isArray(node)) {
    node.forEach((child) => gradients(child, found));
    return found;
  }
  const { props, children } = node as GradientNode;
  if (props?.colors) found.push(props.colors);
  gradients(children, found);
  return found;
}

/** The colour of the nearest ancestor that paints a background, the title's dark plate. */
function plateBehind(title: ReturnType<typeof screen.getByText>): string {
  for (let node = title.parent; node; node = node.parent) {
    const colour = StyleSheet.flatten(node.props.style)?.backgroundColor;
    if (typeof colour === 'string') return colour;
  }
  throw new Error('no plate behind the title');
}

describe.each([
  ['dark', true],
  ['light', false],
])('the generated card in the %s theme', (_name, isDark) => {
  test.each(ONE_PER_ARCHETYPE.map((recipe) => [getRecipeArchetype(recipe), recipe] as const))(
    'the %s title is readable (white, contrast >= 4.5)',
    (_archetype, recipe) => {
      render(<RecipeVisual recipe={recipe} isDark={isDark} />);
      // The fallback is what is drawn once the photo fails, so make it fail where there is one.
      const photo = screen.queryByTestId('recipe-photo');
      if (photo) fireEvent(photo, 'error');

      // A backdrop photo is not measurable, so the dish's own colours stand in for it; the
      // scrim is the last gradient drawn over whichever of the two is shown.
      const palette = getArchetypePalette(getRecipeArchetype(recipe));
      const dish = isDark ? palette.darkColors : palette.lightColors;
      const scrim = gradients(screen.toJSON()).slice(-1)[0];
      const dishMiddle = mean(parseColour(dish[0]).rgb, parseColour(dish[dish.length - 1]).rgb);
      const scrimMiddle = {
        rgb: mean(parseColour(scrim[0]).rgb, parseColour(scrim[scrim.length - 1]).rgb),
        alpha: (parseColour(scrim[0]).alpha + parseColour(scrim[scrim.length - 1]).alpha) / 2,
      };
      const plate = plateBehind(screen.getByText(recipe.title.trim()));
      const background = over(parseColour(plate), over(scrimMiddle, dishMiddle));

      expect(contrast(WHITE, background)).toBeGreaterThanOrEqual(MIN_CONTRAST);
    }
  );
});

test('a photo that fails to load leaves the title on screen, on the card', () => {
  if (!PHOTOGRAPHED) return;
  render(<RecipeVisual recipe={PHOTOGRAPHED} isDark={false} />);

  fireEvent(screen.getByTestId('recipe-photo'), 'error');

  expect(screen.queryByTestId('recipe-photo')).toBeNull();
  expect(screen.getByText(PHOTOGRAPHED.title.trim())).toBeTruthy();
  // The scrim over the card is drawn, so the title keeps its dark ground.
  expect(gradients(screen.toJSON()).length).toBeGreaterThanOrEqual(1);
});
