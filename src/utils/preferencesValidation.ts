import {
  Allergen,
  Appliance,
  DayOfWeek,
  DietType,
  FoodTier,
  HealthGoalTag,
  MealSlot,
  MoodTag,
  SupermarketId,
  UserPreferences,
} from '../types';
import { DEFAULT_REMINDERS, ReminderSettings } from '../types';
import { SUPERMARKETS } from '../data/supermarkets';
import { ALLERGEN_CATALOG } from '../data/allergens';
import { HEALTH_GOALS_CATALOG } from '../data/healthTags';
import { resolveRecipeIds } from '../data/recipeIdAliases';
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
const VALID_HEALTH_GOALS = new Set<string>(HEALTH_GOALS_CATALOG.map((g) => g.id));
const SNACK_TASTES: readonly NonNullable<UserPreferences['snackTastePreference']>[] = [
  'sweet',
  'savory',
  'both',
];
const VALID_SNACK_TASTES = new Set<string>(SNACK_TASTES);

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

/**
 * Per-day slot layouts. Unknown days and slots are dropped, and a day left with no slots is
 * dropped too: an empty list would ask the planner for a day with no meals at all.
 */
function pickDailyMealSlots(value: unknown): Partial<Record<DayOfWeek, MealSlot[]>> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([day]) => VALID_DAYS.has(day))
    .map(([day, slots]) => [day, pickList<MealSlot>(slots, VALID_SLOTS)] as const)
    .filter(([, slots]) => slots.length > 0);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/**
 * Whether the stored diet had to be repaired to be read.
 *
 * parseUserPreferences falls back quietly, which for a diet can mean a vegan reading as
 * omnivore. Hydration asks this so it can tell the user instead of serving them meat.
 */
export function wasDietRepaired(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const raw = value as Record<string, unknown>;

  const dietTypeBroken = raw.dietType !== undefined && !VALID_DIETS.has(raw.dietType as string);
  if (raw.dietTypes === undefined || raw.dietTypes === null) return dietTypeBroken;
  if (!Array.isArray(raw.dietTypes)) return true;

  const validCount = pickList<DietType>(raw.dietTypes, VALID_DIETS).length;
  return dietTypeBroken || validCount !== raw.dietTypes.length;
}

/**
 * Whether the stored health goals had to be repaired to be read. "Fără porc" lives here, so a
 * list that could not be read may have been a religious restriction the app just lost.
 */
export function wasHealthGoalsRepaired(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const tags = (value as Record<string, unknown>).healthGoalTags;
  if (tags === undefined || tags === null) return false;
  if (!Array.isArray(tags)) return true;
  return pickList<HealthGoalTag>(tags, VALID_HEALTH_GOALS).length !== tags.length;
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
  const healthGoalTags = pickList<HealthGoalTag>(raw.healthGoalTags, VALID_HEALTH_GOALS);
  const pendingPantryStock = sanitizePantryStock(raw.pendingPantryStock);
  const snackTastePreference =
    typeof raw.snackTastePreference === 'string' && VALID_SNACK_TASTES.has(raw.snackTastePreference)
      ? (raw.snackTastePreference as UserPreferences['snackTastePreference'])
      : undefined;

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
    // Ids of renamed recipes are translated, so a favourite or a rejection survives a rename.
    dislikedRecipeIds: resolveRecipeIds(pickStringList(raw.dislikedRecipeIds)),
    favouriteRecipeIds: resolveRecipeIds(pickStringList(raw.favouriteRecipeIds)),
    mealSlots: mealSlots.length > 0 ? mealSlots : fallback.mealSlots,
    foodTier: pickString<FoodTier>(raw.foodTier, VALID_TIERS, fallback.foodTier ?? 'medium'),
    selectedSnackIds: pickStringList(raw.selectedSnackIds),
    selectedDrinkIds: pickStringList(raw.selectedDrinkIds),
    includeAlcohol: pickBoolean(raw.includeAlcohol, fallback.includeAlcohol ?? false),
    // These four were missing, so they vanished on every launch and every cloud pull.
    healthGoalTags,
    dailyMealSlots: pickDailyMealSlots(raw.dailyMealSlots),
    pendingPantryStock: Object.keys(pendingPantryStock).length > 0 ? pendingPantryStock : undefined,
    snackTastePreference,
  };
}

const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

/**
 * Reminder settings in the shape the app uses.
 *
 * Untrusted like everything else that comes back from storage or a network: a malformed time
 * would schedule nothing at all, silently, which is the worst way for a reminder to fail.
 * The database speaks snake_case, so `supabase.ts` maps its row into this shape first --
 * one parser for two spellings is how the local copy stopped being read at all.
 */
export function parseReminderSettings(value: unknown): ReminderSettings {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ...DEFAULT_REMINDERS };
  }
  const raw = value as Record<string, unknown>;

  const time = (candidate: unknown, fallback: string) =>
    typeof candidate === 'string' && TIME_PATTERN.test(candidate) ? candidate : fallback;

  const weekday = Number(raw.shoppingWeekday);
  const frequency = Number(raw.emailFrequencyDays);

  return {
    cookingEnabled: raw.cookingEnabled === true,
    cookingTime: time(raw.cookingTime, DEFAULT_REMINDERS.cookingTime),
    shoppingEnabled: raw.shoppingEnabled === true,
    shoppingWeekday:
      Number.isInteger(weekday) && weekday >= 0 && weekday <= 6
        ? weekday
        : DEFAULT_REMINDERS.shoppingWeekday,
    shoppingTime: time(raw.shoppingTime, DEFAULT_REMINDERS.shoppingTime),
    emailEnabled: raw.emailEnabled === true,
    // Clamped rather than rejected: a value outside the range is a stale client, not an
    // attack, and the database would refuse the write anyway.
    emailFrequencyDays:
      Number.isInteger(frequency) && frequency >= 2 && frequency <= 7
        ? frequency
        : DEFAULT_REMINDERS.emailFrequencyDays,
  };
}
