import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { EligibilityMeter } from '../EligibilityMeter';
import { UserPreferences } from '../../types';
import { checkPlanFeasibility } from '../../engine/plannerEngine';
import { useHealthSafetyStore } from '../../store/healthSafetyStore';
import * as platformHealth from '../../utils/platformHealth';

function buildPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    supermarketId: 'lidl',
    peopleCount: 2,
    cookingDays: ['monday', 'tuesday', 'wednesday'],
    budgetRon: 400,
    moodTags: ['speedy'],
    dietType: 'omnivore',
    dietTypes: ['omnivore'],
    appliances: ['hob', 'oven', 'air_fryer'],
    excludePantryStaples: true,
    pantryInventory: [],
    avoidedAllergens: [],
    mealSlots: ['dinner'],
    foodTier: 'medium',
    selectedSnackIds: [],
    selectedDrinkIds: [],
    includeAlcohol: false,
    ...overrides,
  };
}

describe('EligibilityMeter', () => {
  test('reports a healthy catalog for a normal setup', () => {
    render(<EligibilityMeter preferences={buildPreferences()} isDark={false} />);
    expect(screen.getByText(/rețete disponibile/i)).toBeTruthy();
  });

  test('warns, and says what would unblock it, when nothing is cookable', () => {
    render(<EligibilityMeter preferences={buildPreferences({ appliances: [] })} isDark={false} />);
    expect(screen.getByText(/⚠️/)).toBeTruthy();
  });

  test('flags a thin catalog rather than pretending it is fine', () => {
    render(
      <EligibilityMeter
        preferences={buildPreferences({
          dietType: 'vegan',
          dietTypes: ['vegan'],
          appliances: ['microwave'],
          avoidedAllergens: ['gluten'],
        })}
        isDark={false}
      />
    );
    expect(screen.getByText(/puține/i)).toBeTruthy();
  });
});

describe('EligibilityMeter counts what the planner will use (A.8)', () => {
  const GOALS = buildPreferences({ healthGoalTags: ['diabetic_friendly', 'pork_free'] });
  const countFor = (prefs: UserPreferences) =>
    `${checkPlanFeasibility(prefs).eligibleRecipeCount} rețete disponibile`;

  beforeEach(() => useHealthSafetyStore.setState({ answer: 'no', isLoaded: true }));
  afterEach(() => {
    jest.restoreAllMocks();
    useHealthSafetyStore.setState({ answer: null });
  });

  test('on Android, after a "no", the health goal narrows the count', () => {
    render(<EligibilityMeter preferences={GOALS} isDark={false} />);
    expect(screen.getByText(new RegExp(countFor(GOALS)))).toBeTruthy();
  });

  test('on iOS the health goal is ignored and pork-free still applies', () => {
    jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(false);
    const porkOnly = { ...GOALS, healthGoalTags: ['pork_free' as const] };
    expect(countFor(porkOnly)).not.toBe(countFor(GOALS));

    render(<EligibilityMeter preferences={GOALS} isDark={false} />);

    expect(screen.getByText(new RegExp(countFor(porkOnly)))).toBeTruthy();
  });
});
