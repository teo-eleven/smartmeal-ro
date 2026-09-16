import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RecipeNutrition } from '../types';

interface MacroBarProps {
  nutrition: RecipeNutrition;
  isDark: boolean;
}

export const MacroBar: React.FC<MacroBarProps> = ({ nutrition, isDark }) => {
  const theme = {
    bg: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
    label: isDark ? '#94a3b8' : '#64748b',
    calories: '#10b981',
    protein: '#3b82f6',
    carbs: '#f59e0b',
    fat: '#ec4899',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.macroItem}>
        <Text style={[styles.macroValue, { color: theme.calories }]}>{nutrition.calories}</Text>
        <Text style={[styles.macroLabel, { color: theme.label }]}>kcal</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.macroItem}>
        <Text style={[styles.macroValue, { color: theme.protein }]}>{nutrition.proteinGrams}g</Text>
        <Text style={[styles.macroLabel, { color: theme.label }]}>Proteine</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.macroItem}>
        <Text style={[styles.macroValue, { color: theme.carbs }]}>{nutrition.carbsGrams}g</Text>
        <Text style={[styles.macroLabel, { color: theme.label }]}>Carbo</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.macroItem}>
        <Text style={[styles.macroValue, { color: theme.fat }]}>{nutrition.fatGrams}g</Text>
        <Text style={[styles.macroLabel, { color: theme.label }]}>Grăsimi</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: '100%',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  separator: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});
