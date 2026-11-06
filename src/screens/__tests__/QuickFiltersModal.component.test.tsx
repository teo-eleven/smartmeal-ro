import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { QuickFiltersModal } from '../QuickFiltersModal';
import { DayOfWeek, UserPreferences } from '../../types';
import { HEALTH_DISCLAIMER_LONG_RO, HEALTH_DISCLAIMER_SHORT_RO } from '../../data/healthDisclaimer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../../store/useAppStore';
import { useHealthSafetyStore } from '../../store/healthSafetyStore';
import { HEALTH_SAFETY_BLOCKED_RO, HEALTH_SAFETY_QUESTION_RO } from '../../utils/healthSafety';

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

function setup(overrides: Partial<UserPreferences> = {}) {
  const onApplyFilters = jest.fn();
  const onClose = jest.fn();
  const onResetOnboarding = jest.fn();
  render(
    <QuickFiltersModal
      visible
      onClose={onClose}
      preferences={{ ...PREFS, ...overrides }}
      onApplyFilters={onApplyFilters}
      onResetOnboarding={onResetOnboarding}
      isDark={false}
    />
  );
  return { onApplyFilters, onClose, onResetOnboarding };
}

const apply = () => fireEvent.press(screen.getByText('Aplică ✓'));

/**
 * The one screen where a live plan's preferences are edited. It holds its choices locally
 * and hands them over in a single batch, so nothing is rebuilt until the user says so.
 */
describe('QuickFiltersModal', () => {
  test('nu schimbă nimic până nu apeși Aplică', () => {
    const { onApplyFilters } = setup();

    fireEvent.press(screen.getByText('Proteic'));

    expect(onApplyFilters).not.toHaveBeenCalled();
  });

  test('trimite toate preferințele deodată și închide', () => {
    const { onApplyFilters, onClose } = setup();

    apply();

    expect(onApplyFilters).toHaveBeenCalledWith(
      expect.objectContaining({
        cookingDays: WEEK,
        peopleCount: 2,
        budgetRon: 400,
        appliances: ['hob', 'oven'],
      })
    );
    expect(onClose).toHaveBeenCalled();
  });

  test('adaugă o preferință de gust aleasă', () => {
    const { onApplyFilters } = setup();

    fireEvent.press(screen.getByText('Proteic'));
    apply();

    expect(onApplyFilters.mock.calls[0][0].moodTags).toContain('high_protein');
  });

  test('adaugă un aparat bifat', () => {
    const { onApplyFilters } = setup();

    fireEvent.press(screen.getByText('Air Fryer'));
    apply();

    expect(onApplyFilters.mock.calls[0][0].appliances).toContain('air_fryer');
  });

  test('nu te lasă fără niciun aparat', () => {
    const { onApplyFilters } = setup({ appliances: ['hob'] });

    fireEvent.press(screen.getByText('Aragaz / Plită'));
    apply();

    expect(onApplyFilters.mock.calls[0][0].appliances).toEqual(['hob']);
  });

  test('un buget scris de mână sub minim este ridicat la minim', () => {
    const { onApplyFilters } = setup();

    fireEvent.changeText(screen.getByDisplayValue('400'), '10');
    apply();

    expect(onApplyFilters.mock.calls[0][0].budgetRon).toBe(50);
  });

  test('un buget gol păstrează valoarea dinainte', () => {
    const { onApplyFilters } = setup();

    fireEvent.changeText(screen.getByDisplayValue('400'), '');
    apply();

    expect(onApplyFilters.mock.calls[0][0].budgetRon).toBe(400);
  });

  test('reluarea configuratorului este predată aplicației', () => {
    const { onResetOnboarding } = setup();

    fireEvent.press(screen.getByText(/Reia Configuratorul/i));

    expect(onResetOnboarding).toHaveBeenCalled();
  });

  test('închiderea nu aplică nimic', () => {
    const { onApplyFilters, onClose } = setup();

    fireEvent.press(screen.getByLabelText('Închide'));

    expect(onClose).toHaveBeenCalled();
    expect(onApplyFilters).not.toHaveBeenCalled();
  });
});

describe('QuickFiltersModal, zilele și persoanele', () => {
  test('adaugă o zi de gătit', () => {
    const { onApplyFilters } = setup();

    fireEvent.press(screen.getByText('Sâm'));
    apply();

    expect(onApplyFilters.mock.calls[0][0].cookingDays).toContain('saturday');
  });

  test('scoate o zi de gătit', () => {
    const { onApplyFilters } = setup();

    fireEvent.press(screen.getByText('Lun'));
    apply();

    expect(onApplyFilters.mock.calls[0][0].cookingDays).not.toContain('monday');
  });

  /** A week with no cooking days has no plan to build; the last day stays put. */
  test('nu te lasă fără nicio zi de gătit', () => {
    const { onApplyFilters } = setup({ cookingDays: ['monday'] });

    fireEvent.press(screen.getByText('Lun'));
    apply();

    expect(onApplyFilters.mock.calls[0][0].cookingDays).toEqual(['monday']);
  });

  test('scoate o preferință de gust deja aleasă', () => {
    const { onApplyFilters } = setup({ moodTags: ['high_protein', 'speedy'] });

    fireEvent.press(screen.getByText('Proteic'));
    apply();

    expect(onApplyFilters.mock.calls[0][0].moodTags).not.toContain('high_protein');
  });

  test('„+" adaugă o persoană', () => {
    const { onApplyFilters } = setup({ peopleCount: 2 });

    fireEvent.press(screen.getByText('+'));
    apply();

    expect(onApplyFilters.mock.calls[0][0].peopleCount).toBe(3);
  });

  test('numărul de persoane nu coboară sub 1', () => {
    const { onApplyFilters } = setup({ peopleCount: 1 });

    fireEvent.press(screen.getByText('−'));
    apply();

    expect(onApplyFilters.mock.calls[0][0].peopleCount).toBe(1);
  });

  test('numărul de persoane nu urcă peste 8', () => {
    const { onApplyFilters } = setup({ peopleCount: 8 });

    fireEvent.press(screen.getByText('+'));
    apply();

    expect(onApplyFilters.mock.calls[0][0].peopleCount).toBe(8);
  });
});

test('the health goals section carries the short "not medical advice" disclaimer (A.5)', () => {
  setup();

  expect(screen.getByText(HEALTH_DISCLAIMER_SHORT_RO)).toBeTruthy();
});

test('the filters open the long disclaimer from "Despre obiectivele de sănătate" (A.6)', () => {
  setup();

  fireEvent.press(screen.getByRole('button', { name: 'Despre obiectivele de sănătate' }));

  expect(screen.getByText(HEALTH_DISCLAIMER_LONG_RO)).toBeTruthy();
});

describe('the safety question in the filters (A.7c)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useHealthSafetyStore.setState({ answer: null, isLoaded: true });
    useAppStore.getState().setHealthGoalTags([]);
  });

  test('the first health goal asks; "Nu" ticks it and it is applied', () => {
    const { onApplyFilters } = setup();

    fireEvent.press(screen.getByText('Bogat în fibre'));
    expect(screen.getByText(HEALTH_SAFETY_QUESTION_RO)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Nu, niciuna' }));
    apply();

    expect(onApplyFilters.mock.calls[0][0].healthGoalTags).toEqual(['high_fiber']);
  });

  test('"Da" drops the health goals from the filters and from the saved preferences', () => {
    useAppStore.getState().setHealthGoalTags(['heart_healthy', 'pork_free']);
    const { onApplyFilters } = setup({ healthGoalTags: ['heart_healthy', 'pork_free'] });

    fireEvent.press(screen.getByText('Bogat în fibre'));
    fireEvent.press(screen.getByRole('button', { name: 'Da, mi se aplică' }));

    // Closing without "Aplică" must not leave the old goals active.
    expect(useAppStore.getState().preferences.healthGoalTags).toEqual(['pork_free']);
    expect(screen.getByText(HEALTH_SAFETY_BLOCKED_RO)).toBeTruthy();
    apply();
    expect(onApplyFilters.mock.calls[0][0].healthGoalTags).toEqual(['pork_free']);
  });

  test('after "Da" the health chips cannot be ticked; the answer can be taken back', () => {
    useHealthSafetyStore.setState({ answer: 'yes', isLoaded: true });
    setup();

    expect(screen.getByRole('checkbox', { name: /Bogat în fibre/, disabled: true })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Am răspuns greșit' }));

    expect(useHealthSafetyStore.getState().answer).toBeNull();
    expect(screen.getByRole('checkbox', { name: /Bogat în fibre/, disabled: false })).toBeTruthy();
  });
});
