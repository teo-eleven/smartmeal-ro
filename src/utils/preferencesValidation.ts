import {
  Allergen,
  Appliance,
  DayOfWeek,
  DietType,
  FoodTier,
  MealSlot,
  MoodTag,
  SupermarketId,
  UserPreferences,
} from '../types';
import { SUPERMARKETS } from '../data/supermarkets';
import { ALLERGEN_CATALOG } from '../data/allergens';
import { DIET_OPTIONS_CATALOG } from './dietCompatibility';
import { MOOD_OPTIONS_CATALOG } from './moodCatalog';

/**
 * Turns anything at all into usable preferences.
 *
 * Preferences arrive from three places the app does not control: local storage, which is
 * plain localStorage on web and editable by hand; a cloud row, which may have been written
 * by an older build; and the app's own older formats. Every one of them was previously cast
 * straight to `UserPreferences`.
 *
 * That cast was how a diet could stop applying: `dietTypes` holding the string `'vegan'`
 * rather than `['vegan']` passes `.length > 0`, then iterates character by character and
 * matches nothing, so ninety recipes became eligible for a vegan — twenty-five of them meat.
 *
 * Every field is whitelisted against the catalog it belongs to, and anything unrecognisable
 * falls back to the value passed in rather than to a permissive default.
 */

const VALID_DAYS = new Set<string>([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);
const VALID_SLOTS = new Set<string>(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']);
const VALID_TIERS = new Set<string>(['basic', 'medium', 'premium']);
const VALID_APPLIANCES = new Set<string>(['hob', 'oven', 'air_fryer', 'microwave']);
const VALID_SUPERMARKETS = new Set<string>(Object.keys(SUPERMARKETS));
const VALID_ALLERGENS = new Set<string>(ALLERGEN_CATALOG.map((a) => a.id));
const VALID_DIETS = new Set<string>(DIET_OPTIONS_CATALOG.map((d) => d.id));
const VALID_MOODS = new Set<string>(MOOD_OPTIONS_CATALOG.map((m) => m.id));

/** The lowest and highest household the pack maths stays meaningful for. */
const MIN_PEOPLE = 1;
const MAX_PEOPLE = 10;

function pickString<T extends string>(value: unknown, allowed: Set<string>, fallback: T): T {
  return typeof value === 'string' && allowed.has(value) ? (value as T) : fallback;
}

/** Keeps only recognised members. A non-array yields an empty list, never the raw value. */
function pickList<T extends string>(value: unknown, allowed: Set<string>): T[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is T => typeof item === 'string' && allowed.has(item));
}

function pickStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function pickNumber(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function pickBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Amounts already at home. A non-numeric value used to become NaN, which made the shortfall
 * NaN, which made `packsToBuy` zero — an ingredient silently dropped off the shopping list.
 */
export function sanitizePantryStock(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};

  const clean: Record<string, number> = {};
  Object.entries(value as Record<string, unknown>).forEach(([id, amount]) => {
    const parsed = typeof amount === 'number' ? amount : Number(amount);
    if (Number.isFinite(parsed) && parsed > 0) {
      clean[id] = parsed;
    }
  });
  return clean;
}

export function parseUserPreferences(
  value: unknown,
  fallback: UserPreferences
): UserPreferences {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ...fallback };
  }
  const raw = value as Record<string, unknown>;

  const cookingDays = pickList<DayOfWeek>(raw.cookingDays, VALID_DAYS);
  const appliances = pickList<Appliance>(raw.appliances, VALID_APPLIANCES);
  const mealSlots = pickList<MealSlot>(raw.mealSlots, VALID_SLOTS).filter(
    (slot) => slot !== 'snack'
  );
  const dietTypes = pickList<DietType>(raw.dietTypes, VALID_DIETS);

  return {
    supermarketId: pickString<SupermarketId>(
      raw.supermarketId,
      VALID_SUPERMARKETS,
      fallback.supermarketId
    ),
    peopleCount: Math.round(
      pickNumber(raw.peopleCount, fallback.peopleCount, MIN_PEOPLE, MAX_PEOPLE)
    ),
    // An empty week cannot produce a plan, so it falls back rather than through.
    cookingDays: cookingDays.length > 0 ? cookingDays : fallback.cookingDays,
    budgetRon: pickNumber(raw.budgetRon, fallback.budgetRon, 1, 100000),
    moodTags: pickList<MoodTag>(raw.moodTags, VALID_MOODS),
    dietType: pickString<DietType>(raw.dietType, VALID_DIETS, fallback.dietType),
    dietTypes: dietTypes.length > 0 ? dietTypes : undefined,
    appliances: appliances.length > 0 ? appliances : fallback.appliances,
    excludePantryStaples: pickBoolean(raw.excludePantryStaples, fallback.excludePantryStaples),
    pantryInventory: pickStringList(raw.pantryInventory),
    pantryStock: sanitizePantryStock(raw.pantryStock),
    avoidedAllergens: pickList<Allergen>(raw.avoidedAllergens, VALID_ALLERGENS),
    dislikedRecipeIds: pickStringList(raw.dislikedRecipeIds),
    favouriteRecipeIds: pickStringList(raw.favouriteRecipeIds),
    mealSlots: mealSlots.length > 0 ? mealSlots : fallback.mealSlots,
    foodTier: pickString<FoodTier>(raw.foodTier, VALID_TIERS, fallback.foodTier ?? 'medium'),
    selectedSnackIds: pickStringList(raw.selectedSnackIds),
    selectedDrinkIds: pickStringList(raw.selectedDrinkIds),
    includeAlcohol: pickBoolean(raw.includeAlcohol, fallback.includeAlcohol ?? false),
  };
}
