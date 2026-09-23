import { create } from 'zustand';
import {
  Allergen,
  Appliance,
  DayOfWeek,
  DietType,
  FoodTier,
  GroceryListItem,
  MealPlan,
  MealPlanDay,
  MealSlot,
  SavedPlan,
  MoodTag,
  PlannedMeal,
  Recipe,
  RetailProduct,
  SupermarketId,
  UserPreferences,
} from '../types';
import {
  checkPlanFeasibility,
  generateMealPlan,
  getAlternativeRecipes,
  getEligibleRecipes,
  getSlotLabelRo,
  isSupermarketCompatible,
  selectOptimalDessertForDay,
  swapMealInPlan,
} from '../engine/plannerEngine';
import { aggregateGroceryList } from '../engine/groceryAggregator';
import { calculateMinimumViableBudget, calculateRecipePortionCost } from '../engine/budgetCalculator';
import { RETAIL_PRODUCTS_MAP } from '../data/retailProducts';
import { SUPERMARKETS } from '../data/supermarkets';
import { ALLERGEN_CATALOG } from '../data/allergens';
import { getRecipeAllergens } from '../utils/allergenFilter';
import { storageService } from '../services/storage';
import { cloudSyncService } from '../services/supabase';
import { areDietsCompatible } from '../utils/dietCompatibility';

export type ActiveView = 'onboarding' | 'generating' | 'meals' | 'grocery';

/** Actions destructive enough to require an explicit yes before they run. */
export type ConfirmActionId = 'reset_onboarding';

/** Everything needed to put a reset week back exactly as it was. */
export interface DiscardedPlan {
  plan: MealPlan;
  groceryItems: GroceryListItem[];
  preferences: UserPreferences;
}

export interface SystemNotice {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export interface AppState {
  // Navigation & Progress
  currentStep: number;
  maxVisitedStep: number;
  totalSteps: number;
  activeView: ActiveView;
  isHydrated: boolean;
  userEmail: string | null;
  isSyncing: boolean;
  lastSyncedAt: string | null;

  // Pending confirmation for a destructive action
  confirmRequest: ConfirmActionId | null;
  requestConfirm: (action: ConfirmActionId) => void;
  cancelConfirm: () => void;
  confirmPending: () => void;

  // System Informative Notice
  activeNotice: SystemNotice | null;
  showNotice: (
    title: string,
    message: string,
    type?: 'info' | 'warning' | 'error' | 'success'
  ) => void;
  clearNotice: () => void;

  // Domain State
  preferences: UserPreferences;
  currentPlan: MealPlan | null;
  groceryItems: GroceryListItem[];

  // Plan library & one-step undo for the destructive reset
  savedPlans: SavedPlan[];
  lastDiscardedPlan: DiscardedPlan | null;
  saveCurrentPlan: (name: string) => void;
  restoreSavedPlan: (savedPlanId: string) => void;
  deleteSavedPlan: (savedPlanId: string) => void;
  undoReset: () => void;
  dismissUndo: () => void;

  // Actions
  setSupermarket: (id: SupermarketId) => void;
  setPeopleCount: (count: number) => void;
  toggleCookingDay: (day: DayOfWeek) => void;
  setCookingDays: (days: DayOfWeek[]) => void;
  setBudget: (budget: number) => void;
  toggleMoodTag: (tag: MoodTag) => void;
  setDietType: (diet: DietType) => void;
  toggleDietType: (diet: DietType) => void;
  setDietTypes: (diets: DietType[]) => void;
  togglePantryItem: (ingredientId: string) => void;
  setPantryInventory: (items: string[]) => void;
  toggleAvoidedAllergen: (allergen: Allergen) => void;
  toggleAppliance: (appliance: Appliance) => void;
  setExcludePantryStaples: (exclude: boolean) => void;
  setMealSlots: (slots: MealSlot[]) => void;
  setMealsPerDayCount: (count: 1 | 2 | 3) => void;
  setFoodTier: (tier: FoodTier) => void;
  toggleExtraSlot: (slot: 'dessert') => void;
  addExtraMealToDay: (dayOfWeek: DayOfWeek, slot: 'dessert') => void;
  removeMealFromDay: (dayOfWeek: DayOfWeek, mealId: string) => void;
  setMealServings: (dayOfWeek: DayOfWeek, mealId: string, servings: number) => void;

  // Retail Snacks & Drinks Actions
  toggleSnackProduct: (productId: string) => void;
  toggleDrinkProduct: (productId: string) => void;
  setIncludeAlcohol: (include: boolean) => void;
  clearSnacksAndDrinks: () => void;

  // Wizard Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetOnboarding: () => void;
  quickStart: () => void;

  // Plan Operations
  generatePlan: () => void;
  reshufflePlan: () => void;
  updatePreferencesAndRebuild: (newPrefs: Partial<UserPreferences>) => void;
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
  dietTypes: ['omnivore'],
  appliances: ['hob', 'oven', 'air_fryer'],
  excludePantryStaples: true,
  pantryInventory: [],
  avoidedAllergens: [],
  mealSlots: ['dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

/** One portion is the floor; beyond a dozen the pack-size maths stops being meaningful. */
/** Keeps the archive from growing without bound in local storage. */
const MAX_SAVED_PLANS = 20;

/**
 * Date.now() alone collides when two plans are saved inside the same millisecond, and two
 * entries sharing an id means deleting one deletes both. The counter makes ids unique.
 */
let savedPlanCounter = 0;
function nextSavedPlanId(): string {
  savedPlanCounter += 1;
  return `saved-${Date.now()}-${savedPlanCounter}`;
}
const MIN_MEAL_SERVINGS = 1;
const MAX_MEAL_SERVINGS = 12;

function getActiveExtraProductIds(prefs: UserPreferences): string[] {
  const snacks = prefs.selectedSnackIds || [];
  const drinks = prefs.selectedDrinkIds || [];
  return [...snacks, ...drinks];
}

/** The chosen snacks and drinks as full products, so a saved plan carries its own extras. */
function getActiveExtraProducts(prefs: UserPreferences): RetailProduct[] {
  return getActiveExtraProductIds(prefs)
    .map((id) => RETAIL_PRODUCTS_MAP[id])
    .filter((product): product is RetailProduct => Boolean(product));
}

const KNOWN_ALLERGENS = new Set<string>(ALLERGEN_CATALOG.map((a) => a.id));

/**
 * Allergen lists only ever grow when they meet. Restoring an older plan, or reading a list
 * back from storage, must never be a way to end up protected against less than before.
 */
function mergeAllergens(a?: Allergen[], b?: Allergen[]): Allergen[] {
  return Array.from(new Set([...(a ?? []), ...(b ?? [])]));
}

/** Storage is untrusted: anything that is not a known allergen id is dropped. */
export function sanitizeAllergens(value: unknown): { allergens: Allergen[]; wasRepaired: boolean } {
  if (!Array.isArray(value)) {
    return { allergens: [], wasRepaired: value !== undefined };
  }
  const allergens = value.filter(
    (item): item is Allergen => typeof item === 'string' && KNOWN_ALLERGENS.has(item)
  );
  return { allergens, wasRepaired: allergens.length !== value.length };
}

/**
 * Re-checks every meal of a restored plan against the preferences in force now, replacing
 * any that would break diet, allergen or appliance rules. Generation already guarantees
 * this; restoring an archived plan is the second door into the user's week.
 */
function makePlanSafeForPreferences(
  days: MealPlanDay[],
  preferences: UserPreferences
): { days: MealPlanDay[]; replacedCount: number; offendingAllergens: Allergen[] } {
  const eligible = getEligibleRecipes(preferences);
  const avoided = preferences.avoidedAllergens ?? [];
  let replacedCount = 0;
  const offending = new Set<Allergen>();

  const usage = new Map<string, number>();
  days.forEach((day) =>
    day.meals.forEach((meal) => usage.set(meal.recipe.id, (usage.get(meal.recipe.id) || 0) + 1))
  );

  const safeDays = days.map((day) => {
    const meals = day.meals.map((meal) => {
      const isSafe = eligible.some((recipe) => recipe.id === meal.recipe.id);
      if (isSafe) return meal;

      getRecipeAllergens(meal.recipe)
        .filter((allergen) => avoided.includes(allergen))
        .forEach((allergen) => offending.add(allergen));

      const replacement =
        eligible.find(
          (recipe) =>
            (recipe.suitableSlots ? recipe.suitableSlots.includes(meal.slot) : true) &&
            (usage.get(recipe.id) || 0) < 2
        ) ??
        eligible.find((recipe) =>
          recipe.suitableSlots ? recipe.suitableSlots.includes(meal.slot) : true
        ) ??
        eligible[0];

      replacedCount += 1;
      if (!replacement) return null;

      usage.set(replacement.id, (usage.get(replacement.id) || 0) + 1);
      return {
        ...meal,
        recipe: replacement,
        estimatedCostRon: calculateRecipePortionCost(
          replacement,
          meal.servings,
          preferences.supermarketId,
          preferences.excludePantryStaples
        ),
      };
    });

    const keptMeals = meals.filter((meal): meal is PlannedMeal => meal !== null);
    const primary = keptMeals.find((meal) => meal.slot === 'dinner') || keptMeals[0];
    const sum = keptMeals.reduce((total, meal) => total + meal.estimatedCostRon, 0);

    return {
      ...day,
      meals: keptMeals,
      recipe: primary ? primary.recipe : day.recipe,
      estimatedCostRon: Math.round(sum * 100) / 100,
    };
  });

  return { days: safeDays, replacedCount, offendingAllergens: Array.from(offending) };
}

function buildRestoreNotice(replacedCount: number, offendingAllergens: Allergen[]): string {
  const meals = `${replacedCount} ${replacedCount === 1 ? 'masă' : 'mese'}`;
  if (offendingAllergens.length === 0) {
    return `Am înlocuit ${meals} care nu se potriveau cu dieta sau cu aparatele tale actuale.`;
  }
  const labels = offendingAllergens
    .map((id) => ALLERGEN_CATALOG.find((a) => a.id === id)?.label.toLowerCase() ?? id)
    .join(', ');
  return `Am înlocuit ${meals} care conțineau ${labels}. Alergiile tale rămân active.`;
}

/**
 * Picks a replacement for a dish the newly chosen store does not carry, preferring one not
 * already used this week, then this day, then anything legal. Returns null when the catalog
 * genuinely offers nothing — the caller must then tell the user rather than quietly leaving
 * a dish the store does not stock.
 */
export function pickStoreCompatibleReplacement(
  alternatives: Recipe[],
  usedThisDay: Set<string>,
  usedThisWeek: Set<string>
): Recipe | null {
  const notUsedThisDay = alternatives.filter((alt) => !usedThisDay.has(alt.id));
  const notUsedThisWeek = notUsedThisDay.filter((alt) => !usedThisWeek.has(alt.id));
  return notUsedThisWeek[0] ?? notUsedThisDay[0] ?? alternatives[0] ?? null;
}

function buildInfeasibleNotice(reason: string): SystemNotice {
  return {
    id: Date.now().toString(),
    title: 'Combinație imposibilă',
    message: reason,
    type: 'warning',
  };
}

function collectMealsFromDays(days: MealPlanDay[]): { recipe: Recipe; servings: number }[] {
  const meals: { recipe: Recipe; servings: number }[] = [];
  days.forEach((day) =>
    day.meals.forEach((meal) => meals.push({ recipe: meal.recipe, servings: meal.servings }))
  );
  return meals;
}

function collectPlanMeals(plan: MealPlan): { recipe: Recipe; servings: number }[] {
  const meals: { recipe: Recipe; servings: number }[] = [];
  plan.days.forEach((day) => {
    day.meals.forEach((meal) => meals.push({ recipe: meal.recipe, servings: meal.servings }));
  });
  return meals;
}

/**
 * Applies a preference change that requires regenerating the plan.
 *
 * Nothing is written to storage and no state changes unless the new preferences can
 * actually produce a plan. Persisting first and generating second is what used to let a
 * failed rebuild leave storage holding a state the app could not start from.
 */
function applyPreferencesWithRebuild(
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
    collectPlanMeals(plan),
    nextPrefs.supermarketId,
    nextPrefs.excludePantryStaples,
    getActiveExtraProductIds(nextPrefs),
    nextPrefs.pantryInventory || []
  );

  const updatedPlan: MealPlan = {
    ...plan,
    totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
    totalCartCostRon: aggregated.totalCartCostRon,
    extraProducts: getActiveExtraProducts(nextPrefs),
  };

  void storageService.savePreferences(nextPrefs);
  void storageService.savePlanAndGrocery(updatedPlan, aggregated.items);

  return {
    preferences: nextPrefs,
    currentPlan: updatedPlan,
    groceryItems: aggregated.items,
  };
}

/**
 * Recalculates the shopping cart for preference changes that affect prices but not the
 * menu itself, such as marking an ingredient as already at home. The meals are untouched.
 */
function recalculateCartForPreferences(
  state: AppState,
  nextPrefs: UserPreferences
): Partial<AppState> {
  void storageService.savePreferences(nextPrefs);

  if (!state.currentPlan) {
    return { preferences: nextPrefs };
  }

  const aggregated = aggregateGroceryList(
    collectPlanMeals(state.currentPlan),
    nextPrefs.supermarketId,
    nextPrefs.excludePantryStaples,
    getActiveExtraProductIds(nextPrefs),
    nextPrefs.pantryInventory || []
  );

  const updatedPlan: MealPlan = {
    ...state.currentPlan,
    totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
    totalCartCostRon: aggregated.totalCartCostRon,
    extraProducts: getActiveExtraProducts(nextPrefs),
  };

  void storageService.savePlanAndGrocery(updatedPlan, aggregated.items);

  return {
    preferences: nextPrefs,
    currentPlan: updatedPlan,
    groceryItems: aggregated.items,
  };
}

/**
 * Guards a preference change that does not rebuild the plan but could still make the
 * catalog empty (appliances, diet, supermarket). Returns null when the change is safe.
 */
function rejectIfInfeasible(nextPrefs: UserPreferences): Partial<AppState> | null {
  const feasibility = checkPlanFeasibility(nextPrefs);
  if (feasibility.isFeasible) return null;
  return {
    activeNotice: buildInfeasibleNotice(
      feasibility.reasonRo || 'Preferințele alese nu permit generarea unui plan.'
    ),
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  currentStep: 1,
  maxVisitedStep: 1,
  totalSteps: 9,
  activeView: 'onboarding',
  isHydrated: false,
  userEmail: null,
  isSyncing: false,
  lastSyncedAt: null,
  preferences: { ...DEFAULT_PREFERENCES },
  currentPlan: null,
  groceryItems: [],
  savedPlans: [],
  lastDiscardedPlan: null,

  // Pending confirmation for a destructive action
  confirmRequest: null,
  requestConfirm: (action: ConfirmActionId) => set({ confirmRequest: action }),
  cancelConfirm: () => set({ confirmRequest: null }),
  confirmPending: () => {
    const pending = get().confirmRequest;
    if (!pending) return;
    set({ confirmRequest: null });
    if (pending === 'reset_onboarding') {
      get().resetOnboarding();
    }
  },

  // System Informative Notice
  activeNotice: null,
  showNotice: (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info'
  ) => set({ activeNotice: { id: Date.now().toString(), title, message, type } }),
  clearNotice: () => set({ activeNotice: null }),

  hydrateStorage: async () => {
    try {
      const rawStoredPrefs = await storageService.loadPreferences();
      const { plan, items } = await storageService.loadPlanAndGrocery();
      const savedPlans = await storageService.loadSavedPlans();

      // An older build could persist preferences that make the catalog empty, which left
      // the app unable to start at all. Repair such a state instead of inheriting it.
      let storedPrefs = rawStoredPrefs;
      let repairedPrefsNotice: SystemNotice | null = null;

      if (storedPrefs) {
        const repairs: string[] = [];

        // Storage is untrusted. An unreadable allergen list must not cost the user the rest
        // of their settings, and must never be silently treated as "no allergies".
        const { allergens, wasRepaired } = sanitizeAllergens(storedPrefs.avoidedAllergens);
        if (wasRepaired) {
          repairs.push('lista de alergii');
        }
        storedPrefs = { ...storedPrefs, avoidedAllergens: allergens };

        if (!checkPlanFeasibility(storedPrefs).isFeasible) {
          storedPrefs = {
            ...storedPrefs,
            cookingDays:
              storedPrefs.cookingDays && storedPrefs.cookingDays.length > 0
                ? storedPrefs.cookingDays
                : DEFAULT_PREFERENCES.cookingDays,
            peopleCount:
              storedPrefs.peopleCount >= 1
                ? storedPrefs.peopleCount
                : DEFAULT_PREFERENCES.peopleCount,
            budgetRon:
              storedPrefs.budgetRon > 0 ? storedPrefs.budgetRon : DEFAULT_PREFERENCES.budgetRon,
          };

          // Appliances are reset only if they are what actually blocks the catalog, and the
          // check is repeated afterwards so the notice cannot claim a repair that did not work.
          if (!checkPlanFeasibility(storedPrefs).isFeasible) {
            storedPrefs = { ...storedPrefs, appliances: DEFAULT_PREFERENCES.appliances };
            repairs.push('aparatele de bucătărie');
          }

          if (!checkPlanFeasibility(storedPrefs).isFeasible) {
            storedPrefs = { ...storedPrefs, supermarketId: DEFAULT_PREFERENCES.supermarketId };
            repairs.push('magazinul');
          }
        }

        if (repairs.length > 0) {
          void storageService.savePreferences(storedPrefs);
          const stillBroken = !checkPlanFeasibility(storedPrefs).isFeasible;
          repairedPrefsNotice = {
            id: Date.now().toString(),
            title: stillBroken ? 'Setări incomplete' : 'Setări restaurate',
            message: stillBroken
              ? `Am restaurat ${repairs.join(' și ')}, dar combinația de dietă și alergii tot nu permite niciun plan. Verifică-le din Filtre.`
              : `Setările salvate nu permiteau generarea niciunui plan, așa că am restaurat ${repairs.join(' și ')}. Le poți schimba oricând din Filtre.`,
            type: stillBroken ? 'warning' : 'info',
          };
        }
      }

      let sanitizedPlan = plan;
      if (sanitizedPlan) {
        sanitizedPlan = {
          ...sanitizedPlan,
          days: sanitizedPlan.days.map((d) => ({
            ...d,
            meals: d.meals.filter((m) => m.slot !== 'snack'),
          })),
        };
      }

      const urlParams =
        typeof window !== 'undefined' && window.location
          ? new URLSearchParams(window.location.search)
          : null;
      const onboardingParam = urlParams ? urlParams.get('onboarding') : null;
      const forceOnboarding = Boolean(
        urlParams &&
        urlParams.has('onboarding') &&
        onboardingParam !== '0' &&
        onboardingParam !== 'false'
      );
      const viewParam = urlParams?.get('view');
      const targetView =
        viewParam === 'meals' || viewParam === 'grocery' ? (viewParam as ActiveView) : null;
      const stepParam = urlParams?.get('step');
      const targetStep = stepParam ? parseInt(stepParam, 10) : 1;

      set((state) => ({
        isHydrated: true,
        preferences: storedPrefs
          ? {
              ...storedPrefs,
              mealSlots: (storedPrefs.mealSlots || ['dinner']).filter((s) => s !== 'snack'),
            }
          : state.preferences,
        currentPlan: sanitizedPlan || state.currentPlan,
        groceryItems: items.length > 0 ? items : state.groceryItems,
        activeView:
          targetView ||
          (forceOnboarding ? 'onboarding' : sanitizedPlan ? 'meals' : state.activeView),
        currentStep: forceOnboarding && !isNaN(targetStep) ? targetStep : state.currentStep,
        maxVisitedStep:
          forceOnboarding && !isNaN(targetStep)
            ? Math.max(state.maxVisitedStep, targetStep)
            : state.maxVisitedStep,
        activeNotice: repairedPrefsNotice ?? state.activeNotice,
        savedPlans,
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
    const { userEmail, currentPlan, groceryItems, preferences } = get();
    if (!userEmail) return;

    set({ isSyncing: true });
    try {
      // The row is keyed by the authenticated user's id, not their email: user_id is a uuid
      // referencing auth.users, and row-level security compares it against auth.uid().
      const user = await cloudSyncService.getCurrentUser();
      if (!user) {
        set({
          activeNotice: {
            id: Date.now().toString(),
            title: 'Sesiune expirată',
            message: 'Autentifică-te din nou pentru a sincroniza planul în cloud.',
            type: 'warning',
          },
        });
        return;
      }

      const res = await cloudSyncService.saveMealPlan(
        user.id,
        currentPlan,
        groceryItems,
        preferences
      );
      if (res.success) {
        set({ lastSyncedAt: new Date().toLocaleTimeString('ro-RO') });
      } else {
        set({
          activeNotice: {
            id: Date.now().toString(),
            title: 'Sincronizare eșuată',
            message: res.error || 'Planul nu a putut fi salvat în cloud. Rămâne salvat local.',
            type: 'error',
          },
        });
      }
    } finally {
      set({ isSyncing: false });
    }
  },

  setSupermarket: (id: SupermarketId) => {
    set((state) => {
      const nextPrefs = { ...state.preferences, supermarketId: id };
      void storageService.savePreferences(nextPrefs);

      if (state.currentPlan) {
        // Track recipe IDs used across the updated plan to avoid excessive duplication
        const usedRecipeIdsInWeek = new Set<string>();
        const strandedTitles: string[] = [];

        // Pre-populate with existing compatible meals
        state.currentPlan.days.forEach((day) => {
          day.meals.forEach((m) => {
            if (isSupermarketCompatible(m.recipe, id)) {
              usedRecipeIdsInWeek.add(m.recipe.id);
            }
          });
        });

        const updatedDays = state.currentPlan.days.map((day) => {
          const dayRecipeIds = new Set<string>();

          const updatedMeals = day.meals.map((m) => {
            let activeRecipe = m.recipe;

            // If recipe is NOT available at the newly selected supermarket, auto-swap it
            if (!isSupermarketCompatible(activeRecipe, id)) {
              if (m.slot === 'dessert') {
                const optimalDessert = selectOptimalDessertForDay(
                  day.dayOfWeek,
                  state.currentPlan!,
                  nextPrefs
                );
                if (optimalDessert && isSupermarketCompatible(optimalDessert, id)) {
                  activeRecipe = optimalDessert;
                }
              }

              if (!isSupermarketCompatible(activeRecipe, id)) {
                const alternatives = getAlternativeRecipes(m.recipe, nextPrefs, m.slot);
                const chosen = pickStoreCompatibleReplacement(
                  alternatives,
                  dayRecipeIds,
                  usedRecipeIdsInWeek
                );
                if (chosen) {
                  activeRecipe = chosen;
                } else if (!strandedTitles.includes(activeRecipe.title)) {
                  // No legal substitute exists. Keep the dish rather than leave a gap, but
                  // the user has to know it is not stocked where they now shop.
                  strandedTitles.push(activeRecipe.title);
                }
              }
            }

            dayRecipeIds.add(activeRecipe.id);
            usedRecipeIdsInWeek.add(activeRecipe.id);

            const cost = calculateRecipePortionCost(
              activeRecipe,
              nextPrefs.peopleCount,
              id,
              nextPrefs.excludePantryStaples
            );

            return {
              ...m,
              recipe: activeRecipe,
              estimatedCostRon: cost,
            };
          });

          const primaryMeal = updatedMeals.find((m) => m.slot === 'dinner') ||
            updatedMeals[0] || {
              recipe: day.recipe,
              estimatedCostRon: day.estimatedCostRon,
            };
          const dayCostSum = updatedMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0);

          return {
            ...day,
            recipe: primaryMeal.recipe,
            meals: updatedMeals,
            estimatedCostRon: Math.round(dayCostSum * 100) / 100,
          };
        });

        const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
        updatedDays.forEach((d) => {
          d.meals.forEach((m) =>
            allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings })
          );
        });

        const aggregated = aggregateGroceryList(
          allMealsToAggregate,
          id,
          nextPrefs.excludePantryStaples,
          getActiveExtraProductIds(nextPrefs),
          nextPrefs.pantryInventory || []
        );

        const updatedPlan: MealPlan = {
          ...state.currentPlan,
          supermarketId: id,
          totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
          totalCartCostRon: aggregated.totalCartCostRon,
          extraProducts: getActiveExtraProducts(nextPrefs),
          days: updatedDays,
        };

        void storageService.savePlanAndGrocery(updatedPlan, aggregated.items);

        return {
          preferences: nextPrefs,
          currentPlan: updatedPlan,
          groceryItems: aggregated.items,
          activeNotice:
            strandedTitles.length > 0
              ? {
                  id: Date.now().toString(),
                  title: 'Câteva rețete nu se găsesc aici',
                  message: `${SUPERMARKETS[id]?.name ?? 'Magazinul ales'} nu are ingredientele pentru: ${strandedTitles.slice(0, 3).join(', ')}${strandedTitles.length > 3 ? ' și altele' : ''}. Nu am găsit înlocuitori compatibili, așa că le-am păstrat în plan — le poți schimba manual.`,
                  type: 'warning',
                }
              : state.activeNotice,
        };
      }

      return { preferences: nextPrefs };
    });
  },

  setPeopleCount: (count: number) => {
    set((state) => {
      if (count < 1) {
        const nextPrefs = { ...state.preferences, peopleCount: 1 };
        void storageService.savePreferences(nextPrefs);
        return {
          ...state,
          preferences: nextPrefs,
          activeNotice: {
            id: Date.now().toString(),
            title: 'Număr minim de persoane',
            message:
              'Planul alimentar necesită cel puțin o persoană pentru calibrarea ingredientelor și a bugetului.',
            type: 'info',
          },
        };
      }
      if (count > 10) {
        const nextPrefs = { ...state.preferences, peopleCount: 10 };
        void storageService.savePreferences(nextPrefs);
        return {
          ...state,
          preferences: nextPrefs,
          activeNotice: {
            id: Date.now().toString(),
            title: 'Număr maxim de persoane',
            message: 'Planul alimentar este calibrat pentru maximum 10 persoane per gospodărie.',
            type: 'info',
          },
        };
      }
      const nextPrefs = {
        ...state.preferences,
        peopleCount: count,
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
        return {
          ...state,
          activeNotice: {
            id: Date.now().toString(),
            title: 'Cel puțin o zi de gătit',
            message:
              'Trebuie să păstrezi cel puțin o zi activă în planul săptămânal pentru a putea genera rețete.',
            type: 'info',
          },
        };
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

  setCookingDays: (days: DayOfWeek[]) => {
    if (days.length === 0) return;
    set((state) => {
      const daysOrder: DayOfWeek[] = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];
      const sorted = daysOrder.filter((d) => days.includes(d));
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
        if (current.length <= 1) {
          return {
            ...state,
            activeNotice: {
              id: Date.now().toString(),
              title: 'Cel puțin o poftă',
              message:
                'Meniul săptămânal are nevoie de cel puțin un stil culinar selectat pentru sugestii adecvate.',
              type: 'info',
            },
          };
        }
        const nextPrefs = {
          ...state.preferences,
          moodTags: current.filter((t) => t !== tag),
        };
        void storageService.savePreferences(nextPrefs);
        return { preferences: nextPrefs };
      }

      if (current.length >= 5) {
        return {
          ...state,
          activeNotice: {
            id: Date.now().toString(),
            title: 'Limită de 5 pofte culinare',
            message:
              'Ai atins selecția maximă de 5 pofte! Debifează una din opțiunile existente dacă dorești să adaugi o altă poftă.',
            type: 'warning',
          },
        };
      }

      const nextPrefs = { ...state.preferences, moodTags: [...current, tag] };
      void storageService.savePreferences(nextPrefs);
      return { preferences: nextPrefs };
    });
  },

  setDietType: (diet: DietType) => {
    set((state) => {
      const nextPrefs = {
        ...state.preferences,
        dietType: diet,
        dietTypes: [diet],
      };
      void storageService.savePreferences(nextPrefs);
      return { preferences: nextPrefs };
    });
  },

  toggleDietType: (diet: DietType) => {
    set((state) => {
      const current =
        state.preferences.dietTypes && state.preferences.dietTypes.length > 0
          ? state.preferences.dietTypes
          : [state.preferences.dietType];

      if (current.includes(diet)) {
        if (current.length === 1) {
          return {
            ...state,
            activeNotice: {
              id: Date.now().toString(),
              title: 'Cel puțin o orientare alimentară',
              message:
                'Planul tău are nevoie de cel puțin o dietă de bază (ex: Omnivor sau Vegetarian) pentru a genera rețete conforme.',
              type: 'info',
            },
          };
        }
        const nextDiets = current.filter((d) => d !== diet);
        const primaryDiet = nextDiets[0] || 'omnivore';
        const nextPrefs: UserPreferences = {
          ...state.preferences,
          dietType: primaryDiet,
          dietTypes: nextDiets,
        };
        void storageService.savePreferences(nextPrefs);
        return { preferences: nextPrefs };
      }

      // Check compatibility with existing selected diets
      const incompatibleDiets = current.filter((d) => !areDietsCompatible(d, diet));
      if (incompatibleDiets.length > 0) {
        return {
          ...state,
          activeNotice: {
            id: Date.now().toString(),
            title: 'Diete incompatibile',
            message:
              'Dieta selectată nu se poate combina cu dieta deja activă (de exemplu nu se poate combina Omnivor cu Vegan sau Post). Debifează opțiunea incompatibilă pentru a o alege pe aceasta.',
            type: 'warning',
          },
        };
      }

      if (current.length >= 2) {
        return {
          ...state,
          activeNotice: {
            id: Date.now().toString(),
            title: 'Limită de 2 diete',
            message:
              'Poți combina maximum 2 diete simultan (de exemplu Vegetarian + Fără Gluten) pentru a garanta rețete disponibile în catalog.',
            type: 'warning',
          },
        };
      }

      const nextDiets = [...current, diet];
      const primaryDiet = nextDiets[0] || 'omnivore';
      const nextPrefs: UserPreferences = {
        ...state.preferences,
        dietType: primaryDiet,
        dietTypes: nextDiets,
      };

      void storageService.savePreferences(nextPrefs);
      return { preferences: nextPrefs };
    });
  },

  setDietTypes: (diets: DietType[]) => {
    set((state) => {
      const safeDiets = diets.length > 0 ? diets.slice(0, 2) : (['omnivore'] as DietType[]);
      const nextPrefs: UserPreferences = {
        ...state.preferences,
        dietType: safeDiets[0],
        dietTypes: safeDiets,
      };
      void storageService.savePreferences(nextPrefs);
      return { preferences: nextPrefs };
    });
  },

  togglePantryItem: (ingredientId: string) => {
    set((state) => {
      const current = state.preferences.pantryInventory || [];
      const updated = current.includes(ingredientId)
        ? current.filter((id) => id !== ingredientId)
        : [...current, ingredientId];

      return recalculateCartForPreferences(state, {
        ...state.preferences,
        pantryInventory: updated,
      });
    });
  },

  toggleAvoidedAllergen: (allergen: Allergen) => {
    set((state) => {
      const current = state.preferences.avoidedAllergens || [];
      const next = current.includes(allergen)
        ? current.filter((a) => a !== allergen)
        : [...current, allergen];

      const nextPrefs: UserPreferences = { ...state.preferences, avoidedAllergens: next };

      // Adding an allergy can empty the catalog; refuse rather than store a dead end.
      const rejection = current.includes(allergen) ? null : rejectIfInfeasible(nextPrefs);
      if (rejection) return rejection;

      return applyPreferencesWithRebuild(state, nextPrefs);
    });
  },

  setPantryInventory: (items: string[]) => {
    set((state) =>
      recalculateCartForPreferences(state, { ...state.preferences, pantryInventory: items })
    );
  },

  toggleAppliance: (appliance: Appliance) => {
    set((state) => {
      const current = state.preferences.appliances;
      const exists = current.includes(appliance);

      if (exists && current.length <= 1) {
        return {
          activeNotice: buildInfeasibleNotice(
            'Păstrează cel puțin un aparat de bucătărie — fără niciunul nu se pot propune rețete.'
          ),
        };
      }

      const updated = exists ? current.filter((a) => a !== appliance) : [...current, appliance];

      const nextPrefs = { ...state.preferences, appliances: updated };

      // Removing an appliance can empty the catalog; refuse instead of storing a dead end.
      const rejection = exists ? rejectIfInfeasible(nextPrefs) : null;
      if (rejection) return rejection;

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
      const activeExtras = state.preferences.mealSlots.filter(
        (s) => s === 'snack' || s === 'dessert'
      );
      const combinedSlots: MealSlot[] = [...baseSlots, ...activeExtras];

      const nextPrefs = { ...state.preferences, mealSlots: combinedSlots };
      return applyPreferencesWithRebuild(state, nextPrefs);
    });
  },

  setFoodTier: (tier: FoodTier) => {
    set((state) => {
      const nextPrefs = { ...state.preferences, foodTier: tier };
      return applyPreferencesWithRebuild(state, nextPrefs);
    });
  },

  toggleExtraSlot: (slot: 'dessert') => {
    set((state) => {
      const current = state.preferences.mealSlots;
      const nextSlots = current.includes(slot)
        ? current.filter((s) => s !== slot)
        : [...current, slot];

      const safeSlots: MealSlot[] = nextSlots.length > 0 ? nextSlots : ['dinner'];
      const nextPrefs = { ...state.preferences, mealSlots: safeSlots };
      return applyPreferencesWithRebuild(state, nextPrefs);
    });
  },

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
      if (!chosenRecipe) return {};

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
          Math.round(updatedMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0) * 10) / 10,
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
        state.preferences.excludePantryStaples,
        getActiveExtraProductIds(state.preferences),
        state.preferences.pantryInventory || []
      );

      const updatedPlan: MealPlan = {
        ...state.currentPlan,
        days: updatedDays,
        totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
        totalCartCostRon: aggregated.totalCartCostRon,
        extraProducts: getActiveExtraProducts(state.preferences),
      };

      void storageService.savePlanAndGrocery(updatedPlan, aggregated.items);

      return {
        currentPlan: updatedPlan,
        groceryItems: aggregated.items,
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
          return {
            ...meal,
            servings: safeServings,
            estimatedCostRon: calculateRecipePortionCost(
              meal.recipe,
              safeServings,
              state.preferences.supermarketId,
              state.preferences.excludePantryStaples
            ),
          };
        });

        const daySum = updatedMeals.reduce((total, m) => total + m.estimatedCostRon, 0);
        return {
          ...day,
          meals: updatedMeals,
          estimatedCostRon: Math.round(daySum * 100) / 100,
        };
      });

      const planWithServings: MealPlan = { ...state.currentPlan, days: updatedDays };
      const aggregated = aggregateGroceryList(
        collectPlanMeals(planWithServings),
        state.preferences.supermarketId,
        state.preferences.excludePantryStaples,
        getActiveExtraProductIds(state.preferences),
        state.preferences.pantryInventory || []
      );

      const updatedPlan: MealPlan = {
        ...planWithServings,
        totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
        totalCartCostRon: aggregated.totalCartCostRon,
        extraProducts: getActiveExtraProducts(state.preferences),
      };

      void storageService.savePlanAndGrocery(updatedPlan, aggregated.items);
      return { currentPlan: updatedPlan, groceryItems: aggregated.items };
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
          Math.round(updatedMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0) * 10) / 10,
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
        state.preferences.excludePantryStaples,
        getActiveExtraProductIds(state.preferences),
        state.preferences.pantryInventory || []
      );

      const updatedPlan: MealPlan = {
        ...state.currentPlan,
        days: updatedDays,
        totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
        totalCartCostRon: aggregated.totalCartCostRon,
        extraProducts: getActiveExtraProducts(state.preferences),
      };

      void storageService.savePlanAndGrocery(updatedPlan, aggregated.items);

      return {
        currentPlan: updatedPlan,
        groceryItems: aggregated.items,
      };
    });
  },

  toggleSnackProduct: (productId: string) => {
    set((state) => {
      const current = state.preferences.selectedSnackIds || [];
      const updated = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];

      const nextPrefs = { ...state.preferences, selectedSnackIds: updated };
      void storageService.savePreferences(nextPrefs);

      if (state.currentPlan) {
        const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
        state.currentPlan.days.forEach((d) => {
          d.meals.forEach((m) =>
            allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings })
          );
        });

        const extraIds = [...updated, ...(nextPrefs.selectedDrinkIds || [])];
        const aggregated = aggregateGroceryList(
          allMealsToAggregate,
          nextPrefs.supermarketId,
          nextPrefs.excludePantryStaples,
          extraIds,
          nextPrefs.pantryInventory || []
        );

        const updatedPlan: MealPlan = {
          ...state.currentPlan,
          totalCartCostRon: aggregated.totalCartCostRon,
          extraProducts: getActiveExtraProducts(nextPrefs),
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

  toggleDrinkProduct: (productId: string) => {
    set((state) => {
      const current = state.preferences.selectedDrinkIds || [];
      const updated = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];

      const nextPrefs = { ...state.preferences, selectedDrinkIds: updated };
      void storageService.savePreferences(nextPrefs);

      if (state.currentPlan) {
        const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
        state.currentPlan.days.forEach((d) => {
          d.meals.forEach((m) =>
            allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings })
          );
        });

        const extraIds = [...(nextPrefs.selectedSnackIds || []), ...updated];
        const aggregated = aggregateGroceryList(
          allMealsToAggregate,
          nextPrefs.supermarketId,
          nextPrefs.excludePantryStaples,
          extraIds,
          nextPrefs.pantryInventory || []
        );

        const updatedPlan: MealPlan = {
          ...state.currentPlan,
          totalCartCostRon: aggregated.totalCartCostRon,
          extraProducts: getActiveExtraProducts(nextPrefs),
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

  setIncludeAlcohol: (include: boolean) => {
    set((state) => {
      let updatedDrinks = state.preferences.selectedDrinkIds || [];
      if (!include) {
        // Remove alcoholic drinks if alcohol toggle turned off
        updatedDrinks = updatedDrinks.filter((id) => {
          const prod = RETAIL_PRODUCTS_MAP[id];
          return prod ? !prod.isAlcoholic : true;
        });
      }

      const nextPrefs = {
        ...state.preferences,
        includeAlcohol: include,
        selectedDrinkIds: updatedDrinks,
      };
      void storageService.savePreferences(nextPrefs);

      if (state.currentPlan) {
        const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
        state.currentPlan.days.forEach((d) => {
          d.meals.forEach((m) =>
            allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings })
          );
        });

        const extraIds = [...(nextPrefs.selectedSnackIds || []), ...updatedDrinks];
        const aggregated = aggregateGroceryList(
          allMealsToAggregate,
          nextPrefs.supermarketId,
          nextPrefs.excludePantryStaples,
          extraIds,
          nextPrefs.pantryInventory || []
        );

        const updatedPlan: MealPlan = {
          ...state.currentPlan,
          totalCartCostRon: aggregated.totalCartCostRon,
          extraProducts: getActiveExtraProducts(nextPrefs),
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

  clearSnacksAndDrinks: () => {
    set((state) => {
      const nextPrefs = {
        ...state.preferences,
        selectedSnackIds: [],
        selectedDrinkIds: [],
      };
      void storageService.savePreferences(nextPrefs);

      if (state.currentPlan) {
        const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
        state.currentPlan.days.forEach((d) => {
          d.meals.forEach((m) =>
            allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings })
          );
        });

        const aggregated = aggregateGroceryList(
          allMealsToAggregate,
          nextPrefs.supermarketId,
          nextPrefs.excludePantryStaples,
          [],
          nextPrefs.pantryInventory || []
        );

        const updatedPlan: MealPlan = {
          ...state.currentPlan,
          totalCartCostRon: aggregated.totalCartCostRon,
          extraProducts: getActiveExtraProducts(nextPrefs),
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
          exclude,
          getActiveExtraProductIds(nextPrefs),
          nextPrefs.pantryInventory || []
        );

        const updatedPlan: MealPlan = {
          ...state.currentPlan,
          totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
          totalCartCostRon: aggregated.totalCartCostRon,
          extraProducts: getActiveExtraProducts(nextPrefs),
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
    set((state) => {
      const next = Math.min(state.totalSteps, state.currentStep + 1);
      return {
        currentStep: next,
        maxVisitedStep: Math.max(state.maxVisitedStep || 1, next),
      };
    }),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(1, state.currentStep - 1),
    })),

  goToStep: (step: number) =>
    set((state) => {
      const next = Math.max(1, Math.min(state.totalSteps, step));
      return {
        currentStep: next,
        maxVisitedStep: Math.max(state.maxVisitedStep || 1, next),
      };
    }),

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
      preferences: { ...DEFAULT_PREFERENCES },
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

  dismissUndo: () => set({ lastDiscardedPlan: null }),

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
            message: 'Planul salvat nu mai poate fi citit și nu a fost încărcat. Îl poți șterge din listă.',
            type: 'error',
          },
        };
      }

      // The saved plan brings back its menu, not the user's protections. Allergies, diet and
      // the kitchen are whatever they are TODAY: restoring an older week must never be a way
      // around a restriction declared since, which for an allergy is a safety matter.
      const effectivePrefs: UserPreferences = {
        ...entry.preferences,
        avoidedAllergens: mergeAllergens(
          state.preferences.avoidedAllergens,
          entry.preferences.avoidedAllergens
        ),
        dietType: state.preferences.dietType,
        dietTypes: state.preferences.dietTypes,
        appliances: state.preferences.appliances,
      };

      const { days: safeDays, replacedCount, offendingAllergens } = makePlanSafeForPreferences(
        entry.plan.days,
        effectivePrefs
      );

      const aggregated = aggregateGroceryList(
        collectMealsFromDays(safeDays),
        effectivePrefs.supermarketId,
        effectivePrefs.excludePantryStaples,
        getActiveExtraProductIds(effectivePrefs),
        effectivePrefs.pantryInventory || []
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

  setActiveView: (view) => set(() => ({ activeView: view })),

  generatePlan: () => {
    const { preferences } = get();

    const feasibility = checkPlanFeasibility(preferences);
    if (!feasibility.isFeasible) {
      set({
        activeNotice: buildInfeasibleNotice(
          feasibility.reasonRo || 'Preferințele alese nu permit generarea unui plan.'
        ),
      });
      return;
    }

    const plan = generateMealPlan(preferences);

    const aggregated = aggregateGroceryList(
      collectPlanMeals(plan),
      preferences.supermarketId,
      preferences.excludePantryStaples,
      getActiveExtraProductIds(preferences),
      preferences.pantryInventory || []
    );

    // The freshly aggregated totals are the ones shown to the user, so the plan has to
    // carry them: the engine's own figures do not know about pantry stock.
    const savedPlan: MealPlan = {
      ...plan,
      totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
      totalCartCostRon: aggregated.totalCartCostRon,
      extraProducts: getActiveExtraProducts(preferences),
    };

    void storageService.savePlanAndGrocery(savedPlan, aggregated.items);

    set(() => ({
      currentPlan: savedPlan,
      groceryItems: aggregated.items,
      activeView: 'meals',
    }));
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

    const currentRecipeIds = new Set<string>();
    currentPlan.days.forEach((d) => {
      d.meals.forEach((m) => currentRecipeIds.add(m.recipe.id));
    });

    const newPlan = generateMealPlan(preferences, {
      reshuffle: true,
      excludedRecipeIds: currentRecipeIds,
    });

    // Preserve any day-specific extra slots (like desserts) that user had added
    const updatedDays = newPlan.days.map((newDay) => {
      const existingDay = currentPlan.days.find((d) => d.dayOfWeek === newDay.dayOfWeek);
      const hadDessert = existingDay?.meals.some((m) => m.slot === 'dessert');
      const meals = [...newDay.meals];

      if (hadDessert && !meals.some((m) => m.slot === 'dessert')) {
        const optimalDessert = selectOptimalDessertForDay(newDay.dayOfWeek, newPlan, preferences);
        if (optimalDessert) {
          const dessertCost = calculateRecipePortionCost(
            optimalDessert,
            preferences.peopleCount,
            preferences.supermarketId,
            preferences.excludePantryStaples
          );
          meals.push({
            id: `${newDay.dayOfWeek}-dessert-${Date.now()}`,
            slot: 'dessert',
            slotLabelRo: getSlotLabelRo('dessert'),
            recipe: optimalDessert,
            servings: preferences.peopleCount,
            estimatedCostRon: dessertCost,
          });
        }
      }

      const primaryMeal = meals.find((m) => m.slot === 'dinner') || meals[0];
      const dayCostSum = meals.reduce((sum, m) => sum + m.estimatedCostRon, 0);

      return {
        ...newDay,
        recipe: primaryMeal.recipe,
        meals,
        estimatedCostRon: Math.round(dayCostSum * 100) / 100,
      };
    });

    const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
    updatedDays.forEach((d) => {
      d.meals.forEach((m) => allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings }));
    });

    const aggregated = aggregateGroceryList(
      allMealsToAggregate,
      preferences.supermarketId,
      preferences.excludePantryStaples,
      getActiveExtraProductIds(preferences),
      preferences.pantryInventory || []
    );

    const updatedPlan: MealPlan = {
      ...newPlan,
      days: updatedDays,
      totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
      totalCartCostRon: aggregated.totalCartCostRon,
      extraProducts: getActiveExtraProducts(preferences),
    };

    void storageService.savePlanAndGrocery(updatedPlan, aggregated.items);

    set(() => ({
      currentPlan: updatedPlan,
      groceryItems: aggregated.items,
    }));
  },

  updatePreferencesAndRebuild: (newPrefs: Partial<UserPreferences>) => {
    const { preferences, currentPlan } = get();
    const nextPrefs: UserPreferences = {
      ...preferences,
      ...newPrefs,
    };

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

    void storageService.savePreferences(nextPrefs);

    const newPlan = generateMealPlan(nextPrefs);

    const updatedDays = newPlan.days.map((newDay) => {
      const existingDay = currentPlan?.days.find((d) => d.dayOfWeek === newDay.dayOfWeek);
      const hadDessert = existingDay?.meals.some((m) => m.slot === 'dessert');
      const meals = [...newDay.meals];

      if (hadDessert && !meals.some((m) => m.slot === 'dessert')) {
        const optimalDessert = selectOptimalDessertForDay(newDay.dayOfWeek, newPlan, nextPrefs);
        if (optimalDessert) {
          const dessertCost = calculateRecipePortionCost(
            optimalDessert,
            nextPrefs.peopleCount,
            nextPrefs.supermarketId,
            nextPrefs.excludePantryStaples
          );
          meals.push({
            id: `${newDay.dayOfWeek}-dessert-${Date.now()}`,
            slot: 'dessert',
            slotLabelRo: getSlotLabelRo('dessert'),
            recipe: optimalDessert,
            servings: nextPrefs.peopleCount,
            estimatedCostRon: dessertCost,
          });
        }
      }

      const primaryMeal = meals.find((m) => m.slot === 'dinner') || meals[0];
      const dayCostSum = meals.reduce((sum, m) => sum + m.estimatedCostRon, 0);

      return {
        ...newDay,
        recipe: primaryMeal.recipe,
        meals,
        estimatedCostRon: Math.round(dayCostSum * 100) / 100,
      };
    });

    const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
    updatedDays.forEach((d) => {
      d.meals.forEach((m) => allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings }));
    });

    const aggregated = aggregateGroceryList(
      allMealsToAggregate,
      nextPrefs.supermarketId,
      nextPrefs.excludePantryStaples,
      getActiveExtraProductIds(nextPrefs),
      nextPrefs.pantryInventory || []
    );

    const updatedPlan: MealPlan = {
      ...newPlan,
      days: updatedDays,
      totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
      totalCartCostRon: aggregated.totalCartCostRon,
      extraProducts: getActiveExtraProducts(nextPrefs),
    };

    void storageService.savePlanAndGrocery(updatedPlan, aggregated.items);

    set(() => ({
      preferences: nextPrefs,
      currentPlan: updatedPlan,
      groceryItems: aggregated.items,
    }));
  },

  swapMeal: (dayOfWeek: DayOfWeek, slot?: MealSlot) => {
    const { currentPlan, preferences } = get();
    if (!currentPlan) return;

    const updatedPlan = swapMealInPlan(currentPlan, dayOfWeek, preferences, slot);
    const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
    updatedPlan.days.forEach((d) => {
      d.meals.forEach((m) => allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings }));
    });

    const aggregated = aggregateGroceryList(
      allMealsToAggregate,
      preferences.supermarketId,
      preferences.excludePantryStaples,
      getActiveExtraProductIds(preferences),
      preferences.pantryInventory || []
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

    const primaryMeal = updatedMeals.find((m) => m.slot === 'dinner') ||
      updatedMeals[0] || {
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
      d.meals.forEach((m) => allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings }));
    });

    const aggregated = aggregateGroceryList(
      allMealsToAggregate,
      preferences.supermarketId,
      preferences.excludePantryStaples,
      getActiveExtraProductIds(preferences),
      preferences.pantryInventory || []
    );

    const updatedPlan: MealPlan = {
      ...currentPlan,
      totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
      totalCartCostRon: aggregated.totalCartCostRon,
      extraProducts: getActiveExtraProducts(preferences),
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
        item.ingredientId === ingredientId ? { ...item, isPurchased: !item.isPurchased } : item
      );
      void storageService.savePlanAndGrocery(currentPlan, nextItems);
      return { groceryItems: nextItems };
    });
  },
}));

declare global {
  interface Window {
    /** Exposed for debugging from the browser console; not used by the app itself. */
    __SMARTMEAL_STORE__?: typeof useAppStore;
  }
}

if (typeof window !== 'undefined') {
  window.__SMARTMEAL_STORE__ = useAppStore;
}
