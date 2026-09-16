import { create } from 'zustand';
import {
  Appliance,
  DayOfWeek,
  DietType,
  GroceryListItem,
  MealPlan,
  MoodTag,
  SupermarketId,
  UserPreferences,
} from '../types';
import { generateMealPlan, swapMealInPlan } from '../engine/plannerEngine';
import { aggregateGroceryList } from '../engine/groceryAggregator';

export interface AppState {
  // Navigation & View State
  currentStep: number;
  totalSteps: number;
  activeView: 'onboarding' | 'generating' | 'meals' | 'grocery';

  // User Preferences for Onboarding
  preferences: UserPreferences;

  // Meal Plan & Grocery State
  currentPlan: MealPlan | null;
  groceryItems: GroceryListItem[];

  // Actions
  setSupermarket: (id: SupermarketId) => void;
  setPeopleCount: (count: number) => void;
  toggleCookingDay: (day: DayOfWeek) => void;
  setBudget: (budget: number) => void;
  toggleMoodTag: (tag: MoodTag) => void;
  setDietType: (diet: DietType) => void;
  toggleAppliance: (appliance: Appliance) => void;
  setExcludePantryStaples: (exclude: boolean) => void;

  // Wizard Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetOnboarding: () => void;

  // Plan Operations
  generatePlan: () => void;
  swapMeal: (dayOfWeek: DayOfWeek) => void;
  toggleGroceryItem: (ingredientId: string) => void;
  setActiveView: (view: 'onboarding' | 'generating' | 'meals' | 'grocery') => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  budgetRon: 150,
  moodTags: ['speedy', 'family_fav'],
  dietType: 'omnivore',
  appliances: ['hob', 'oven', 'air_fryer'],
  excludePantryStaples: true,
};

export const useAppStore = create<AppState>((set, get) => ({
  currentStep: 1,
  totalSteps: 7,
  activeView: 'onboarding',
  preferences: { ...DEFAULT_PREFERENCES },
  currentPlan: null,
  groceryItems: [],

  setSupermarket: (id: SupermarketId) =>
    set((state) => ({
      preferences: { ...state.preferences, supermarketId: id },
    })),

  setPeopleCount: (count: number) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        peopleCount: Math.max(1, Math.min(10, count)),
      },
    })),

  toggleCookingDay: (day: DayOfWeek) =>
    set((state) => {
      const current = state.preferences.cookingDays;
      const exists = current.includes(day);

      // Keep at least 1 day selected
      if (exists && current.length <= 1) {
        return state;
      }

      const daysOrder: DayOfWeek[] = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];

      const nextDays = exists
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));

      return {
        preferences: {
          ...state.preferences,
          cookingDays: nextDays,
        },
      };
    }),

  setBudget: (budget: number) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        budgetRon: Math.max(20, Math.round(budget)),
      },
    })),

  toggleMoodTag: (tag: MoodTag) =>
    set((state) => {
      const current = state.preferences.moodTags;
      const exists = current.includes(tag);

      if (exists) {
        return {
          preferences: {
            ...state.preferences,
            moodTags: current.filter((t) => t !== tag),
          },
        };
      }

      // Max 3 mood tags allowed (like in the inspiration video)
      if (current.length >= 3) {
        return state;
      }

      return {
        preferences: {
          ...state.preferences,
          moodTags: [...current, tag],
        },
      };
    }),

  setDietType: (diet: DietType) =>
    set((state) => ({
      preferences: { ...state.preferences, dietType: diet },
    })),

  toggleAppliance: (appliance: Appliance) =>
    set((state) => {
      const current = state.preferences.appliances;
      const exists = current.includes(appliance);

      // Keep at least 1 appliance selected
      if (exists && current.length <= 1) {
        return state;
      }

      return {
        preferences: {
          ...state.preferences,
          appliances: exists
            ? current.filter((a) => a !== appliance)
            : [...current, appliance],
        },
      };
    }),

  setExcludePantryStaples: (exclude: boolean) =>
    set((state) => {
      const nextPrefs = { ...state.preferences, excludePantryStaples: exclude };
      let nextGroceryItems = state.groceryItems;

      if (state.currentPlan) {
        const aggregated = aggregateGroceryList(
          state.currentPlan.days.map((d) => ({ recipe: d.recipe, servings: d.servings })),
          nextPrefs.supermarketId,
          exclude
        );
        nextGroceryItems = aggregated.items;
      }

      return {
        preferences: nextPrefs,
        groceryItems: nextGroceryItems,
      };
    }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.totalSteps, state.currentStep + 1),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(1, state.currentStep - 1),
    })),

  goToStep: (step: number) =>
    set((state) => ({
      currentStep: Math.max(1, Math.min(state.totalSteps, step)),
    })),

  resetOnboarding: () =>
    set(() => ({
      currentStep: 1,
      activeView: 'onboarding',
      currentPlan: null,
      groceryItems: [],
    })),

  setActiveView: (view) => set(() => ({ activeView: view })),

  generatePlan: () => {
    const { preferences } = get();
    const plan = generateMealPlan(preferences);

    const aggregated = aggregateGroceryList(
      plan.days.map((d) => ({ recipe: d.recipe, servings: d.servings })),
      preferences.supermarketId,
      preferences.excludePantryStaples
    );

    set(() => ({
      currentPlan: plan,
      groceryItems: aggregated.items,
      activeView: 'meals',
    }));
  },

  swapMeal: (dayOfWeek: DayOfWeek) => {
    const { currentPlan, preferences } = get();
    if (!currentPlan) return;

    const updatedPlan = swapMealInPlan(currentPlan, dayOfWeek, preferences);
    const aggregated = aggregateGroceryList(
      updatedPlan.days.map((d) => ({ recipe: d.recipe, servings: d.servings })),
      preferences.supermarketId,
      preferences.excludePantryStaples
    );

    set(() => ({
      currentPlan: updatedPlan,
      groceryItems: aggregated.items,
    }));
  },

  toggleGroceryItem: (ingredientId: string) =>
    set((state) => ({
      groceryItems: state.groceryItems.map((item) =>
        item.ingredientId === ingredientId
          ? { ...item, isPurchased: !item.isPurchased }
          : item
      ),
    })),
}));
