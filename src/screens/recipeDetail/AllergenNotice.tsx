import React from 'react';
import { Text, View } from 'react-native';
import { RecipeDetailTheme } from './types';
import { styles } from './styles';

interface AllergenNoticeProps {
  theme: RecipeDetailTheme;
  recipeAllergenLabels: string;
}

/** Allergens present in this dish, stated plainly before the ingredient list. */
export const AllergenNotice: React.FC<AllergenNoticeProps> = ({ theme, recipeAllergenLabels }) => (
  <View
    accessibilityRole="text"
    accessibilityLabel={`Atenție, conține alergeni: ${recipeAllergenLabels}`}
    style={[styles.allergenNotice, { backgroundColor: theme.warningBg, borderColor: theme.border }]}
  >
    <Text style={[styles.allergenNoticeText, { color: theme.warningText }]}>
      ⚠️ Conține: {recipeAllergenLabels}
    </Text>
  </View>
);
