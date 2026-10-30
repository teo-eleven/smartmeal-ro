import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { DayOfWeek } from '../../types';
import { RecipeDetailTheme } from './types';
import { styles } from './styles';

interface MealActionsCardProps {
  theme: RecipeDetailTheme;
  isDark: boolean;
  targetDay?: DayOfWeek | null;
  isEatenOut: boolean;
  onSwap: () => void;
  onClose: () => void;
  onToggleEatOut: () => void;
}

export const MealActionsCard: React.FC<MealActionsCardProps> = ({
  theme,
  isDark,
  targetDay,
  isEatenOut,
  onSwap,
  onClose,
  onToggleEatOut,
}) => (
  <View
    style={[
      styles.cardSection,
      styles.actionsCardSection,
      { backgroundColor: theme.card, borderColor: theme.border },
    ]}
  >
    <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 12 }]}>
      ⚡ Opțiuni pentru această masă
    </Text>

    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Schimbă cu alt preparat"
        onPress={onSwap}
        style={[
          styles.actionBtn,
          styles.swapActionBtn,
          { backgroundColor: theme.primaryLight, borderColor: theme.primary },
        ]}
        activeOpacity={0.8}
      >
        <Text style={[styles.actionBtnText, { color: theme.primary }]}>
          🔄 Schimbă cu alt preparat
        </Text>
      </TouchableOpacity>

      {targetDay && (
        <TouchableOpacity
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isEatenOut }}
          accessibilityLabel={isEatenOut ? 'Gătește acasă' : 'Mănâncă în oraș'}
          onPress={onToggleEatOut}
          style={[
            styles.actionBtn,
            styles.eatOutActionBtn,
            {
              backgroundColor: isEatenOut
                ? isDark
                  ? 'rgba(234, 179, 8, 0.2)'
                  : '#fef9c3'
                : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : '#f3f4f6',
              borderColor: isEatenOut ? (isDark ? '#ca8a04' : '#eab308') : theme.border,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.actionBtnText,
              { color: isEatenOut ? (isDark ? '#facc15' : '#854d0e') : theme.text },
            ]}
          >
            {isEatenOut ? '↺ Gătește acasă această masă' : '🍽️ Mâncat în oraș la această masă'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Închide"
        onPress={onClose}
        style={[styles.actionBtn, styles.doneActionBtn, { backgroundColor: theme.primary }]}
        activeOpacity={0.85}
      >
        <Text style={[styles.actionBtnText, { color: theme.primaryText, fontWeight: '800' }]}>
          ✓ Închide & Înapoi la Meniu
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);
