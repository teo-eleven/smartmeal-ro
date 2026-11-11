import React from 'react';
import { Text, View } from 'react-native';
import { MacroBar } from '../../components/MacroBar';
import { Recipe } from '../../types';
import { RecipeDetailTheme } from './types';
import { styles } from './styles';

interface NutritionCardProps {
  recipe: Recipe;
  theme: RecipeDetailTheme;
  isDark: boolean;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({ recipe, theme, isDark }) => (
  <View style={[styles.macroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <Text style={[styles.sectionHeading, { color: theme.text }]}>
      Valori nutriționale per porție
    </Text>
    <MacroBar nutrition={recipe.nutritionPerServing} isDark={isDark} />
  </View>
);
