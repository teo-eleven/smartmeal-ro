import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MealSwapModal } from '../MealSwapModal';
import { useAppStore } from '../../store/useAppStore';
import { useHealthSafetyStore } from '../../store/healthSafetyStore';
import { effectivePreferences } from '../../utils/healthSafety';
import { rankSwapCandidates } from '../../utils/swapCandidates';
import { aiProxyService } from '../../services/aiProxy';
import { DayOfWeek, UserPreferences } from '../../types';

jest.mock('../../services/aiProxy', () => ({
  aiProxyService: {
    isAiAvailable: jest.fn(() => true),
    suggestSmartSwap: jest.fn(),
  },
}));

const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const PREFS: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: WEEK,
  budgetRon: 900,
  moodTags: ['family_fav'],
  dietType: 'omnivore',
  dietTypes: ['omnivore'],
  appliances: ['hob', 'oven', 'air_fryer'],
  excludePantryStaples: true,
  pantryInventory: [],
  avoidedAllergens: [],
  mealSlots: ['breakfast', 'lunch', 'dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

function planFixture() {
  useAppStore.setState({ preferences: PREFS, currentPlan: null, groceryItems: [], savedPlans: [] });
  useAppStore.getState().generatePlan();
  return useAppStore.getState().currentPlan!;
}

/**
 * The modal never unmounts -- the board only toggles `visible` -- so anything it holds in
 * state outlives the day it was asked about unless it is cleared deliberately.
 */
describe('MealSwapModal uită sugestia AI când schimbi ziua', () => {
  test('sugestia pentru o zi nu mai apare când modalul se redeschide pentru alta', async () => {
    const plan = planFixture();
    const suggestion = plan.days[2].meals[0].recipe;
    (aiProxyService.suggestSmartSwap as jest.Mock).mockResolvedValue({
      recipe: suggestion,
      reason: 'motivul sugestiei',
      isAiGenerated: true,
    });

    const props = {
      currentPlan: plan,
      preferences: PREFS,
      onClose: jest.fn(),
      onSelectReplacement: jest.fn(),
      isDark: false,
    };

    const { rerender } = render(
      <MealSwapModal visible dayOfWeek="monday" slot="dinner" {...props} />
    );

    fireEvent.press(screen.getByText(/Întreabă AI/i));
    await waitFor(() => expect(screen.getByText('motivul sugestiei')).toBeTruthy());

    // The board closes the modal and reopens it for another day.
    rerender(<MealSwapModal visible={false} dayOfWeek={null} slot={null} {...props} />);
    rerender(<MealSwapModal visible dayOfWeek="tuesday" slot="dinner" {...props} />);

    expect(screen.queryByText('motivul sugestiei')).toBeNull();
  });
});

describe('un răspuns AI întârziat nu ajunge pe altă zi', () => {
  test('sugestia cerută pentru luni, sosită după ce modalul e pe marți, e ignorată', async () => {
    const plan = planFixture();
    let resolveLate: (value: unknown) => void = () => undefined;
    (aiProxyService.suggestSmartSwap as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveLate = resolve;
      })
    );
    const props = {
      currentPlan: plan,
      preferences: PREFS,
      onClose: jest.fn(),
      onSelectReplacement: jest.fn(),
      isDark: true,
      visible: true,
    };
    const { rerender } = render(<MealSwapModal {...props} dayOfWeek="monday" slot="dinner" />);
    fireEvent.press(screen.getByText(/Întreabă AI/));

    rerender(<MealSwapModal {...props} dayOfWeek="tuesday" slot="dinner" />);
    resolveLate({ recipe: plan.days[3].meals[0].recipe, reason: 'pentru luni', isAiGenerated: true });
    await waitFor(() => expect(aiProxyService.suggestSmartSwap).toHaveBeenCalled());

    expect(screen.queryByText('pentru luni')).toBeNull();
  });

  test('o eroare de rețea la AI se explică, nu lasă o eroare neprinsă', async () => {
    const plan = planFixture();
    (aiProxyService.suggestSmartSwap as jest.Mock).mockRejectedValue(new Error('offline'));
    useAppStore.setState({ activeNotice: null, noticeQueue: [] });
    render(
      <MealSwapModal
        currentPlan={plan}
        preferences={PREFS}
        onClose={jest.fn()}
        onSelectReplacement={jest.fn()}
        isDark
        visible
        dayOfWeek="monday"
        slot="dinner"
      />
    );

    fireEvent.press(screen.getByText(/Întreabă AI/));

    await waitFor(() => expect(useAppStore.getState().activeNotice?.type).toBe('warning'));
  });
});

describe('MealSwapModal follows the health safety answer (A.7f-3)', () => {
  test('the list is rebuilt when the answer changes while the modal is open', () => {
    const goals = ['heart_healthy', 'diabetic_friendly', 'high_fiber'] as const;
    const prefsWithGoals = { ...PREFS, healthGoalTags: [...goals] };
    useHealthSafetyStore.setState({ answer: 'no', isLoaded: true });
    const plan = planFixture();
    const titlesFor = (answer: 'yes' | 'no') =>
      rankSwapCandidates(plan, effectivePreferences(prefsWithGoals, answer), 'monday', 'dinner')
        .candidates.map((c) => c.recipe.title);
    // A goal narrows the list, so a "yes" (goals blocked) brings back dishes the goals hid.
    const hiddenByGoals = titlesFor('yes').find((title) => !titlesFor('no').includes(title));
    expect(hiddenByGoals).toBeDefined();

    render(
      <MealSwapModal
        visible
        dayOfWeek="monday"
        slot="dinner"
        currentPlan={plan}
        preferences={prefsWithGoals}
        onClose={jest.fn()}
        onSelectReplacement={jest.fn()}
        isDark={false}
      />
    );
    expect(screen.queryByText(hiddenByGoals as string)).toBeNull();

    act(() => useHealthSafetyStore.setState({ answer: 'yes' }));

    expect(screen.getAllByText(hiddenByGoals as string).length).toBeGreaterThan(0);
    act(() => useHealthSafetyStore.setState({ answer: null }));
  });
});
