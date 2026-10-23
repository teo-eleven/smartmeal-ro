import { recipeContainsPork } from '../data/healthTags';
import { RECIPES } from '../data/recipes';
import {
  DietType,
  FoodTier,
  HealthGoalTag,
  MealSlot,
  MoodTag,
  Recipe,
  UserPreferences,
} from '../types';
import { isRecipeSafeForAllergies } from '../utils/allergenFilter';
import { isRecipeMatchingDiets } from '../utils/dietCompatibility';

import { getEligibleDessertRecipes, hasRequiredAppliances } from './eligibility';
import {
  GenerateMealPlanOptions,
  MAX_RECIPE_REPEATS,
  RESHUFFLE_JITTER_POINTS,
} from './plannerConstants';
import { ScoredRecipe, scoreFallbackRecipes as scoreFallback } from './recipeScoring';

/** Everything the slot picker needs to know about this week's rules. */
export interface SlotPickerContext {
  preferences: UserPreferences;
  scoredRecipes: ScoredRecipe[];
  activeDiets: DietType[];
  rejectedIds: Set<string>;
  requirePorkFree: boolean | undefined;
  activeHealthGoals: HealthGoalTag[];
  effectiveTier: FoodTier;
  options?: GenerateMealPlanOptions;
}

/**
 * The function that chooses each meal of a week, one slot at a time. It remembers what it
 * already served (usage counts, the last dish, ingredients in play) so variety and
 * ingredient synergy hold across the whole week; a new picker starts a new week.
 */
/** Cheaper first: a craving may pull in a dish of a cheaper tier, never a dearer one. */
const TIER_RANK: Record<FoodTier, number> = { basic: 0, medium: 1, premium: 2 };
/** Once the chosen tier has no unused dish left for a craving, a cheaper tier may serve it. */
const MIN_TIER_OPTIONS_PER_CRAVING = 1;

export function createSlotPicker(ctx: SlotPickerContext) {
  const {
    preferences,
    scoredRecipes,
    activeDiets,
    rejectedIds,
    requirePorkFree,
    activeHealthGoals,
    effectiveTier,
    options,
  } = ctx;
  const recipeUsageCount = new Map<string, number>();
  const usedIngredientsInPlan = new Set<string>();
  let lastUsedRecipeId: string | null = null;
  // Meals served from a cheaper tier because of a craving, and meals picked in all: at most
  // half may be the former, so the chosen tier still shows in the plan.
  let cravingFromCheaperTier = 0;
  let mealsPicked = 0;

  const scoreFallbackRecipes = (recipes: Recipe[]) => scoreFallback(recipes, preferences);

  function matchesSlot(recipe: Recipe, slot: MealSlot): boolean {
    if (!recipe.suitableSlots || recipe.suitableSlots.length === 0) return true;
    return recipe.suitableSlots.includes(slot);
  }

  /**
   * Null only when nothing at all may be served in this slot, which today happens for
   * desserts under strict diets: keto has no dessert, and inventing one would break the diet.
   */
  function pickBestRecipeForSlot(slot: MealSlot, daySpotlightMood?: MoodTag): Recipe | null {
    // Relaxation ladder, loosest constraint first. Diet and appliances are NEVER relaxed:
    // suggesting a dish the user cannot cook, or must not eat, is worse than no preference
    // match at all. Only store availability and slot suitability may give way.
    let candidates =
      slot === 'dessert'
        ? scoreFallbackRecipes(getEligibleDessertRecipes(preferences))
        : scoredRecipes.filter((s) => matchesSlot(s.recipe, slot));

    if (slot === 'dessert' && candidates.length === 0) {
      // Fallback for desserts relaxing supermarket only, strictly KEEPING diet, allergens, appliances!
      const anyDesserts = RECIPES.filter(
        (r) =>
          matchesSlot(r, 'dessert') &&
          !rejectedIds.has(r.id) &&
          (!requirePorkFree || !recipeContainsPork(r)) &&
          isRecipeMatchingDiets(r, activeDiets) &&
          isRecipeSafeForAllergies(r, preferences.avoidedAllergens) &&
          hasRequiredAppliances(r.appliances, preferences.appliances)
      );
      if (anyDesserts.length > 0) {
        candidates = scoreFallbackRecipes(anyDesserts);
      }
    } else if (candidates.length === 0) {
      // 1. Drop the supermarket requirement, keep diet + appliances + slot + health goals.
      const ignoringStore = RECIPES.filter(
        (r) =>
          !rejectedIds.has(r.id) &&
          matchesSlot(r, slot) &&
          (!activeHealthGoals.length ||
            activeHealthGoals.some((g) => (r.healthTags || []).includes(g))) &&
          isRecipeMatchingDiets(r, activeDiets) &&
          isRecipeSafeForAllergies(r, preferences.avoidedAllergens) &&
          hasRequiredAppliances(r.appliances, preferences.appliances) &&
          (!requirePorkFree || !recipeContainsPork(r))
      );

      if (ignoringStore.length > 0) {
        candidates = scoreFallbackRecipes(ignoringStore);
      } else {
        // 2. Drop slot suitability too, keeping health goals.
        const ignoringSlot = RECIPES.filter(
          (r) =>
            !rejectedIds.has(r.id) &&
            (!activeHealthGoals.length ||
              activeHealthGoals.some((g) => (r.healthTags || []).includes(g))) &&
            isRecipeMatchingDiets(r, activeDiets) &&
            isRecipeSafeForAllergies(r, preferences.avoidedAllergens) &&
            hasRequiredAppliances(r.appliances, preferences.appliances) &&
            (!requirePorkFree || !recipeContainsPork(r))
        );

        if (ignoringSlot.length > 0) {
          candidates = scoreFallbackRecipes(ignoringSlot);
        } else {
          // 3. Reached when the catalog has no health-tagged dish under this diet/appliance constraint.
          // Relax health goals (except pork_free, which is strict dietary/religious).
          const cookableAndEdible = RECIPES.filter(
            (r) =>
              !rejectedIds.has(r.id) &&
              isRecipeMatchingDiets(r, activeDiets) &&
              isRecipeSafeForAllergies(r, preferences.avoidedAllergens) &&
              hasRequiredAppliances(r.appliances, preferences.appliances) &&
              (!requirePorkFree || !recipeContainsPork(r))
          );
          candidates =
            cookableAndEdible.length > 0 ? scoreFallbackRecipes(cookableAndEdible) : scoredRecipes;
        }
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
    // A craving the chosen tier has run out of may reach into a cheaper tier. Without it the
    // tier emptied cravings before they were read: 17 of the 19 soups are Basic, so a Medium
    // household asking for soups got the two Medium ones and nothing more. The tier's own
    // dishes still come first, so the tier keeps deciding the overall level.
    // Only for the day's own craving (each craving gets its days), so the other days keep
    // the chosen tier and the plan's overall level does not slide down.
    const isSpotlightScarce =
      Boolean(daySpotlightMood) &&
      cravingFromCheaperTier * 2 <= mealsPicked &&
      candidates.filter(
        (c) =>
          c.recipe.tier === effectiveTier &&
          c.recipe.moodTags.includes(daySpotlightMood as MoodTag) &&
          !recipeUsageCount.has(c.recipe.id)
      ).length < MIN_TIER_OPTIONS_PER_CRAVING;
    const isCraved = (recipe: Recipe) =>
      isSpotlightScarce &&
      TIER_RANK[recipe.tier ?? 'medium'] <= TIER_RANK[effectiveTier] &&
      recipe.moodTags.includes(daySpotlightMood as MoodTag);
    const matchesTier = (s: (typeof candidates)[number]) =>
      s.recipe.tier === effectiveTier || isWanted(s.recipe.id) || isCraved(s.recipe);

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
    // One draw per candidate, made before sorting: drawn inside the comparator, the same
    // recipe scored differently on every comparison and the resulting order was undefined.
    const jitterById = new Map(
      candidatePool.map((c) => [
        c.recipe.id,
        options?.reshuffle ? Math.floor(Math.random() * RESHUFFLE_JITTER_POINTS) : 0,
      ])
    );

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

      // Spotlight mood boost: intelligently distributes user cravings across days
      const aSpotlightBonus =
        daySpotlightMood && a.recipe.moodTags.includes(daySpotlightMood) ? 35 : 0;
      const bSpotlightBonus =
        daySpotlightMood && b.recipe.moodTags.includes(daySpotlightMood) ? 35 : 0;

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

      const aJitter = jitterById.get(a.recipe.id) ?? 0;
      const bJitter = jitterById.get(b.recipe.id) ?? 0;

      const aTotalScore =
        a.score +
        aShared * 8 +
        aSpotlightBonus -
        aConsecutivePenalty -
        aUsagePenalty -
        aExcludedPenalty +
        aJitter -
        a.portionCost * 0.2;
      const bTotalScore =
        b.score +
        bShared * 8 +
        bSpotlightBonus -
        bConsecutivePenalty -
        bUsagePenalty -
        bExcludedPenalty +
        bJitter -
        b.portionCost * 0.2;

      return bTotalScore - aTotalScore;
    });

    if (sorted.length === 0) return null;
    const chosen = sorted[0].recipe;
    mealsPicked += 1;
    if (TIER_RANK[chosen.tier ?? 'medium'] < TIER_RANK[effectiveTier]) cravingFromCheaperTier += 1;
    const currentUsage = recipeUsageCount.get(chosen.id) || 0;
    recipeUsageCount.set(chosen.id, currentUsage + 1);
    lastUsedRecipeId = chosen.id;
    chosen.ingredients.forEach((ing) => usedIngredientsInPlan.add(ing.ingredientId));

    return chosen;
  }

  return pickBestRecipeForSlot;
}
