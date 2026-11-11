import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { CardChips } from '../CardChips';
import { RECIPES } from '../../../data/recipes';
import { getAppTheme } from '../../../styles/theme';
import * as platformHealth from '../../../utils/platformHealth';

const RECIPE = { ...RECIPES[0], healthTags: ['heart_healthy' as const, 'pork_free' as const] };
const renderChips = () =>
  render(
    <CardChips recipe={RECIPE} supermarketId="lidl" theme={getAppTheme(false)} isDark={false} />
  );

describe('the health chip on a meal card (A.8)', () => {
  afterEach(() => jest.restoreAllMocks());

  test('on Android and web the first health goal shows as a chip', () => {
    renderChips();
    expect(screen.getByText(/Puțină sare/)).toBeTruthy();
  });

  test('on iOS no health chip is shown; the other chips stay', () => {
    jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(false);

    renderChips();

    expect(screen.queryByText(/Puțină sare/)).toBeNull();
    expect(screen.getByText(/min$/)).toBeTruthy();
  });
});
