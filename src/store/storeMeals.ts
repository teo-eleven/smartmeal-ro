import { resolveRecipeId } from '../data/recipeIdAliases';
import { RECIPES_MAP } from '../data/recipes';
import { calculateRecipePortionCost } from '../engine/budgetCalculator';
import { aggregateGroceryList } from '../engine/groceryAggregator';
import { getSlotLabelRo, selectOptimalDessertForDay } from '../engine/plannerEngine';
import { storageService } from '../services/storage';
import { DayOfWeek, MealPlan, MealPlanDay, MealSlot, PlannedMeal, Recipe } from '../types';
import {
  collectMealsFromDays,
  getActiveExtraProductIds,
  getActiveExtraProducts,
  mergePurchased,
} from './cart';

import { StoreApi } from 'zustand';
import { AppState } from './appState';
import { MAX_MEAL_SERVINGS, MIN_MEAL_SERVINGS } from './defaults';
import { describeUnsafeRecipe } from './planSafety';

type SetState = StoreApi<AppState>['setState'];
type GetState = () => AppState;

/** Edits to single meals: desserts, servings, removal, replacement and eating out. */
export function createMealsActions(set: SetState, get: GetState) {
  return {
    addExtraMealToDay: (dayOfWeek: DayOfWeek, slot: 'dessert') => {
      set((state) => {
        if (!state.currentPlan) return {};
        const dayIndex = state.currentPlan.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
        if (dayIndex === -1) return {};

        const day = state.currentPlan.days[dayIndex];
        // Check if slot already exists in this day
        if (day.meals.some((m) => m.slot === slot)) {
          return {
            activeNotice: {
              id: Date.now().toString(),
              title: 'Desert deja adăugat',
              message:
                'Ai deja un desert selectat pentru această zi. Poți vizualiza sau schimba rețeta direct din meniu.',
              type: 'info',
            },
          };
        }

        // Pick optimal contextual dessert tailored to what is already on this day and in the board
        const chosenRecipe = selectOptimalDessertForDay(
          dayOfWeek,
          state.currentPlan,
          state.preferences
        );
        if (!chosenRecipe) {
          return {
            activeNotice: {
              id: Date.now().toString(),
              title: 'Niciun desert disponibil',
              message:
                'Nu s-a găsit niciun desert compatibil cu aparatele sau restricțiile tale curente.',
              type: 'warning',
            },
          };
        }

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
          estimatedCostRon:
            Math.round(updatedMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0) * 100) / 100,
        };

        const updatedDays = [...state.currentPlan.days];
        updatedDays[dayIndex] = updatedDay;

        const allMealsToAggregate = collectMealsFromDays(updatedDays);

        const aggregated = aggregateGroceryList(
          allMealsToAggregate,
          state.preferences.supermarketId,
          state.preferences.excludePantryStaples,
          getActiveExtraProductIds(state.preferences),
          state.preferences.pantryInventory || [],
          state.preferences.pantryStock || {}
        );

        const cartItems = mergePurchased(state.groceryItems, aggregated.items);

        const updatedPlan: MealPlan = {
          ...state.currentPlan,
          days: updatedDays,
          totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
          totalCartCostRon: aggregated.totalCartCostRon,
          extraProducts: getActiveExtraProducts(state.preferences),
        };

        void storageService.savePlanAndGrocery(updatedPlan, cartItems);

        const dayNameRo =
          dayOfWeek === 'monday'
            ? 'luni'
            : dayOfWeek === 'tuesday'
              ? 'marți'
              : dayOfWeek === 'wednesday'
                ? 'miercuri'
                : dayOfWeek === 'thursday'
                  ? 'joi'
                  : dayOfWeek === 'friday'
                    ? 'vineri'
                    : dayOfWeek === 'saturday'
                      ? 'sâmbătă'
                      : 'duminică';

        return {
          currentPlan: updatedPlan,
          groceryItems: cartItems,
          activeNotice: {
            id: Date.now().toString(),
            title: '🍰 Desert adăugat',
            message: `Am adăugat „${chosenRecipe.title}” în meniul de ${dayNameRo}.`,
            type: 'success',
          },
        };
      });
    },

    setMealServings: (dayOfWeek: DayOfWeek, mealId: string, servings: number) => {
      set((state) => {
        if (!state.currentPlan) return state;

        const safeServings = Math.max(
          MIN_MEAL_SERVINGS,
          Math.min(MAX_MEAL_SERVINGS, Math.round(servings))
        );

        const targetDay = state.currentPlan.days.find((d) => d.dayOfWeek === dayOfWeek);
        const targetMeal = targetDay?.meals.find((m) => m.id === mealId);
        if (!targetDay || !targetMeal) return state;
        if (targetMeal.servings === safeServings) return state;

        const updatedDays = state.currentPlan.days.map((day) => {
          if (day.dayOfWeek !== dayOfWeek) return day;

          const updatedMeals = day.meals.map((meal) => {
            if (meal.id !== mealId) return meal;
            // A reheated portion or a meal eaten out is not bought, whatever its servings.
            const isBought = !meal.isLeftover && !meal.isEatenOut;
            return {
              ...meal,
              servings: safeServings,
              estimatedCostRon: isBought
                ? calculateRecipePortionCost(
                    meal.recipe,
                    safeServings,
                    state.preferences.supermarketId,
                    state.preferences.excludePantryStaples
                  )
                : 0,
            };
          });

          const daySum = updatedMeals.reduce((total, m) => total + m.estimatedCostRon, 0);
          return {
            ...day,
            meals: updatedMeals,
            servings: day.recipe.id === mealId ? safeServings : day.servings,
            estimatedCostRon: Math.round(daySum * 100) / 100,
          };
        });

        const planWithServings: MealPlan = { ...state.currentPlan, days: updatedDays };
        const aggregated = aggregateGroceryList(
          collectMealsFromDays(planWithServings.days),
          state.preferences.supermarketId,
          state.preferences.excludePantryStaples,
          getActiveExtraProductIds(state.preferences),
          state.preferences.pantryInventory || [],
          state.preferences.pantryStock || {}
        );
        const cartItems = mergePurchased(state.groceryItems, aggregated.items);

        const updatedPlan: MealPlan = {
          ...planWithServings,
          totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
          totalCartCostRon: aggregated.totalCartCostRon,
          extraProducts: getActiveExtraProducts(state.preferences),
        };

        void storageService.savePlanAndGrocery(updatedPlan, cartItems);
        return { currentPlan: updatedPlan, groceryItems: cartItems };
      });
    },

    removeMealFromDay: (dayOfWeek: DayOfWeek, mealId: string) => {
      set((state) => {
        if (!state.currentPlan) return {};
        const dayIndex = state.currentPlan.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
        if (dayIndex === -1) return {};

        const day = state.currentPlan.days[dayIndex];
        if (day.meals.length <= 1) {
          return {
            activeNotice: {
              id: Date.now().toString(),
              title: 'Ultima masă din zi',
              message: 'Fiecare zi activă trebuie să conțină cel puțin o masă principală.',
              type: 'info',
            },
          };
        }

        const updatedMeals = day.meals.filter((m) => m.id !== mealId);
        const primaryMeal = updatedMeals.find((m) => m.slot === 'dinner') || updatedMeals[0];
        const updatedDay: MealPlanDay = {
          ...day,
          meals: updatedMeals,
          recipe: primaryMeal.recipe,
          estimatedCostRon:
            Math.round(updatedMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0) * 100) / 100,
        };

        const updatedDays = [...state.currentPlan.days];
        updatedDays[dayIndex] = updatedDay;

        const allMealsToAggregate = collectMealsFromDays(updatedDays);

        const aggregated = aggregateGroceryList(
          allMealsToAggregate,
          state.preferences.supermarketId,
          state.preferences.excludePantryStaples,
          getActiveExtraProductIds(state.preferences),
          state.preferences.pantryInventory || [],
          state.preferences.pantryStock || {}
        );

        const cartItems = mergePurchased(state.groceryItems, aggregated.items);

        const updatedPlan: MealPlan = {
          ...state.currentPlan,
          days: updatedDays,
          totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
          totalCartCostRon: aggregated.totalCartCostRon,
          extraProducts: getActiveExtraProducts(state.preferences),
        };

        void storageService.savePlanAndGrocery(updatedPlan, cartItems);

        return {
          currentPlan: updatedPlan,
          groceryItems: cartItems,
        };
      });
    },

    replaceMealWithRecipe: (dayOfWeek: DayOfWeek, newRecipe: Recipe, slot?: MealSlot) => {
      const { currentPlan, preferences } = get();
      if (!currentPlan) return;

      const dayIndex = currentPlan.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
      if (dayIndex === -1) return;

      // The safety check used to read the diet, appliances and ingredients off the object it
      // was handed, so a fabricated recipe claiming `dietType: 'vegan'` and no ingredients
      // passed all three trivially and landed on the board with arbitrary cooking steps.
      // Nothing outside the catalog can be cooked, so nothing outside it may be inserted.
      const canonical = RECIPES_MAP[resolveRecipeId(newRecipe.id)];
      if (!canonical) {
        set({
          activeNotice: {
            id: Date.now().toString(),
            title: 'Rețetă necunoscută',
            message: 'Rețeta aceasta nu există în catalog, așa că nu poate fi pusă în plan.',
            type: 'warning',
          },
        });
        return;
      }

      const rejection = describeUnsafeRecipe(canonical, preferences);
      if (rejection) {
        set({
          activeNotice: {
            id: Date.now().toString(),
            title: 'Rețeta nu ți se potrivește',
            message: rejection,
            type: 'warning',
          },
        });
        return;
      }

      const targetDay = currentPlan.days[dayIndex];
      const targetSlot: MealSlot =
        slot ||
        (targetDay.meals && targetDay.meals.length > 0 ? targetDay.meals[0].slot : 'dinner');

      const originalMeal = targetDay.meals?.find((m) => m.slot === targetSlot && !m.isLeftover);
      const originalMealId = originalMeal?.id;
      const effectiveServings = originalMeal ? originalMeal.servings : currentPlan.peopleCount;

      const newCost = calculateRecipePortionCost(
        canonical,
        effectiveServings,
        preferences.supermarketId,
        preferences.excludePantryStaples
      );

      const updatedDays = currentPlan.days.map((day, dIdx) => {
        if (dIdx === dayIndex) {
          const updatedMeals = (day.meals || []).map((m) => {
            // Same rule as a swap: a reheated portion belongs to the day it was cooked on.
            if (m.slot === targetSlot && !m.isLeftover) {
              return {
                ...m,
                recipe: canonical,
                estimatedCostRon: newCost,
              };
            }
            return m;
          });

          const primaryMeal = updatedMeals.find((m) => m.slot === 'dinner') ||
            updatedMeals[0] || {
              recipe: canonical,
              estimatedCostRon: newCost,
            };
          const dayCostSum = updatedMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0);

          return {
            ...day,
            meals: updatedMeals,
            recipe: primaryMeal.recipe,
            estimatedCostRon: Math.round(dayCostSum * 100) / 100,
          };
        }

        // Check if this other day has a leftover linked to the replaced meal
        const hasDependentLeftover = day.meals?.some(
          (m) =>
            m.isLeftover &&
            (m.leftoverFromMealId === originalMealId ||
              (originalMeal && m.recipe.id === originalMeal.recipe.id) ||
              (m.slot === targetSlot && (dIdx === dayIndex + 1 || m.leftoverFromDay === dayOfWeek)))
        );

        if (hasDependentLeftover) {
          const updatedMeals = (day.meals || []).map((m) => {
            if (
              m.isLeftover &&
              (m.leftoverFromMealId === originalMealId ||
                (originalMeal && m.recipe.id === originalMeal.recipe.id) ||
                (m.slot === targetSlot &&
                  (dIdx === dayIndex + 1 || m.leftoverFromDay === dayOfWeek)))
            ) {
              return {
                ...m,
                recipe: canonical,
                estimatedCostRon: 0,
              };
            }
            return m;
          });

          const primaryMeal = updatedMeals.find((m) => m.slot === 'dinner') || updatedMeals[0];
          const dayCostSum = updatedMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0);

          return {
            ...day,
            meals: updatedMeals,
            recipe: primaryMeal?.recipe || day.recipe,
            estimatedCostRon: Math.round(dayCostSum * 100) / 100,
          };
        }

        return day;
      });

      const allMealsToAggregate = collectMealsFromDays(updatedDays);

      const aggregated = aggregateGroceryList(
        allMealsToAggregate,
        preferences.supermarketId,
        preferences.excludePantryStaples,
        getActiveExtraProductIds(preferences),
        preferences.pantryInventory || [],
        preferences.pantryStock || {}
      );

      const cartItems = mergePurchased(get().groceryItems, aggregated.items);

      const updatedPlan: MealPlan = {
        ...currentPlan,
        totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
        totalCartCostRon: aggregated.totalCartCostRon,
        extraProducts: getActiveExtraProducts(preferences),
        days: updatedDays,
      };

      void storageService.savePlanAndGrocery(updatedPlan, cartItems);

      set(() => ({
        currentPlan: updatedPlan,
        groceryItems: cartItems,
      }));
    },

    toggleEatOut: (dayOfWeek: DayOfWeek, slot?: MealSlot, mealId?: string) => {
      const { currentPlan, preferences } = get();
      if (!currentPlan) return;

      const dayIndex = currentPlan.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
      if (dayIndex === -1) return;

      // One meal, never every meal sharing the slot: a leftover in the same slot used to be
      // marked "eaten out" along with the dish the user meant.
      const targetDay = currentPlan.days[dayIndex];
      const target = mealId
        ? targetDay.meals.find((m) => m.id === mealId)
        : (targetDay.meals.find((m) => m.slot === slot && !m.isLeftover) ??
          targetDay.meals.find((m) => !m.isLeftover));
      if (!target) return;

      let wasUpdated = false;
      const updatedDays = currentPlan.days.map((d) => {
        if (d.dayOfWeek !== dayOfWeek) return d;
        const nextMeals = (d.meals || []).map((m) => {
          if (m.id !== target.id) return m;
          wasUpdated = true;
          const newEatenOut = !m.isEatenOut;
          const cost = newEatenOut
            ? 0
            : m.isLeftover
              ? 0
              : calculateRecipePortionCost(
                  m.recipe,
                  m.servings,
                  preferences.supermarketId,
                  preferences.excludePantryStaples
                );
          return {
            ...m,
            isEatenOut: newEatenOut,
            estimatedCostRon: cost,
          };
        });

        const dayTotalCost = nextMeals.reduce((sum, meal) => sum + meal.estimatedCostRon, 0);

        return {
          ...d,
          meals: nextMeals,
          estimatedCostRon: Math.round(dayTotalCost * 100) / 100,
        };
      });

      if (!wasUpdated) return;

      const allMealsToAggregate = collectMealsFromDays(updatedDays);

      const aggregated = aggregateGroceryList(
        allMealsToAggregate,
        preferences.supermarketId,
        preferences.excludePantryStaples,
        getActiveExtraProductIds(preferences),
        preferences.pantryInventory || [],
        preferences.pantryStock || {}
      );

      const cartItems = mergePurchased(get().groceryItems, aggregated.items);

      const updatedPlan: MealPlan = {
        ...currentPlan,
        days: updatedDays,
        totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
        totalCartCostRon: aggregated.totalCartCostRon,
      };

      void storageService.savePlanAndGrocery(updatedPlan, cartItems);

      set(() => ({
        currentPlan: updatedPlan,
        groceryItems: cartItems,
      }));
    },
  } satisfies Partial<AppState>;
}
