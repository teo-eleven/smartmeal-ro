import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { calculateMinimumViableBudget } from '../engine/budgetCalculator';
import { FoodTier, SupermarketId } from '../types';

interface BudgetSliderProps {
  budget: number;
  peopleCount: number;
  daysCount: number;
  supermarketId: SupermarketId;
  onChangeBudget: (newBudget: number) => void;
  isDark: boolean;
  mealsPerDay?: number;
  foodTier?: FoodTier;
}

export const BudgetSlider: React.FC<BudgetSliderProps> = ({
  budget,
  peopleCount,
  daysCount,
  supermarketId,
  onChangeBudget,
  isDark,
  mealsPerDay = 1,
  foodTier = 'medium',
}) => {
  const minFloor = calculateMinimumViableBudget(peopleCount, daysCount, supermarketId, true, mealsPerDay, foodTier);
  const isBelowFloor = budget < minFloor;

  const presets = [
    Math.max(50, minFloor - 20),
    minFloor,
    minFloor + 30,
    minFloor + 60,
    minFloor + 100,
  ];

  const adjustBudget = (delta: number) => {
    const next = Math.max(30, Math.min(600, budget + delta));
    onChangeBudget(next);
  };

  const theme = {
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    primary: '#10b981',
    primaryBg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5',
    cardBg: isDark ? '#1e293b' : '#f8fafc',
    border: isDark ? '#334155' : '#e2e8f0',
    warningBg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
    warningText: isDark ? '#fbbf24' : '#b45309',
  };

  return (
    <View style={styles.container}>
      {/* Big Budget Counter */}
      <View style={styles.counterRow}>
        <TouchableOpacity
          onPress={() => adjustBudget(-10)}
          style={[styles.stepBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.stepBtnText, { color: theme.text }]}>−</Text>
        </TouchableOpacity>

        <View style={styles.valueDisplay}>
          <Text style={[styles.currencySymbol, { color: theme.primary }]}>RON</Text>
          <Text style={[styles.budgetValue, { color: theme.text }]}>{budget}</Text>
          <Text style={[styles.periodLabel, { color: theme.textMuted }]}>săptămâna aceasta</Text>
        </View>

        <TouchableOpacity
          onPress={() => adjustBudget(10)}
          style={[styles.stepBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.stepBtnText, { color: theme.text }]}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Recommendation Banner */}
      <View
        style={[
          styles.floorBadge,
          {
            backgroundColor: isBelowFloor ? theme.warningBg : theme.primaryBg,
            borderColor: isBelowFloor ? theme.warningText : theme.primary,
          },
        ]}
      >
        <Text
          style={[
            styles.floorText,
            { color: isBelowFloor ? theme.warningText : '#065f46' },
          ]}
        >
          {isBelowFloor
            ? `⚠️ Sub pragul recomandat de ~${minFloor} lei. Vom alege ingrediente de bază super-economice.`
            : `✓ Buget optim pentru ${peopleCount} ${peopleCount === 1 ? 'persoană' : 'persoane'}, ${daysCount} ${daysCount === 1 ? 'zi' : 'zile'}.`}
        </Text>
      </View>

      {/* Quick Presets */}
      <Text style={[styles.presetsTitle, { color: theme.textMuted }]}>Alegere rapidă:</Text>
      <View style={styles.presetsRow}>
        {presets.map((val) => (
          <TouchableOpacity
            key={val}
            onPress={() => onChangeBudget(val)}
            style={[
              styles.presetBtn,
              {
                backgroundColor: budget === val ? theme.primary : theme.cardBg,
                borderColor: budget === val ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.presetBtnText,
                { color: budget === val ? '#ffffff' : theme.text },
              ]}
            >
              {val} lei
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stepBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 28,
  },
  valueDisplay: {
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: -4,
  },
  budgetValue: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  periodLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: -2,
  },
  floorBadge: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  floorText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
  presetsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
