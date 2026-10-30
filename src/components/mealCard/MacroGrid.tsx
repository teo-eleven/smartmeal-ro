import React from 'react';
import { Text, View } from 'react-native';
import { Recipe } from '../../types';
import { AppTheme } from '../../styles/theme';
import { styles } from './styles';

interface MacroGridProps {
  recipe: Recipe;
  theme: AppTheme;
}

export const MacroGrid: React.FC<MacroGridProps> = ({ recipe, theme }) => (
  <View style={[styles.macroRow, { backgroundColor: theme.accentBg, borderColor: theme.border }]}>
    <View style={styles.macroCol}>
      <Text style={[styles.macroVal, { color: theme.text }]}>
        {recipe.nutritionPerServing.calories}
      </Text>
      <Text style={[styles.macroLbl, { color: theme.textMuted }]}>kcal/p</Text>
    </View>
    <View style={styles.macroDivider} />

    <View style={styles.macroCol}>
      <Text style={[styles.macroVal, { color: '#38bdf8' }]}>
        {recipe.nutritionPerServing.proteinGrams}g
      </Text>
      <Text style={[styles.macroLbl, { color: theme.textMuted }]}>proteină/p</Text>
    </View>
    <View style={styles.macroDivider} />

    <View style={styles.macroCol}>
      <Text style={[styles.macroVal, { color: '#fbbf24' }]}>
        {recipe.nutritionPerServing.carbsGrams}g
      </Text>
      <Text style={[styles.macroLbl, { color: theme.textMuted }]}>carbo/p</Text>
    </View>
    <View style={styles.macroDivider} />

    <View style={styles.macroCol}>
      <Text style={[styles.macroVal, { color: '#f87171' }]}>
        {recipe.nutritionPerServing.fatGrams}g
      </Text>
      <Text style={[styles.macroLbl, { color: theme.textMuted }]}>grăsimi/p</Text>
    </View>
  </View>
);
