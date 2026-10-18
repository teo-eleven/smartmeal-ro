import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PreGenerationSummaryCard } from '../PreGenerationSummaryCard';
import { UserPreferences } from '../../types';

describe('PreGenerationSummaryCard Component', () => {
  const samplePrefs: UserPreferences = {
    supermarketId: 'lidl',
    peopleCount: 2,
    cookingDays: ['monday', 'wednesday', 'friday'],
    mealSlots: ['lunch', 'dinner'],
    budgetRon: 300,
    moodTags: ['healthy_comfort', 'high_protein'],
    healthGoalTags: ['anti_inflammatory', 'pcos_friendly'],
    dietType: 'omnivore',
    appliances: ['hob', 'oven', 'air_fryer'],
    excludePantryStaples: true,
  };

  it('renders pre-generation summary title and metrics correctly', () => {
    render(<PreGenerationSummaryCard preferences={samplePrefs} isDark={true} extrasCost={25} />);

    expect(screen.getByText('Pregătim săptămâna ta')).toBeTruthy();
    expect(screen.getByText(/3 zile • 6 mese/)).toBeTruthy();
    expect(screen.getByText(/2 persoane • 12 porții totale/)).toBeTruthy();
    expect(screen.getByText(/300 lei max/)).toBeTruthy();
    expect(screen.getByText('Omnivor')).toBeTruthy();
    expect(screen.getByText(/Antiinflamator/)).toBeTruthy();
    expect(screen.getByText(/SOP/)).toBeTruthy();
  });

  it('adapts calorie and protein targets according to preferences', () => {
    render(<PreGenerationSummaryCard preferences={samplePrefs} isDark={false} />);

    expect(screen.getByText(/kcal\/zi/)).toBeTruthy();
    expect(screen.getByText(/proteine\/zi/)).toBeTruthy();
    expect(screen.getByText(/zero risipă alimentară/)).toBeTruthy();
  });
});
