import { ALLERGEN_CATALOG } from '../data/allergens';
import { recipeContainsPork } from '../data/healthTags';
import { resolveRecipeId } from '../data/recipeIdAliases';
import { RECIPES_MAP } from '../data/recipes';
import { calculateRecipePortionCost } from '../engine/budgetCalculator';
import {
  getEligibleDessertRecipes,
  getEligibleRecipes,
  hasRequiredAppliances,
  isSupermarketCompatible,
} from '../engine/plannerEngine';
import { Allergen, MealPlanDay, PlannedMeal, Recipe, UserPreferences } from '../types';
import { getRecipeAllergens } from '../utils/allergenFilter';
import { isRecipeMatchingDiets } from '../utils/dietCompatibility';

import { SystemNotice } from './appState';

export const KNOWN_ALLERGENS = new Set<string>(ALLERGEN_CATALOG.map((a) => a.id));

/**
 * Allergen lists only ever grow when they meet. Restoring an older plan, or reading a list
 * back from storage, must never be a way to end up protected against less than before.
 */
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
export function makePlanSafeForPreferences(
  days: MealPlanDay[],
  preferences: UserPreferences
): { days: MealPlanDay[]; replacedCount: number; offendingAllergens: Allergen[] } {
  const eligible = getEligibleRecipes(preferences);
  // Desserts are judged by the dessert rules, exactly as generation picks them: health goals
  // shape the main meals only, so a dessert without a 'high_fiber' tag is not unsafe.
  const eligibleDesserts = getEligibleDessertRecipes(preferences);
  const avoided = preferences.avoidedAllergens ?? [];
  let replacedCount = 0;
  const offending = new Set<Allergen>();

  const usage = new Map<string, number>();
  days.forEach((day) =>
    day.meals.forEach((meal) => {
      const id = resolveRecipeId(meal.recipe.id);
      usage.set(id, (usage.get(id) || 0) + 1);
    })
  );

  const safeDays = days.map((day) => {
    const meals = day.meals.map((meal) => {
      // The id was checked and the body was believed. A plan from storage or the cloud could
      // keep a legitimate id while its ingredients said something else entirely, and the
      // allergen verdict was then computed against a list the catalog never contained.
      // Whatever arrives, the dish served is the one the catalog defines.
      const canonical = RECIPES_MAP[resolveRecipeId(meal.recipe.id)];
      const pool = meal.slot === 'dessert' ? eligibleDesserts : eligible;
      const isSafe = Boolean(canonical) && pool.some((recipe) => recipe.id === canonical.id);
      if (isSafe) return meal.recipe === canonical ? meal : { ...meal, recipe: canonical };

      // A dish the catalog does not know is replaced; its stored body is never read, since it
      // may not even have an ingredient list.
      (canonical ? getRecipeAllergens(canonical) : [])
        .filter((allergen) => avoided.includes(allergen))
        .forEach((allergen) => offending.add(allergen));

      // A dessert is only ever replaced by a dessert; with none left, the slot is dropped.
      const replacement =
        pool.find(
          (recipe) =>
            (recipe.suitableSlots ? recipe.suitableSlots.includes(meal.slot) : true) &&
            (usage.get(recipe.id) || 0) < 2
        ) ??
        pool.find((recipe) =>
          recipe.suitableSlots ? recipe.suitableSlots.includes(meal.slot) : true
        ) ??
        (meal.slot === 'dessert' ? undefined : pool[0]);

      replacedCount += 1;
      if (!replacement) return null;

      usage.set(replacement.id, (usage.get(replacement.id) || 0) + 1);
      return {
        ...meal,
        recipe: replacement,
        // A reheated portion was paid for on the day it was cooked; recomputing it here put
        // a price on the card and in the day total for something the cart never buys.
        estimatedCostRon: meal.isLeftover
          ? 0
          : calculateRecipePortionCost(
              replacement,
              meal.servings,
              preferences.supermarketId,
              preferences.excludePantryStaples
            ),
      };
    });

    const keptMeals = meals.filter((meal): meal is PlannedMeal => meal !== null);
    const primary = keptMeals.find((meal) => meal.slot === 'dinner') || keptMeals[0];
    // With nothing safe left, the day goes: keeping it would keep the unsafe dish as its
    // headline, and parts of the UI read the headline rather than the meals.
    if (!primary) return null;
    const sum = keptMeals.reduce((total, meal) => total + meal.estimatedCostRon, 0);

    return {
      ...day,
      meals: keptMeals,
      recipe: primary.recipe,
      estimatedCostRon: Math.round(sum * 100) / 100,
    };
  });

  return {
    days: safeDays.filter((day): day is MealPlanDay => day !== null),
    replacedCount,
    offendingAllergens: Array.from(offending),
  };
}

/** Said when no day of an incoming plan survives today's rules, so nothing is replaced. */
export function buildNothingSafeNotice(source: 'restore' | 'cloud'): SystemNotice {
  return {
    id: Date.now().toString(),
    title: 'Planul nu se potrivește cu setările tale',
    message:
      source === 'restore'
        ? 'Niciun fel din planul salvat nu respectă dieta, alergiile sau aparatele tale de acum, așa că am păstrat meniul curent.'
        : 'Niciun fel din planul din cloud nu respectă dieta, alergiile sau aparatele tale de pe acest dispozitiv, așa că am păstrat meniul curent.',
    type: 'warning',
  };
}

/**
 * The safety pass, for plans that arrive from outside generation. A malformed plan throws
 * inside it; that is a refusal like any other, never a crash out of a tap handler.
 */
export function tryMakePlanSafe(
  days: MealPlanDay[],
  preferences: UserPreferences
): ReturnType<typeof makePlanSafeForPreferences> | null {
  try {
    const result = makePlanSafeForPreferences(days, preferences);
    return result.days.length > 0 ? result : null;
  } catch (error) {
    console.warn('[useAppStore] Incoming plan unusable:', error);
    return null;
  }
}

export function buildRestoreNotice(replacedCount: number, offendingAllergens: Allergen[]): string {
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

export function buildInfeasibleNotice(reason: string): SystemNotice {
  return {
    id: Date.now().toString(),
    title: 'Combinație imposibilă',
    message: reason,
    type: 'warning',
  };
}

/**
 * Applies one of the wizard's single-tap preference controls.
 *
 * Before a plan exists there is nothing to rebuild, which is the onboarding case. Once one
 * exists these controls are reachable again -- the wizard opens over a live plan with
 * ?onboarding=1 -- and the board then has to follow the preferences rather than keep meals
 * they no longer allow. Diet and appliances are hard constraints, so this is a safety path.
 */
/**
 * Explains why a recipe may not be put in front of this user, or null when it may.
 *
 * Diet, allergens and appliances are the three hard constraints the planner never relaxes;
 * this states them once so a caller cannot accidentally skip one.
 */
export function describeUnsafeRecipe(recipe: Recipe, preferences: UserPreferences): string | null {
  // `dislikedRecipeIds` is documented as a hard filter like diet and allergens, and
  // `getEligibleRecipes` treats it as one. This check did not, so a refused dish could be
  // put straight back on the board through a direct replacement.
  if ((preferences.dislikedRecipeIds ?? []).includes(recipe.id)) {
    return `Ai spus că nu vrei să-ți mai propun „${recipe.title}".`;
  }

  // Store availability is the other predicate getEligibleRecipes enforces and this one
  // omitted, so the two definitions of "allowed" disagreed by exactly two rules.
  if (!isSupermarketCompatible(recipe, preferences.supermarketId)) {
    return `„${recipe.title}" nu se găsește la magazinul pe care l-ai ales.`;
  }

  const diets =
    preferences.dietTypes && preferences.dietTypes.length > 0
      ? preferences.dietTypes
      : [preferences.dietType];

  const offendingAllergens = getRecipeAllergens(recipe).filter((allergen) =>
    (preferences.avoidedAllergens ?? []).includes(allergen)
  );
  if (offendingAllergens.length > 0) {
    const labels = offendingAllergens
      .map((id) => ALLERGEN_CATALOG.find((a) => a.id === id)?.label.toLowerCase() ?? id)
      .join(', ');
    return `„${recipe.title}" conține ${labels}, iar tu ai declarat această alergie.`;
  }

  if (!isRecipeMatchingDiets(recipe, diets)) {
    return `„${recipe.title}" nu se potrivește cu dieta pe care ai ales-o.`;
  }

  // The other admission paths (generation, alternatives, desserts) all enforce this one; a
  // direct replacement did not, so a pork dish could be put on a "Fără porc" board by hand.
  if ((preferences.healthGoalTags ?? []).includes('pork_free') && recipeContainsPork(recipe)) {
    return `„${recipe.title}" conține carne de porc, iar tu ai ales „Fără porc”.`;
  }

  if (!hasRequiredAppliances(recipe.appliances, preferences.appliances)) {
    return `„${recipe.title}" are nevoie de un aparat pe care nu l-ai bifat în bucătăria ta.`;
  }

  return null;
}

/** Keeps a day's headline dish and total in step with the meals it actually holds. */
export function rebuildDayShape(
  meals: PlannedMeal[],
  day: MealPlanDay
): { recipe: Recipe; estimatedCostRon: number } {
  const primary = meals.find((m) => m.slot === 'dinner') ?? meals[0];
  const sum = meals.reduce((total, m) => total + m.estimatedCostRon, 0);
  return {
    recipe: primary ? primary.recipe : day.recipe,
    estimatedCostRon: Math.round(sum * 100) / 100,
  };
}
