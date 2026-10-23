import { recipeContainsPork } from '../data/healthTags';
import { RECIPES } from '../data/recipes';
import { Appliance, DietType, MealSlot, Recipe, SupermarketId, UserPreferences } from '../types';
import { isRecipeSafeForAllergies } from '../utils/allergenFilter';
import { isRecipeMatchingDiets } from '../utils/dietCompatibility';

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
  const requirePorkFree = preferences.healthGoalTags?.includes('pork_free');
  const activeHealthGoals = (preferences.healthGoalTags || []).filter((g) => g !== 'pork_free');

  return RECIPES.filter(
    (recipe) =>
      !rejected.has(recipe.id) &&
      (!requirePorkFree || !recipeContainsPork(recipe)) &&
      (!activeHealthGoals.length ||
        activeHealthGoals.some((g) => (recipe.healthTags || []).includes(g))) &&
      isRecipeMatchingDiets(recipe, activeDiets) &&
      isRecipeSafeForAllergies(recipe, preferences.avoidedAllergens) &&
      hasRequiredAppliances(recipe.appliances, preferences.appliances) &&
      isSupermarketCompatible(recipe, preferences.supermarketId)
  );
}

/**
 * Retrieves all dessert recipes matching dietary, allergy, appliance, and supermarket constraints.
 * Desserts are exempt from savory main-dish health goal restrictions (e.g. muscle_gain, high_protein),
 * but strictly enforce diets, avoided allergens, required kitchen appliances, and religious/pork restrictions.
 */
export function getEligibleDessertRecipes(preferences: UserPreferences): Recipe[] {
  const activeDiets: DietType[] =
    preferences.dietTypes && preferences.dietTypes.length > 0
      ? preferences.dietTypes
      : [preferences.dietType];
  const rejected = new Set(preferences.dislikedRecipeIds ?? []);
  const requirePorkFree = preferences.healthGoalTags?.includes('pork_free');

  // Primary: strictly matching store, appliances, diet, allergens, not disliked, pork_free, and suitable for dessert slot
  let desserts = RECIPES.filter(
    (recipe) =>
      Boolean(recipe.suitableSlots?.includes('dessert')) &&
      !rejected.has(recipe.id) &&
      (!requirePorkFree || !recipeContainsPork(recipe)) &&
      isRecipeMatchingDiets(recipe, activeDiets) &&
      isRecipeSafeForAllergies(recipe, preferences.avoidedAllergens) &&
      hasRequiredAppliances(recipe.appliances, preferences.appliances) &&
      isSupermarketCompatible(recipe, preferences.supermarketId)
  );

  // Fallback: relax supermarket availability if store-specific catalog is limited,
  // but NEVER relax diet, allergens, appliances, or religious restrictions!
  if (desserts.length === 0) {
    desserts = RECIPES.filter(
      (recipe) =>
        Boolean(recipe.suitableSlots?.includes('dessert')) &&
        !rejected.has(recipe.id) &&
        (!requirePorkFree || !recipeContainsPork(recipe)) &&
        isRecipeMatchingDiets(recipe, activeDiets) &&
        isRecipeSafeForAllergies(recipe, preferences.avoidedAllergens) &&
        hasRequiredAppliances(recipe.appliances, preferences.appliances)
    );
  }

  // Sort: dishes matching user's selected foodTier or moodTags (especially sweet_treat) first
  const effectiveTier = preferences.foodTier || 'medium';
  return desserts.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if ((preferences.favouriteRecipeIds ?? []).includes(a.id)) scoreA += 50;
    if ((preferences.favouriteRecipeIds ?? []).includes(b.id)) scoreB += 50;
    if (a.tier === effectiveTier) scoreA += 20;
    if (b.tier === effectiveTier) scoreB += 20;
    if (preferences.moodTags?.includes('sweet_treat')) {
      if (a.moodTags?.includes('sweet_treat')) scoreA += 30;
      if (b.moodTags?.includes('sweet_treat')) scoreB += 30;
    }
    // Synergy with user's active health goals if the dessert possesses them (e.g. chia pudding for anti-inflammatory)
    (a.healthTags || []).forEach((t) => {
      if (preferences.healthGoalTags?.includes(t)) scoreA += 15;
    });
    (b.healthTags || []).forEach((t) => {
      if (preferences.healthGoalTags?.includes(t)) scoreB += 15;
    });
    return scoreB - scoreA;
  });
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
  const isDessert = slot === 'dessert' || Boolean(currentRecipe.suitableSlots?.includes('dessert'));
  const eligible = isDessert
    ? getEligibleDessertRecipes(preferences)
    : getEligibleRecipes(preferences);
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

    const aHealthMatches = (a.healthTags || []).filter((t) =>
      preferences.healthGoalTags?.includes(t)
    ).length;
    const bHealthMatches = (b.healthTags || []).filter((t) =>
      preferences.healthGoalTags?.includes(t)
    ).length;
    if (bHealthMatches !== aHealthMatches) return bHealthMatches - aHealthMatches;

    const aMatch = a.tier === effectiveTier ? 1 : 0;
    const bMatch = b.tier === effectiveTier ? 1 : 0;
    return bMatch - aMatch;
  });
}
