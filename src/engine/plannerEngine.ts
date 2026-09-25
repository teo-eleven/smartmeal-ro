import {
  Appliance,
  DayOfWeek,
  DietType,
  MealPlan,
  MealPlanDay,
  MealSlot,
  PlannedMeal,
  Recipe,
  SupermarketId,
  UserPreferences,
} from '../types';
import { RECIPES } from '../data/recipes';
import { calculateRecipePortionCost } from './budgetCalculator';
import { aggregateGroceryList } from './groceryAggregator';
import { isRecipeMatchingDiets } from '../utils/dietCompatibility';
import { isRecipeSafeForAllergies } from '../utils/allergenFilter';

export function getSlotLabelRo(slot: MealSlot): string {
  switch (slot) {
    case 'breakfast':
      return 'Mic Dejun';
    case 'lunch':
      return 'Prânz';
    case 'dinner':
      return 'Cină';
    case 'snack':
      return 'Ronțăială (Film & Meci)';
    case 'dessert':
      return 'Desert de Casă';
  }
}

/**
 * Checks if a recipe's diet type is compatible with user's diet restrictions.
 */
export function isDietCompatible(recipeDiet: DietType, userDiet: DietType): boolean {
  if (userDiet === 'omnivore') return true;
  if (userDiet === 'pescatarian') {
    return recipeDiet === 'pescatarian' || recipeDiet === 'vegetarian' || recipeDiet === 'vegan';
  }
  if (userDiet === 'vegetarian') {
    return recipeDiet === 'vegetarian' || recipeDiet === 'vegan';
  }
  if (userDiet === 'vegan') {
    return recipeDiet === 'vegan';
  }
  return false;
}

/**
 * Checks if user has all appliances required to cook the recipe.
 */
export function hasRequiredAppliances(
  recipeAppliances: string[],
  userAppliances: string[]
): boolean {
  if (recipeAppliances.length === 0) return true;
  return recipeAppliances.every((app) => userAppliances.includes(app));
}

/**
 * Checks if a recipe is available at the selected supermarket.
 * If availableSupermarkets is undefined or empty, the recipe is universal (available at all stores).
 */
export function isSupermarketCompatible(recipe: Recipe, supermarketId?: SupermarketId): boolean {
  if (!supermarketId) return true;
  if (!recipe.availableSupermarkets || recipe.availableSupermarkets.length === 0) {
    return true; // Universal staple
  }
  return recipe.availableSupermarkets.includes(supermarketId);
}

/**
 * Filters the master catalog down to recipes satisfying hard constraints (diet, appliances & supermarket).
 */
export function getEligibleRecipes(preferences: UserPreferences): Recipe[] {
  const activeDiets: DietType[] =
    preferences.dietTypes && preferences.dietTypes.length > 0
      ? preferences.dietTypes
      : [preferences.dietType];

  const rejected = new Set(preferences.dislikedRecipeIds ?? []);

  return RECIPES.filter(
    (recipe) =>
      !rejected.has(recipe.id) &&
      isRecipeMatchingDiets(recipe, activeDiets) &&
      isRecipeSafeForAllergies(recipe, preferences.avoidedAllergens) &&
      hasRequiredAppliances(recipe.appliances, preferences.appliances) &&
      isSupermarketCompatible(recipe, preferences.supermarketId)
  );
}

export const ALL_APPLIANCES: Appliance[] = ['hob', 'oven', 'air_fryer', 'microwave'];

const APPLIANCE_LABELS_RO: Record<Appliance, string> = {
  hob: 'Aragaz',
  oven: 'Cuptor',
  air_fryer: 'Air Fryer',
  microwave: 'Microunde',
};

export function getApplianceLabelRo(appliance: Appliance): string {
  return APPLIANCE_LABELS_RO[appliance] ?? appliance;
}

export interface FeasibilityResult {
  isFeasible: boolean;
  eligibleRecipeCount: number;
  reasonRo?: string;
}

/**
 * Answers "can a plan be built from these preferences?" without ever throwing.
 *
 * generateMealPlan throws on impossible input, which is correct for an engine but fatal
 * for a UI: the throw used to escape through store actions and React effects, leaving the
 * app in a state it could not render. Callers ask this first and can refuse gracefully.
 */
export function checkPlanFeasibility(preferences: UserPreferences): FeasibilityResult {
  if (!preferences.cookingDays || preferences.cookingDays.length === 0) {
    return {
      isFeasible: false,
      eligibleRecipeCount: 0,
      reasonRo: 'Alege cel puțin o zi în care gătești.',
    };
  }

  if (!preferences.peopleCount || preferences.peopleCount < 1) {
    return {
      isFeasible: false,
      eligibleRecipeCount: 0,
      reasonRo: 'Planul are nevoie de cel puțin o persoană.',
    };
  }

  if (!preferences.budgetRon || preferences.budgetRon <= 0) {
    return {
      isFeasible: false,
      eligibleRecipeCount: 0,
      reasonRo: 'Bugetul săptămânal trebuie să fie mai mare decât 0 lei.',
    };
  }

  if (!preferences.appliances || preferences.appliances.length === 0) {
    return {
      isFeasible: false,
      eligibleRecipeCount: 0,
      reasonRo: 'Alege cel puțin un aparat de bucătărie pe care îl ai acasă.',
    };
  }

  const eligibleRecipeCount = getEligibleRecipes(preferences).length;
  if (eligibleRecipeCount === 0) {
    const selected = preferences.appliances.map(getApplianceLabelRo).join(', ');
    const unlocking = suggestAppliancesToUnlock(preferences).map(getApplianceLabelRo);
    const hint =
      unlocking.length > 0
        ? ` Adaugă cel puțin un aparat: ${unlocking.join(', ')}.`
        : ' Încearcă o dietă mai permisivă sau alt magazin.';

    return {
      isFeasible: false,
      eligibleRecipeCount: 0,
      reasonRo: `Cu doar [${selected}] nu există nicio rețetă compatibilă cu dieta ta.${hint}`,
    };
  }

  return { isFeasible: true, eligibleRecipeCount };
}

/**
 * Returns the appliances that would, on their own, unlock at least one recipe.
 * Empty when the current selection already works.
 */
export function suggestAppliancesToUnlock(preferences: UserPreferences): Appliance[] {
  if (!preferences.appliances || preferences.appliances.length === 0) {
    return ALL_APPLIANCES;
  }
  if (getEligibleRecipes(preferences).length > 0) {
    return [];
  }

  return ALL_APPLIANCES.filter((appliance) => {
    if (preferences.appliances.includes(appliance)) return false;
    const widened: UserPreferences = {
      ...preferences,
      appliances: [...preferences.appliances, appliance],
    };
    return getEligibleRecipes(widened).length > 0;
  });
}

/**
 * Returns alternative recipes suitable for a specific meal slot and supermarket.
 */
export function getAlternativeRecipes(
  currentRecipe: Recipe,
  preferences: UserPreferences,
  slot?: MealSlot
): Recipe[] {
  const eligible = getEligibleRecipes(preferences);
  const filtered = eligible.filter((r) => {
    if (r.id === currentRecipe.id) return false;
    if (slot && r.suitableSlots && r.suitableSlots.length > 0) {
      return r.suitableSlots.includes(slot);
    }
    return true;
  });

  const effectiveTier = preferences.foodTier || 'medium';
  return filtered.sort((a, b) => {
    const aStoreMatch =
      preferences.supermarketId && a.storeSignature === preferences.supermarketId ? 1 : 0;
    const bStoreMatch =
      preferences.supermarketId && b.storeSignature === preferences.supermarketId ? 1 : 0;
    if (bStoreMatch !== aStoreMatch) return bStoreMatch - aStoreMatch;

    const aMatch = a.tier === effectiveTier ? 1 : 0;
    const bMatch = b.tier === effectiveTier ? 1 : 0;
    return bMatch - aMatch;
  });
}

export interface GenerateMealPlanOptions {
  reshuffle?: boolean;
  excludedRecipeIds?: Set<string>;
}

/** Guard against pathological loops; a week of meals never needs more than a few dozen swaps. */
const MAX_BUDGET_SWAPS = 60;
/** Same ceiling the generator uses, so cost-cutting cannot collapse the week into one dish. */
const MAX_RECIPE_REPEATS = 2;
/**
 * Candidates within this fraction of the cheapest option count as equal, leaving room for
 * variety. Proportional rather than absolute so it still works for a 10-person household,
 * where every portion cost is an order of magnitude larger.
 */
const BUDGET_TIE_TOLERANCE_RATIO = 0.15;

export function collectDayMeals(days: MealPlanDay[]): { recipe: Recipe; servings: number }[] {
  const meals: { recipe: Recipe; servings: number }[] = [];
  days.forEach((day) =>
    day.meals.forEach((meal) => {
      // A reheated portion was already shopped for on the day it was cooked.
      if (!meal.isLeftover) meals.push({ recipe: meal.recipe, servings: meal.servings });
    })
  );
  return meals;
}

function getExtraProductIds(preferences: UserPreferences): string[] {
  return [...(preferences.selectedSnackIds || []), ...(preferences.selectedDrinkIds || [])];
}

/** The real number the user is judged against: whole packages, extras and pantry included. */
function computeCartCost(days: MealPlanDay[], preferences: UserPreferences): number {
  return aggregateGroceryList(
    collectDayMeals(days),
    preferences.supermarketId,
    preferences.excludePantryStaples,
    getExtraProductIds(preferences),
    preferences.pantryInventory || [],
    preferences.pantryStock || {}
  ).totalCartCostRon;
}

function countRecipeUsage(days: MealPlanDay[]): Map<string, number> {
  const usage = new Map<string, number>();
  days.forEach((day) =>
    day.meals.forEach((meal) => usage.set(meal.recipe.id, (usage.get(meal.recipe.id) || 0) + 1))
  );
  return usage;
}

function rebuildDayTotals(day: MealPlanDay): MealPlanDay {
  const primaryMeal = day.meals.find((m) => m.slot === 'dinner') || day.meals[0];
  const sum = day.meals.reduce((total, meal) => total + meal.estimatedCostRon, 0);
  return {
    ...day,
    recipe: primaryMeal ? primaryMeal.recipe : day.recipe,
    estimatedCostRon: Math.round(sum * 100) / 100,
  };
}

/**
 * Brings an over-budget plan down by repeatedly replacing the single most expensive meal
 * with the cheapest alternative that is still legal for that slot.
 *
 * Hard constraints (diet, appliances, supermarket, slot) come from `eligibleRecipes` and are
 * never relaxed — a cheaper cart is worthless if it serves a vegan a steak. Repetition is
 * capped so the week does not collapse onto the single cheapest dish. Stops as soon as the
 * cart fits, or when no swap can improve it further; the caller reports that floor honestly.
 */
export function optimizeDaysForBudget(
  days: MealPlanDay[],
  preferences: UserPreferences,
  eligibleRecipes: Recipe[],
  options?: GenerateMealPlanOptions
): { days: MealPlanDay[]; swapsApplied: number } {
  let workingDays = days;
  let swapsApplied = 0;

  if (computeCartCost(workingDays, preferences) <= preferences.budgetRon) {
    return { days: workingDays, swapsApplied: 0 };
  }

  // Meals we have already tried and could not improve; prevents re-picking the same target.
  const exhausted = new Set<string>();

  while (swapsApplied < MAX_BUDGET_SWAPS) {
    if (computeCartCost(workingDays, preferences) <= preferences.budgetRon) break;

    let targetDayIndex = -1;
    let targetMealIndex = -1;
    let targetCost = -Infinity;

    workingDays.forEach((day, dayIndex) => {
      day.meals.forEach((meal, mealIndex) => {
        if (exhausted.has(meal.id)) return;
        if (meal.estimatedCostRon > targetCost) {
          targetCost = meal.estimatedCostRon;
          targetDayIndex = dayIndex;
          targetMealIndex = mealIndex;
        }
      });
    });

    if (targetDayIndex === -1) break;

    const targetDay = workingDays[targetDayIndex];
    const targetMeal = targetDay.meals[targetMealIndex];
    const usage = countRecipeUsage(workingDays);

    const cheaperCandidate = eligibleRecipes
      .filter((candidate) => {
        if (candidate.id === targetMeal.recipe.id) return false;
        if (candidate.suitableSlots && candidate.suitableSlots.length > 0) {
          if (!candidate.suitableSlots.includes(targetMeal.slot)) return false;
        }
        return (usage.get(candidate.id) || 0) < MAX_RECIPE_REPEATS;
      })
      .map((candidate) => ({
        candidate,
        cost: calculateRecipePortionCost(
          candidate,
          preferences.peopleCount,
          preferences.supermarketId,
          preferences.excludePantryStaples
        ),
      }))
      .filter((entry) => entry.cost < targetMeal.estimatedCostRon)
      .sort((a, b) => a.cost - b.cost);

    // A hard budget must not freeze the week: among options that cost practically the same,
    // prefer one the previous plan did not use, so "Amestecă" still visibly reshuffles.
    const cheapest = cheaperCandidate[0];
    const bestCandidate =
      options?.reshuffle && cheapest
        ? cheaperCandidate.find(
            (entry) =>
              entry.cost <= cheapest.cost * (1 + BUDGET_TIE_TOLERANCE_RATIO) &&
              !options.excludedRecipeIds?.has(entry.candidate.id)
          ) || cheapest
        : cheapest;

    if (!bestCandidate) {
      exhausted.add(targetMeal.id);
      continue;
    }

    const updatedMeals = targetDay.meals.map((meal, index) =>
      index === targetMealIndex
        ? { ...meal, recipe: bestCandidate.candidate, estimatedCostRon: bestCandidate.cost }
        : meal
    );

    workingDays = workingDays.map((day, index) =>
      index === targetDayIndex ? rebuildDayTotals({ ...day, meals: updatedMeals }) : day
    );

    swapsApplied += 1;
  }

  return { days: workingDays, swapsApplied };
}

/**
 * Generates an optimized weekly meal plan strictly respecting constraints, target budget,
 * meal slot compatibility (e.g. no burgers at breakfast), and ingredient synergies.
 */
export function generateMealPlan(
  preferences: UserPreferences,
  options?: GenerateMealPlanOptions
): MealPlan {
  // Input Validations
  if (!preferences.cookingDays || preferences.cookingDays.length === 0) {
    throw new Error('[PlannerEngine] At least one cooking day must be selected.');
  }
  if (preferences.peopleCount <= 0) {
    throw new Error('[PlannerEngine] peopleCount must be at least 1.');
  }
  if (preferences.budgetRon <= 0) {
    throw new Error('[PlannerEngine] budgetRon must be greater than 0.');
  }
  if (!preferences.appliances || preferences.appliances.length === 0) {
    throw new Error('[PlannerEngine] At least one kitchen appliance must be selected.');
  }

  const eligibleRecipes = getEligibleRecipes(preferences);

  if (eligibleRecipes.length === 0) {
    throw new Error(
      `[PlannerEngine] Nu s-au găsit rețete compatibile pentru dieta "${preferences.dietType}" și electrocasnicele selectate: [${preferences.appliances.join(', ')}].`
    );
  }

  const activeDiets: DietType[] =
    preferences.dietTypes && preferences.dietTypes.length > 0
      ? preferences.dietTypes
      : [preferences.dietType];

  const rawSlots: MealSlot[] =
    preferences.mealSlots && preferences.mealSlots.length > 0 ? preferences.mealSlots : ['dinner'];
  const slots: MealSlot[] = rawSlots.filter((s) => s !== 'snack');

  const effectiveTier = preferences.foodTier || 'medium';

  // The relaxation ladder below rebuilds candidates from the whole catalog when a slot runs
  // dry. It relaxes the store and the slot -- never a dish the user asked never to see again.
  const rejectedIds = new Set(preferences.dislikedRecipeIds ?? []);

  // Score each recipe based on mood tags, food tier preference, and portion cost
  const scoredRecipes = eligibleRecipes.map((recipe) => {
    let score = 0;

    // Dishes the user said they liked, weighted the same as in the day-by-day pass.
    if ((preferences.favouriteRecipeIds ?? []).includes(recipe.id)) {
      score += 40;
    }

    if (preferences.moodTags && preferences.moodTags.length > 0) {
      recipe.moodTags.forEach((tag) => {
        if (preferences.moodTags.includes(tag)) {
          score += 15;
        }
      });
    }

    // Food Tier preference scoring
    if (recipe.tier === effectiveTier) {
      score += 35;
    } else if (effectiveTier === 'basic') {
      if (recipe.tier === 'medium') score -= 10;
      if (recipe.tier === 'premium') score -= 50;
    } else if (effectiveTier === 'medium') {
      if (recipe.tier === 'basic') score += 5;
      if (recipe.tier === 'premium') score -= 15;
    } else if (effectiveTier === 'premium') {
      if (recipe.tier === 'basic') score -= 30;
      if (recipe.tier === 'medium') score += 5;
    }

    // Supermarket signature boost: prioritize store specialties
    if (preferences.supermarketId && recipe.storeSignature === preferences.supermarketId) {
      score += 25;
    }

    const portionCost = calculateRecipePortionCost(
      recipe,
      preferences.peopleCount,
      preferences.supermarketId,
      preferences.excludePantryStaples
    );

    return {
      recipe,
      score,
      portionCost,
    };
  });

  const recipeUsageCount = new Map<string, number>();
  const usedIngredientsInPlan = new Set<string>();
  let lastUsedRecipeId: string | null = null;

  function scoreFallbackRecipes(recipes: Recipe[]): typeof scoredRecipes {
    return recipes.map((recipe) => ({
      recipe,
      score: 100,
      // Real cost, never a placeholder: the budget optimizer picks its targets by this number.
      portionCost: calculateRecipePortionCost(
        recipe,
        preferences.peopleCount,
        preferences.supermarketId,
        preferences.excludePantryStaples
      ),
    }));
  }

  function matchesSlot(recipe: Recipe, slot: MealSlot): boolean {
    if (!recipe.suitableSlots || recipe.suitableSlots.length === 0) return true;
    return recipe.suitableSlots.includes(slot);
  }

  function pickBestRecipeForSlot(slot: MealSlot): Recipe {
    // Relaxation ladder, loosest constraint first. Diet and appliances are NEVER relaxed:
    // suggesting a dish the user cannot cook, or must not eat, is worse than no preference
    // match at all. Only store availability and slot suitability may give way.
    let candidates = scoredRecipes.filter((s) => matchesSlot(s.recipe, slot));

    if (candidates.length === 0) {
      // 1. Drop the supermarket requirement, keep diet + appliances + slot.
      const ignoringStore = RECIPES.filter(
        (r) =>
          !rejectedIds.has(r.id) &&
          matchesSlot(r, slot) &&
          isRecipeMatchingDiets(r, activeDiets) &&
          isRecipeSafeForAllergies(r, preferences.avoidedAllergens) &&
          hasRequiredAppliances(r.appliances, preferences.appliances)
      );

      if (ignoringStore.length > 0) {
        candidates = scoreFallbackRecipes(ignoringStore);
      } else {
        // 2. Drop slot suitability too, but still only dishes the user can cook and eat.
        //    Reached when the catalog has no dish at all for this slot under this diet
        //    (for example: there is no vegan breakfast recipe).
        const cookableAndEdible = RECIPES.filter(
          (r) =>
            !rejectedIds.has(r.id) &&
            isRecipeMatchingDiets(r, activeDiets) &&
            isRecipeSafeForAllergies(r, preferences.avoidedAllergens) &&
            hasRequiredAppliances(r.appliances, preferences.appliances)
        );
        candidates =
          cookableAndEdible.length > 0 ? scoreFallbackRecipes(cookableAndEdible) : scoredRecipes;
      }
    }

    // Repetition rules, strongest first:
    // 1. Never repeat a dish while an unused one is still available for this slot. Tier is a
    //    preference; eating the same thing twice when the catalog has more to offer is not
    //    something a user asked for, so freshness outranks it here.
    // 2. Otherwise prefer the matching tier, then anything, capped at MAX_RECIPE_REPEATS.
    // A dish the user asked for counts as matching the tier. The tier narrowing happens
    // before any score is consulted, so without this a favourite of another tier is dropped
    // from the pool and its bonus is never read at all.
    const isWanted = (id: string) => (preferences.favouriteRecipeIds ?? []).includes(id);
    const matchesTier = (s: (typeof candidates)[number]) =>
      s.recipe.tier === effectiveTier || isWanted(s.recipe.id);

    const unused = candidates.filter((c) => !recipeUsageCount.has(c.recipe.id));
    const tierMatches = candidates.filter(matchesTier);
    const tierUnderLimit = tierMatches.filter(
      (c) => (recipeUsageCount.get(c.recipe.id) || 0) < MAX_RECIPE_REPEATS
    );
    const anyUnderLimit = candidates.filter(
      (c) => (recipeUsageCount.get(c.recipe.id) || 0) < MAX_RECIPE_REPEATS
    );

    let candidatePool: typeof candidates;
    if (unused.length > 0) {
      // Within the untouched dishes the tier preference still applies, when it can.
      const unusedMatchingTier = unused.filter(matchesTier);
      candidatePool = unusedMatchingTier.length > 0 ? unusedMatchingTier : unused;
    } else if (tierUnderLimit.length > 0) {
      candidatePool = tierUnderLimit;
    } else if (anyUnderLimit.length > 0) {
      candidatePool = anyUnderLimit;
    } else if (tierMatches.length > 0) {
      candidatePool = tierMatches;
    } else {
      candidatePool = candidates;
    }

    // Sort candidates:
    // 1. Least used first (usage === 0 gets priority, usage === 1 allowed)
    // 2. No back-to-back repetitions (penalty if id === lastUsedRecipeId)
    // 3. Synergy bonus: sharing ingredients with existing meals
    // 4. Mood tag score & portion cost
    const sorted = [...candidatePool].sort((a, b) => {
      const aUsage = recipeUsageCount.get(a.recipe.id) || 0;
      const bUsage = recipeUsageCount.get(b.recipe.id) || 0;

      // Synergy bonus
      const aShared = a.recipe.ingredients.filter((ing) =>
        usedIngredientsInPlan.has(ing.ingredientId)
      ).length;
      const bShared = b.recipe.ingredients.filter((ing) =>
        usedIngredientsInPlan.has(ing.ingredientId)
      ).length;

      // Penalize consecutive day repetition
      const aConsecutivePenalty = a.recipe.id === lastUsedRecipeId ? 40 : 0;
      const bConsecutivePenalty = b.recipe.id === lastUsedRecipeId ? 40 : 0;

      // Usage penalty: 0 uses = 0, 1 use = -25 penalty
      const aUsagePenalty = aUsage * 30;
      const bUsagePenalty = bUsage * 30;

      // Reshuffle variance & exclusion penalty to guarantee fresh, varied meal choices
      const aExcludedPenalty =
        options?.reshuffle && options?.excludedRecipeIds?.has(a.recipe.id) ? 75 : 0;
      const bExcludedPenalty =
        options?.reshuffle && options?.excludedRecipeIds?.has(b.recipe.id) ? 75 : 0;

      const aJitter = options?.reshuffle ? Math.floor(Math.random() * 25) : 0;
      const bJitter = options?.reshuffle ? Math.floor(Math.random() * 25) : 0;

      const aTotalScore =
        a.score +
        aShared * 8 -
        aConsecutivePenalty -
        aUsagePenalty -
        aExcludedPenalty +
        aJitter -
        a.portionCost * 0.2;
      const bTotalScore =
        b.score +
        bShared * 8 -
        bConsecutivePenalty -
        bUsagePenalty -
        bExcludedPenalty +
        bJitter -
        b.portionCost * 0.2;

      return bTotalScore - aTotalScore;
    });

    const chosen = sorted[0].recipe;
    const currentUsage = recipeUsageCount.get(chosen.id) || 0;
    recipeUsageCount.set(chosen.id, currentUsage + 1);
    lastUsedRecipeId = chosen.id;
    chosen.ingredients.forEach((ing) => usedIngredientsInPlan.add(ing.ingredientId));

    return chosen;
  }

  // Construct MealPlanDay entries
  const days: MealPlanDay[] = preferences.cookingDays.map((dayOfWeek) => {
    const dayMeals: PlannedMeal[] = slots.map((slot) => {
      const recipe = pickBestRecipeForSlot(slot);
      const cost = calculateRecipePortionCost(
        recipe,
        preferences.peopleCount,
        preferences.supermarketId,
        preferences.excludePantryStaples
      );

      return {
        id: `${dayOfWeek}-${slot}`,
        slot,
        slotLabelRo: getSlotLabelRo(slot),
        recipe,
        servings: preferences.peopleCount,
        estimatedCostRon: cost,
      };
    });

    const primaryMeal = dayMeals.find((m) => m.slot === 'dinner') || dayMeals[0];
    const dayCostSum = dayMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0);

    return {
      dayOfWeek,
      meals: dayMeals,
      recipe: primaryMeal.recipe,
      servings: preferences.peopleCount,
      estimatedCostRon: Math.round(dayCostSum * 100) / 100,
    };
  });

  // Bring the cart down to the user's budget before the plan is handed back.
  const { days: budgetedDays, swapsApplied } = optimizeDaysForBudget(
    days,
    preferences,
    eligibleRecipes,
    options
  );

  const groceryList = aggregateGroceryList(
    collectDayMeals(budgetedDays),
    preferences.supermarketId,
    preferences.excludePantryStaples,
    getExtraProductIds(preferences),
    preferences.pantryInventory || [],
    preferences.pantryStock || {}
  );

  return {
    id: `plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    supermarketId: preferences.supermarketId,
    peopleCount: preferences.peopleCount,
    totalBudgetRon: preferences.budgetRon,
    totalRecipeCostRon: groceryList.totalRecipePortionCostRon,
    totalCartCostRon: groceryList.totalCartCostRon,
    days: budgetedDays,
    budgetStatus: {
      isWithinBudget: groceryList.totalCartCostRon <= preferences.budgetRon,
      minimumAchievableRon: groceryList.totalCartCostRon,
      swapsApplied,
    },
  };
}

/**
 * Swaps a specific meal or slot in an existing plan with a valid alternative suitable for that slot.
 */
export function swapMealInPlan(
  currentPlan: MealPlan,
  dayToSwap: DayOfWeek,
  preferences: UserPreferences,
  targetSlot?: MealSlot
): MealPlan {
  const dayIndex = currentPlan.days.findIndex((d) => d.dayOfWeek === dayToSwap);
  if (dayIndex === -1) {
    throw new Error(`[PlannerEngine] Ziua "${dayToSwap}" nu se găsește în planul curent.`);
  }

  const targetDay = currentPlan.days[dayIndex];
  const slotToSwap: MealSlot =
    targetSlot ||
    (targetDay.meals && targetDay.meals.length > 0 ? targetDay.meals[0].slot : 'dinner');

  // Collect existing recipe IDs in the plan
  const existingRecipeIds = new Set<string>();
  currentPlan.days.forEach((d) => {
    if (d.meals && d.meals.length > 0) {
      d.meals.forEach((m) => existingRecipeIds.add(m.recipe.id));
    } else {
      existingRecipeIds.add(d.recipe.id);
    }
  });

  const eligible = getEligibleRecipes(preferences);

  // Filter candidates strictly matching slot compatibility
  let slotFiltered = eligible.filter((r) =>
    r.suitableSlots ? r.suitableSlots.includes(slotToSwap) : true
  );
  if (slotFiltered.length === 0) slotFiltered = eligible;

  // Candidates not already in this week's plan
  let availableCandidates = slotFiltered.filter((r) => !existingRecipeIds.has(r.id));

  // Fallback to any slot-compatible recipe except the current one if all recipes are used
  const currentMealObj = targetDay.meals?.find((m) => m.slot === slotToSwap);
  const currentRecipeId = currentMealObj ? currentMealObj.recipe.id : targetDay.recipe.id;

  if (availableCandidates.length === 0) {
    availableCandidates = slotFiltered.filter((r) => r.id !== currentRecipeId);
  }

  if (availableCandidates.length === 0) {
    availableCandidates = eligible.filter((r) => r.id !== currentRecipeId);
  }

  if (availableCandidates.length === 0) {
    throw new Error('[PlannerEngine] Nu există alte rețete compatibile pentru swap.');
  }

  // Pick the best replacement matching foodTier and mood preferences
  const effectiveTier = preferences.foodTier || 'medium';
  availableCandidates.sort((a, b) => {
    const aTier = a.tier === effectiveTier ? 20 : 0;
    const bTier = b.tier === effectiveTier ? 20 : 0;
    const aMatches = a.moodTags.filter((t) => preferences.moodTags.includes(t)).length;
    const bMatches = b.moodTags.filter((t) => preferences.moodTags.includes(t)).length;
    return bTier + bMatches - (aTier + aMatches);
  });

  const replacementRecipe = availableCandidates[0];
  const newCost = calculateRecipePortionCost(
    replacementRecipe,
    currentPlan.peopleCount,
    preferences.supermarketId,
    preferences.excludePantryStaples
  );

  const updatedDays = [...currentPlan.days];
  const updatedMeals = (targetDay.meals || []).map((m) => {
    // A reheated portion belongs to the day it was cooked on. Swapping it kept the
    // "reheated" flag on a different dish, so the card claimed yesterday's leftovers while
    // showing something else entirely -- and nothing was bought for it.
    if (m.slot === slotToSwap && !m.isLeftover) {
      return {
        ...m,
        recipe: replacementRecipe,
        estimatedCostRon: newCost,
      };
    }
    return m;
  });

  const primaryMeal = updatedMeals.find((m) => m.slot === 'dinner') ||
    updatedMeals[0] || {
      recipe: replacementRecipe,
      estimatedCostRon: newCost,
    };
  const dayCostSum = updatedMeals.reduce((sum, m) => sum + m.estimatedCostRon, 0);

  updatedDays[dayIndex] = {
    ...targetDay,
    meals: updatedMeals,
    recipe: primaryMeal.recipe,
    estimatedCostRon: Math.round(dayCostSum * 100) / 100,
  };

  // Re-aggregate full grocery list
  const allMealsToAggregate: { recipe: Recipe; servings: number }[] = [];
  updatedDays.forEach((d) => {
    d.meals.forEach((m) => {
      if (!m.isLeftover) allMealsToAggregate.push({ recipe: m.recipe, servings: m.servings });
    });
  });

  // Extras and pantry belong here exactly as they do in every other aggregation: leaving
  // them out priced a cart the user never sees, and the header stopped matching the list.
  const reaggregated = aggregateGroceryList(
    allMealsToAggregate,
    preferences.supermarketId,
    preferences.excludePantryStaples,
    getExtraProductIds(preferences),
    preferences.pantryInventory || [],
    preferences.pantryStock || {}
  );

  return {
    ...currentPlan,
    totalRecipeCostRon: reaggregated.totalRecipePortionCostRon,
    totalCartCostRon: reaggregated.totalCartCostRon,
    days: updatedDays,
  };
}

/**
 * Selects an optimal, unique dessert for a specific day based on what meals are already
 * inserted in that day and across the entire meal plan.
 *
 * Guarantees:
 * 1. Each day gets a DIFFERENT dessert (no duplicates across days).
 * 2. Never repeats a recipe already served on the same day (e.g. breakfast pancakes).
 * 3. Balances calories: lighter desserts on heavy days, richer desserts on light days.
 * 4. Prevents ingredient fatigue (e.g. avoids cheese dessert if lunch & dinner already had heavy cheese).
 * 5. Matches mood tags, food tier, and supermarket ingredient shopping list synergy.
 */
export function selectOptimalDessertForDay(
  dayOfWeek: DayOfWeek,
  currentPlan: MealPlan,
  preferences: UserPreferences
): Recipe | null {
  const day = currentPlan.days.find((d) => d.dayOfWeek === dayOfWeek);
  if (!day) return null;

  // All recipes eligible by diet and appliances with 'dessert' in suitableSlots
  const eligible = getEligibleRecipes(preferences).filter((r) =>
    r.suitableSlots ? r.suitableSlots.includes('dessert') : false
  );
  if (eligible.length === 0) return null;

  // 1. Desserts already used across the ENTIRE plan
  const existingDessertRecipeIdsInPlan = new Set<string>();
  currentPlan.days.forEach((d) => {
    (d.meals || []).forEach((m) => {
      if (m.slot === 'dessert') {
        existingDessertRecipeIdsInPlan.add(m.recipe.id);
      }
    });
  });

  // 2. Recipes on THIS specific day
  const recipeIdsInThisDay = new Set<string>((day.meals || []).map((m) => m.recipe.id));

  // 3. Frequency count of all recipes across the plan
  const planRecipeUsage = new Map<string, number>();
  currentPlan.days.forEach((d) => {
    (d.meals || []).forEach((m) => {
      planRecipeUsage.set(m.recipe.id, (planRecipeUsage.get(m.recipe.id) || 0) + 1);
    });
  });

  // Day context metrics
  const dayCalories = (day.meals || []).reduce(
    (sum, m) => sum + (m.recipe?.nutritionPerServing?.calories || 0),
    0
  );
  const dayIngredients = new Set<string>(
    (day.meals || []).flatMap((m) => m.recipe.ingredients.map((i) => i.ingredientId))
  );
  const dayHasHeavyDairy = Array.from(dayIngredients).some(
    (id) => id.includes('branza') || id.includes('telemea') || id.includes('cascaval')
  );

  // All ingredients in plan for shopping cart synergy
  const allPlanIngredients = new Set<string>(
    currentPlan.days.flatMap((d) =>
      (d.meals || []).flatMap((m) => m.recipe.ingredients.map((i) => i.ingredientId))
    )
  );

  // Score each candidate dessert
  const scored = eligible.map((candidate) => {
    let score = 100;

    // RULE 1: Ensure DIFFERENT desserts across days!
    if (existingDessertRecipeIdsInPlan.has(candidate.id)) {
      score -= 300; // Heavy penalty if already added as dessert on another day
    }

    // RULE 2: Never repeat a recipe cooked on the SAME day
    if (recipeIdsInThisDay.has(candidate.id)) {
      score -= 600; // Hard penalty
    }

    // Penalize general repetition across the week
    const generalUses = planRecipeUsage.get(candidate.id) || 0;
    score -= generalUses * 50;

    // RULE 3: Caloric and richness balance
    const candCalories = candidate.nutritionPerServing?.calories || 300;
    if (dayCalories > 1150) {
      // Heavy day: favor lighter, fresher desserts
      if (candCalories <= 320) {
        score += 40;
      } else if (candCalories >= 450) {
        score -= 30;
      }
    } else if (dayCalories > 0 && dayCalories < 850) {
      // Light day: favor rich/satisfying desserts
      if (candCalories >= 350) {
        score += 35;
      }
    }

    // RULE 4: Dairy/Cheese fatigue
    const candIngs = candidate.ingredients.map((i) => i.ingredientId);
    const candHasCheese = candIngs.some((id) => id.includes('branza') || id.includes('telemea'));
    if (dayHasHeavyDairy && candHasCheese) {
      score -= 25;
    }

    // RULE 5: Mood tag synergy
    (preferences.moodTags || []).forEach((tag) => {
      if (candidate.moodTags.includes(tag)) {
        score += 20;
      }
    });

    // RULE 6: Food Tier synergy
    if (preferences.foodTier && candidate.tier === preferences.foodTier) {
      score += 20;
    }

    // RULE 8: dishes the user said they liked. Large enough to be felt, small enough that it
    // cannot drag a dish past the variety and budget rules that follow.
    if ((preferences.favouriteRecipeIds ?? []).includes(candidate.id)) {
      score += 40;
    }

    // RULE 7: Shopping cart ingredient overlap (economical synergy)
    const overlapping = candIngs.filter((id) => allPlanIngredients.has(id));
    score += overlapping.length * 6;

    return { candidate, score };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored[0]?.candidate || eligible[0];
}
