import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { MealSwapModal } from '../MealSwapModal';
import { useAppStore } from '../../store/useAppStore';
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
