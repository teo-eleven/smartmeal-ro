import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DayOfWeek, MealPlanDay } from '../types';

interface MealCardProps {
  day: MealPlanDay;
  onPressRecipe: () => void;
  onSwapMeal: () => void;
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

const MOOD_LABELS: Record<string, string> = {
  speedy: 'Mese Rapide',
  low_calorie: 'Low Calorie',
  family_fav: 'Favorit Familie',
  healthy_comfort: 'Healthy Comfort',
  fakeaway: 'Fakeaway',
  high_protein: 'Proteic',
  romanian_classic: 'Tradițional',
};

export const MealCard: React.FC<MealCardProps> = ({
  day,
  onPressRecipe,
  onSwapMeal,
  isDark,
}) => {
  const { recipe } = day;
  const primaryMood = recipe.moodTags[0] ? MOOD_LABELS[recipe.moodTags[0]] ?? recipe.moodTags[0] : 'Delicios';

  const theme = {
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#10b981',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
    accentBg: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
  };

  const totalCookingTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPressRecipe}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      {/* Day & Mood Header */}
      <View style={styles.topRow}>
        <View style={[styles.dayBadge, { backgroundColor: theme.primaryLight }]}>
          <Text style={[styles.dayBadgeText, { color: theme.primary }]}>
            {DAY_LABELS[day.dayOfWeek]}
          </Text>
        </View>

        <View style={[styles.moodTag, { backgroundColor: theme.accentBg }]}>
          <Text style={[styles.moodTagText, { color: theme.textMuted }]}>{primaryMood}</Text>
        </View>
      </View>

      {/* Recipe Info */}
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
        {recipe.title}
      </Text>

      <Text style={[styles.description, { color: theme.textMuted }]} numberOfLines={2}>
        {recipe.description}
      </Text>

      {/* Metrics Row (Time, Servings, Cost) */}
      <View style={[styles.metricsRow, { backgroundColor: theme.accentBg }]}>
        <View style={styles.metricItem}>
          <Text style={styles.metricIcon}>⏱️</Text>
          <Text style={[styles.metricText, { color: theme.text }]}>{totalCookingTime}m</Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricIcon}>👥</Text>
          <Text style={[styles.metricText, { color: theme.text }]}>
            {day.servings} {day.servings === 1 ? 'porție' : 'porții'}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricIcon}>🔥</Text>
          <Text style={[styles.metricText, { color: theme.text }]}>
            {recipe.nutritionPerServing.calories} kcal
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricIcon}>🏷️</Text>
          <Text style={[styles.costHighlight, { color: theme.primary }]}>
            ~{day.estimatedCostRon} lei
          </Text>
        </View>
      </View>

      {/* Card Action Row */}
      <View style={styles.actionRow}>
        <Text style={[styles.viewRecipeHint, { color: theme.primary }]}>
          Vezi rețeta completă →
        </Text>

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onSwapMeal();
          }}
          style={[styles.swapBtn, { borderColor: theme.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.swapBtnText, { color: theme.text }]}>🔄 Schimbă</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moodTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  moodTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricIcon: {
    fontSize: 13,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
  },
  costHighlight: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewRecipeHint: {
    fontSize: 12,
    fontWeight: '700',
  },
  swapBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  swapBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
