import { DietType, HealthGoalTag, UserPreferences } from '../types';
import { areDietsCompatible, isBaseDiet } from '../utils/dietCompatibility';

/**
 * Protections are the preferences that keep someone safe or respect a firm "never": allergies,
 * diet, dishes they rejected and "Fără porc". When two sets of preferences meet (a restored
 * plan, a cloud row from another device) these only ever get stricter. Everything else is a
 * matter of taste and follows whichever side the user chose to adopt.
 */

function asList<T>(value: T[] | undefined): T[] {
  // Either side can come from storage or a cloud row as something that is not a list.
  return Array.isArray(value) ? value : [];
}

function union<T>(a: T[] | undefined, b: T[] | undefined): T[] {
  return Array.from(new Set([...asList(a), ...asList(b)]));
}

/** Strictness of the base diets: each one excludes everything the previous one excludes. */
const BASE_DIET_STRICTNESS: Record<string, number> = {
  omnivore: 0,
  pescatarian: 1,
  vegetarian: 2,
  vegan: 3,
};

/** Modifiers in the order they are kept when only one fits: gluten is a medical need. */
const MODIFIER_PRIORITY: DietType[] = ['gluten_free', 'keto'];

/** The app allows a base diet plus one modifier. */
const MAX_DIETS = 2;

function dietsOf(preferences: UserPreferences): DietType[] {
  const list = asList(preferences.dietTypes);
  return list.length > 0 ? list : [preferences.dietType];
}

function baseDietOf(diets: DietType[]): DietType {
  return diets.find(isBaseDiet) ?? 'omnivore';
}

/**
 * The stricter of two diets: the stricter base, plus the modifiers either side had that are
 * compatible with it. A cloud row from an older device saying "omnivore" must never turn a
 * vegan's week back into meat.
 */
export function stricterDiet(
  a: UserPreferences,
  b: UserPreferences
): Pick<UserPreferences, 'dietType' | 'dietTypes'> {
  const aDiets = dietsOf(a);
  const bDiets = dietsOf(b);
  const aBase = baseDietOf(aDiets);
  const bBase = baseDietOf(bDiets);
  const base =
    (BASE_DIET_STRICTNESS[bBase] ?? 0) > (BASE_DIET_STRICTNESS[aBase] ?? 0) ? bBase : aBase;

  const wantedModifiers = new Set([...aDiets, ...bDiets].filter((diet) => !isBaseDiet(diet)));
  const modifiers = MODIFIER_PRIORITY.filter(
    (modifier) => wantedModifiers.has(modifier) && areDietsCompatible(base, modifier)
  );

  // "Omnivore" restricts nothing, so it gives up its place for a second modifier: keto from
  // one side and gluten-free from the other must both survive.
  const listed = base === 'omnivore' && modifiers.length > 0 ? modifiers : [base, ...modifiers];
  const dietTypes = listed.slice(0, MAX_DIETS);
  return { dietType: base, dietTypes };
}

/**
 * Allergies and rejected dishes from both sides, and "Fără porc" if either side had it.
 *
 * Both sides must already have been through `parseUserPreferences`, which resolves renamed
 * recipe ids; unioning raw ids from storage would keep an old and a new id for one dish.
 *
 * The other health goals are left to `base`: they shape the menu rather than forbid
 * anything, and a user who switched one off did so on purpose.
 */
export function mergeProtections(
  base: UserPreferences,
  other: UserPreferences
): Pick<UserPreferences, 'avoidedAllergens' | 'dislikedRecipeIds' | 'healthGoalTags'> {
  const porkFree: HealthGoalTag[] = asList(other.healthGoalTags).includes('pork_free')
    ? ['pork_free']
    : [];

  return {
    avoidedAllergens: union(base.avoidedAllergens, other.avoidedAllergens),
    dislikedRecipeIds: union(base.dislikedRecipeIds, other.dislikedRecipeIds),
    healthGoalTags: union(base.healthGoalTags, porkFree),
  };
}
