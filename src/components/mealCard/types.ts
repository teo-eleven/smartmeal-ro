import { MealPlanDay, PlannedMeal } from '../../types';

export interface MealCardProps {
  day: MealPlanDay;
  meal?: PlannedMeal;
  slotLabel?: string;
  onPressRecipe: () => void;
  onSwapMeal: () => void;
  onRemoveMeal?: () => void;
  onToggleEatOut?: () => void;
  /** Cook a double portion here and reheat it the next day. Absent when there is no next day. */
  onCookDouble?: () => void;
  /** Turn a reheated day back into a meal of its own. */
  onUndoCookDouble?: () => void;
  onChangeServings?: (servings: number) => void;
  isDark: boolean;
}
