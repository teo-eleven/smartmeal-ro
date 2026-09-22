import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { calculateMinimumViableBudget } from '../engine/budgetCalculator';
import { FoodTier, SupermarketId } from '../types';
import { getAppTheme } from '../styles/theme';

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

  const [customText, setCustomText] = useState(String(budget));

  useEffect(() => {
    setCustomText(String(budget));
  }, [budget]);

  const handleCustomChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setCustomText(cleaned);
    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num > 0) {
      onChangeBudget(num);
    }
  };

  const handleBlur = () => {
    const num = parseInt(customText, 10);
    if (isNaN(num) || num < 20) {
      const fallback = Math.max(30, minFloor);
      setCustomText(String(fallback));
      onChangeBudget(fallback);
    } else {
      const clamped = Math.min(2500, num);
      setCustomText(String(clamped));
      onChangeBudget(clamped);
    }
  };

  const adjustBudget = (delta: number) => {
    const next = Math.max(30, Math.min(2500, budget + delta));
    onChangeBudget(next);
  };

  const appTheme = getAppTheme(isDark);
  const theme = {
    text: appTheme.text,
    textMuted: appTheme.textMuted,
    primary: appTheme.primary,
    primaryText: appTheme.primaryText,
    primaryLight: appTheme.primaryLight,
    surfaceSecondary: appTheme.surfaceSecondary,
    cardBg: appTheme.card,
    border: appTheme.border,
    warningBg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
    warningText: isDark ? '#fbbf24' : '#b45309',
  };

  return (
    <View style={styles.container}>
      {/* Tight Integrated Stepper & Center Edit Row */}
      <View style={styles.tightStepperRow}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => adjustBudget(-10)}
          style={[styles.tightStepBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.tightStepBtnText, { color: theme.text }]}>−</Text>
        </TouchableOpacity>

        <View style={[styles.tightCenterInputBox, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <TextInput
            value={customText}
            onChangeText={handleCustomChange}
            onBlur={handleBlur}
            keyboardType="numeric"
            style={[styles.tightInputField, { color: theme.text }]}
            selectTextOnFocus
            maxLength={5}
          />
          <Text style={[styles.tightCurrencyLabel, { color: theme.primary }]}>LEI</Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => adjustBudget(10)}
          style={[styles.tightStepBtn, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.tightStepBtnText, { color: theme.text }]}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.hintText, { color: theme.textMuted }]}>
        Apasă pe sumă pentru editare directă sau pe + / − pentru ajustare rapidă (±10 lei)
      </Text>

      {/* Single Suggested Budget Card based on prior selections */}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Folosește bugetul sugerat de ${minFloor} lei`}
        onPress={() => onChangeBudget(minFloor)}
        activeOpacity={0.8}
        style={[
          styles.suggestedCard,
          {
            backgroundColor: budget === minFloor ? theme.primaryLight : theme.cardBg,
            borderColor: budget === minFloor ? theme.primary : (isBelowFloor ? theme.warningText : theme.border),
          },
        ]}
      >
        <View style={styles.suggestedLeft}>
          <Text style={styles.suggestedIcon}>💡</Text>
          <View style={styles.suggestedInfo}>
            <Text style={[styles.suggestedTitle, { color: theme.text }]}>
              Buget sugerat:{' '}
              <Text style={{ fontWeight: '900', color: theme.text }}>
                {minFloor} LEI
              </Text>
            </Text>
            <Text style={[styles.suggestedSubtitle, { color: theme.textMuted }]}>
              Calculat pentru {peopleCount} {peopleCount === 1 ? 'persoană' : 'persoane'}, {daysCount} {daysCount === 1 ? 'zi' : 'zile'}, {mealsPerDay} {mealsPerDay === 1 ? 'masă' : 'mese'}/zi.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.suggestedActionBtn,
            {
              backgroundColor: budget === minFloor ? (isDark ? '#ffffff' : '#000000') : theme.surfaceSecondary,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.suggestedActionText,
              { color: budget === minFloor ? (isDark ? '#000000' : '#ffffff') : theme.text },
            ]}
          >
            {budget === minFloor ? '✓ Aplicat' : 'Aplică'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Warning indicator if below minimum floor */}
      {isBelowFloor && (
        <View style={[styles.floorWarningBadge, { backgroundColor: theme.warningBg, borderColor: theme.warningText }]}>
          <Text style={[styles.floorWarningText, { color: theme.warningText }]}>
            ⚠️ Bugetul tău ({budget} lei) este sub pragul minim estimat de ~{minFloor} lei. Vom include rețete ultra-economice din ingrediente de bază.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
  },
  tightStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  tightStepBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tightStepBtnText: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 30,
  },
  tightCenterInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 56,
    minWidth: 160,
    maxWidth: 220,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  tightInputField: {
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: 0,
    marginVertical: 0,
    minWidth: 70,
  },
  tightCurrencyLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  suggestedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 14,
    gap: 12,
  },
  suggestedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  suggestedIcon: {
    fontSize: 24,
  },
  suggestedInfo: {
    flex: 1,
  },
  suggestedTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  suggestedSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  suggestedActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  suggestedActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  floorWarningBadge: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  floorWarningText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
});
