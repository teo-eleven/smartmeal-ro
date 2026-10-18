import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SUPERMARKETS } from '../data/supermarkets';
import { getHealthGoalMeta } from '../data/healthTags';
import { getAppTheme } from '../styles/theme';
import { UserPreferences } from '../types';

interface PreGenerationSummaryCardProps {
  preferences: UserPreferences;
  isDark: boolean;
  extrasCost?: number;
}

export const PreGenerationSummaryCard: React.FC<PreGenerationSummaryCardProps> = ({
  preferences,
  isDark,
  extrasCost = 0,
}) => {
  const theme = getAppTheme(isDark);

  const peopleCount = preferences.peopleCount || 1;
  const daysCount = preferences.cookingDays?.length || 7;
  const slotsCount = preferences.mealSlots?.length || 2;
  const totalMeals = daysCount * slotsCount;
  const totalPortions = totalMeals * peopleCount;

  const supermarket = SUPERMARKETS[preferences.supermarketId] || {
    name: 'Supermarket',
    icon: '🛒',
  };

  // Nutrition targets calculated from profile
  const isHighProtein =
    preferences.moodTags?.includes('high_protein') ||
    preferences.healthGoalTags?.includes('pcos_friendly');
  const isLowCalorie = preferences.moodTags?.includes('low_calorie');

  let targetCalories = 2050;
  if (isLowCalorie) targetCalories = 1750;
  else if (preferences.foodTier === 'basic') targetCalories = 1950;
  else if (preferences.foodTier === 'premium') targetCalories = 2200;

  let targetProteinGrams = 95;
  if (isHighProtein) targetProteinGrams = 125;
  else if (preferences.foodTier === 'basic') targetProteinGrams = 85;
  else if (preferences.foodTier === 'premium') targetProteinGrams = 115;

  const costPerPortion =
    totalPortions > 0 ? (preferences.budgetRon / totalPortions).toFixed(1) : '15.0';

  const activeHealthTags = preferences.healthGoalTags || [];
  const selectedDiets =
    preferences.dietTypes && preferences.dietTypes.length > 0
      ? preferences.dietTypes
      : [preferences.dietType];

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIconBox, { backgroundColor: theme.primaryLight }]}>
          <Text style={styles.headerIcon}>📋</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>Pregătim săptămâna ta</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Rezumatul preferințelor tale înainte de generarea planului
          </Text>
        </View>
      </View>

      {/* Grid of Targets */}
      <View style={styles.metricsGrid}>
        {/* Metric 1: Diets & Health Goals */}
        <View
          style={[
            styles.metricCard,
            { backgroundColor: theme.accentBg, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>🎯 DIETĂ & SĂNĂTATE</Text>
          <View style={styles.badgesWrap}>
            {selectedDiets.map((d) => (
              <View
                key={d}
                style={[
                  styles.badge,
                  { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                ]}
              >
                <Text style={[styles.badgeText, { color: theme.primary }]}>
                  {d === 'omnivore'
                    ? 'Omnivor'
                    : d === 'vegetarian'
                      ? 'Vegetarian'
                      : d === 'vegan'
                        ? 'Vegan'
                        : d === 'pescatarian'
                          ? 'Pescatarian'
                          : d}
                </Text>
              </View>
            ))}
            {activeHealthTags.map((tagId) => {
              const meta = getHealthGoalMeta(tagId);
              return (
                <View
                  key={tagId}
                  style={[
                    styles.badge,
                    { backgroundColor: theme.surfaceTertiary, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: theme.text }]}>
                    {meta?.icon} {meta?.shortBadgeRo || tagId}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Metric 2: Planning Scope */}
        <View
          style={[
            styles.metricCard,
            { backgroundColor: theme.accentBg, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>📅 VOLUM PLANIFICAT</Text>
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {daysCount} {daysCount === 1 ? 'zi' : 'zile'} • {totalMeals} mese
          </Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>
            👥 {peopleCount} {peopleCount === 1 ? 'persoană' : 'persoane'} • {totalPortions} porții
            totale
          </Text>
        </View>

        {/* Metric 3: Nutritional Targets */}
        <View
          style={[
            styles.metricCard,
            { backgroundColor: theme.accentBg, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
            ⚡ ȚINTE MEDII ZILNICE
          </Text>
          <View style={styles.macroTargetRow}>
            <View style={styles.macroPill}>
              <Text style={[styles.macroPillVal, { color: '#fb923c' }]}>~{targetCalories}</Text>
              <Text style={[styles.macroPillLbl, { color: theme.textMuted }]}>kcal/zi</Text>
            </View>
            <View style={[styles.macroDivider, { backgroundColor: theme.border }]} />
            <View style={styles.macroPill}>
              <Text style={[styles.macroPillVal, { color: '#38bdf8' }]}>
                ~{targetProteinGrams}g
              </Text>
              <Text style={[styles.macroPillLbl, { color: theme.textMuted }]}>proteine/zi</Text>
            </View>
          </View>
        </View>

        {/* Metric 4: Supermarket & Budget */}
        <View
          style={[
            styles.metricCard,
            { backgroundColor: theme.accentBg, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.metricLabel, { color: theme.textMuted }]}>🛒 BUGET & MAGAZIN</Text>
          <Text style={[styles.metricValue, { color: theme.primary }]}>
            {preferences.budgetRon} lei max
          </Text>
          <Text style={[styles.metricSub, { color: theme.textMuted }]}>
            {supermarket.name} • ~{costPerPortion} lei / porție
            {extrasCost > 0 ? ` (include ${extrasCost.toFixed(0)} lei extra)` : ''}
          </Text>
        </View>
      </View>

      {/* Zero Waste Promise */}
      <View
        style={[
          styles.zeroWasteBanner,
          { backgroundColor: theme.primaryLight, borderColor: theme.primary },
        ]}
      >
        <Text style={styles.zeroWasteIcon}>🌱</Text>
        <Text style={[styles.zeroWasteText, { color: theme.text }]}>
          Algoritmul SmartMeal optimizează cumpărăturile pentru{' '}
          <Text style={{ fontWeight: '800', color: theme.primary }}>zero risipă alimentară</Text> și
          prețuri minime la raft.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginVertical: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 22,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  metricsGrid: {
    gap: 10,
  },
  metricCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricSub: {
    fontSize: 12,
    marginTop: 2,
  },
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  macroTargetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroPillVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  macroPillLbl: {
    fontSize: 11,
  },
  macroDivider: {
    width: 1,
    height: 16,
  },
  zeroWasteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  zeroWasteIcon: {
    fontSize: 16,
  },
  zeroWasteText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
});
