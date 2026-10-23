import { RETAIL_PRODUCTS_MAP } from '../data/retailProducts';
import { aggregateGroceryList } from '../engine/groceryAggregator';
import { storageService } from '../services/storage';
import { MealPlan } from '../types';
import { collectMealsFromDays, getActiveExtraProducts, mergePurchased } from './cart';

import { StoreApi } from 'zustand';
import { AppState } from './appState';
import { recalculateCartForPreferences } from './storeTransforms';

type SetState = StoreApi<AppState>['setState'];
type GetState = () => AppState;

/** Shopping list: snacks and drinks, pantry staples and ticks. */
export function createGroceryActions(set: SetState, get: GetState) {
  return {
    toggleSnackProduct: (productId: string) => {
      set((state) => {
        const current = state.preferences.selectedSnackIds || [];
        const updated = current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId];

        const nextPrefs = { ...state.preferences, selectedSnackIds: updated };
        void storageService.savePreferences(nextPrefs);

        if (state.currentPlan) {
          const allMealsToAggregate = collectMealsFromDays(state.currentPlan.days);

          const extraIds = [...updated, ...(nextPrefs.selectedDrinkIds || [])];
          const aggregated = aggregateGroceryList(
            allMealsToAggregate,
            nextPrefs.supermarketId,
            nextPrefs.excludePantryStaples,
            extraIds,
            nextPrefs.pantryInventory || [],
            nextPrefs.pantryStock || {}
          );
          const cartItems = mergePurchased(state.groceryItems, aggregated.items);

          const updatedPlan: MealPlan = {
            ...state.currentPlan,
            totalCartCostRon: aggregated.totalCartCostRon,
            extraProducts: getActiveExtraProducts(nextPrefs),
          };

          void storageService.savePlanAndGrocery(updatedPlan, cartItems);

          return {
            preferences: nextPrefs,
            currentPlan: updatedPlan,
            groceryItems: cartItems,
          };
        }

        return { preferences: nextPrefs };
      });
    },

    toggleDrinkProduct: (productId: string) => {
      set((state) => {
        const current = state.preferences.selectedDrinkIds || [];
        const updated = current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId];

        const nextPrefs = { ...state.preferences, selectedDrinkIds: updated };
        void storageService.savePreferences(nextPrefs);

        if (state.currentPlan) {
          const allMealsToAggregate = collectMealsFromDays(state.currentPlan.days);

          const extraIds = [...(nextPrefs.selectedSnackIds || []), ...updated];
          const aggregated = aggregateGroceryList(
            allMealsToAggregate,
            nextPrefs.supermarketId,
            nextPrefs.excludePantryStaples,
            extraIds,
            nextPrefs.pantryInventory || [],
            nextPrefs.pantryStock || {}
          );
          const cartItems = mergePurchased(state.groceryItems, aggregated.items);

          const updatedPlan: MealPlan = {
            ...state.currentPlan,
            totalCartCostRon: aggregated.totalCartCostRon,
            extraProducts: getActiveExtraProducts(nextPrefs),
          };

          void storageService.savePlanAndGrocery(updatedPlan, cartItems);

          return {
            preferences: nextPrefs,
            currentPlan: updatedPlan,
            groceryItems: cartItems,
          };
        }

        return { preferences: nextPrefs };
      });
    },

    setIncludeAlcohol: (include: boolean) => {
      set((state) => {
        let updatedDrinks = state.preferences.selectedDrinkIds || [];
        if (!include) {
          // Remove alcoholic drinks if alcohol toggle turned off
          updatedDrinks = updatedDrinks.filter((id) => {
            const prod = RETAIL_PRODUCTS_MAP[id];
            return prod ? !prod.isAlcoholic : true;
          });
        }

        const nextPrefs = {
          ...state.preferences,
          includeAlcohol: include,
          selectedDrinkIds: updatedDrinks,
        };
        void storageService.savePreferences(nextPrefs);

        if (state.currentPlan) {
          const allMealsToAggregate = collectMealsFromDays(state.currentPlan.days);

          const extraIds = [...(nextPrefs.selectedSnackIds || []), ...updatedDrinks];
          const aggregated = aggregateGroceryList(
            allMealsToAggregate,
            nextPrefs.supermarketId,
            nextPrefs.excludePantryStaples,
            extraIds,
            nextPrefs.pantryInventory || [],
            nextPrefs.pantryStock || {}
          );
          const cartItems = mergePurchased(state.groceryItems, aggregated.items);

          const updatedPlan: MealPlan = {
            ...state.currentPlan,
            totalCartCostRon: aggregated.totalCartCostRon,
            extraProducts: getActiveExtraProducts(nextPrefs),
          };

          void storageService.savePlanAndGrocery(updatedPlan, cartItems);

          return {
            preferences: nextPrefs,
            currentPlan: updatedPlan,
            groceryItems: cartItems,
          };
        }

        return { preferences: nextPrefs };
      });
    },

    setExcludePantryStaples: (exclude: boolean) => {
      set((state) =>
        recalculateCartForPreferences(state, {
          ...state.preferences,
          excludePantryStaples: exclude,
        })
      );
    },

    toggleGroceryItem: (ingredientId: string) => {
      const { currentPlan, groceryItems } = get();
      const nextItems = groceryItems.map((item) =>
        item.ingredientId === ingredientId ? { ...item, isPurchased: !item.isPurchased } : item
      );
      set({ groceryItems: nextItems });
      void storageService.savePlanAndGrocery(currentPlan, nextItems);
    },

    setAllPurchased: (purchased: boolean) => {
      const { currentPlan, groceryItems } = get();
      // What is already at home keeps its own state: "untick all" must not put it back on the list.
      const nextItems = groceryItems.map((item) =>
        item.isFromPantry ? item : { ...item, isPurchased: purchased }
      );
      set({ groceryItems: nextItems });
      void storageService.savePlanAndGrocery(currentPlan, nextItems);
    },
  } satisfies Partial<AppState>;
}
