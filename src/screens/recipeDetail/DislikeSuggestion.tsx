import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { AppState } from '../../store/useAppStore';
import { calculateRecipePortionCost } from '../../engine/budgetCalculator';
import { DayOfWeek, MealSlot, Recipe, UserPreferences } from '../../types';
import { RecipeDetailTheme } from './types';
import { styles } from './styles';

interface DislikeSuggestionProps {
  recipe: Recipe;
  suggestedReplacement: Recipe;
  theme: RecipeDetailTheme;
  activeServings: number;
  preferences: UserPreferences;
  targetDay?: DayOfWeek | null;
  targetSlot?: MealSlot | null;
  replaceMealWithRecipe: AppState['replaceMealWithRecipe'];
  showNotice: AppState['showNotice'];
  onClose: () => void;
  onSwap: () => void;
}

/** Shown once a recipe is excluded: the closest alternative, ready to take its place. */
export const DislikeSuggestion: React.FC<DislikeSuggestionProps> = ({
  recipe,
  suggestedReplacement,
  theme,
  activeServings,
  preferences,
  targetDay,
  targetSlot,
  replaceMealWithRecipe,
  showNotice,
  onClose,
  onSwap,
}) => (
  <View
    style={[
      styles.dislikeSuggestionCard,
      {
        backgroundColor: theme.card,
        borderColor: theme.dangerBorder,
      },
    ]}
  >
    <View style={styles.dislikeSuggestionHeader}>
      <Text style={[styles.dislikeSuggestionBadge, { color: theme.danger }]}>
        💡 Sugestie de înlocuire recomandată
      </Text>
    </View>
    <Text style={[styles.dislikeSuggestionSubtext, { color: theme.textMuted }]}>
      Rețeta „{recipe.title}” a fost exclusă definitiv de pe acest cont. Iată alternativa optimă
      pentru acest loc:
    </Text>

    <View
      style={[
        styles.suggestedDishBox,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.suggestedDishHeader}>
        <Text style={[styles.suggestedDishTitle, { color: theme.text }]}>
          {suggestedReplacement.title}
        </Text>
        {suggestedReplacement.tier && (
          <View style={[styles.suggestedTierBadge, { backgroundColor: theme.inputBg }]}>
            <Text style={[styles.suggestedTierText, { color: theme.textMuted }]}>
              {suggestedReplacement.tier === 'basic'
                ? '🥉 Basic'
                : suggestedReplacement.tier === 'medium'
                  ? '🥈 Medium'
                  : '🥇 Premium'}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.suggestedDishDesc, { color: theme.textMuted }]} numberOfLines={2}>
        {suggestedReplacement.description}
      </Text>

      <View style={styles.suggestedMetaRow}>
        <View style={[styles.suggestedMetaPill, { backgroundColor: theme.inputBg }]}>
          <Text style={[styles.suggestedMetaText, { color: theme.text }]}>
            ⏱️ {suggestedReplacement.prepTimeMinutes} min
          </Text>
        </View>
        <View style={[styles.suggestedMetaPill, { backgroundColor: theme.inputBg }]}>
          <Text style={[styles.suggestedMetaText, { color: theme.text }]}>
            🔥 {suggestedReplacement.nutritionPerServing.calories} kcal
          </Text>
        </View>
        <View style={[styles.suggestedMetaPill, { backgroundColor: theme.primaryLight }]}>
          <Text style={[styles.suggestedMetaText, { color: theme.primary }]}>
            💰 ~
            {Math.round(
              calculateRecipePortionCost(
                suggestedReplacement,
                activeServings,
                preferences.supermarketId,
                preferences.excludePantryStaples
              )
            )}{' '}
            lei
          </Text>
        </View>
      </View>
    </View>

    <View style={styles.suggestedActionsColumn}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Înlocuiește cu ${suggestedReplacement.title}`}
        onPress={() => {
          if (targetDay) {
            replaceMealWithRecipe(targetDay, suggestedReplacement, targetSlot || undefined);
            showNotice(
              'Rețetă înlocuită',
              `Am adăugat „${suggestedReplacement.title}” în meniul tău.`,
              'success'
            );
            onClose();
          } else {
            onSwap();
          }
        }}
        style={[styles.confirmReplacementBtn, { backgroundColor: theme.success }]}
        activeOpacity={0.85}
      >
        <Text style={[styles.confirmReplacementBtnText, { color: theme.onSuccess }]}>
          ✓ Înlocuiește cu această rețetă
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Alege altceva din catalog"
        onPress={onSwap}
        style={[
          styles.browseCatalogBtn,
          { backgroundColor: theme.btnBg, borderColor: theme.border },
        ]}
        activeOpacity={0.8}
      >
        <Text style={[styles.browseCatalogBtnText, { color: theme.text }]}>
          🔄 Alege altceva din catalog
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);
