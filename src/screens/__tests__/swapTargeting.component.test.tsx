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

    // The catalog is now large enough that a generated week never repeats a dish, so the
    // duplicate this test needs is planted deliberately: it is the shape that used to make
    // the swap land on the wrong day, not something the planner should produce on its own.
    const generated = useAppStore.getState().currentPlan!;
    const shared = generated.days[0].meals[0].recipe;
    const lastIndex = generated.days.length - 1;

    useAppStore.setState({
      currentPlan: {
        ...generated,
        days: generated.days.map((day, index) =>
          index === lastIndex
            ? { ...day, meals: day.meals.map((m, i) => (i === 0 ? { ...m, recipe: shared } : m)) }
            : day
        ),
      },
    });

    const plan = useAppStore.getState().currentPlan!;
    const first = { day: plan.days[0].dayOfWeek, title: shared.title };
    const last = { day: plan.days[lastIndex].dayOfWeek };
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
