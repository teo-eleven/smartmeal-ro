import { create } from 'zustand';
import {
  Appliance,
  DayOfWeek,
  DietType,
  GroceryListItem,
  MealPlan,
  MealPlanDay,
  MealSlot,
  MoodTag,
  PlannedMeal,
  Recipe,
  SupermarketId,
  UserPreferences,
} from '../types';
import {
  generateMealPlan,
  getEligibleRecipes,
  getSlotLabelRo,
  swapMealInPlan,
} from '../engine/plannerEngine';
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

  // Domain State
  preferences: UserPreferences;
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
  setMealSlots: (slots: MealSlot[]) => void;
  setMealsPerDayCount: (count: 1 | 2 | 3) => void;
  toggleExtraSlot: (slot: 'snack' | 'dessert') => void;
  addExtraMealToDay: (dayOfWeek: DayOfWeek, slot: 'snack' | 'dessert') => void;
  removeMealFromDay: (dayOfWeek: DayOfWeek, mealId: string) => void;

  // Wizard Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetOnboarding: () => void;

  // Plan Operations
  generatePlan: () => void;
  swapMeal: (dayOfWeek: DayOfWeek, slot?: MealSlot) => void;
  replaceMealWithRecipe: (dayOfWeek: DayOfWeek, newRecipe: Recipe, slot?: MealSlot) => void;
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
  mealSlots: ['dinner'],
};

export const useAppStore = create<AppState>((set, get) => ({
  currentStep: 1,
  totalSteps: 8,
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
        preferences: storedPrefs
          ? { ...storedPrefs, mealSlots: storedPrefs.mealSlots || ['dinner'] }
          : state.preferences,
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

  setMealSlots: (slots: MealSlot[]) => {
    const safeSlots: MealSlot[] = slots.length > 0 ? slots : ['dinner'];
    set((state) => {
      const nextPrefs = { ...state.preferences, mealSlots: safeSlots };
      void storageService.savePreferences(nextPrefs);
      return { preferences: nextPrefs };
    });
  },

  setMealsPerDayCount: (count: 1 | 2 | 3) => {
    let baseSlots: MealSlot[] = ['dinner'];
    if (count === 2) {
      baseSlots = ['lunch', 'dinner'];
    } else if (count === 3) {
      baseSlots = ['breakfast', 'lunch', 'dinner'];
    }

    set((state) => {
      // Preserve existing snack or dessert toggles if any
      const activeExtras = state.preferences.mealSlots.filter((s) => s === 'snack' || s === 'dessert');
      const combinedSlots: MealSlot[] = [...baseSlots, ...activeExtras];

      const nextPrefs = { ...state.preferences, mealSlots: combinedSlots };
      void storageService.savePreferences(nextPrefs);

      if (state.currentPlan) {
        const plan = generateMealPlan(nextPrefs);
        const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
        plan.days.forEach((d) => {
          d.meals.forEach((m) =>
            allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings })
          );
        });
        const aggregated = aggregateGroceryList(
          allMealsToAggregate,
          nextPrefs.supermarketId,
          nextPrefs.excludePantryStaples
        );
        void storageService.savePlanAndGrocery(plan, aggregated.items);
        return {
          preferences: nextPrefs,
          currentPlan: plan,
          groceryItems: aggregated.items,
        };
      }

      return { preferences: nextPrefs };
    });
  },

  toggleExtraSlot: (slot: 'snack' | 'dessert') => {
    set((state) => {
      const current = state.preferences.mealSlots;
      const nextSlots = current.includes(slot)
        ? current.filter((s) => s !== slot)
        : [...current, slot];

      const safeSlots: MealSlot[] = nextSlots.length > 0 ? nextSlots : ['dinner'];
      const nextPrefs = { ...state.preferences, mealSlots: safeSlots };
      void storageService.savePreferences(nextPrefs);

      if (state.currentPlan) {
        const plan = generateMealPlan(nextPrefs);
        const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
        plan.days.forEach((d) => {
          d.meals.forEach((m) =>
            allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings })
          );
        });
        const aggregated = aggregateGroceryList(
          allMealsToAggregate,
          nextPrefs.supermarketId,
          nextPrefs.excludePantryStaples
        );
        void storageService.savePlanAndGrocery(plan, aggregated.items);
        return {
          preferences: nextPrefs,
          currentPlan: plan,
          groceryItems: aggregated.items,
        };
      }

      return { preferences: nextPrefs };
    });
  },

  addExtraMealToDay: (dayOfWeek: DayOfWeek, slot: 'snack' | 'dessert') => {
    set((state) => {
      if (!state.currentPlan) return {};
      const dayIndex = state.currentPlan.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
      if (dayIndex === -1) return {};

      const day = state.currentPlan.days[dayIndex];
      // Check if slot already exists in this day
      if (day.meals.some((m) => m.slot === slot)) return {};

      // Filter eligible recipes for slot
      const eligible = getEligibleRecipes(state.preferences).filter((r) =>
        r.suitableSlots ? r.suitableSlots.includes(slot) : true
      );
      if (eligible.length === 0) return {};

      // Pick recipe not currently in that day
      const existingIds = new Set(day.meals.map((m) => m.recipe.id));
      const chosenRecipe = eligible.find((r) => !existingIds.has(r.id)) || eligible[0];

      const cost = calculateRecipePortionCost(
        chosenRecipe,
        state.preferences.peopleCount,
        state.preferences.supermarketId,
        state.preferences.excludePantryStaples
      );

      const newMeal: PlannedMeal = {
        id: `${dayOfWeek}-${slot}-${Date.now()}`,
        slot,
        slotLabelRo: getSlotLabelRo(slot),
        recipe: chosenRecipe,
        servings: state.preferences.peopleCount,
        estimatedCostRon: cost,
      };

      const updatedMeals = [...day.meals, newMeal];
      const updatedDay: MealPlanDay = {
        ...day,
        meals: updatedMeals,
        estimatedCostRon: Math.round(updatedMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0) * 10) / 10,
      };

      const updatedDays = [...state.currentPlan.days];
      updatedDays[dayIndex] = updatedDay;

      const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
      updatedDays.forEach((d) => {
        d.meals.forEach((m) =>
          allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings })
        );
      });

      const aggregated = aggregateGroceryList(
        allMealsToAggregate,
        state.preferences.supermarketId,
        state.preferences.excludePantryStaples
      );

      const updatedPlan: MealPlan = {
        ...state.currentPlan,
        days: updatedDays,
        totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
        totalCartCostRon: aggregated.totalCartCostRon,
      };

      void storageService.savePlanAndGrocery(updatedPlan, aggregated.items);

      return {
        currentPlan: updatedPlan,
        groceryItems: aggregated.items,
      };
    });
  },

  removeMealFromDay: (dayOfWeek: DayOfWeek, mealId: string) => {
    set((state) => {
      if (!state.currentPlan) return {};
      const dayIndex = state.currentPlan.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
      if (dayIndex === -1) return {};

      const day = state.currentPlan.days[dayIndex];
      if (day.meals.length <= 1) return {};

      const updatedMeals = day.meals.filter((m) => m.id !== mealId);
      const primaryMeal = updatedMeals.find((m) => m.slot === 'dinner') || updatedMeals[0];
      const updatedDay: MealPlanDay = {
        ...day,
        meals: updatedMeals,
        recipe: primaryMeal.recipe,
        estimatedCostRon: Math.round(updatedMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0) * 10) / 10,
      };

      const updatedDays = [...state.currentPlan.days];
      updatedDays[dayIndex] = updatedDay;

      const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
      updatedDays.forEach((d) => {
        d.meals.forEach((m) =>
          allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings })
        );
      });

      const aggregated = aggregateGroceryList(
        allMealsToAggregate,
        state.preferences.supermarketId,
        state.preferences.excludePantryStaples
      );

      const updatedPlan: MealPlan = {
        ...state.currentPlan,
        days: updatedDays,
        totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
        totalCartCostRon: aggregated.totalCartCostRon,
      };

      void storageService.savePlanAndGrocery(updatedPlan, aggregated.items);

      return {
        currentPlan: updatedPlan,
        groceryItems: aggregated.items,
      };
    });
  },

  setExcludePantryStaples: (exclude: boolean) => {
    set((state) => {
      const nextPrefs = { ...state.preferences, excludePantryStaples: exclude };
      void storageService.savePreferences(nextPrefs);

      if (state.currentPlan) {
        const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
        state.currentPlan.days.forEach((d) => {
          if (d.meals && d.meals.length > 0) {
            d.meals.forEach((m) =>
              allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings })
            );
          } else {
            allMealsToAggregate.push({ recipe: d.recipe, servings: d.servings });
          }
        });

        const aggregated = aggregateGroceryList(
          allMealsToAggregate,
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

    const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
    plan.days.forEach((d) => {
      d.meals.forEach((m) =>
        allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings })
      );
    });

    const aggregated = aggregateGroceryList(
      allMealsToAggregate,
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

  swapMeal: (dayOfWeek: DayOfWeek, slot?: MealSlot) => {
    const { currentPlan, preferences } = get();
    if (!currentPlan) return;

    const updatedPlan = swapMealInPlan(currentPlan, dayOfWeek, preferences, slot);
    const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
    updatedPlan.days.forEach((d) => {
      d.meals.forEach((m) =>
        allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings })
      );
    });

    const aggregated = aggregateGroceryList(
      allMealsToAggregate,
      preferences.supermarketId,
      preferences.excludePantryStaples
    );

    void storageService.savePlanAndGrocery(updatedPlan, aggregated.items);

    set(() => ({
      currentPlan: updatedPlan,
      groceryItems: aggregated.items,
    }));
  },

  replaceMealWithRecipe: (dayOfWeek: DayOfWeek, newRecipe: Recipe, slot?: MealSlot) => {
    const { currentPlan, preferences } = get();
    if (!currentPlan) return;

    const dayIndex = currentPlan.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
    if (dayIndex === -1) return;

    const targetDay = currentPlan.days[dayIndex];
    const targetSlot: MealSlot =
      slot || (targetDay.meals && targetDay.meals.length > 0 ? targetDay.meals[0].slot : 'dinner');

    const newCost = calculateRecipePortionCost(
      newRecipe,
      currentPlan.peopleCount,
      preferences.supermarketId,
      preferences.excludePantryStaples
    );

    const updatedDays = [...currentPlan.days];
    const updatedMeals = (targetDay.meals || []).map((m) => {
      if (m.slot === targetSlot) {
        return {
          ...m,
          recipe: newRecipe,
          estimatedCostRon: newCost,
        };
      }
      return m;
    });

    const primaryMeal =
      updatedMeals.find((m) => m.slot === 'dinner') || updatedMeals[0] || {
        recipe: newRecipe,
        estimatedCostRon: newCost,
      };
    const dayCostSum = updatedMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0);

    updatedDays[dayIndex] = {
      ...targetDay,
      meals: updatedMeals,
      recipe: primaryMeal.recipe,
      estimatedCostRon: Math.round(dayCostSum * 10) / 10,
    };

    const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
    updatedDays.forEach((d) => {
      d.meals.forEach((m) =>
        allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings })
      );
    });

    const aggregated = aggregateGroceryList(
      allMealsToAggregate,
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
