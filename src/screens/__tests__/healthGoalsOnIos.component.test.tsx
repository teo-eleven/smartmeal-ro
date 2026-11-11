import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { OnboardingWizard } from '../onboarding/OnboardingWizard';
import { QuickFiltersModal } from '../QuickFiltersModal';
import { useAppStore } from '../../store/useAppStore';
import { useHealthSafetyStore } from '../../store/healthSafetyStore';
import { HEALTH_DISCLAIMER_SHORT_RO } from '../../data/healthDisclaimer';
import { HEALTH_GOALS_CATALOG, isHealthGoal } from '../../data/healthTags';
import { HEALTH_SAFETY_BLOCKED_RO, HEALTH_SAFETY_QUESTION_RO } from '../../utils/healthSafety';
import * as platformHealth from '../../utils/platformHealth';
import { DayOfWeek, HealthGoalTag, UserPreferences } from '../../types';

/**
 * On iOS the health goals are hidden (A.8, Apple 1.4.1): no goal, title, condition line,
 * disclaimer, "about" link, blocked notice or safety question. Pork-free stays, and the goals
 * already saved are kept in the data. Android and web are covered by the existing tests.
 */
const PORK_FREE = 'Fără carne de porc (Halal)';
const HEALTH_GOALS = HEALTH_GOALS_CATALOG.filter((goal) => isHealthGoal(goal.id));
const STORED: HealthGoalTag[] = ['diabetic_friendly', 'pork_free'];
const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const PREFS: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: WEEK,
  budgetRon: 400,
  moodTags: ['speedy'],
  dietType: 'omnivore',
  dietTypes: ['omnivore'],
  appliances: ['hob', 'oven'],
  excludePantryStaples: true,
  pantryInventory: [],
  avoidedAllergens: [],
  mealSlots: ['dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

const onIos = () => jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(false);
const storedGoals = () => useAppStore.getState().preferences.healthGoalTags;

function expectNoHealthGoalSurface() {
  for (const goal of HEALTH_GOALS) {
    expect(screen.queryByText(goal.labelRo)).toBeNull();
    expect(screen.queryByText(goal.shortBadgeRo)).toBeNull();
  }
  expect(screen.queryByText(/Relevant dacă/)).toBeNull();
  expect(screen.queryByText(/Obiective de sănătate/i)).toBeNull();
  expect(screen.queryByText(HEALTH_DISCLAIMER_SHORT_RO)).toBeNull();
  expect(screen.queryByText(/Despre obiectivele de sănătate/)).toBeNull();
  expect(screen.queryByText(HEALTH_SAFETY_BLOCKED_RO)).toBeNull();
  expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
}

beforeEach(async () => {
  useAppStore.getState().resetOnboarding();
  useAppStore.getState().dismissUndo();
  await AsyncStorage.clear();
  useHealthSafetyStore.setState({ answer: null, isLoaded: true });
});
afterEach(() => jest.restoreAllMocks());

describe('onboarding on iOS (A.8)', () => {
  const renderWizard = () =>
    render(<OnboardingWizard isDark={false} onPlanGenerated={jest.fn()} />);

  test('shows pork-free and nothing about health goals, whatever the answer', () => {
    onIos();
    useHealthSafetyStore.setState({ answer: 'yes', isLoaded: true });
    renderWizard();

    expect(screen.getByRole('checkbox', { name: /Fără carne de porc \(Halal\)/ })).toBeTruthy();
    expectNoHealthGoalSurface();
  });

  test('pork-free ticks without the safety question and keeps the hidden stored goals', () => {
    onIos();
    useAppStore.setState((s) => ({
      preferences: { ...s.preferences, healthGoalTags: ['high_fiber'] },
    }));
    renderWizard();

    fireEvent.press(screen.getByText(PORK_FREE));

    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
    expect(storedGoals()).toEqual(['high_fiber', 'pork_free']);

    fireEvent.press(screen.getByText(PORK_FREE));
    expect(storedGoals()).toEqual(['high_fiber']);
  });

  test('on Android the health goals are still offered', () => {
    renderWizard();

    expect(screen.getByText('Atent la zaharuri')).toBeTruthy();
    expect(screen.getByText(HEALTH_DISCLAIMER_SHORT_RO)).toBeTruthy();
  });
});

describe('the filters on iOS (A.8)', () => {
  function setup(overrides: Partial<UserPreferences> = {}) {
    const onApplyFilters = jest.fn();
    render(
      <QuickFiltersModal
        visible
        onClose={jest.fn()}
        preferences={{ ...PREFS, ...overrides }}
        onApplyFilters={onApplyFilters}
        onResetOnboarding={jest.fn()}
        isDark={false}
      />
    );
    return { onApplyFilters };
  }
  const apply = () => fireEvent.press(screen.getByText('Aplică ✓'));

  test('shows pork-free and nothing about health goals, even after a "yes"', () => {
    onIos();
    useHealthSafetyStore.setState({ answer: 'yes', isLoaded: true });
    setup({ healthGoalTags: STORED });

    expect(screen.getByRole('checkbox', { name: /Fără porc/ })).toBeTruthy();
    expectNoHealthGoalSurface();
  });

  test('"Aplică" hands back the stored health goals unchanged', () => {
    onIos();
    useHealthSafetyStore.setState({ answer: 'no', isLoaded: true });
    const { onApplyFilters } = setup({ healthGoalTags: STORED });

    apply();

    expect(onApplyFilters.mock.calls[0][0].healthGoalTags).toEqual(STORED);
  });

  test('only pork-free is editable; the hidden goals ride along untouched', () => {
    onIos();
    const { onApplyFilters } = setup({ healthGoalTags: STORED });

    fireEvent.press(screen.getByText('Fără porc'));
    apply();
    expect(onApplyFilters.mock.calls[0][0].healthGoalTags).toEqual(['diabetic_friendly']);
  });

  test('ticking pork-free never asks the safety question', () => {
    onIos();
    const { onApplyFilters } = setup({ healthGoalTags: ['high_fiber'] });

    fireEvent.press(screen.getByText('Fără porc'));

    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
    apply();
    expect(onApplyFilters.mock.calls[0][0].healthGoalTags).toEqual(['high_fiber', 'pork_free']);
  });

  test('the count in the section header counts only what is shown', () => {
    onIos();
    setup({ healthGoalTags: STORED });

    expect(screen.getByText('1 active')).toBeTruthy();
  });
});
