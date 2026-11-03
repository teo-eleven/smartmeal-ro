import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { DayOfWeek, Recipe } from '../../types';
import { RecipeDetailTheme } from './types';
import { styles } from './styles';

interface RecipeTopBarProps {
  recipe: Recipe;
  theme: RecipeDetailTheme;
  totalTime: number;
  formattedCostPerServing: string;
  targetDay?: DayOfWeek | null;
  isEatenOut: boolean;
  onClose: () => void;
  onSwap: () => void;
  onToggleEatOut: () => void;
}

export const RecipeTopBar: React.FC<RecipeTopBarProps> = ({
  recipe,
  theme,
  totalTime,
  formattedCostPerServing,
  targetDay,
  isEatenOut,
  onClose,
  onSwap,
  onToggleEatOut,
}) => (
  <View
    style={[styles.topBar, { backgroundColor: theme.glassBg, borderBottomColor: theme.border }]}
  >
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Închide"
      onPress={onClose}
      style={[styles.closeBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
      activeOpacity={0.7}
    >
      <Text style={[styles.closeIcon, { color: theme.text }]}>✕ Închide</Text>
    </TouchableOpacity>

    <View style={styles.topCenter}>
      <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
        {recipe.title}
      </Text>
      <Text style={[styles.headerSubtitle, { color: theme.primary }]} numberOfLines={1}>
        ⏱️ {totalTime} min • ~{formattedCostPerServing} lei/porție
      </Text>
    </View>

    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Înlocuiește rețeta"
      onPress={onSwap}
      style={[styles.swapHeaderBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
      activeOpacity={0.7}
    >
      <Text style={[styles.swapHeaderText, { color: theme.text }]}>🔄 Înlocuiește</Text>
    </TouchableOpacity>

    {targetDay && (
      <TouchableOpacity
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isEatenOut }}
        accessibilityLabel={isEatenOut ? 'Gătește acasă' : 'Mănânc în oraș'}
        onPress={onToggleEatOut}
        style={[
          styles.swapHeaderBtn,
          {
            backgroundColor: isEatenOut ? theme.warningBg : theme.btnBg,
            borderColor: isEatenOut ? theme.warningBorder : theme.border,
          },
        ]}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.swapHeaderText, { color: isEatenOut ? theme.warningText : theme.text }]}
        >
          {isEatenOut ? '↺ Acasă' : '🍽️ În oraș'}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);
