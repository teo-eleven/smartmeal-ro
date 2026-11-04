import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { INGREDIENTS } from '../../data/ingredients';
import { formatIngredientWithHousehold } from '../../utils/householdUnits';
import { Recipe } from '../../types';
import { RecipeDetailTheme } from './types';
import { styles } from './styles';

interface IngredientsCardProps {
  recipe: Recipe;
  theme: RecipeDetailTheme;
  isWide: boolean;
  activeServings: number;
  checkedIngredients: Record<string, boolean>;
  onToggleIngredient: (id: string) => void;
}

/** The ingredients scaled to the chosen servings, as a checklist for what is already at home. */
export const IngredientsCard: React.FC<IngredientsCardProps> = ({
  recipe,
  theme,
  isWide,
  activeServings,
  checkedIngredients,
  onToggleIngredient,
}) => (
  <View
    style={[styles.ingredientsCard, { backgroundColor: theme.card, borderColor: theme.border }]}
  >
    <View style={[styles.ingredientsHeaderRow, { borderBottomColor: theme.borderSubtle }]}>
      <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 0 }]}>
        🛒 Ingrediente necesare ({activeServings} {activeServings === 1 ? 'porție' : 'porții'})
      </Text>
      <Text style={[styles.ingredientsHint, { color: theme.textMuted }]}>Bifează ce ai acasă</Text>
    </View>

    <View style={[styles.ingredientsList, isWide && styles.ingredientsListWide]}>
      {recipe.ingredients.map((ing, i) => {
        const dbIng = INGREDIENTS[ing.ingredientId];
        const scaledAmount = Math.round(ing.amountPerServing * activeServings * 10) / 10;
        const isChecked = Boolean(checkedIngredients[ing.ingredientId]);

        return (
          <TouchableOpacity
            accessibilityRole="checkbox"
            aria-checked={isChecked}
            key={ing.ingredientId}
            onPress={() => onToggleIngredient(ing.ingredientId)}
            activeOpacity={0.7}
            style={[
              styles.ingredientRow,
              isWide && styles.ingredientRowWide,
              !isWide &&
                i < recipe.ingredients.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
              isWide && { borderColor: theme.border, borderWidth: 1, borderRadius: 12 },
              isChecked && { backgroundColor: theme.stepDoneBg },
            ]}
          >
            <View
              style={[
                styles.ingCheckSquare,
                {
                  backgroundColor: isChecked ? theme.primary : 'transparent',
                  borderColor: isChecked ? theme.primary : theme.border,
                },
              ]}
            >
              {isChecked && <Text style={[styles.checkMark, { color: theme.primaryText }]}>✓</Text>}
            </View>

            <Text
              style={[
                styles.ingredientName,
                {
                  color: isChecked ? theme.textMuted : theme.text,
                  textDecorationLine: isChecked ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={2}
            >
              {dbIng ? dbIng.name : ing.ingredientId}
            </Text>

            <View style={[styles.amountBadge, { backgroundColor: theme.inputBg }]}>
              <Text style={[styles.ingredientAmount, { color: theme.primary }]} numberOfLines={2}>
                {formatIngredientWithHousehold(ing.ingredientId, scaledAmount, ing.unit)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);
