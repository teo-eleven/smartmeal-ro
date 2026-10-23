import { INGREDIENTS } from '../data/ingredients';
import { storageService } from '../services/storage';
import { DayOfWeek, PlannedMeal, UserPreferences } from '../types';

import { StoreApi } from 'zustand';
import { AppState } from './appState';
import { buildInfeasibleNotice, makePlanSafeForPreferences, rebuildDayShape } from './planSafety';
import {
  applyPreferencesWithRebuild,
  rejectIfInfeasible,
  restoreReplacedMeal,
  undoDoubleOnSource,
  withRecalculatedCart,
} from './storeTransforms';

type SetState = StoreApi<AppState>['setState'];
type GetState = () => AppState;

/** Cook once eat twice, liked and rejected dishes, and the cupboard surplus. */
export function createLeftoversActions(set: SetState, _get: GetState) {
  return {
    /**
     * Rejects a dish for good. This is a hard filter, like diet and allergens, because a thumb
     * down that still served the dish next week would mean nothing — and like the others it is
     * refused rather than stored when it would leave the catalog with nothing to offer.
     */
    /**
     * Cooks a double portion on one day and reheats it the next, which is the cheapest thing a
     * meal planner can suggest. The reheated meal keeps the dish but buys nothing: its
     * ingredients were already on the list for the day it was cooked.
     */
    cookDoubleFor: (dayOfWeek: DayOfWeek, mealId: string) => {
      set((state) => {
        const plan = state.currentPlan;
        if (!plan) return state;

        const dayIndex = plan.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
        const source = plan.days[dayIndex]?.meals.find((m) => m.id === mealId);
        if (!source || source.isLeftover) return state;

        // The button stays on the card after a double, and it compounded: six taps booked 128
        // portions and a 1331-lei cart. One double is the whole idea; a second is a mistake.
        if (source.servings > state.preferences.peopleCount) {
          return {
            activeNotice: {
              id: Date.now().toString(),
              title: 'Deja gătești porție dublă',
              message: `„${source.recipe.title}" e deja dublat pentru ziua următoare. Anulează întâi dacă vrei altceva.`,
              type: 'info',
            },
          };
        }

        const nextDay = plan.days[dayIndex + 1];
        if (!nextDay) {
          return {
            activeNotice: {
              id: Date.now().toString(),
              title: 'Nu mai urmează nicio zi',
              message: 'E ultima zi din plan, deci nu are unde să fie reîncălzită porția a doua.',
              type: 'info',
            },
          };
        }

        const existingTarget = nextDay.meals.find((m) => m.slot === source.slot);

        const days = plan.days.map((day, index) => {
          if (index === dayIndex) {
            const meals = day.meals.map((m) =>
              m.id === mealId
                ? {
                    ...m,
                    servingsBeforeDouble: m.servings,
                    servings: m.servings * 2,
                    estimatedCostRon: m.estimatedCostRon * 2,
                  }
                : m
            );
            return { ...day, meals, ...rebuildDayShape(meals, day) };
          }
          if (index === dayIndex + 1) {
            if (existingTarget) {
              const meals = day.meals.map((m) =>
                m.id === existingTarget.id
                  ? {
                      ...m,
                      recipe: source.recipe,
                      isLeftover: true,
                      leftoverFromMealId: source.id,
                      leftoverFromDay: dayOfWeek,
                      replacedRecipe: m.recipe,
                      replacedServings: m.servings,
                      estimatedCostRon: 0,
                    }
                  : m
              );
              return { ...day, meals, ...rebuildDayShape(meals, day) };
            } else {
              // Append a new leftover meal so unrelated slots (e.g. dinner) are not overwritten
              const newLeftoverMeal: PlannedMeal = {
                id: `${nextDay.dayOfWeek}-${source.slot}-leftover-${Date.now()}`,
                slot: source.slot,
                slotLabelRo:
                  source.slotLabelRo || (source.slot === 'dessert' ? 'Desert' : source.slot),
                recipe: source.recipe,
                servings: state.preferences.peopleCount || source.servings,
                estimatedCostRon: 0,
                isLeftover: true,
                leftoverFromMealId: source.id,
                leftoverFromDay: dayOfWeek,
                isAddedLeftover: true,
              };
              const meals = [...day.meals, newLeftoverMeal];
              return { ...day, meals, ...rebuildDayShape(meals, day) };
            }
          }
          return day;
        });

        return withRecalculatedCart(state, days, {
          id: Date.now().toString(),
          title: 'Gătești o dată, mănânci de două ori',
          message: `Porție dublă de „${source.recipe.title}" — a doua zi doar o reîncălzești, fără cumpărături în plus.`,
          type: 'info',
        });
      });
    },

    /** Puts a reheated day back to a meal of its own, and halves the day it came from. */
    undoCookDouble: (dayOfWeek: DayOfWeek, mealId: string) => {
      set((state) => {
        const plan = state.currentPlan;
        if (!plan) return state;

        const dayIndex = plan.days.findIndex((d) => d.dayOfWeek === dayOfWeek);
        const leftover = plan.days[dayIndex]?.meals.find((m) => m.id === mealId);
        if (!leftover || !leftover.isLeftover) return state;

        const sourceDay = plan.days[dayIndex - 1];
        // By identity, not by recipe id: a day that serves the same dish twice used to have
        // the wrong meal halved, and a source that had since been swapped matched nothing at
        // all, leaving the double portion booked and the cart inflated.
        const source = leftover.leftoverFromMealId
          ? sourceDay?.meals.find((m) => m.id === leftover.leftoverFromMealId)
          : sourceDay?.meals.find((m) => m.recipe.id === leftover.recipe.id);

        if (!source) {
          return {
            activeNotice: {
              id: Date.now().toString(),
              title: 'Nu mai găsesc porția dublată',
              message:
                'Masa din care venea reîncălzirea s-a schimbat între timp, așa că nu o pot anula singur. Schimbă manual ziua asta.',
              type: 'warning',
            },
          };
        }

        const days = plan.days.map((day, index) => {
          if (index === dayIndex - 1 && source) {
            const meals = day.meals.map((m) =>
              m.id === source.id ? undoDoubleOnSource(m, state.preferences) : m
            );
            return { ...day, meals, ...rebuildDayShape(meals, day) };
          }
          if (index === dayIndex) {
            if (leftover.isAddedLeftover || leftover.slot === 'dessert') {
              const meals = day.meals.filter((m) => m.id !== mealId);
              return { ...day, meals, ...rebuildDayShape(meals, day) };
            }
            const meals = day.meals.map((m) =>
              m.id === mealId ? restoreReplacedMeal(m, state.preferences) : m
            );
            return { ...day, meals, ...rebuildDayShape(meals, day) };
          }
          return day;
        });

        return withRecalculatedCart(state, days, null);
      });
    },

    toggleDislikedRecipe: (recipeId: string) => {
      set((state) => {
        const current = state.preferences.dislikedRecipeIds ?? [];
        const isRemoving = current.includes(recipeId);
        const next = isRemoving ? current.filter((id) => id !== recipeId) : [...current, recipeId];

        const nextPrefs: UserPreferences = {
          ...state.preferences,
          dislikedRecipeIds: next,
          // A dish cannot be both wanted and refused.
          favouriteRecipeIds: isRemoving
            ? state.preferences.favouriteRecipeIds
            : (state.preferences.favouriteRecipeIds ?? []).filter((id) => id !== recipeId),
        };

        if (!isRemoving) {
          const rejection = rejectIfInfeasible(nextPrefs);
          if (rejection) {
            return {
              activeNotice: buildInfeasibleNotice(
                'Dacă scoți și rețeta asta nu mai rămâne nimic de gătit cu setările tale. Lărgește dieta, aparatele sau alergiile întâi.'
              ),
            };
          }
        }

        if (isRemoving) {
          void storageService.savePreferences(nextPrefs);
          return { preferences: nextPrefs };
        }

        if (state.currentPlan) {
          const { days: safeDays } = makePlanSafeForPreferences(state.currentPlan.days, nextPrefs);
          const days = safeDays.map((d) => ({
            ...d,
            ...rebuildDayShape(d.meals, d),
          }));
          void storageService.savePreferences(nextPrefs);
          return {
            preferences: nextPrefs,
            ...withRecalculatedCart(state, days, null),
          };
        }

        return applyPreferencesWithRebuild(state, nextPrefs);
      });
    },

    /** Marks a dish as wanted. A strong pull in the scoring, never a way past a hard rule. */
    toggleFavouriteRecipe: (recipeId: string) => {
      set((state) => {
        const current = state.preferences.favouriteRecipeIds ?? [];
        const next = current.includes(recipeId)
          ? current.filter((id) => id !== recipeId)
          : [...current, recipeId];

        const nextPrefs: UserPreferences = {
          ...state.preferences,
          favouriteRecipeIds: next,
          dislikedRecipeIds: (state.preferences.dislikedRecipeIds ?? []).filter(
            (id) => id !== recipeId
          ),
        };

        void storageService.savePreferences(nextPrefs);
        return { preferences: nextPrefs };
      });
    },

    /**
     * Moves what this week will not use up into the cupboard, so next week's list starts from
     * it. A supermarket sells whole packs: a week needing 270 g of rice buys a kilo, and the
     * remaining 730 g used to be forgotten and bought again seven days later.
     */
    carryOverSurplus: () => {
      set((state) => {
        if (!state.currentPlan) return state;

        const carried: Record<string, number> = { ...(state.preferences.pantryStock || {}) };
        let savedRon = 0;
        let movedCount = 0;

        state.groceryItems.forEach((item) => {
          const leftover = item.leftoverAmount ?? 0;
          if (leftover <= 0 || item.isFromPantry) return;

          // Replaces rather than adds: `leftoverAmount` already counts the stock that was
          // there when the list was built, so adding again would double it.
          carried[item.ingredientId] = Math.round(leftover * 10) / 10;
          movedCount += 1;

          const ingredient = INGREDIENTS[item.ingredientId];
          if (ingredient && item.packSize > 0) {
            const packPrice = ingredient.typicalPriceRon[state.preferences.supermarketId] ?? 0;
            savedRon += (leftover / item.packSize) * packPrice;
          }
        });

        if (movedCount === 0) {
          return {
            activeNotice: {
              id: Date.now().toString(),
              title: 'Nimic de pus deoparte',
              message: 'Săptămâna asta consumă tot ce cumperi, deci cămara rămâne cum e.',
              type: 'info',
            },
          };
        }

        // Parked until the next plan is generated. Writing straight to `pantryStock` meant the
        // first re-aggregation of the CURRENT week subtracted it, and eleven items disappeared
        // from a list the user was still shopping from.
        const nextPrefs: UserPreferences = { ...state.preferences, pendingPantryStock: carried };
        void storageService.savePreferences(nextPrefs);

        return {
          preferences: nextPrefs,
          activeNotice: {
            id: Date.now().toString(),
            title: 'Surplus trecut în cămară',
            message: `Am pus deoparte ${movedCount} ${movedCount === 1 ? 'ingredient' : 'ingrediente'} care îți rămân, cam ${Math.round(savedRon)} lei. Se scad când generezi planul următor.`,
            type: 'info',
          },
        };
      });
    },
  } satisfies Partial<AppState>;
}
