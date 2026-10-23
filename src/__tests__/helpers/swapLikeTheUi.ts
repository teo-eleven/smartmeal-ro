import { useAppStore } from '../../store/useAppStore';
import { getEligibleDessertRecipes, getEligibleRecipes } from '../../engine/plannerEngine';
import { DayOfWeek, MealSlot } from '../../types';

/**
 * Swaps a meal the way the app does: MealSwapModal lists the eligible recipes for the slot
 * and the user picks one, which calls replaceMealWithRecipe. Tests used a store-only
 * shortcut (swapMeal) that no screen ever called; it was removed as dead code.
 */
export function swapLikeTheUi(dayOfWeek: DayOfWeek, slot?: MealSlot): void {
  const { currentPlan, preferences, replaceMealWithRecipe } = useAppStore.getState();
  const day = currentPlan?.days.find((d) => d.dayOfWeek === dayOfWeek);
  const meal = day?.meals.find((m) => (slot ? m.slot === slot : true) && !m.isLeftover);
  if (!day || !meal) return;

  const pool =
    meal.slot === 'dessert'
      ? getEligibleDessertRecipes(preferences)
      : getEligibleRecipes(preferences);
  const candidate = pool.find(
    (recipe) =>
      recipe.id !== meal.recipe.id &&
      (!recipe.suitableSlots || recipe.suitableSlots.includes(meal.slot))
  );
  if (candidate) replaceMealWithRecipe(dayOfWeek, candidate, meal.slot);
}
