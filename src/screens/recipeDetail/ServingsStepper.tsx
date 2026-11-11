import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { RecipeDetailTheme } from './types';
import { styles } from './styles';

interface ServingsStepperProps {
  theme: RecipeDetailTheme;
  activeServings: number;
  onChange: (servings: number) => void;
}

export const ServingsStepper: React.FC<ServingsStepperProps> = ({
  theme,
  activeServings,
  onChange,
}) => (
  <View style={[styles.stepperCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <View style={styles.rowText}>
      <Text style={[styles.stepperLabel, { color: theme.text }]}>Porții calculate</Text>
      <Text style={[styles.stepperSubtext, { color: theme.primary }]}>
        Ingredientele se scalează automat
      </Text>
    </View>

    <View style={styles.stepperControls}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Scade o porție"
        onPress={() => onChange(activeServings - 1)}
        style={[styles.stepBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.stepBtnText, { color: theme.text }]}>−</Text>
      </TouchableOpacity>

      <Text style={[styles.servingsCountText, { color: theme.text }]}>{activeServings}</Text>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Adaugă o porție"
        onPress={() => onChange(activeServings + 1)}
        style={[styles.stepBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.stepBtnText, { color: theme.text }]}>+</Text>
      </TouchableOpacity>
    </View>
  </View>
);
