import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { RecipeTopBar } from '../RecipeTopBar';
import { RECIPES } from '../../../data/recipes';
import { getAppTheme } from '../../../styles/theme';
import { RecipeDetailTheme } from '../types';

type Instance = ReturnType<typeof screen.getAllByRole>[number];
const RECIPE = RECIPES[0];
const APP_THEME = getAppTheme(false);
const THEME: RecipeDetailTheme = {
  ...APP_THEME,
  stepDoneBg: APP_THEME.primaryLight,
  badgeBg: APP_THEME.accentBg,
  accentCard: APP_THEME.surfaceSecondary,
};

const renderBar = () =>
  render(
    <RecipeTopBar
      theme={THEME}
      targetDay="monday"
      isEatenOut={false}
      onClose={jest.fn()}
      onSwap={jest.fn()}
      onToggleEatOut={jest.fn()}
    />
  );

describe('the recipe header', () => {
  test('holds only its three controls: no title text a screen reader would read unseen', () => {
    renderBar();

    expect(screen.queryByText(RECIPE.title)).toBeNull();
    expect(screen.queryByText(/lei\/porție/)).toBeNull();
  });

  test('reads Închide, then Înlocuiește, then În oraș', () => {
    renderBar();

    const inOrder = screen.root
      .findAll(
        (node: Instance) =>
          typeof node.props.accessibilityLabel === 'string' && Boolean(node.props.accessibilityRole)
      )
      .map((node: Instance) => node.props.accessibilityLabel as string)
      .filter((label: string, i: number, all: string[]) => all.indexOf(label) === i);

    expect(inOrder).toEqual(['Închide', 'Înlocuiește rețeta', 'Mănânc în oraș']);
  });
});
