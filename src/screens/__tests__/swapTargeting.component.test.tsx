import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MealBoardScreen } from '../MealBoardScreen';
import { useAppStore } from '../../store/useAppStore';
import { DayOfWeek, UserPreferences } from '../../types';

const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/** A vegan week: the catalog is small enough that recipes repeat across days. */
const RESTRICTED: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: WEEK,
  budgetRon: 900,
  moodTags: ['family_fav'],
  dietType: 'vegan',
  dietTypes: ['vegan'],
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

/**
 * Opening a meal's detail sheet and pressing "swap" used to re-derive which meal was meant
 * by searching the week for that recipe id, keeping the last match. A restricted catalog
 * repeats recipes freely, so the swap landed on a different day than the one being looked at.
 */
describe('ținta swapului pornit din detaliul rețetei', () => {
  test('rămâne ziua de pe care ai deschis rețeta, chiar când se repetă în săptămână', () => {
    useAppStore.setState({
      preferences: { ...RESTRICTED },
      currentPlan: null,
      groceryItems: [],
      savedPlans: [],
      activeNotice: null,
    });
    useAppStore.getState().generatePlan();

    const plan = useAppStore.getState().currentPlan!;
    const uses = new Map<string, { day: DayOfWeek; title: string }[]>();
    plan.days.forEach((d) =>
      d.meals.forEach((m) =>
        uses.set(m.recipe.id, [...(uses.get(m.recipe.id) ?? []), { day: d.dayOfWeek, title: m.recipe.title }])
      )
    );
    const repeated = [...uses.values()].find((places) => places.length > 1);
    expect(repeated).toBeDefined();

    const first = repeated![0];
    const last = repeated![repeated!.length - 1];
    expect(first.day).not.toBe(last.day);

    render(<MealBoardScreen isDark={false} />);

    // Open the detail sheet from the FIRST day that serves this recipe.
    fireEvent.press(screen.getAllByText(first.title)[0]);
    fireEvent.press(screen.getByText(/Schimbă cu alt preparat/i));

    // The swap sheet must name that same first day, not the last one.
    expect(screen.getByText(new RegExp(`de ${DAY_LABEL[first.day]}`, 'i'))).toBeTruthy();
    expect(screen.queryByText(new RegExp(`de ${DAY_LABEL[last.day]}`, 'i'))).toBeNull();
  });
});

const DAY_LABEL: Record<DayOfWeek, string> = {
  monday: 'Luni',
  tuesday: 'Marți',
  wednesday: 'Miercuri',
  thursday: 'Joi',
  friday: 'Vineri',
  saturday: 'Sâmbătă',
  sunday: 'Duminică',
};
