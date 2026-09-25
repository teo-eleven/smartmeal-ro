import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealPlan, UserPreferences, GroceryListItem, SavedPlan } from '../types';

const STORAGE_KEYS = {
  PREFERENCES: '@smartmeal_preferences',
  CURRENT_PLAN: '@smartmeal_current_plan',
  GROCERY_ITEMS: '@smartmeal_grocery_items',
  SAVED_PLANS: '@smartmeal_saved_plans',
  THEME_MODE: '@smartmeal_theme_mode',
};

/** Shape check for a row read back from storage, before anything relies on it. */
export function isWellFormedSavedPlan(value: unknown): value is SavedPlan {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  const plan = entry.plan as { days?: unknown } | undefined;
  return (
    typeof entry.id === 'string' &&
    typeof entry.name === 'string' &&
    typeof plan === 'object' &&
    plan !== null &&
    Array.isArray(plan.days) &&
    typeof entry.preferences === 'object' &&
    entry.preferences !== null
  );
}

/**
 * Shape check for the current plan, before hydration touches it.
 *
 * loadSavedPlans has filtered its rows since the library existed; this one did not, and a
 * plan whose days were missing or the wrong type threw from inside the hydration try block,
 * which then discarded the preferences and the plan library alongside it.
 */
const VALID_MEAL_SLOTS = new Set<string>(['breakfast', 'lunch', 'dinner', 'snack', 'dessert']);

/** A meal is only usable if it names a recipe and a slot the app knows. */
function isWellFormedMeal(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const meal = value as { recipe?: unknown; slot?: unknown };
  if (typeof meal.slot !== 'string' || !VALID_MEAL_SLOTS.has(meal.slot)) return false;
  const recipe = meal.recipe as { id?: unknown } | undefined;
  return typeof recipe === 'object' && recipe !== null && typeof recipe.id === 'string';
}

export function isWellFormedPlan(value: unknown): value is MealPlan {
  if (typeof value !== 'object' || value === null) return false;
  const plan = value as { days?: unknown };
  if (!Array.isArray(plan.days)) return false;

  // This used to stop at `Array.isArray(day.meals)` and never look inside. A `meals: [null]`
  // therefore passed the gate and threw later, deep inside hydration, where a single catch
  // discarded the preferences and the plan library it had already read successfully -- the
  // app then started as an unrestricted omnivore with no allergies and said nothing.
  return plan.days.every((day) => {
    if (typeof day !== 'object' || day === null) return false;
    const meals = (day as { meals?: unknown }).meals;
    return Array.isArray(meals) && meals.every(isWellFormedMeal);
  });
}

export const storageService = {
  async savePreferences(preferences: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (e) {
      console.warn('[StorageService] Failed to save preferences to local storage', e);
    }
  },

  /**
   * Returns whatever was stored, unparsed and untyped on purpose.
   *
   * This was the one loader that cast its JSON straight to `UserPreferences`, while its two
   * neighbours each had a shape gate. The caller runs it through `parseUserPreferences`,
   * which owns the defaults; keeping that here would make this module depend on the store.
   */
  async loadPreferences(): Promise<unknown> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[StorageService] Failed to load preferences from local storage', e);
      return null;
    }
  },

  async savePlanAndGrocery(plan: MealPlan | null, items: GroceryListItem[]): Promise<void> {
    try {
      if (plan) {
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_PLAN, JSON.stringify(plan));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_PLAN);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.GROCERY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn('[StorageService] Failed to save plan/grocery items', e);
    }
  },

  async loadPlanAndGrocery(): Promise<{
    plan: MealPlan | null;
    items: GroceryListItem[];
  }> {
    try {
      const rawPlan = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_PLAN);
      const rawItems = await AsyncStorage.getItem(STORAGE_KEYS.GROCERY_ITEMS);

      const parsedPlan: unknown = rawPlan ? JSON.parse(rawPlan) : null;
      const parsedItems: unknown = rawItems ? JSON.parse(rawItems) : [];

      if (parsedPlan !== null && !isWellFormedPlan(parsedPlan)) {
        console.warn('[StorageService] Stored plan has an unusable shape, ignoring it');
      }

      return {
        plan: isWellFormedPlan(parsedPlan) ? parsedPlan : null,
        items: Array.isArray(parsedItems) ? (parsedItems as GroceryListItem[]) : [],
      };
    } catch (e) {
      console.warn('[StorageService] Failed to load stored plan/items', e);
      return { plan: null, items: [] };
    }
  },

  async saveSavedPlans(plans: SavedPlan[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(plans));
    } catch (e) {
      console.warn('[StorageService] Failed to save the plan library', e);
    }
  },

  async loadSavedPlans(): Promise<SavedPlan[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_PLANS);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      // Storage is untrusted: an entry missing its plan would throw the moment someone
      // tried to restore it, so malformed rows are dropped on the way in.
      return parsed.filter(isWellFormedSavedPlan);
    } catch (e) {
      console.warn('[StorageService] Failed to load the plan library', e);
      return [];
    }
  },

  async saveThemeMode(mode: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    } catch (e) {
      console.warn('[StorageService] Failed to save the theme choice', e);
    }
  },

  async loadThemeMode(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
    } catch (e) {
      console.warn('[StorageService] Failed to load the theme choice', e);
      return null;
    }
  },

  async clearAll(): Promise<void> {
    try {
      // SAVED_PLANS is deliberately left alone: starting a new week must not delete the
      // plans the user chose to keep.
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PREFERENCES,
        STORAGE_KEYS.CURRENT_PLAN,
        STORAGE_KEYS.GROCERY_ITEMS,
      ]);
    } catch (e) {
      console.warn('[StorageService] Failed to clear storage', e);
    }
  },
};
