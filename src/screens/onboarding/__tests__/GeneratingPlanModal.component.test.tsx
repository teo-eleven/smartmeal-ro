import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { GeneratingPlanModal } from '../GeneratingPlanModal';
import { useAppStore } from '../../../store/useAppStore';
import * as platformHealth from '../../../utils/platformHealth';

const HEALTH_STEP = /obiectivelor tale de sănătate/;

describe('the "building your menu" screen (A.8)', () => {
  beforeEach(() =>
    useAppStore.setState((s) => ({
      preferences: { ...s.preferences, healthGoalTags: ['high_fiber'] },
    }))
  );
  afterEach(() => jest.restoreAllMocks());

  test('on Android it mentions the health goals the user chose', () => {
    render(<GeneratingPlanModal onComplete={jest.fn()} isDark={false} />);
    expect(screen.getByText(HEALTH_STEP)).toBeTruthy();
  });

  test('on iOS it never mentions health goals, even when some are stored', () => {
    jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(false);

    render(<GeneratingPlanModal onComplete={jest.fn()} isDark={false} />);

    expect(screen.queryByText(HEALTH_STEP)).toBeNull();
    expect(screen.getByText(/Aliniem mesele/)).toBeTruthy();
  });
});
