import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RecipeNutrition } from '../types';
import { getAppTheme } from '../styles/theme';

interface MacroBarProps {
  nutrition: RecipeNutrition;
  isDark: boolean;
}

export const MacroBar: React.FC<MacroBarProps> = ({ nutrition, isDark }) => {
  const appTheme = getAppTheme(isDark);
  const theme = {
    cardBg: appTheme.accentBg,
    border: appTheme.border,
    label: appTheme.textMuted,
    text: appTheme.text,
    calories: appTheme.text,
    caloriesBg: appTheme.trackBg,
    caloriesBorder: appTheme.borderStrong,
    protein: appTheme.macro.protein,
    carbs: appTheme.macro.carbs,
    fat: appTheme.macro.fat,
  };

  return (
    <View style={styles.grid}>
      {/* Calories Card */}
      <View
        style={[
          styles.macroCard,
          {
            backgroundColor: theme.caloriesBg,
            borderColor: theme.caloriesBorder,
          },
        ]}
      >
        <Text style={[styles.macroValue, { color: theme.calories }]}>{nutrition.calories}</Text>
        <Text style={[styles.macroLabel, { color: theme.label }]}>KCAL</Text>
      </View>

      {/* Protein Card */}
      <View
        style={[
          styles.macroCard,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.macroValue, { color: theme.protein }]}>{nutrition.proteinGrams}g</Text>
        <Text style={[styles.macroLabel, { color: theme.label }]}>PROTEINĂ</Text>
      </View>

      {/* Carbs Card */}
      <View
        style={[
          styles.macroCard,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.macroValue, { color: theme.carbs }]}>{nutrition.carbsGrams}g</Text>
        <Text style={[styles.macroLabel, { color: theme.label }]}>CARBOHIDRAȚI</Text>
      </View>

      {/* Fat Card */}
      <View
        style={[
          styles.macroCard,
          { backgroundColor: theme.cardBg, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.macroValue, { color: theme.fat }]}>{nutrition.fatGrams}g</Text>
        <Text style={[styles.macroLabel, { color: theme.label }]}>GRĂSIMI</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  macroCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  macroLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
