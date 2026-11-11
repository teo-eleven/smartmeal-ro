import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MealCard } from '../../components/MealCard';
import { AppState } from '../../store/useAppStore';
import { DayOfWeek, MealPlanDay, MealSlot, Recipe } from '../../types';
import { glass } from '../../styles/glass';
import { AppTheme } from '../../styles/theme';
import { DAY_LABELS_RO } from '../../constants/days';
import { AnimatedMealSlot } from './AnimatedMealSlot';
import { styles } from './styles';

const CANONICAL_ORDER: Record<string, number> = {
  breakfast: 1,
  lunch: 2,
  dinner: 3,
  snack: 4,
  dessert: 5,
};

interface DayRowProps {
  day: MealPlanDay;
  dayIdx: number;
  dayCount: number;
  theme: AppTheme;
  isDark: boolean;
  isLargeScreen: boolean;
  handleOpenDetail: (
    recipe: Recipe,
    servings: number,
    dayOfWeek: DayOfWeek,
    slot: MealSlot
  ) => void;
  handleOpenSwap: (dayOfWeek: DayOfWeek, slot?: MealSlot) => void;
  addExtraMealToDay: AppState['addExtraMealToDay'];
  cookDoubleFor: AppState['cookDoubleFor'];
  undoCookDouble: AppState['undoCookDouble'];
  removeMealFromDay: AppState['removeMealFromDay'];
  setMealServings: AppState['setMealServings'];
  toggleEatOut: AppState['toggleEatOut'];
}

/** One day of the plan: its header, the dessert toggle and a card for every meal. */
export const DayRow: React.FC<DayRowProps> = ({
  day,
  dayIdx,
  dayCount,
  theme,
  isDark,
  isLargeScreen,
  handleOpenDetail,
  handleOpenSwap,
  addExtraMealToDay,
  cookDoubleFor,
  undoCookDouble,
  removeMealFromDay,
  setMealServings,
  toggleEatOut,
}) => {
  const visibleMeals = day.meals
    .filter((m) => m.slot !== 'snack')
    .sort((a, b) => (CANONICAL_ORDER[a.slot] ?? 99) - (CANONICAL_ORDER[b.slot] ?? 99));
  const hasDessert = visibleMeals.some((m) => m.slot === 'dessert');

  return (
    <View
      {...glass('card')}
      style={[
        styles.dayRowContainer,
        { shadowColor: theme.shadowColor },
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
              📅 {DAY_LABELS_RO[day.dayOfWeek].toUpperCase()}
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
              accessibilityLabel="Adaugă Desert de Casă"
              onPress={() => addExtraMealToDay(day.dayOfWeek, 'dessert')}
              {...glass('pill')}
              style={[
                styles.addDessertBtn,
                { shadowColor: theme.accentHighlight },
                {
                  backgroundColor: theme.primaryLight,
                  borderColor: theme.accentHighlight,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.addDessertBtnText, { color: theme.accentHighlight }]}>
                + 🍰 Adaugă Desert de Casă
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.dessertIncludedBadge,
                {
                  backgroundColor: theme.primaryLight,
                  borderColor: theme.borderStrong,
                },
              ]}
            >
              <Text style={[styles.dessertIncludedText, { color: theme.accentHighlight }]}>
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
            style={[styles.mealCol, !isLargeScreen && styles.mealColMobile]}
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
                dayIdx < dayCount - 1 ? () => cookDoubleFor(day.dayOfWeek, meal.id) : undefined
              }
              onUndoCookDouble={() => undoCookDouble(day.dayOfWeek, meal.id)}
              onRemoveMeal={
                meal.slot === 'dessert'
                  ? () => removeMealFromDay(day.dayOfWeek, meal.id)
                  : undefined
              }
              onChangeServings={(servings) => setMealServings(day.dayOfWeek, meal.id, servings)}
              onToggleEatOut={() => toggleEatOut(day.dayOfWeek, meal.slot, meal.id)}
              isDark={isDark}
            />
          </AnimatedMealSlot>
        ))}
      </View>
    </View>
  );
};
