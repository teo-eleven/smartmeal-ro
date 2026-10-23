import { calculateMinimumViableBudget } from '../engine/budgetCalculator';
import { aggregateGroceryList } from '../engine/groceryAggregator';
import { checkPlanFeasibility, generateMealPlan } from '../engine/plannerEngine';
import { storageService } from '../services/storage';
import { MealPlan, SavedPlan, UserPreferences } from '../types';
import { parseUserPreferences } from '../utils/preferencesValidation';
import {
  collectMealsFromDays,
  getActiveExtraProductIds,
  getActiveExtraProducts,
  rebuildCart,
} from './cart';
import { mergeProtections } from './preferenceProtections';

import { StoreApi } from 'zustand';
import { AppState } from './appState';
import { DEFAULT_PREFERENCES, MAX_SAVED_PLANS, nextSavedPlanId } from './defaults';
import {
  buildInfeasibleNotice,
  buildNothingSafeNotice,
  buildRestoreNotice,
  tryMakePlanSafe,
} from './planSafety';
import { keepingDessertDays, promotePendingStock } from './storeTransforms';

type SetState = StoreApi<AppState>['setState'];
type GetState = () => AppState;

/** Whole-plan operations: generate, reshuffle, rebuild, reset and the plan library. */
export function createPlanActions(set: SetState, get: GetState) {
  return {
    resetOnboarding: () => {
      void storageService.clearAll();
      // clearAll() wipes stored preferences, so memory has to follow: keeping the old
      // preferences in memory left the two disagreeing until the next reload silently
      // reverted everything to defaults.
      set((state) => ({
        currentStep: 1,
        maxVisitedStep: 1,
        activeView: 'onboarding',
        currentPlan: null,
        groceryItems: [],
        // The cupboard and the thumbs are things the user built up, not onboarding answers.
        // Starting a new week is exactly when the surplus is supposed to pay off, so wiping
        // it here erased the point of having carried it.
        preferences: {
          ...DEFAULT_PREFERENCES,
          pantryStock: state.preferences.pantryStock,
          pendingPantryStock: state.preferences.pendingPantryStock,
          dislikedRecipeIds: state.preferences.dislikedRecipeIds,
          favouriteRecipeIds: state.preferences.favouriteRecipeIds,
        },
        // Held in memory only, so the user can take the reset back straight away.
        lastDiscardedPlan: state.currentPlan
          ? {
              plan: state.currentPlan,
              groceryItems: state.groceryItems,
              preferences: state.preferences,
            }
          : state.lastDiscardedPlan,
      }));
    },

    /**
     * Generates a plan from sensible defaults so the app is useful before answering nine
     * questions. The supermarket is kept if already chosen, since it is the one answer that
     * cannot be guessed. Budget is derived, never hardcoded, so the plan always fits it.
     */
    quickStart: () => {
      const { preferences } = get();

      const baseQuickPrefs: UserPreferences = {
        ...DEFAULT_PREFERENCES,
        supermarketId: preferences.supermarketId,
        peopleCount: preferences.peopleCount,
        cookingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        mealSlots: ['dinner'],
        moodTags: ['speedy', 'family_fav'],
        appliances: ['hob', 'oven', 'air_fryer'],
        foodTier: 'medium',
      };

      const quickPrefs: UserPreferences = {
        ...baseQuickPrefs,
        budgetRon: Math.max(
          baseQuickPrefs.budgetRon,
          calculateMinimumViableBudget(
            baseQuickPrefs.peopleCount,
            baseQuickPrefs.cookingDays.length,
            baseQuickPrefs.supermarketId,
            baseQuickPrefs.excludePantryStaples,
            1,
            baseQuickPrefs.foodTier
          ) * 2
        ),
      };

      const feasibility = checkPlanFeasibility(quickPrefs);
      if (!feasibility.isFeasible) {
        set({
          activeNotice: buildInfeasibleNotice(
            feasibility.reasonRo || 'Nu s-a putut porni rapid. Alege manual preferințele.'
          ),
        });
        return;
      }

      void storageService.savePreferences(quickPrefs);
      set((state) => ({
        preferences: quickPrefs,
        // Every step counts as seen, so the user can jump back into any of them later.
        currentStep: state.totalSteps,
        maxVisitedStep: state.totalSteps,
      }));

      get().generatePlan();
    },

    undoReset: () => {
      set((state) => {
        const discarded = state.lastDiscardedPlan;
        if (!discarded) return state;

        void storageService.savePreferences(discarded.preferences);
        void storageService.savePlanAndGrocery(discarded.plan, discarded.groceryItems);

        return {
          preferences: discarded.preferences,
          currentPlan: discarded.plan,
          groceryItems: discarded.groceryItems,
          activeView: 'meals',
          lastDiscardedPlan: null,
        };
      });
    },

    saveCurrentPlan: (name: string) => {
      set((state) => {
        if (!state.currentPlan) return state;

        const entry: SavedPlan = {
          id: nextSavedPlanId(),
          name: name.trim() || `Plan din ${new Date().toLocaleDateString('ro-RO')}`,
          savedAt: new Date().toISOString(),
          plan: state.currentPlan,
          preferences: state.preferences,
        };

        const savedPlans = [entry, ...state.savedPlans].slice(0, MAX_SAVED_PLANS);
        void storageService.saveSavedPlans(savedPlans);
        return { savedPlans };
      });
    },

    restoreSavedPlan: (savedPlanId: string) => {
      set((state) => {
        const entry = state.savedPlans.find((p) => p.id === savedPlanId);
        if (!entry || !entry.plan || !Array.isArray(entry.plan.days) || !entry.preferences) {
          return {
            activeNotice: {
              id: Date.now().toString(),
              title: 'Plan deteriorat',
              message:
                'Planul salvat nu mai poate fi citit și nu a fost încărcat. Îl poți șterge din listă.',
              type: 'error',
            },
          };
        }

        // The saved plan brings back its menu, not the user's settings. Everything starts from
        // TODAY's preferences; only the shape of the week comes from the entry, so later
        // rebuilds match the plan on screen. Protections from both sides are kept, and the
        // entry is parsed like any other stored data before any of it is believed.
        const entryPrefs = parseUserPreferences(entry.preferences, state.preferences);
        const effectivePrefs: UserPreferences = {
          ...state.preferences,
          cookingDays: entryPrefs.cookingDays,
          mealSlots: entryPrefs.mealSlots,
          dailyMealSlots: entryPrefs.dailyMealSlots,
          peopleCount: entryPrefs.peopleCount,
          ...mergeProtections(state.preferences, entryPrefs),
        };

        const checked = tryMakePlanSafe(entry.plan.days, effectivePrefs);
        if (!checked) return { activeNotice: buildNothingSafeNotice('restore') };
        const { days: safeDays, replacedCount, offendingAllergens } = checked;

        const aggregated = aggregateGroceryList(
          collectMealsFromDays(safeDays),
          effectivePrefs.supermarketId,
          effectivePrefs.excludePantryStaples,
          getActiveExtraProductIds(effectivePrefs),
          effectivePrefs.pantryInventory || [],
          effectivePrefs.pantryStock || {}
        );

        const restoredPlan: MealPlan = {
          ...entry.plan,
          days: safeDays,
          totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
          totalCartCostRon: aggregated.totalCartCostRon,
          extraProducts: getActiveExtraProducts(effectivePrefs),
        };

        void storageService.savePreferences(effectivePrefs);
        void storageService.savePlanAndGrocery(restoredPlan, aggregated.items);

        return {
          preferences: effectivePrefs,
          currentPlan: restoredPlan,
          groceryItems: aggregated.items,
          activeView: 'meals',
          activeNotice:
            replacedCount > 0
              ? {
                  id: Date.now().toString(),
                  title: 'Plan adaptat la setările tale',
                  message: buildRestoreNotice(replacedCount, offendingAllergens),
                  type: 'warning',
                }
              : state.activeNotice,
        };
      });
    },

    deleteSavedPlan: (savedPlanId: string) => {
      set((state) => {
        const savedPlans = state.savedPlans.filter((p) => p.id !== savedPlanId);
        void storageService.saveSavedPlans(savedPlans);
        return { savedPlans };
      });
    },

    generatePlan: () => {
      // Generating a plan is the moment a new week starts, so whatever was put aside from the
      // last one becomes the cupboard now -- but only once the plan exists: promoting first
      // and then failing replaced the cupboard with nothing to show for it.
      const preferences = promotePendingStock(get().preferences);

      const feasibility = checkPlanFeasibility(preferences);
      if (!feasibility.isFeasible) {
        set({
          activeNotice: buildInfeasibleNotice(
            feasibility.reasonRo || 'Preferințele alese nu permit generarea unui plan.'
          ),
        });
        return false;
      }

      const plan = generateMealPlan(preferences);

      const aggregated = aggregateGroceryList(
        collectMealsFromDays(plan.days),
        preferences.supermarketId,
        preferences.excludePantryStaples,
        getActiveExtraProductIds(preferences),
        preferences.pantryInventory || [],
        preferences.pantryStock || {}
      );

      // The freshly aggregated totals are the ones shown to the user, so the plan has to
      // carry them: the engine's own figures do not know about pantry stock.
      // Ensure the initial plan budget cleanly matches or accommodates the realistic cart cost
      // so the user is not greeted with an artificial deficit on the very first screen.
      const resolvedBudgetRon = Math.max(plan.totalBudgetRon, aggregated.totalCartCostRon);

      const savedPlan: MealPlan = {
        ...plan,
        totalBudgetRon: resolvedBudgetRon,
        totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
        totalCartCostRon: aggregated.totalCartCostRon,
        extraProducts: getActiveExtraProducts(preferences),
      };

      const finalPreferences = {
        ...preferences,
        budgetRon: resolvedBudgetRon,
      };
      void storageService.savePreferences(finalPreferences);
      void storageService.savePlanAndGrocery(savedPlan, aggregated.items);

      set(() => ({
        preferences: finalPreferences,
        currentPlan: savedPlan,
        groceryItems: aggregated.items,
        activeView: 'meals',
      }));
      return true;
    },

    reshufflePlan: () => {
      const { preferences, currentPlan } = get();
      if (!currentPlan) {
        get().generatePlan();
        return;
      }

      const feasibility = checkPlanFeasibility(preferences);
      if (!feasibility.isFeasible) {
        set({
          activeNotice: buildInfeasibleNotice(
            feasibility.reasonRo || 'Preferințele alese nu permit generarea unui plan.'
          ),
        });
        return;
      }

      const currentRecipeIds = new Set(
        currentPlan.days.flatMap((day) => day.meals.map((meal) => meal.recipe.id))
      );
      const newPlan = generateMealPlan(keepingDessertDays(preferences, currentPlan), {
        reshuffle: true,
        excludedRecipeIds: currentRecipeIds,
      });
      // A reshuffle is a new week: the basket starts empty.
      const { plan: updatedPlan, items } = rebuildCart(newPlan, newPlan.days, preferences);

      void storageService.savePlanAndGrocery(updatedPlan, items);
      set({ currentPlan: updatedPlan, groceryItems: items });
    },

    updatePreferencesAndRebuild: (newPrefs: Partial<UserPreferences>) => {
      const { preferences, currentPlan, groceryItems } = get();
      const nextPrefs: UserPreferences = { ...preferences, ...newPrefs };

      // Feasibility is checked before anything is persisted: a rebuild that cannot succeed
      // must leave both memory and storage exactly as they were.
      const feasibility = checkPlanFeasibility(nextPrefs);
      if (!feasibility.isFeasible) {
        set({
          activeNotice: buildInfeasibleNotice(
            feasibility.reasonRo || 'Preferințele alese nu permit generarea unui plan.'
          ),
        });
        return;
      }

      // Generate first, persist second: a generation that throws must not leave storage holding
      // preferences that memory never adopted.
      let newPlan: MealPlan;
      try {
        newPlan = generateMealPlan(keepingDessertDays(nextPrefs, currentPlan));
      } catch (error) {
        console.warn('[useAppStore] Rebuild failed, preferences unchanged:', error);
        set({
          activeNotice: buildInfeasibleNotice(
            'Nu am putut reface meniul cu aceste setări. Am păstrat meniul și setările de până acum.'
          ),
        });
        return;
      }
      const { plan: updatedPlan, items } = rebuildCart(
        newPlan,
        newPlan.days,
        nextPrefs,
        groceryItems
      );

      void storageService.savePreferences(nextPrefs);
      void storageService.savePlanAndGrocery(updatedPlan, items);
      set({ preferences: nextPrefs, currentPlan: updatedPlan, groceryItems: items });
    },
  } satisfies Partial<AppState>;
}
