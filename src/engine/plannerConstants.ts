export interface GenerateMealPlanOptions {
  reshuffle?: boolean;
  excludedRecipeIds?: Set<string>;
}

/** Same ceiling the generator uses, so cost-cutting cannot collapse the week into one dish. */
export const MAX_RECIPE_REPEATS = 2;

/** Random score spread used by "Regenerează" so a reshuffle actually changes the week. */
export const RESHUFFLE_JITTER_POINTS = 25;
