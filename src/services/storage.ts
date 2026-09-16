import AsyncStorage from '@react-native-async-storage/async-storage';
import { MealPlan, UserPreferences, GroceryListItem } from '../types';

const STORAGE_KEYS = {
  PREFERENCES: '@smartmeal_preferences',
  CURRENT_PLAN: '@smartmeal_current_plan',
  GROCERY_ITEMS: '@smartmeal_grocery_items',
};

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

  async clearAll(): Promise<void> {
    try {
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
