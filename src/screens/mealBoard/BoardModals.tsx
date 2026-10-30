import React from 'react';
import { MealPlan } from '../../types';
import { RecipeDetailModal } from '../RecipeDetailModal';
import { MealSwapModal } from '../MealSwapModal';
import { QuickFiltersModal } from '../QuickFiltersModal';
import { PantryInventoryModal } from '../PantryInventoryModal';
import { MealPrepModal } from '../MealPrepModal';
import { WeeklyMacroModal } from '../WeeklyMacroModal';
import { MealsPerDayModal } from '../MealsPerDayModal';
import { BudgetOverrunModal } from '../BudgetOverrunModal';
import { StoreComparisonModal } from '../StoreComparisonModal';
import { SavedPlansModal } from '../SavedPlansModal';
import { MealBoardState } from './useMealBoardState';

interface BoardModalsProps {
  board: MealBoardState;
  currentPlan: MealPlan;
  isDark: boolean;
}

/** Every sheet the board can open; each one's visibility lives in the board state. */
export const BoardModals: React.FC<BoardModalsProps> = ({ board, currentPlan, isDark }) => {
  const {
    preferences,
    updatePreferencesAndRebuild,
    requestConfirm,
    setSupermarket,
    setMealServings,
    triggerReload,
    savedPlans,
    saveCurrentPlan,
    restoreSavedPlan,
    deleteSavedPlan,
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
    budgetOverrunModalVisible,
    setBudgetOverrunModalVisible,
    handleOpenSwap,
    handleSelectReplacement,
  } = board;

  return (
    <>
      {/* Recipe Detail Full Modal */}
      <RecipeDetailModal
        visible={Boolean(selectedRecipe)}
        recipe={selectedRecipe}
        servings={detailServings}
        targetDay={detailTarget?.dayOfWeek}
        targetSlot={detailTarget?.slot}
        onClose={() => {
          setSelectedRecipe(null);
          setDetailTarget(null);
        }}
        onSwap={() => {
          const target = detailTarget;
          setSelectedRecipe(null);
          setDetailTarget(null);
          if (target) {
            handleOpenSwap(target.dayOfWeek, target.slot);
          }
        }}
        onChangeServings={(newServings) => {
          setDetailServings(newServings);
          if (detailTarget) {
            const day = currentPlan.days.find((d) => d.dayOfWeek === detailTarget.dayOfWeek);
            const meal = day?.meals.find((m) => m.slot === detailTarget.slot);
            if (meal) {
              setMealServings(detailTarget.dayOfWeek, meal.id, newServings);
            }
          }
        }}
        isDark={isDark}
      />

      {/* Interactive Meal Swap Alternative Selection Modal */}
      <MealSwapModal
        visible={Boolean(swapDay)}
        dayOfWeek={swapDay}
        slot={swapSlot}
        currentPlan={currentPlan}
        preferences={preferences}
        onClose={() => {
          setSwapDay(null);
          setSwapSlot(null);
        }}
        onSelectReplacement={handleSelectReplacement}
        isDark={isDark}
      />

      {/* Quick Filters Modal */}
      <QuickFiltersModal
        visible={filtersModalVisible}
        onClose={() => setFiltersModalVisible(false)}
        preferences={preferences}
        onApplyFilters={(newPrefs) => {
          updatePreferencesAndRebuild(newPrefs);
          setFiltersModalVisible(false);
        }}
        onResetOnboarding={() => requestConfirm('reset_onboarding')}
        isDark={isDark}
      />

      {/* Personal plan library */}
      <SavedPlansModal
        visible={savedPlansVisible}
        savedPlans={savedPlans}
        canSaveCurrent={Boolean(currentPlan)}
        onSaveCurrent={saveCurrentPlan}
        onRestore={(savedPlanId) => {
          restoreSavedPlan(savedPlanId);
          setSavedPlansVisible(false);
        }}
        onDelete={deleteSavedPlan}
        onClose={() => setSavedPlansVisible(false)}
        isDark={isDark}
      />

      {/* Same basket, priced at every chain */}
      <StoreComparisonModal
        visible={storeComparisonVisible}
        plan={currentPlan}
        preferences={preferences}
        onClose={() => setStoreComparisonVisible(false)}
        onSwitchStore={(supermarketId) => setSupermarket(supermarketId)}
        isDark={isDark}
      />

      {/* Smart Pantry Inventory Modal */}
      <PantryInventoryModal
        visible={pantryModalVisible}
        onClose={() => setPantryModalVisible(false)}
        isDark={isDark}
      />

      {/* Weekend Meal Prep Batch Cooking Modal */}
      <MealPrepModal
        visible={mealPrepModalVisible}
        onClose={() => setMealPrepModalVisible(false)}
        plan={currentPlan}
        isDark={isDark}
      />

      {/* Weekly Macro & Nutrition Tracker Modal */}
      <WeeklyMacroModal
        visible={macroModalVisible}
        onClose={() => setMacroModalVisible(false)}
        plan={currentPlan}
        isDark={isDark}
      />

      {/* Meals Per Day Customization Modal */}
      <MealsPerDayModal
        visible={mealsModalVisible}
        initialCount={mealsModalInitialCount}
        onClose={() => setMealsModalVisible(false)}
        isDark={isDark}
      />

      {/* Informative Budget Overrun Modal */}
      <BudgetOverrunModal
        visible={budgetOverrunModalVisible}
        currentCostRon={currentPlan?.totalCartCostRon ?? 0}
        currentBudgetRon={currentPlan?.totalBudgetRon ?? preferences.budgetRon}
        onConfirmIncrease={(newBudget) => {
          setBudgetOverrunModalVisible(false);
          void triggerReload(
            {
              title: 'Actualizăm bugetul...',
              subtitle: `Configurăm noul buget la ${newBudget} lei...`,
              icon: '💰',
            },
            () => {
              updatePreferencesAndRebuild({ budgetRon: newBudget });
            }
          );
        }}
        onDismiss={() => setBudgetOverrunModalVisible(false)}
        isDark={isDark}
      />
    </>
  );
};
