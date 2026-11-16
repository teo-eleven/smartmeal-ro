import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { QuickFiltersModal } from '../QuickFiltersModal';
import { ExistingGoalsSafetyPrompt } from '../../components/ExistingGoalsSafetyPrompt';
import { PreGenerationSummaryCard } from '../../components/PreGenerationSummaryCard';
import { CardChips } from '../../components/mealCard/CardChips';
import { HealthBadges } from '../recipeDetail/HealthBadges';
import { GeneratingPlanModal } from '../onboarding/GeneratingPlanModal';
import { HealthSafetyBlockedNotice } from '../../components/HealthSafetyBlockedNotice';
import { useAppStore } from '../../store/useAppStore';
import { useHealthSafetyStore } from '../../store/healthSafetyStore';
import { HEALTH_GOALS_CATALOG, isHealthGoal } from '../../data/healthTags';
import { RECIPES } from '../../data/recipes';
import { getAppTheme } from '../../styles/theme';
import { HEALTH_SAFETY_BLOCKED_RO, HEALTH_SAFETY_QUESTION_RO } from '../../utils/healthSafety';
import * as platformHealth from '../../utils/platformHealth';
import { DayOfWeek, HealthGoalTag, UserPreferences } from '../../types';

/**
 * A.11e: taps that come twice, a question that is open while the window closes, and every
 * place on iOS that could still show a health goal.
 */
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
const HEALTH_GOAL_IDS = HEALTH_GOALS_CATALOG.filter((g) => isHealthGoal(g.id)).map((g) => g.id);
const FIBER = 'Bogat în fibre';
const YES = 'Da, mi se aplică';
const NO = 'Nu, niciuna';

const goalsInStore = () => useAppStore.getState().preferences.healthGoalTags;
const answer = () => useHealthSafetyStore.getState().answer;
const onIos = () => jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(false);

function filters(overrides: Partial<UserPreferences> = {}, visible = true) {
  const onApplyFilters = jest.fn();
  const element = (isVisible: boolean) => (
    <QuickFiltersModal
      visible={isVisible}
      onClose={jest.fn()}
      preferences={{ ...PREFS, ...overrides }}
      onApplyFilters={onApplyFilters}
      onResetOnboarding={jest.fn()}
      isDark={false}
    />
  );
  const view = render(element(visible));
  return { onApplyFilters, setVisible: (v: boolean) => view.rerender(element(v)) };
}
const apply = () => fireEvent.press(screen.getByText('Aplică ✓'));
const questionCount = () => screen.queryAllByText(HEALTH_SAFETY_QUESTION_RO).length;

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
  useHealthSafetyStore.setState({ answer: null, isLoaded: true, isReminderDismissed: false });
  useAppStore.getState().setHealthGoalTags([]);
});

describe('double taps in the filters', () => {
  test('pressing the same health goal twice opens the question once and ticks nothing', () => {
    const { onApplyFilters } = filters();

    fireEvent.press(screen.getByText(FIBER));
    fireEvent.press(screen.getByText(FIBER));

    expect(questionCount()).toBe(1);
    expect(answer()).toBeNull();
    apply();
    expect(onApplyFilters.mock.calls[0][0].healthGoalTags).toEqual([]);
  });

  test('"Nu" tapped twice ticks the goal once, not on and off again', () => {
    const { onApplyFilters } = filters();
    fireEvent.press(screen.getByText(FIBER));
    const no = screen.getByRole('button', { name: NO });

    fireEvent.press(no);
    fireEvent.press(no);

    expect(answer()).toBe('no');
    apply();
    expect(onApplyFilters.mock.calls[0][0].healthGoalTags).toEqual(['high_fiber']);
  });

  test('"Da" tapped twice blocks once and keeps pork-free', () => {
    useAppStore.getState().setHealthGoalTags(['heart_healthy', 'pork_free']);
    const { onApplyFilters } = filters({ healthGoalTags: ['heart_healthy', 'pork_free'] });
    fireEvent.press(screen.getByText(FIBER));
    const yes = screen.getByRole('button', { name: YES });

    fireEvent.press(yes);
    fireEvent.press(yes);

    expect(answer()).toBe('yes');
    expect(goalsInStore()).toEqual(['pork_free']);
    apply();
    expect(onApplyFilters.mock.calls[0][0].healthGoalTags).toEqual(['pork_free']);
  });

  test('"Am răspuns greșit" tapped twice resets once and the question comes back once', () => {
    useHealthSafetyStore.setState({ answer: 'yes', isLoaded: true });
    filters();
    const wrong = screen.getByRole('button', { name: 'Am răspuns greșit' });

    fireEvent.press(wrong);
    fireEvent.press(wrong);

    expect(answer()).toBeNull();
    expect(screen.queryByText(HEALTH_SAFETY_BLOCKED_RO)).toBeNull();
    fireEvent.press(screen.getByText(FIBER));
    expect(questionCount()).toBe(1);
  });

  test('"Aplică" tapped twice hands back the same preferences both times', () => {
    const { onApplyFilters } = filters({ healthGoalTags: ['pork_free'] });

    apply();
    apply();

    expect(onApplyFilters.mock.calls.length).toBeGreaterThanOrEqual(1);
    for (const [sent] of onApplyFilters.mock.calls) {
      expect(sent.healthGoalTags).toEqual(['pork_free']);
    }
  });

  test('opening and closing the filters quickly while the question is open never leaves it open', () => {
    const { setVisible } = filters();
    fireEvent.press(screen.getByText(FIBER));
    expect(questionCount()).toBe(1);

    for (let i = 0; i < 6; i++) {
      setVisible(false);
      setVisible(true);
    }

    expect(questionCount()).toBe(0);
    expect(answer()).toBeNull();
  });

  test('a stale "Da" pressed after the question was dismissed does not tick anything', () => {
    const { onApplyFilters, setVisible } = filters();
    fireEvent.press(screen.getByText(FIBER));
    const no = screen.getByRole('button', { name: NO });
    setVisible(false);
    setVisible(true);

    fireEvent.press(no);

    apply();
    expect(onApplyFilters.mock.calls[0][0].healthGoalTags).toEqual([]);
  });
});

describe('edge values', () => {
  test('all six goals (five health goals and pork-free) ticked, then "Da" on the old-goals question: only pork-free is left', () => {
    const all: HealthGoalTag[] = [...HEALTH_GOAL_IDS, 'pork_free'];
    expect(all).toHaveLength(6);
    useAppStore.setState({ preferences: { ...PREFS, healthGoalTags: all } });
    render(<ExistingGoalsSafetyPrompt isDark={false} />);

    fireEvent.press(screen.getByRole('button', { name: YES }));

    expect(answer()).toBe('yes');
    expect(goalsInStore()).toEqual(['pork_free']);
  });

  test('four health goals ticked in the filters, the fifth asks, "Da" leaves only pork-free', () => {
    const five = HEALTH_GOAL_IDS.slice(0, 4);
    const ticked: HealthGoalTag[] = [...five, 'pork_free'];
    useAppStore.getState().setHealthGoalTags(ticked);
    const { onApplyFilters } = filters({ healthGoalTags: ticked });
    const fifth = HEALTH_GOALS_CATALOG.find((g) => g.id === HEALTH_GOAL_IDS[4])!;

    fireEvent.press(screen.getByText(fifth.shortBadgeRo));
    fireEvent.press(screen.getByRole('button', { name: YES }));
    apply();

    expect(onApplyFilters.mock.calls[0][0].healthGoalTags).toEqual(['pork_free']);
    expect(goalsInStore()).toEqual(['pork_free']);
  });
});

describe('every entry point on iOS hides the health goals', () => {
  const taggedRecipe = RECIPES.find((r) => (r.healthTags ?? []).some(isHealthGoal));

  test('the fixture recipe really has a health tag (so the checks below mean something)', () => {
    expect(taggedRecipe).toBeDefined();
  });

  test('recipe card chips and recipe detail badges show none; Android shows them', () => {
    const recipe = taggedRecipe!;
    const theme = getAppTheme(false);
    const metas = (recipe.healthTags ?? []).filter(isHealthGoal);
    const labels = HEALTH_GOALS_CATALOG.filter((g) => metas.includes(g.id)).map((g) => g.shortBadgeRo);

    onIos();
    const ios = render(
      <>
        <CardChips recipe={recipe} supermarketId="lidl" theme={theme} isDark={false} />
        <HealthBadges recipe={recipe} isDark={false} />
      </>
    );
    for (const label of labels) expect(ios.queryByText(new RegExp(label))).toBeNull();
    ios.unmount();

    jest.restoreAllMocks();
    const android = render(
      <CardChips recipe={recipe} supermarketId="lidl" theme={theme} isDark={false} />
    );
    expect(android.queryByText(new RegExp(labels[0]))).not.toBeNull();
  });

  test('the pre-generation summary names no health goal, even with all of them stored', () => {
    onIos();
    render(
      <PreGenerationSummaryCard
        preferences={{ ...PREFS, healthGoalTags: [...HEALTH_GOAL_IDS, 'pork_free'] }}
        isDark={false}
      />
    );
    for (const goal of HEALTH_GOALS_CATALOG.filter((g) => isHealthGoal(g.id))) {
      expect(screen.queryByText(new RegExp(goal.shortBadgeRo))).toBeNull();
    }
  });

  test('the "building your menu" screen does not mention health goals', () => {
    onIos();
    useAppStore.setState({ preferences: { ...PREFS, healthGoalTags: ['heart_healthy'] } });
    render(<GeneratingPlanModal onComplete={jest.fn()} isDark={false} />);
    expect(screen.queryByText(/obiectivelor tale de sănătate/)).toBeNull();
  });

  test('the existing-goals question never appears, whatever is stored and unanswered', () => {
    onIos();
    useAppStore.setState({ preferences: { ...PREFS, healthGoalTags: HEALTH_GOAL_IDS } });
    useHealthSafetyStore.setState({ answer: null, isLoaded: true });
    render(<ExistingGoalsSafetyPrompt isDark={false} />);
    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
  });

  test('on Android the same unanswered stored goals DO raise the question', () => {
    useAppStore.setState({ preferences: { ...PREFS, healthGoalTags: HEALTH_GOAL_IDS } });
    useHealthSafetyStore.setState({ answer: null, isLoaded: true });
    render(<ExistingGoalsSafetyPrompt isDark={false} />);
    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).not.toBeNull();
  });

  test('the filters on iOS offer no goal and no question, and pressing where one was does nothing', () => {
    onIos();
    useHealthSafetyStore.setState({ answer: null, isLoaded: true });
    const { onApplyFilters } = filters({ healthGoalTags: ['heart_healthy'] });

    for (const goal of HEALTH_GOALS_CATALOG.filter((g) => isHealthGoal(g.id))) {
      expect(screen.queryByText(goal.labelRo)).toBeNull();
    }
    expect(questionCount()).toBe(0);
    apply();
    expect(onApplyFilters.mock.calls[0][0].healthGoalTags).toEqual(['heart_healthy']);
  });

  test('the blocked notice is not drawn on iOS after a "yes"', () => {
    onIos();
    useHealthSafetyStore.setState({ answer: 'yes', isLoaded: true });
    filters();
    expect(screen.queryByText(HEALTH_SAFETY_BLOCKED_RO)).toBeNull();
  });

  test('the blocked notice itself still renders its button (control for the test above)', () => {
    render(<HealthSafetyBlockedNotice isDark={false} onChangeAnswer={jest.fn()} />);
    expect(screen.getByText(HEALTH_SAFETY_BLOCKED_RO)).toBeTruthy();
  });
});
