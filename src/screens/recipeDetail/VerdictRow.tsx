import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { RecipeDetailTheme } from './types';
import { styles } from './styles';

interface VerdictRowProps {
  recipeId: string;
  theme: RecipeDetailTheme;
  isFavourite: boolean;
  isDisliked: boolean;
  toggleFavouriteRecipe: (recipeId: string) => void;
  toggleDislikedRecipe: (recipeId: string) => void;
}

/** What the planner should remember about this dish. */
export const VerdictRow: React.FC<VerdictRowProps> = ({
  recipeId,
  theme,
  isFavourite,
  isDisliked,
  toggleFavouriteRecipe,
  toggleDislikedRecipe,
}) => (
  <View style={styles.verdictRow}>
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={isFavourite ? 'Scoate de la preferate' : 'Marchează ca preferat'}
      onPress={() => toggleFavouriteRecipe(recipeId)}
      style={[
        styles.verdictBtn,
        {
          borderColor: isFavourite ? theme.successText : theme.border,
          backgroundColor: isFavourite ? theme.successBg : theme.btnBg,
        },
      ]}
      activeOpacity={0.8}
    >
      <Text
        style={[styles.verdictText, { color: isFavourite ? theme.successText : theme.textMuted }]}
      >
        {isFavourite ? 'Preferat ✓' : '👍 Îmi place'}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={isDisliked ? 'Adu rețeta înapoi în propuneri' : 'Nu mai propune rețeta'}
      onPress={() => toggleDislikedRecipe(recipeId)}
      style={[
        styles.verdictBtn,
        {
          borderColor: isDisliked ? theme.danger : theme.border,
          backgroundColor: isDisliked ? theme.dangerBg : theme.btnBg,
        },
      ]}
      activeOpacity={0.8}
    >
      <Text style={[styles.verdictText, { color: isDisliked ? theme.danger : theme.textMuted }]}>
        {isDisliked ? '↩︎ Adu-o înapoi' : '👎 Nu mai propune'}
      </Text>
    </TouchableOpacity>
  </View>
);
