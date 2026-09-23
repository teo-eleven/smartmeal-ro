import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SavedPlansModal } from '../SavedPlansModal';
import { generateMealPlan } from '../../engine/plannerEngine';
import { DayOfWeek, SavedPlan, UserPreferences } from '../../types';

function buildPreferences(): UserPreferences {
  const days: DayOfWeek[] = ['monday', 'tuesday'];
  return {
    supermarketId: 'lidl', peopleCount: 2, cookingDays: days, budgetRon: 600,
    moodTags: ['speedy'], dietType: 'omnivore', dietTypes: ['omnivore'],
    appliances: ['hob', 'oven', 'air_fryer'], excludePantryStaples: true,
    pantryInventory: [], avoidedAllergens: [], mealSlots: ['dinner'], foodTier: 'medium',
    selectedSnackIds: [], selectedDrinkIds: [], includeAlcohol: false,
  };
}

function buildSaved(name: string, id: string): SavedPlan {
  const preferences = buildPreferences();
  return { id, name, savedAt: new Date().toISOString(), plan: generateMealPlan(preferences), preferences };
}

const baseProps = {
  visible: true,
  canSaveCurrent: true,
  onSaveCurrent: jest.fn(),
  onRestore: jest.fn(),
  onDelete: jest.fn(),
  onClose: jest.fn(),
  isDark: false,
};

describe('SavedPlansModal', () => {
  beforeEach(() => jest.clearAllMocks());

  test('explains the empty state instead of showing a blank sheet', () => {
    render(<SavedPlansModal {...baseProps} savedPlans={[]} />);
    expect(screen.getByText(/Niciun plan salvat/i)).toBeTruthy();
  });

  test('saving passes the typed name through', () => {
    render(<SavedPlansModal {...baseProps} savedPlans={[]} />);
    fireEvent.changeText(screen.getByLabelText(/Numele planului/i), 'Săptămâna ușoară');
    fireEvent.press(screen.getByLabelText(/Salvează planul curent/i));
    expect(baseProps.onSaveCurrent).toHaveBeenCalledWith('Săptămâna ușoară');
  });

  test('hides the save row when there is no plan to save', () => {
    render(<SavedPlansModal {...baseProps} canSaveCurrent={false} savedPlans={[]} />);
    expect(screen.queryByLabelText(/Salvează planul curent/i)).toBeNull();
  });

  test('lists saved plans with their details', () => {
    render(<SavedPlansModal {...baseProps} savedPlans={[buildSaved('Prima', 'a')]} />);
    expect(screen.getByText('Prima')).toBeTruthy();
    expect(screen.getByText(/Lidl/)).toBeTruthy();
  });

  test('restoring reports the plan and closes', () => {
    render(<SavedPlansModal {...baseProps} savedPlans={[buildSaved('Prima', 'a')]} />);
    fireEvent.press(screen.getByLabelText(/Reia planul Prima/i));
    expect(baseProps.onRestore).toHaveBeenCalledWith('a');
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  test('deleting asks for confirmation first', () => {
    render(<SavedPlansModal {...baseProps} savedPlans={[buildSaved('Prima', 'a')]} />);
    fireEvent.press(screen.getByLabelText(/Șterge planul Prima/i));
    expect(baseProps.onDelete).not.toHaveBeenCalled();
    expect(screen.getByText(/Ștergi definitiv/i)).toBeTruthy();
  });

  test('confirming the delete reports it', () => {
    render(<SavedPlansModal {...baseProps} savedPlans={[buildSaved('Prima', 'a')]} />);
    fireEvent.press(screen.getByLabelText(/Șterge planul Prima/i));
    fireEvent.press(screen.getByLabelText(/Șterge definitiv planul Prima/i));
    expect(baseProps.onDelete).toHaveBeenCalledWith('a');
  });

  test('cancelling the delete keeps the plan', () => {
    render(<SavedPlansModal {...baseProps} savedPlans={[buildSaved('Prima', 'a')]} />);
    fireEvent.press(screen.getByLabelText(/Șterge planul Prima/i));
    fireEvent.press(screen.getByLabelText(/Anulează ștergerea/i));
    expect(baseProps.onDelete).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Reia planul Prima/i)).toBeTruthy();
  });
});
