import { resolveRecipeId } from '../data/recipeIdAliases';
import { RECIPES_MAP } from '../data/recipes';
import { calculateRecipePortionCost } from '../engine/budgetCalculator';
import { aggregateGroceryList } from '../engine/groceryAggregator';
import { checkPlanFeasibility, generateMealPlan } from '../engine/plannerEngine';
import { storageService } from '../services/storage';
import { MealPlan, MealPlanDay, PlannedMeal, UserPreferences } from '../types';
import { parseUserPreferences } from '../utils/preferencesValidation';
import {
  collectMealsFromDays,
  getActiveExtraProductIds,
  getActiveExtraProducts,
  mergePurchased,
} from './cart';
import { describeUnsafeRecipe } from './planSafety';
import { mergeProtections, stricterDiet } from './preferenceProtections';

import { AppState, DiscardReason, DiscardedPlan, PendingCloudPlan, SystemNotice } from './appState';
import {
  buildInfeasibleNotice,
  buildNothingSafeNotice,
  buildRestoreNotice,
  tryMakePlanSafe,
} from './planSafety';

/**
 * Without a Supabase project there is no cloud to sync with, only the local account
 * simulation. Saying "session expired" there sent someone who was signed in round a loop
 * with no exit; this says what is actually true.
 */
export function syncUnavailableNotice() {
  return {
    id: Date.now().toString(),
    title: 'Sincronizare indisponibilă',
    message:
      'Sincronizarea între telefoane nu e disponibilă pe această versiune. Planul tău e salvat pe acest dispozitiv.',
    type: 'info' as const,
  };
}

function isServingCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1;
}

/** The cooked-double meal back to its own servings, recosted. */
export function undoDoubleOnSource(meal: PlannedMeal, prefs: UserPreferences): PlannedMeal {
  // Stored data is untrusted: only a positive, finite count is believed.
  const servings = isServingCount(meal.servingsBeforeDouble)
    ? meal.servingsBeforeDouble
    : Math.max(1, Math.round(meal.servings / 2));
  return {
    ...meal,
    servingsBeforeDouble: undefined,
    servings,
    estimatedCostRon: calculateRecipePortionCost(
      meal.recipe,
      servings,
      prefs.supermarketId,
      prefs.excludePantryStaples
    ),
  };
}

/** A leftover turned back into the meal it replaced (or its own dish when none is known). */
export function restoreReplacedMeal(meal: PlannedMeal, prefs: UserPreferences): PlannedMeal {
  // The replaced dish comes back only as the catalog defines it today, and only if today's
  // rules still allow it: an allergy declared since the double must not be undone by undo.
  const canonical = meal.replacedRecipe
    ? RECIPES_MAP[resolveRecipeId(meal.replacedRecipe.id)]
    : undefined;
  const canRestore = canonical !== undefined && describeUnsafeRecipe(canonical, prefs) === null;
  const recipe = canRestore ? canonical : meal.recipe;
  const servings =
    canRestore && isServingCount(meal.replacedServings) ? meal.replacedServings : meal.servings;
  return {
    ...meal,
    replacedRecipe: undefined,
    replacedServings: undefined,
    leftoverFromMealId: undefined,
    leftoverFromDay: undefined,
    recipe,
    servings,
    isLeftover: false,
    estimatedCostRon: calculateRecipePortionCost(
      recipe,
      servings,
      prefs.supermarketId,
      prefs.excludePantryStaples
    ),
  };
}

/**
 * Generation-only preferences that ask for a dessert on every day that has one now, so
 * regenerating a week keeps the user's desserts AND the budget pass sees them. Appending them
 * afterwards let a plan end over budget while its budgetStatus still said "within budget".
 * Never persisted: the user's own per-day slots stay as they were.
 */
export function keepingDessertDays(
  prefs: UserPreferences,
  previous: MealPlan | null
): UserPreferences {
  const dessertDays = (previous?.days ?? [])
    .filter((day) => day.meals.some((meal) => meal.slot === 'dessert'))
    .map((day) => day.dayOfWeek);
  if (dessertDays.length === 0) return prefs;

  const dailyMealSlots = { ...(prefs.dailyMealSlots ?? {}) };
  dessertDays.forEach((day) => {
    const slots = dailyMealSlots[day] ?? prefs.mealSlots;
    if (!slots.includes('dessert')) dailyMealSlots[day] = [...slots, 'dessert'];
  });
  return { ...prefs, dailyMealSlots };
}

/**
 * Moves the parked surplus into the cupboard, which is what starting a new week means.
 * Called wherever a fresh plan is generated, never while one is being shopped for.
 */
export function promotePendingStock(prefs: UserPreferences): UserPreferences {
  const pending = prefs.pendingPantryStock;
  if (!pending || Object.keys(pending).length === 0) return prefs;
  return { ...prefs, pantryStock: pending, pendingPantryStock: {} };
}

/**
 * Applies a preference change that requires regenerating the plan.
 *
 * Nothing is written to storage and no state changes unless the new preferences can
 * actually produce a plan. Persisting first and generating second is what used to let a
 * failed rebuild leave storage holding a state the app could not start from.
 */
export function applyPreferencesWithRebuild(
  state: AppState,
  nextPrefs: UserPreferences
): Partial<AppState> {
  const feasibility = checkPlanFeasibility(nextPrefs);
  if (!feasibility.isFeasible) {
    return {
      activeNotice: buildInfeasibleNotice(
        feasibility.reasonRo || 'Preferințele alese nu permit generarea unui plan.'
      ),
    };
  }

  if (!state.currentPlan) {
    void storageService.savePreferences(nextPrefs);
    return { preferences: nextPrefs };
  }

  const plan = generateMealPlan(nextPrefs);
  const aggregated = aggregateGroceryList(
    collectMealsFromDays(plan.days),
    nextPrefs.supermarketId,
    nextPrefs.excludePantryStaples,
    getActiveExtraProductIds(nextPrefs),
    nextPrefs.pantryInventory || [],
    nextPrefs.pantryStock || {}
  );
  const cartItems = mergePurchased(state.groceryItems, aggregated.items);

  const updatedPlan: MealPlan = {
    ...plan,
    totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
    totalCartCostRon: aggregated.totalCartCostRon,
    extraProducts: getActiveExtraProducts(nextPrefs),
  };

  void storageService.savePreferences(nextPrefs);
  void storageService.savePlanAndGrocery(updatedPlan, cartItems);

  return {
    preferences: nextPrefs,
    currentPlan: updatedPlan,
    groceryItems: cartItems,
  };
}

/**
 * A rebuild the user can take back: the week on screen, swaps included, goes to the Undo
 * banner. Only for layout changes (meals per day, tier); a safety setting such as an allergy
 * is never offered, or one tap would silently drop the protection with the old menu.
 */
export function rebuildKeepingUndo(state: AppState, nextPrefs: UserPreferences): Partial<AppState> {
  const result = applyPreferencesWithRebuild(state, nextPrefs);
  if (!result.currentPlan) return result;
  return { ...result, lastDiscardedPlan: keepForUndo(state, 'rebuild') };
}

/**
 * Recalculates the shopping cart for preference changes that affect prices but not the
 * menu itself, such as marking an ingredient as already at home. The meals are untouched.
 */
export function recalculateCartForPreferences(
  state: AppState,
  nextPrefs: UserPreferences
): Partial<AppState> {
  void storageService.savePreferences(nextPrefs);

  if (!state.currentPlan) {
    return { preferences: nextPrefs };
  }

  const aggregated = aggregateGroceryList(
    collectMealsFromDays(state.currentPlan.days),
    nextPrefs.supermarketId,
    nextPrefs.excludePantryStaples,
    getActiveExtraProductIds(nextPrefs),
    nextPrefs.pantryInventory || [],
    nextPrefs.pantryStock || {}
  );

  const cartItems = mergePurchased(state.groceryItems, aggregated.items);

  const updatedPlan: MealPlan = {
    ...state.currentPlan,
    totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
    totalCartCostRon: aggregated.totalCartCostRon,
    extraProducts: getActiveExtraProducts(nextPrefs),
  };

  void storageService.savePlanAndGrocery(updatedPlan, cartItems);

  return {
    preferences: nextPrefs,
    currentPlan: updatedPlan,
    groceryItems: cartItems,
  };
}

/**
 * Guards a preference change that does not rebuild the plan but could still make the
 * catalog empty (appliances, diet, supermarket). Returns null when the change is safe.
 */
export function rejectIfInfeasible(nextPrefs: UserPreferences): Partial<AppState> | null {
  const feasibility = checkPlanFeasibility(nextPrefs);
  if (feasibility.isFeasible) return null;
  return {
    activeNotice: buildInfeasibleNotice(
      feasibility.reasonRo || 'Preferințele alese nu permit generarea unui plan.'
    ),
  };
}

/**
 * Puts a plan fetched from the cloud in front of the user.
 *
 * The cloud is the fifth door a meal comes through, and the only one whose data crossed a
 * network from a copy of the app that may be older than this one. So: the other device's
 * preferences are adopted, because pulling them down is what the user asked for -- except
 * the allergies, which only ever grow when two devices meet. The plan is then re-checked
 * against the result, and the shopping list is recomputed rather than believed.
 */
/** The plan about to be replaced, held in memory so the Undo banner can bring it back. */
export function keepForUndo(state: AppState, reason: DiscardReason): DiscardedPlan | null {
  if (!state.currentPlan) return state.lastDiscardedPlan;
  return {
    reason,
    plan: state.currentPlan,
    groceryItems: state.groceryItems,
    preferences: state.preferences,
  };
}

export function applyCloudPlan(state: AppState, pending: PendingCloudPlan): Partial<AppState> {
  // The row crossed a network and was written by another copy of this app, possibly older.
  // It gets the same whitelist as anything read from storage, falling back field by field to
  // what this device already holds -- a cloud row carrying peopleCount: -3 used to be adopted
  // whole and then threw out of a tap handler.
  const cloudPrefs = pending.preferences
    ? parseUserPreferences(pending.preferences, state.preferences)
    : state.preferences;

  // Taste follows the cloud, which is what the user asked for; protections only get stricter.
  const effectivePrefs: UserPreferences = {
    ...cloudPrefs,
    ...mergeProtections(cloudPrefs, state.preferences),
    ...stricterDiet(state.preferences, cloudPrefs),
  };

  // Even valid-looking preferences can describe a week nobody can cook. Refusing beats
  // adopting a state the app cannot generate from.
  const feasibility = checkPlanFeasibility(effectivePrefs);
  if (!feasibility.isFeasible) {
    return {
      confirmRequest: null,
      pendingCloudPlan: null,
      activeNotice: buildInfeasibleNotice(
        `Planul din cloud vine cu setări care nu permit niciun meniu aici: ${
          feasibility.reasonRo ?? 'combinație imposibilă'
        } Am păstrat ce ai pe dispozitivul ăsta.`
      ),
    };
  }

  const checked = tryMakePlanSafe(pending.plan.days, effectivePrefs);
  if (!checked) {
    return {
      confirmRequest: null,
      pendingCloudPlan: null,
      activeNotice: buildNothingSafeNotice('cloud'),
    };
  }
  const { days: safeDays, replacedCount, offendingAllergens } = checked;

  const aggregated = aggregateGroceryList(
    collectMealsFromDays(safeDays),
    effectivePrefs.supermarketId,
    effectivePrefs.excludePantryStaples,
    getActiveExtraProductIds(effectivePrefs),
    effectivePrefs.pantryInventory || [],
    effectivePrefs.pantryStock || {}
  );

  const downloadedPlan: MealPlan = {
    ...pending.plan,
    days: safeDays,
    supermarketId: effectivePrefs.supermarketId,
    peopleCount: effectivePrefs.peopleCount,
    totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
    totalCartCostRon: aggregated.totalCartCostRon,
    extraProducts: getActiveExtraProducts(effectivePrefs),
  };

  void storageService.savePreferences(effectivePrefs);
  void storageService.savePlanAndGrocery(downloadedPlan, aggregated.items);

  return {
    preferences: effectivePrefs,
    currentPlan: downloadedPlan,
    groceryItems: aggregated.items,
    activeView: 'meals',
    confirmRequest: null,
    pendingCloudPlan: null,
    // Whatever this replaced stays recoverable, the same way a reset does.
    lastDiscardedPlan: keepForUndo(state, 'cloud'),
    activeNotice: {
      id: Date.now().toString(),
      title: replacedCount > 0 ? 'Plan adaptat la setările tale' : 'Plan descărcat din cloud',
      message:
        replacedCount > 0
          ? buildRestoreNotice(replacedCount, offendingAllergens)
          : 'Am adus planul salvat pe celălalt dispozitiv. Îl poți anula imediat dacă nu era cel dorit.',
      type: replacedCount > 0 ? 'warning' : 'info',
    },
  };
}

/** Rebuilds the cart from a new set of days, so the header never drifts from the list. */
export function withRecalculatedCart(
  state: AppState,
  days: MealPlanDay[],
  notice: SystemNotice | null
): Partial<AppState> {
  const prefs = state.preferences;
  const aggregated = aggregateGroceryList(
    collectMealsFromDays(days),
    prefs.supermarketId,
    prefs.excludePantryStaples,
    getActiveExtraProductIds(prefs),
    prefs.pantryInventory || [],
    prefs.pantryStock || {}
  );
  const cartItems = mergePurchased(state.groceryItems, aggregated.items);

  const updatedPlan: MealPlan = {
    ...state.currentPlan!,
    days,
    totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
    totalCartCostRon: aggregated.totalCartCostRon,
    extraProducts: getActiveExtraProducts(prefs),
  };

  void storageService.savePlanAndGrocery(updatedPlan, cartItems);

  return {
    currentPlan: updatedPlan,
    groceryItems: cartItems,
    activeNotice: notice ?? state.activeNotice,
  };
}

export function applyPreferenceStep(
  state: AppState,
  nextPrefs: UserPreferences
): Partial<AppState> {
  if (!state.currentPlan) {
    void storageService.savePreferences(nextPrefs);
    return { preferences: nextPrefs };
  }
  return applyPreferencesWithRebuild(state, nextPrefs);
}
