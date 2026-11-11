import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { PlanHeader } from '../components/PlanHeader';
import { useResponsive } from '../hooks/useResponsive';
import { getAppTheme } from '../styles/theme';
import { AppLoadingScreen } from '../components/AppLoadingScreen';
import { BoardModals } from './mealBoard/BoardModals';
import { DayRow } from './mealBoard/DayRow';
import { MealsPerDayToolbar } from './mealBoard/MealsPerDayToolbar';
import { QuickActionsBar } from './mealBoard/QuickActionsBar';
import { styles } from './mealBoard/styles';
import { useMealBoardState } from './mealBoard/useMealBoardState';

interface MealBoardScreenProps {
  isDark: boolean;
}

export const MealBoardScreen: React.FC<MealBoardScreenProps> = ({ isDark }) => {
  const board = useMealBoardState();
  const {
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
    addExtraMealToDay,
    removeMealFromDay,
    setMealServings,
    isReloading,
    triggerReload,
    savedPlans,
    toggleEatOut,
    setFiltersModalVisible,
    setPantryModalVisible,
    setMealPrepModalVisible,
    setMacroModalVisible,
    setStoreComparisonVisible,
    setSavedPlansVisible,
    setMealsModalVisible,
    setMealsModalInitialCount,
    baseMealsCount,
    handleOpenDetail,
    handleOpenSwap,
  } = board;

  const { isDesktop, isTablet, contentMaxWidth } = useResponsive();
  const isLargeScreen = isDesktop || isTablet;

  const theme = getAppTheme(isDark);

  if (!currentPlan) {
    return (
      <AppLoadingScreen
        isDark={isDark}
        title="Se încarcă meniul săptămânal..."
        subtitle="Construim recomandările personalizate conform preferințelor tale."
        onRetry={() => generatePlan()}
        retryLabel="Generează Rețetele Acum"
        showRetryAfterMs={1200}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isReloading}
            onRefresh={() => {
              void triggerReload({
                title: 'Se reîmprospătează meniul...',
                subtitle: 'Sincronizăm stocurile și verificăm lista de cumpărături...',
                icon: '🔄',
              });
            }}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Financial Overview Header */}
        <View style={[styles.planHeaderWrapper, { maxWidth: contentMaxWidth }]}>
          <PlanHeader
            plan={currentPlan}
            onResetOnboarding={() => requestConfirm('reset_onboarding')}
            onOpenFilters={() => setFiltersModalVisible(true)}
            onRaiseBudget={(amountRon) => {
              void triggerReload(
                {
                  title: 'Recalculăm meniul pentru noul buget...',
                  subtitle: `Ajustăm ingredientele conform bugetului de ${amountRon} lei...`,
                  icon: '💰',
                },
                () => {
                  updatePreferencesAndRebuild({ budgetRon: amountRon });
                }
              );
            }}
            isDark={isDark}
          />
        </View>

        {/* Quick Actions Command Bar: Pantry Matcher, Meal Prep & Weekly Macros */}
        <QuickActionsBar
          theme={theme}
          contentMaxWidth={contentMaxWidth}
          preferences={preferences}
          savedPlanCount={savedPlans.length}
          triggerReload={triggerReload}
          reshufflePlan={reshufflePlan}
          onOpenSavedPlans={() => setSavedPlansVisible(true)}
          onOpenStoreComparison={() => setStoreComparisonVisible(true)}
          onOpenPantry={() => setPantryModalVisible(true)}
          onOpenMealPrep={() => setMealPrepModalVisible(true)}
          onOpenMacros={() => setMacroModalVisible(true)}
        />

        {/* 1, 2 sau 3 Mese pe zi Quick Switcher Bar / Command Center */}
        <MealsPerDayToolbar
          theme={theme}
          isDark={isDark}
          isDesktop={isDesktop}
          contentMaxWidth={contentMaxWidth}
          baseMealsCount={baseMealsCount}
          foodTier={preferences.foodTier}
          setMealsModalInitialCount={setMealsModalInitialCount}
          setMealsModalVisible={setMealsModalVisible}
          setMealsPerDayCount={setMealsPerDayCount}
          setFoodTier={setFoodTier}
        />

        {/* Day-by-day Meal Cards Feed: Zilele una după cealaltă pe linii, mesele orizontal full-width */}
        <View style={[styles.feed, { maxWidth: contentMaxWidth }]}>
          {currentPlan.days.map((day, dayIdx) => (
            <DayRow
              key={day.dayOfWeek}
              day={day}
              dayIdx={dayIdx}
              dayCount={currentPlan.days.length}
              theme={theme}
              isDark={isDark}
              isLargeScreen={isLargeScreen}
              handleOpenDetail={handleOpenDetail}
              handleOpenSwap={handleOpenSwap}
              addExtraMealToDay={addExtraMealToDay}
              cookDoubleFor={cookDoubleFor}
              undoCookDouble={undoCookDouble}
              removeMealFromDay={removeMealFromDay}
              setMealServings={setMealServings}
              toggleEatOut={toggleEatOut}
            />
          ))}
        </View>
      </ScrollView>

      <BoardModals board={board} currentPlan={currentPlan} isDark={isDark} />
    </View>
  );
};
