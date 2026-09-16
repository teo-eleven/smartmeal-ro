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
  Recipe,
} from '../types';
import { generateMealPlan, swapMealInPlan } from '../engine/plannerEngine';
import { aggregateGroceryList } from '../engine/groceryAggregator';
import { calculateRecipePortionCost } from '../engine/budgetCalculator';
import { storageService } from '../services/storage';
import { cloudSyncService } from '../services/supabase';

export interface AppState {
  // Navigation & View State
  currentStep: number;
  totalSteps: number;
  activeView: 'onboarding' | 'generating' | 'meals' | 'grocery';

  // Persistence & Hydration
  isHydrated: boolean;
  userEmail: string | null;
  isSyncing: boolean;
  lastSyncedAt: string | null;

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
  replaceMealWithRecipe: (dayOfWeek: DayOfWeek, newRecipe: Recipe) => void;
  toggleGroceryItem: (ingredientId: string) => void;
  setActiveView: (view: 'onboarding' | 'generating' | 'meals' | 'grocery') => void;

  // Persistence & Sync Actions
  hydrateStorage: () => Promise<void>;
  setUserEmail: (email: string | null) => void;
  syncWithCloud: () => Promise<void>;
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
  isHydrated: false,
  userEmail: null,
  isSyncing: false,
  lastSyncedAt: null,
  preferences: { ...DEFAULT_PREFERENCES },
  currentPlan: null,
  groceryItems: [],

  hydrateStorage: async () => {
    try {
      const storedPrefs = await storageService.loadPreferences();
      const { plan, items } = await storageService.loadPlanAndGrocery();

      set((state) => ({
        isHydrated: true,
        preferences: storedPrefs || state.preferences,
        currentPlan: plan || state.currentPlan,
        groceryItems: items.length > 0 ? items : state.groceryItems,
        activeView: plan ? 'meals' : state.activeView,
      }));
    } catch (e) {
      console.warn('[useAppStore] Hydration error:', e);
      set({ isHydrated: true });
    }
  },

  setUserEmail: (email: string | null) => {
    set({ userEmail: email });
  },

  syncWithCloud: async () => {
    const { userEmail, currentPlan, groceryItems } = get();
    if (!userEmail) return;

    set({ isSyncing: true });
    try {
      const res = await cloudSyncService.saveMealPlan(userEmail, currentPlan, groceryItems);
      if (res.success) {
        set({ lastSyncedAt: new Date().toLocaleTimeString('ro-RO') });
      }
    } finally {
      set({ isSyncing: false });
    }
  },

  setSupermarket: (id: SupermarketId) => {
    set((state) => {
      const nextPrefs = { ...state.preferences, supermarketId: id };
      void storageService.savePreferences(nextPrefs);
      return { preferences: nextPrefs };
    });
  },

  setPeopleCount: (count: number) => {
    set((state) => {
      const nextPrefs = {
        ...state.preferences,
        peopleCount: Math.max(1, Math.min(10, count)),
      };
      void storageService.savePreferences(nextPrefs);
      return { preferences: nextPrefs };
    });
  },

  toggleCookingDay: (day: DayOfWeek) => {
    set((state) => {
      const current = state.preferences.cookingDays;
      const exists = current.includes(day);

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

      const updated = exists ? current.filter((d) => d !== day) : [...current, day];
      const sorted = daysOrder.filter((d) => updated.includes(d));

      const nextPrefs = { ...state.preferences, cookingDays: sorted };
      void storageService.savePreferences(nextPrefs);
      return { preferences: nextPrefs };
    });
  },

  setBudget: (budget: number) => {
    set((state) => {
      const nextPrefs = {
        ...state.preferences,
        budgetRon: Math.max(20, Math.round(budget)),
      };
      void storageService.savePreferences(nextPrefs);
      return { preferences: nextPrefs };
    });
  },

  toggleMoodTag: (tag: MoodTag) => {
    set((state) => {
      const current = state.preferences.moodTags;
      const exists = current.includes(tag);

      if (exists) {
        if (current.length <= 1) return state;
        const nextPrefs = {
          ...state.preferences,
          moodTags: current.filter((t) => t !== tag),
        };
        void storageService.savePreferences(nextPrefs);
        return { preferences: nextPrefs };
      }

      if (current.length >= 3) {
        return state;
      }

      const nextPrefs = { ...state.preferences, moodTags: [...current, tag] };
      void storageService.savePreferences(nextPrefs);
      return { preferences: nextPrefs };
    });
  },

  setDietType: (diet: DietType) => {
    set((state) => {
      const nextPrefs = { ...state.preferences, dietType: diet };
      void storageService.savePreferences(nextPrefs);
      return { preferences: nextPrefs };
    });
  },

  toggleAppliance: (appliance: Appliance) => {
    set((state) => {
      const current = state.preferences.appliances;
      const exists = current.includes(appliance);

      if (exists && current.length <= 1) {
        return state;
      }

      const updated = exists
        ? current.filter((a) => a !== appliance)
        : [...current, appliance];

      const nextPrefs = { ...state.preferences, appliances: updated };
      void storageService.savePreferences(nextPrefs);
      return { preferences: nextPrefs };
    });
  },

  setExcludePantryStaples: (exclude: boolean) => {
    set((state) => {
      const nextPrefs = { ...state.preferences, excludePantryStaples: exclude };
      void storageService.savePreferences(nextPrefs);

      if (state.currentPlan) {
        const aggregated = aggregateGroceryList(
          state.currentPlan.days.map((d) => ({ recipe: d.recipe, servings: d.servings })),
          nextPrefs.supermarketId,
          exclude
        );

        const updatedPlan: MealPlan = {
          ...state.currentPlan,
          totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
          totalCartCostRon: aggregated.totalCartCostRon,
        };

        void storageService.savePlanAndGrocery(updatedPlan, aggregated.items);

        return {
          preferences: nextPrefs,
          currentPlan: updatedPlan,
          groceryItems: aggregated.items,
        };
      }

      return { preferences: nextPrefs };
    });
  },

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

  resetOnboarding: () => {
    void storageService.clearAll();
    set(() => ({
      currentStep: 1,
      activeView: 'onboarding',
      currentPlan: null,
      groceryItems: [],
    }));
  },

  setActiveView: (view) => set(() => ({ activeView: view })),

  generatePlan: () => {
    const { preferences } = get();
    const plan = generateMealPlan(preferences);

    const aggregated = aggregateGroceryList(
      plan.days.map((d) => ({ recipe: d.recipe, servings: d.servings })),
      preferences.supermarketId,
      preferences.excludePantryStaples
    );

    void storageService.savePlanAndGrocery(plan, aggregated.items);

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

    void storageService.savePlanAndGrocery(updatedPlan, aggregated.items);

    set(() => ({
      currentPlan: updatedPlan,
      groceryItems: aggregated.items,
    }));
  },

  replaceMealWithRecipe: (dayOfWeek: DayOfWeek, newRecipe: Recipe) => {
    const { currentPlan, preferences } = get();
    if (!currentPlan) return;

    const dayIndex = currentPlan.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
    if (dayIndex === -1) return;

    const newCost = calculateRecipePortionCost(
      newRecipe,
      currentPlan.peopleCount,
      preferences.supermarketId,
      preferences.excludePantryStaples
    );

    const updatedDays = [...currentPlan.days];
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      recipe: newRecipe,
      estimatedCostRon: newCost,
    };

    const aggregated = aggregateGroceryList(
      updatedDays.map((d) => ({ recipe: d.recipe, servings: d.servings })),
      preferences.supermarketId,
      preferences.excludePantryStaples
    );

    const updatedPlan: MealPlan = {
      ...currentPlan,
      totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
      totalCartCostRon: aggregated.totalCartCostRon,
      days: updatedDays,
    };

    void storageService.savePlanAndGrocery(updatedPlan, aggregated.items);

    set(() => ({
      currentPlan: updatedPlan,
      groceryItems: aggregated.items,
    }));
  },

  toggleGroceryItem: (ingredientId: string) => {
    const { currentPlan } = get();
    set((state) => {
      const nextItems = state.groceryItems.map((item) =>
        item.ingredientId === ingredientId
          ? { ...item, isPurchased: !item.isPurchased }
          : item
      );
      void storageService.savePlanAndGrocery(currentPlan, nextItems);
      return { groceryItems: nextItems };
    });
  },
}));
