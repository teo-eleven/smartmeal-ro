import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../store/useAppStore';
import { DayOfWeek, MealSlot, Recipe } from '../../types';

/**
 * Everything the board keeps: the store slices it reads, which sheet is open, and the two
 * effects that prompt about the budget and build a first plan.
 */
export function useMealBoardState() {
  const {
    currentPlan,
    preferences,
    generatePlan,
    showNotice,
    reshufflePlan,
    updatePreferencesAndRebuild,
    cookDoubleFor,
    undoCookDouble,
    requestConfirm,
    replaceMealWithRecipe,
    setMealsPerDayCount,
    setFoodTier,
    setSupermarket,
    addExtraMealToDay,
    removeMealFromDay,
    setMealServings,
    isReloading,
    triggerReload,
    savedPlans,
    saveCurrentPlan,
    restoreSavedPlan,
    deleteSavedPlan,
    toggleEatOut,
  } = useAppStore(
    useShallow((state) => ({
      currentPlan: state.currentPlan,
      preferences: state.preferences,
      generatePlan: state.generatePlan,
      showNotice: state.showNotice,
      reshufflePlan: state.reshufflePlan,
      updatePreferencesAndRebuild: state.updatePreferencesAndRebuild,
      cookDoubleFor: state.cookDoubleFor,
      undoCookDouble: state.undoCookDouble,
      requestConfirm: state.requestConfirm,
      replaceMealWithRecipe: state.replaceMealWithRecipe,
      setMealsPerDayCount: state.setMealsPerDayCount,
      setFoodTier: state.setFoodTier,
      setSupermarket: state.setSupermarket,
      addExtraMealToDay: state.addExtraMealToDay,
      removeMealFromDay: state.removeMealFromDay,
      setMealServings: state.setMealServings,
      isReloading: state.isReloading,
      triggerReload: state.triggerReload,
      savedPlans: state.savedPlans,
      saveCurrentPlan: state.saveCurrentPlan,
      restoreSavedPlan: state.restoreSavedPlan,
      deleteSavedPlan: state.deleteSavedPlan,
      toggleEatOut: state.toggleEatOut,
    }))
  );

  const [filtersModalVisible, setFiltersModalVisible] = useState(false);
  const [pantryModalVisible, setPantryModalVisible] = useState(false);
  const [mealPrepModalVisible, setMealPrepModalVisible] = useState(false);
  const [macroModalVisible, setMacroModalVisible] = useState(false);
  const [storeComparisonVisible, setStoreComparisonVisible] = useState(false);
  const [savedPlansVisible, setSavedPlansVisible] = useState(false);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [detailServings, setDetailServings] = useState<number>(currentPlan?.peopleCount ?? 2);
  const [swapDay, setSwapDay] = useState<DayOfWeek | null>(null);
  const [swapSlot, setSwapSlot] = useState<MealSlot | null>(null);
  const [detailTarget, setDetailTarget] = useState<{ dayOfWeek: DayOfWeek; slot: MealSlot } | null>(
    null
  );

  const [mealsModalVisible, setMealsModalVisible] = useState(false);
  const [mealsModalInitialCount, setMealsModalInitialCount] = useState<1 | 2 | 3>(1);
  const [budgetOverrunModalVisible, setBudgetOverrunModalVisible] = useState(false);
  const budgetOverrunPromptedCost = useAppStore((s) => s.budgetOverrunPromptedCost);
  const markBudgetOverrunPrompted = useAppStore((s) => s.markBudgetOverrunPrompted);

  // Prompt once per cart total, remembered in the store: the board unmounts on every tab
  // switch, and a per-mount ref brought the prompt back each time the user returned.
  useEffect(() => {
    if (!currentPlan) return;
    if (
      currentPlan.totalCartCostRon > currentPlan.totalBudgetRon &&
      budgetOverrunPromptedCost !== currentPlan.totalCartCostRon
    ) {
      markBudgetOverrunPrompted(currentPlan.totalCartCostRon);
      setBudgetOverrunModalVisible(true);
    }
  }, [currentPlan?.totalCartCostRon, currentPlan?.totalBudgetRon]);

  // Attempted only once per mount: a plan that cannot be built must not re-trigger the
  // effect on every render, which previously turned an impossible setup into a crash loop.
  const autoGenerateAttempted = useRef(false);

  useEffect(() => {
    if (currentPlan || autoGenerateAttempted.current) return;
    autoGenerateAttempted.current = true;
    try {
      generatePlan();
    } catch (err) {
      console.warn('[MealBoardScreen] Auto plan generation failed:', err);
      showNotice(
        'Meniul nu a putut fi generat',
        'A apărut o eroare neașteptată. Apasă „Plan Nou” sau schimbă o preferință și încearcă din nou.',
        'error'
      );
    }
  }, [currentPlan, generatePlan, showNotice]);

  const baseMealsCount =
    preferences.mealSlots?.filter((s) => s === 'breakfast' || s === 'lunch' || s === 'dinner')
      .length || 1;

  /**
   * The meal the detail sheet is describing, remembered rather than searched for later.
   * Looking it up again by recipe id picked the LAST day that used that recipe, and a
   * restricted catalog repeats recipes freely -- a vegan week can serve one breakfast on
   * all seven days, so swapping from Monday's sheet silently changed Sunday.
   */
  const handleOpenDetail = (
    recipe: Recipe,
    servings: number,
    dayOfWeek: DayOfWeek,
    slot: MealSlot
  ) => {
    setSelectedRecipe(recipe);
    setDetailServings(servings);
    setDetailTarget({ dayOfWeek, slot });
  };

  const handleOpenSwap = (dayOfWeek: DayOfWeek, slot?: MealSlot) => {
    setSwapDay(dayOfWeek);
    setSwapSlot(slot || null);
  };

  const handleSelectReplacement = (recipe: Recipe) => {
    if (swapDay) {
      replaceMealWithRecipe(swapDay, recipe, swapSlot || undefined);
      setSwapDay(null);
      setSwapSlot(null);
    }
  };

  return {
    currentPlan,
    preferences,
    generatePlan,
    reshufflePlan,
    updatePreferencesAndRebuild,
    cookDoubleFor,
    undoCookDouble,
    requestConfirm,
    setMealsPerDayCount,
    setFoodTier,
    setSupermarket,
    addExtraMealToDay,
    removeMealFromDay,
    setMealServings,
    isReloading,
    triggerReload,
    savedPlans,
    saveCurrentPlan,
    restoreSavedPlan,
    deleteSavedPlan,
    toggleEatOut,
    filtersModalVisible,
    setFiltersModalVisible,
    pantryModalVisible,
    setPantryModalVisible,
    mealPrepModalVisible,
    setMealPrepModalVisible,
    macroModalVisible,
    setMacroModalVisible,
    storeComparisonVisible,
    setStoreComparisonVisible,
    savedPlansVisible,
    setSavedPlansVisible,
    selectedRecipe,
    setSelectedRecipe,
    detailServings,
    setDetailServings,
    swapDay,
    setSwapDay,
    swapSlot,
    setSwapSlot,
    detailTarget,
    setDetailTarget,
    mealsModalVisible,
    setMealsModalVisible,
    mealsModalInitialCount,
    setMealsModalInitialCount,
    budgetOverrunModalVisible,
    setBudgetOverrunModalVisible,
    baseMealsCount,
    handleOpenDetail,
    handleOpenSwap,
    handleSelectReplacement,
  };
}

export type MealBoardState = ReturnType<typeof useMealBoardState>;
