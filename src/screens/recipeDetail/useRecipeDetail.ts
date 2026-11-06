import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../store/useAppStore';
import { useBlockingWindow } from '../../hooks/useBlockingWindow';
import { getEligibleRecipes, getEligibleDessertRecipes } from '../../store/guardedEngine';
import { DayOfWeek, MealSlot, Recipe } from '../../types';

interface UseRecipeDetailArgs {
  recipe: Recipe | null;
  initialServings: number;
  visible: boolean;
  onChangeServings?: (servings: number) => void;
  targetDay?: DayOfWeek | null;
  targetSlot?: MealSlot | null;
}

/** The sheet's own state (servings, ticked steps and ingredients) and what it reads from the plan. */
export function useRecipeDetail({
  recipe,
  initialServings,
  visible,
  onChangeServings,
  targetDay,
  targetSlot,
}: UseRecipeDetailArgs) {
  useBlockingWindow(visible);
  const [activeServings, setActiveServings] = useState(initialServings);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  const handleServingsChange = (newServings: number) => {
    const clamped = Math.max(1, Math.min(12, newServings));
    setActiveServings(clamped);
    if (onChangeServings) {
      onChangeServings(clamped);
    }
  };

  const {
    preferences,
    currentPlan,
    replaceMealWithRecipe,
    toggleFavouriteRecipe,
    toggleDislikedRecipe,
    toggleEatOut,
    showNotice,
    recipeNotes,
    setRecipeNote,
  } = useAppStore(
    useShallow((state) => ({
      preferences: state.preferences,
      currentPlan: state.currentPlan,
      replaceMealWithRecipe: state.replaceMealWithRecipe,
      toggleFavouriteRecipe: state.toggleFavouriteRecipe,
      toggleDislikedRecipe: state.toggleDislikedRecipe,
      toggleEatOut: state.toggleEatOut,
      showNotice: state.showNotice,
      recipeNotes: state.recipeNotes,
      setRecipeNote: state.setRecipeNote,
    }))
  );

  const targetMeal = useMemo(() => {
    if (!currentPlan || !targetDay) return null;
    const dayPlan = currentPlan.days.find((d) => d.dayOfWeek === targetDay);
    if (!dayPlan) return null;
    return dayPlan.meals.find((m) =>
      targetSlot ? m.slot === targetSlot : m.recipe.id === recipe?.id
    );
  }, [currentPlan, targetDay, targetSlot, recipe]);

  const isEatenOut = Boolean(targetMeal?.isEatenOut);

  const suggestedReplacement = useMemo(() => {
    if (!recipe) return null;
    const target = targetSlot || (recipe.suitableSlots && recipe.suitableSlots[0]) || 'dinner';
    const isDessert = target === 'dessert' || Boolean(recipe.suitableSlots?.includes('dessert'));
    const eligible = isDessert
      ? getEligibleDessertRecipes(preferences)
      : getEligibleRecipes(preferences);
    const slotFiltered = isDessert
      ? eligible.filter((r) => r.id !== recipe.id)
      : eligible.filter(
          (r) => r.id !== recipe.id && (r.suitableSlots ? r.suitableSlots.includes(target) : true)
        );
    const baseCandidates =
      slotFiltered.length > 0 ? slotFiltered : eligible.filter((r) => r.id !== recipe.id);

    const usedRecipeIds = new Set<string>();
    if (currentPlan) {
      currentPlan.days.forEach((d) => {
        d.meals?.forEach((m) => usedRecipeIds.add(m.recipe.id));
      });
    }

    const unusedCandidates = baseCandidates.filter((r) => !usedRecipeIds.has(r.id));
    const pool = unusedCandidates.length > 0 ? unusedCandidates : baseCandidates;

    if (pool.length === 0) return null;

    // Prioritize favorites if any
    const favs = pool.filter((r) => (preferences.favouriteRecipeIds ?? []).includes(r.id));
    if (favs.length > 0) return favs[0];

    // Prioritize same tier
    const sameTier = pool.filter((r) => r.tier === recipe.tier);
    if (sameTier.length > 0) return sameTier[0];

    return pool[0];
  }, [recipe, preferences, currentPlan, targetSlot]);

  useEffect(() => {
    setActiveServings(initialServings);
    setCompletedSteps({});
    setCheckedIngredients({});
  }, [initialServings, recipe]);

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const toggleIngredient = (id: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleEatOut = () => {
    if (!targetDay) return;
    const effectiveSlot = targetSlot || targetMeal?.slot || 'dinner';
    toggleEatOut(targetDay, effectiveSlot);
    showNotice(
      isEatenOut ? 'Gătești acasă' : 'Mâncat în oraș',
      isEatenOut
        ? `Am reintrodus masa în planul de gătit și în lista de cumpărături.`
        : `Am marcat masa ca mâncată în oraș. Ingredientele au fost scoase din lista de cumpărături.`,
      'info'
    );
  };

  return {
    activeServings,
    completedSteps,
    checkedIngredients,
    handleServingsChange,
    preferences,
    replaceMealWithRecipe,
    toggleFavouriteRecipe,
    toggleDislikedRecipe,
    showNotice,
    recipeNotes,
    setRecipeNote,
    isEatenOut,
    suggestedReplacement,
    toggleStep,
    toggleIngredient,
    handleToggleEatOut,
  };
}
