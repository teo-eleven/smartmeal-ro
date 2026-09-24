import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DayOfWeek, MealPlanDay, PlannedMeal } from '../types';
import { RecipeVisual } from './RecipeVisual';
import { getAppTheme } from '../styles/theme';

interface WeekOverviewProps {
  days: MealPlanDay[];
  onPressMeal: (dayOfWeek: DayOfWeek, meal: PlannedMeal) => void;
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

/**
 * The whole week at once.
 *
 * The detailed board is one card per meal, which is the right shape when deciding about a
 * single dinner and the wrong one when judging the week: twenty-one full cards is a long
 * scroll and you never see Monday and Friday together. This trades the detail for the shape
 * of the week — what is cooked when, what each day costs, and where the repeats fall.
 */
export const WeekOverview: React.FC<WeekOverviewProps> = ({ days, onPressMeal, isDark }) => {
  const theme = getAppTheme(isDark);

  return (
    <View style={styles.week}>
      {days.map((day) => (
        <View
          key={day.dayOfWeek}
          style={[styles.dayRow, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <View style={styles.dayHeader}>
            <Text style={[styles.dayName, { color: theme.text }]}>{DAY_LABELS[day.dayOfWeek]}</Text>
            <Text style={[styles.dayCost, { color: theme.textMuted }]}>
              {day.estimatedCostRon} lei
            </Text>
          </View>

          <View style={styles.meals}>
            {day.meals.map((meal) => (
              <TouchableOpacity
                key={meal.id}
                accessibilityRole="button"
                accessibilityLabel={`${DAY_LABELS[day.dayOfWeek]}, ${meal.slotLabelRo}: ${meal.recipe.title}`}
                onPress={() => onPressMeal(day.dayOfWeek, meal)}
                style={[styles.mealCard, { borderColor: theme.border }]}
                activeOpacity={0.85}
              >
                <View style={styles.mealVisual}>
                  <RecipeVisual recipe={meal.recipe} isDark={isDark} compact />
                </View>

                <View style={styles.mealFoot}>
                  <Text style={[styles.mealSlot, { color: theme.textMuted }]} numberOfLines={1}>
                    {meal.isLeftover ? '♻️ reîncălzit' : meal.slotLabelRo}
                  </Text>
                  <Text style={[styles.mealCost, { color: theme.text }]}>
                    {meal.isLeftover ? '0 lei' : `${meal.estimatedCostRon} lei`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  week: { width: '100%', gap: 10 },
  dayRow: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayName: { fontSize: 13, fontWeight: '900', letterSpacing: 0.2 },
  dayCost: { fontSize: 11, fontWeight: '700' },
  meals: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mealCard: {
    flexGrow: 1,
    flexBasis: 150,
    minWidth: 150,
    maxWidth: 260,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mealVisual: { height: 74, width: '100%' },
  mealFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  mealSlot: { fontSize: 10, fontWeight: '700', flexShrink: 1 },
  mealCost: { fontSize: 11, fontWeight: '900' },
});
