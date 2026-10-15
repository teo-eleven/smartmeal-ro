import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { PlanHeader } from '../components/PlanHeader';
import { MealCard } from '../components/MealCard';
import { RecipeDetailModal } from './RecipeDetailModal';
import { MealSwapModal } from './MealSwapModal';
import { QuickFiltersModal } from './QuickFiltersModal';
import { PantryInventoryModal } from './PantryInventoryModal';
import { MealPrepModal } from './MealPrepModal';
import { WeeklyMacroModal } from './WeeklyMacroModal';
import { SUPERMARKET_LIST } from '../data/supermarkets';
import { DayOfWeek, FoodTier, MealSlot, Recipe } from '../types';
import { useResponsive } from '../hooks/useResponsive';
import { getAppTheme } from '../styles/theme';
import { glass } from '../styles/glass';
import { StoreComparisonModal } from './StoreComparisonModal';
import { SavedPlansModal } from './SavedPlansModal';
import { AppLoadingScreen } from '../components/AppLoadingScreen';

interface AnimatedMealSlotProps {
  children: React.ReactNode;
  isDessert?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AnimatedMealSlot: React.FC<AnimatedMealSlotProps> = ({ children, isDessert, style }) => {
  const spawnAnim = useRef(new Animated.Value(isDessert ? 0 : 1)).current;

  useEffect(() => {
    if (isDessert) {
      Animated.parallel([
        Animated.timing(spawnAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(spawnAnim, {
          toValue: 1,
          tension: 48,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDessert, spawnAnim]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: spawnAnim,
          transform: [
            {
              scale: spawnAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.82, 1],
              }),
            },
            {
              translateY: spawnAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [24, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

interface MealBoardScreenProps {
  isDark: boolean;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Luni',
  tuesday: 'Marți',
  wednesday: 'Miercuri',
  thursday: 'Joi',
  friday: 'Vineri',
  saturday: 'Sâmbătă',
  sunday: 'Duminică',
};

export const MealBoardScreen: React.FC<MealBoardScreenProps> = ({ isDark }) => {
  const {
    currentPlan,
    preferences,
    generatePlan,
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
  } = useAppStore();

  const [filtersModalVisible, setFiltersModalVisible] = useState(false);
  const [pantryModalVisible, setPantryModalVisible] = useState(false);
  const [mealPrepModalVisible, setMealPrepModalVisible] = useState(false);
  const [macroModalVisible, setMacroModalVisible] = useState(false);
  const [storeComparisonVisible, setStoreComparisonVisible] = useState(false);
  const [savedPlansVisible, setSavedPlansVisible] = useState(false);

  const { isDesktop, isTablet, contentMaxWidth } = useResponsive();
  const isLargeScreen = isDesktop || isTablet;

  const getTierColor = (tier?: FoodTier): string => {
    switch (tier) {
      case 'basic':
        return isDark ? '#ffffff' : '#000000';
      case 'medium':
        return '#0a84ff';
      case 'premium':
        return isDark ? '#ffd60a' : '#b45309';
      default:
        return '#0a84ff';
    }
  };

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [detailServings, setDetailServings] = useState<number>(currentPlan?.peopleCount ?? 2);
  const [swapDay, setSwapDay] = useState<DayOfWeek | null>(null);
  const [swapSlot, setSwapSlot] = useState<MealSlot | null>(null);
  const [detailTarget, setDetailTarget] = useState<{ dayOfWeek: DayOfWeek; slot: MealSlot } | null>(
    null
  );

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
    }
  }, [currentPlan, generatePlan]);

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
        <View
          {...glass('card')}
          style={[
            styles.quickActionsBar,
            { backgroundColor: theme.card, borderColor: theme.border, maxWidth: contentMaxWidth },
          ]}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Reîncarcă și regenerează meniul săptămânal"
            onPress={() => {
              void triggerReload(
                {
                  title: 'Regenerăm meniul săptămânal...',
                  subtitle: 'Selectăm variante culinare noi adaptate preferințelor tale...',
                  icon: '🔄',
                  steps: [
                    'Verificăm ingredientele la preț de magazin',
                    'Asigurăm varietatea meselor fără repetiții',
                    'Actualizăm lista de cumpărături pe 7 raioane',
                  ],
                },
                () => {
                  reshufflePlan();
                }
              );
            }}
            {...glass('pill')}
            style={[
              styles.quickActionBtn,
              { backgroundColor: theme.btnBg, borderColor: theme.border },
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionIcon}>🔄</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickActionTitle, { color: theme.text }]}>Regenerează Meniul</Text>
              <Text style={[styles.quickActionSub, { color: theme.textMuted }]}>
                Variante noi pe săptămână
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Planurile mele salvate"
            onPress={() => setSavedPlansVisible(true)}
            {...glass('pill')}
            style={[
              styles.quickActionBtn,
              { backgroundColor: theme.btnBg, borderColor: theme.border },
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionIcon}>⭐</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickActionTitle, { color: theme.text }]}>Planurile Mele</Text>
              <Text style={[styles.quickActionSub, { color: theme.textMuted }]}>
                {savedPlans.length > 0
                  ? `${savedPlans.length} salvate`
                  : 'Salvează săptămâna curentă'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Compară prețul coșului între supermarketuri"
            onPress={() => setStoreComparisonVisible(true)}
            {...glass('pill')}
            style={[
              styles.quickActionBtn,
              { backgroundColor: theme.btnBg, borderColor: theme.border },
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionIcon}>🏷️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickActionTitle, { color: theme.text }]}>Compară Magazine</Text>
              <Text style={[styles.quickActionSub, { color: theme.textMuted }]}>
                Același coș la toate cele 8 lanțuri
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setPantryModalVisible(true)}
            {...glass('pill')}
            style={[
              styles.quickActionBtn,
              {
                backgroundColor:
                  (preferences.pantryInventory?.length || 0) > 0
                    ? theme.surfaceTertiary
                    : theme.btnBg,
                borderColor:
                  (preferences.pantryInventory?.length || 0) > 0
                    ? theme.borderStrong
                    : theme.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionIcon}>🏠</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickActionTitle, { color: theme.text }]}>Ce am în Cămară</Text>
              <Text
                style={[
                  styles.quickActionSub,
                  {
                    color:
                      (preferences.pantryInventory?.length || 0) > 0 ? theme.text : theme.textMuted,
                  },
                ]}
              >
                {(preferences.pantryInventory?.length || 0) > 0
                  ? `${preferences.pantryInventory?.length} deduse din coș ✓`
                  : 'Bifează stocul de acasă'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setMealPrepModalVisible(true)}
            {...glass('pill')}
            style={[
              styles.quickActionBtn,
              { backgroundColor: theme.btnBg, borderColor: theme.border },
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionIcon}>🍱</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickActionTitle, { color: theme.text }]}>Ghid Meal Prep</Text>
              <Text style={[styles.quickActionSub, { color: theme.textMuted }]}>
                Batch cooking (90 min)
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setMacroModalVisible(true)}
            {...glass('pill')}
            style={[
              styles.quickActionBtn,
              { backgroundColor: theme.btnBg, borderColor: theme.border },
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.quickActionIcon}>📊</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickActionTitle, { color: theme.text }]}>Macro Săptămână</Text>
              <Text style={[styles.quickActionSub, { color: theme.textMuted }]}>
                Calorii & nutrienți
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 1, 2 sau 3 Mese pe zi Quick Switcher Bar / Command Center */}
        <View
          {...glass('card')}
          style={[
            styles.mealsPerDayCard,
            { backgroundColor: theme.card, borderColor: theme.border, maxWidth: contentMaxWidth },
          ]}
        >
          <View style={[styles.toolbarControlsWrapper, isDesktop && styles.toolbarDesktopRow]}>
            {/* Section 1: Meals per Day */}
            <View style={[styles.toolbarSection, isDesktop && styles.toolbarSectionDesktop]}>
              <View style={styles.mealsPerDayHeader}>
                <Text style={[styles.mealsPerDayTitle, { color: theme.text }]}>Mese pe zi:</Text>
                <Text style={[styles.mealsPerDaySubtitle, { color: theme.text }]}>
                  {baseMealsCount === 1 && '1 Masă (Cină)'}
                  {baseMealsCount === 2 && '2 Mese (Prânz + Cină)'}
                  {baseMealsCount === 3 && '3 Mese (Complet)'}
                </Text>
              </View>

              <View
                style={[
                  styles.segmentedControl,
                  { backgroundColor: theme.btnBg, borderColor: theme.border },
                ]}
              >
                {([1, 2, 3] as const).map((cnt) => (
                  <TouchableOpacity
                    accessibilityRole="button"
                    key={cnt}
                    onPress={() => {
                      if (baseMealsCount === cnt) return;
                      setMealsPerDayCount(cnt);
                    }}
                    {...glass(baseMealsCount === cnt ? 'pill-active' : 'pill')}
                    style={[
                      styles.segmentBtn,
                      baseMealsCount === cnt && [
                        styles.segmentBtnActive,
                        { backgroundColor: theme.primary, borderColor: theme.primary },
                      ],
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        {
                          color: baseMealsCount === cnt ? theme.primaryText : theme.textMuted,
                          fontWeight: baseMealsCount === cnt ? '800' : '600',
                        },
                      ]}
                    >
                      {cnt} {cnt === 1 ? 'Masă' : 'Mese'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Desktop Vertical Divider */}
            {isDesktop && (
              <View style={[styles.toolbarDividerV, { backgroundColor: theme.border }]} />
            )}

            {/* Section 2: Food Tier */}
            <View style={[styles.toolbarSection, isDesktop && styles.toolbarSectionDesktop]}>
              <View style={styles.mealsPerDayHeader}>
                <Text style={[styles.mealsPerDayTitle, { color: theme.text }]}>
                  Nivel ingrediente:
                </Text>
                <Text
                  style={[
                    styles.mealsPerDaySubtitle,
                    { color: getTierColor(preferences.foodTier) },
                  ]}
                >
                  {preferences.foodTier === 'basic' && '🥉 Basic (~8-12 lei)'}
                  {preferences.foodTier === 'medium' && '🥈 Medium (~13-18 lei)'}
                  {preferences.foodTier === 'premium' && '🥇 Premium (~20-35+ lei)'}
                </Text>
              </View>

              <View
                style={[
                  styles.segmentedControl,
                  { backgroundColor: theme.btnBg, borderColor: theme.border },
                ]}
              >
                {(['basic', 'medium', 'premium'] as FoodTier[]).map((tier) => {
                  const isActive = (preferences.foodTier || 'medium') === tier;
                  const label =
                    tier === 'basic' ? '🥉 Basic' : tier === 'medium' ? '🥈 Med' : '🥇 Prem';
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={tier}
                      onPress={() => {
                      if (preferences.foodTier === tier) return;
                      setFoodTier(tier);
                    }}
                      {...glass(isActive ? 'pill-active' : 'pill')}
                      style={[
                        styles.segmentBtn,
                        isActive && [
                          styles.segmentBtnActive,
                          {
                            backgroundColor:
                              tier === 'basic'
                                ? isDark
                                  ? '#ffffff'
                                  : '#000000'
                                : tier === 'medium'
                                  ? isDark
                                    ? 'rgba(10, 132, 255, 0.24)'
                                    : '#eff6ff'
                                  : isDark
                                    ? 'rgba(234, 179, 8, 0.2)'
                                    : '#fefce8',
                            borderColor:
                              tier === 'basic'
                                ? isDark
                                  ? '#ffffff'
                                  : '#000000'
                                : tier === 'medium'
                                  ? '#0a84ff'
                                  : '#eab308',
                          },
                        ],
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          {
                            color: isActive
                              ? tier === 'basic'
                                ? isDark
                                  ? '#000000'
                                  : '#ffffff'
                                : tier === 'medium'
                                  ? '#0a84ff'
                                  : '#eab308'
                              : theme.textMuted,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Desktop Vertical Divider */}
            {isDesktop && (
              <View style={[styles.toolbarDividerV, { backgroundColor: theme.border }]} />
            )}

            {/* Section 3: which chain the estimate is priced at. Not "real" or "official":
                the prices are estimates from usual shelf prices, and the app has no link with
                any chain. */}
            <View style={[styles.toolbarSection, isDesktop && styles.toolbarSectionDesktop]}>
              <View style={styles.mealsPerDayHeader}>
                <Text style={[styles.mealsPerDayTitle, { color: theme.text }]}>
                  Prețuri estimate la:
                </Text>
                <Text style={[styles.mealsPerDaySubtitle, { color: theme.primary }]}>
                  {SUPERMARKET_LIST.find((s) => s.id === preferences.supermarketId)?.name ??
                    preferences.supermarketId}
                </Text>
              </View>

              <View style={styles.supermarketPillsRow}>
                {SUPERMARKET_LIST.map((market) => {
                  const isActive = preferences.supermarketId === market.id;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={market.id}
                      onPress={() => {
                        if (preferences.supermarketId === market.id) return;
                        setSupermarket(market.id);
                      }}
                      {...glass(isActive ? 'pill-active' : 'pill')}
                      style={[
                        styles.marketPill,
                        isActive
                          ? { backgroundColor: market.brandColor, borderColor: market.brandColor }
                          : { backgroundColor: theme.btnBg, borderColor: theme.border },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.marketPillText,
                          {
                            color: isActive ? '#ffffff' : theme.text,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {market.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Day-by-day Meal Cards Feed: Zilele una după cealaltă pe linii, mesele orizontal full-width */}
        <View style={[styles.feed, { maxWidth: contentMaxWidth }]}>
          {currentPlan.days.map((day, dayIdx) => {
            const visibleMeals = day.meals.filter((m) => m.slot !== 'snack');
            const hasDessert = visibleMeals.some((m) => m.slot === 'dessert');

            return (
              <View
                key={day.dayOfWeek}
                {...glass('card')}
                style={[
                  styles.dayRowContainer,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                {/* Day Header Row */}
                <View
                  {...glass('pill')}
                  style={[
                    styles.dayGroupHeader,
                    { backgroundColor: theme.dayHeaderBg, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.dayHeaderLeft}>
                    <View style={styles.dayTitleBadgeRow}>
                      <Text style={[styles.dayGroupTitle, { color: theme.text }]}>
                        📅 {DAY_LABELS[day.dayOfWeek].toUpperCase()}
                      </Text>
                      <View
                        style={[
                          styles.dayCostBadge,
                          {
                            backgroundColor: theme.surfaceTertiary,
                            borderColor: theme.border,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <Text style={[styles.dayGroupCost, { color: theme.text }]}>
                          Total zi: ~{day.estimatedCostRon} lei
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.mealsCountTag, { color: theme.textMuted }]}>
                      {visibleMeals.length} {visibleMeals.length === 1 ? 'masă' : 'mese'} (
                      {visibleMeals.map((m) => m.slotLabelRo).join(' • ')})
                    </Text>
                  </View>

                  <View style={styles.dayHeaderRight}>
                    {!hasDessert ? (
                      <TouchableOpacity
                        accessibilityRole="button"
                        onPress={() => addExtraMealToDay(day.dayOfWeek, 'dessert')}
                        {...glass('pill')}
                        style={[
                          styles.addDessertBtn,
                          {
                            backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : '#fdf2f8',
                            borderColor: '#ec4899',
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.addDessertBtnText, { color: '#ec4899' }]}>
                          + 🍰 Adaugă Desert de Casă
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View
                        style={[
                          styles.dessertIncludedBadge,
                          {
                            backgroundColor: isDark ? 'rgba(236, 72, 153, 0.16)' : '#fdf2f8',
                            borderColor: 'rgba(236, 72, 153, 0.4)',
                          },
                        ]}
                      >
                        <Text style={[styles.dessertIncludedText, { color: '#ec4899' }]}>
                          ✨ Desert de Casă inclus
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Horizontal dynamic row of meals: mic dejun, pranz, cina (si desert) */}
                <View style={[styles.mealsRow, !isLargeScreen && styles.mealsRowMobile]}>
                  {visibleMeals.map((meal) => (
                    <AnimatedMealSlot
                      key={meal.id}
                      isDessert={meal.slot === 'dessert'}
                      style={styles.mealCol}
                    >
                      <MealCard
                        day={day}
                        meal={meal}
                        slotLabel={meal.slotLabelRo}
                        onPressRecipe={() =>
                          handleOpenDetail(meal.recipe, meal.servings, day.dayOfWeek, meal.slot)
                        }
                        onSwapMeal={() => handleOpenSwap(day.dayOfWeek, meal.slot)}
                        onCookDouble={
                          dayIdx < currentPlan.days.length - 1
                            ? () => cookDoubleFor(day.dayOfWeek, meal.id)
                            : undefined
                        }
                        onUndoCookDouble={() => undoCookDouble(day.dayOfWeek, meal.id)}
                        onRemoveMeal={
                          meal.slot === 'dessert'
                            ? () => removeMealFromDay(day.dayOfWeek, meal.id)
                            : undefined
                        }
                        onChangeServings={(servings) =>
                          setMealServings(day.dayOfWeek, meal.id, servings)
                        }
                        isDark={isDark}
                      />
                    </AnimatedMealSlot>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  planHeaderWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  mealsPerDayCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  toolbarControlsWrapper: {
    gap: 14,
  },
  toolbarDesktopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 18,
  },
  toolbarSection: {
    width: '100%',
  },
  // flex: 1 only where the sections sit side by side. Stacked on a phone, it gave each one a
  // basis of 0 on the web, so the card stopped growing with its content and the second row
  // of supermarkets hung out below it.
  toolbarSectionDesktop: {
    flex: 1,
    minWidth: 250,
  },
  toolbarDividerV: {
    width: 1,
    height: 48,
    marginHorizontal: 4,
  },
  mealsPerDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  mealsPerDayTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  mealsPerDaySubtitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentBtnActive: {
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
  },
  extrasPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  extraPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 5,
  },
  extraPillIcon: {
    fontSize: 13,
  },
  extraPillText: {
    fontSize: 11,
  },
  addDayExtraRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 14,
  },
  addDayExtraBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDayExtraText: {
    fontSize: 11,
    fontWeight: '700',
  },
  feed: {
    width: '100%',
    gap: 24,
  },
  dayRowContainer: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  dayGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  dayHeaderLeft: {
    gap: 4,
  },
  dayTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayGroupTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dayCostBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dayGroupCost: {
    fontSize: 13,
    fontWeight: '800',
  },
  mealsCountTag: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addDessertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  addDessertBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  dessertIncludedBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  dessertIncludedText: {
    fontSize: 12,
    fontWeight: '800',
  },
  mealsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
  },
  mealsRowMobile: {
    flexDirection: 'column',
  },
  mealCol: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 280,
    minWidth: 280,
    maxWidth: '100%',
    transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  tierSectionContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  supermarketPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  marketPill: {
    flex: 1,
    minWidth: 68,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketPillText: {
    fontSize: 11,
    // "Mega Image" is the only name that wraps, and without this it sat left-aligned while
    // every single-line neighbour looked centred.
    textAlign: 'center',
  },
  quickActionsBar: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  quickActionIcon: {
    fontSize: 22,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  quickActionSub: {
    fontSize: 11,
    marginTop: 1,
  },
});
