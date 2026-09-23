import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealPlan, UserPreferences, GroceryListItem, SavedPlan } from '../types';

const STORAGE_KEYS = {
  PREFERENCES: '@smartmeal_preferences',
  CURRENT_PLAN: '@smartmeal_current_plan',
  GROCERY_ITEMS: '@smartmeal_grocery_items',
  SAVED_PLANS: '@smartmeal_saved_plans',
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

export const storageService = {
  async savePreferences(preferences: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
    } catch (e) {
      console.warn('[StorageService] Failed to save preferences to local storage', e);
    }
  },

  async loadPreferences(): Promise<UserPreferences | null> {
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

      return {
        plan: rawPlan ? JSON.parse(rawPlan) : null,
        items: rawItems ? JSON.parse(rawItems) : [],
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
