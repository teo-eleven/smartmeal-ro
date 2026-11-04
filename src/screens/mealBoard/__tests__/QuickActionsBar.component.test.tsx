import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { QuickActionsBar } from '../QuickActionsBar';
import { getAppTheme } from '../../../styles/theme';
import { DEFAULT_PREFERENCES } from '../../../store/defaults';
import { AppState } from '../../../store/useAppStore';

function renderBar(overrides: { pantry?: string[]; savedPlanCount?: number } = {}) {
  const props = {
    theme: getAppTheme(true),
    contentMaxWidth: 600,
    preferences: { ...DEFAULT_PREFERENCES, pantryInventory: overrides.pantry ?? [] },
    savedPlanCount: overrides.savedPlanCount ?? 0,
    triggerReload: jest.fn<
      ReturnType<AppState['triggerReload']>,
      Parameters<AppState['triggerReload']>
    >(async (_copy, task) => {
      await task?.();
    }),
    reshufflePlan: jest.fn(),
    onOpenSavedPlans: jest.fn(),
    onOpenStoreComparison: jest.fn(),
    onOpenPantry: jest.fn(),
    onOpenMealPrep: jest.fn(),
    onOpenMacros: jest.fn(),
  };
  render(<QuickActionsBar {...props} />);
  return props;
}

describe('the tools above the meal board', () => {
  test('an empty pantry and no saved plans invite the user to start', () => {
    renderBar();
    expect(screen.getByText('Bifează stocul de acasă')).toBeTruthy();
    expect(screen.getByText('Salvează săptămâna curentă')).toBeTruthy();
  });

  test('a stocked pantry and saved plans show their counts, the pantry highlighted', () => {
    const theme = getAppTheme(true);
    renderBar({ pantry: ['ou', 'lapte'], savedPlanCount: 3 });

    expect(screen.getByText('2 deduse din coș ✓')).toBeTruthy();
    expect(screen.getByText('3 salvate')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Ce am în Cămară/ })).toHaveStyle({
      backgroundColor: theme.surfaceTertiary,
    });
  });

  test('each tool opens its own screen, and regenerating reshuffles the plan', () => {
    const props = renderBar();
    const press = (name: RegExp) => fireEvent.press(screen.getByRole('button', { name }));

    press(/Regenerează Meniul/);
    press(/Planurile Mele/);
    press(/Compară Magazine/);
    press(/Ce am în Cămară/);
    press(/Ghid Meal Prep/);
    press(/Macro Săptămână/);

    expect(props.reshufflePlan).toHaveBeenCalledTimes(1);
    expect(props.onOpenSavedPlans).toHaveBeenCalledTimes(1);
    expect(props.onOpenStoreComparison).toHaveBeenCalledTimes(1);
    expect(props.onOpenPantry).toHaveBeenCalledTimes(1);
    expect(props.onOpenMealPrep).toHaveBeenCalledTimes(1);
    expect(props.onOpenMacros).toHaveBeenCalledTimes(1);
  });
});
