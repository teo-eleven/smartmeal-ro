import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { HealthBadges } from '../HealthBadges';
import { RECIPES } from '../../../data/recipes';
import { HEALTH_DISCLAIMER_SHORT_RO } from '../../../data/healthDisclaimer';
import { Recipe } from '../../../types';
import * as platformHealth from '../../../utils/platformHealth';

const withTags = (healthTags: Recipe['healthTags']): Recipe => ({ ...RECIPES[0], healthTags });

describe('HealthBadges (A.5)', () => {
  test('a recipe with a health badge shows the short disclaimer under it', () => {
    render(<HealthBadges recipe={withTags(['heart_healthy'])} isDark={false} />);

    expect(screen.getByText('Puțină sare')).toBeTruthy();
    expect(screen.getByText(HEALTH_DISCLAIMER_SHORT_RO)).toBeTruthy();
  });

  test('pork-free alone is not a health claim, so neither badge nor disclaimer shows', () => {
    render(<HealthBadges recipe={withTags(['pork_free'])} isDark={false} />);

    expect(screen.queryByText(HEALTH_DISCLAIMER_SHORT_RO)).toBeNull();
  });

  test('a recipe without health tags shows no disclaimer', () => {
    render(<HealthBadges recipe={withTags(undefined)} isDark />);

    expect(screen.queryByText(HEALTH_DISCLAIMER_SHORT_RO)).toBeNull();
  });
});

describe('HealthBadges on iOS (A.8)', () => {
  afterEach(() => jest.restoreAllMocks());

  test('no health badge and no disclaimer, even on a recipe with health tags', () => {
    jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(false);

    render(<HealthBadges recipe={withTags(['heart_healthy', 'pork_free'])} isDark={false} />);

    expect(screen.queryByText('Puțină sare')).toBeNull();
    expect(screen.queryByText(HEALTH_DISCLAIMER_SHORT_RO)).toBeNull();
  });
});
