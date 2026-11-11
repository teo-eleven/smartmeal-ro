import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { DayOfWeek, Recipe } from '../../types';
import { glass } from '../../styles/glass';
import { AppTheme } from '../../styles/theme';
import { DAY_LABELS_RO } from '../../constants/days';
import { styles } from './styles';

interface EatenOutCardProps {
  recipe: Recipe;
  dayOfWeek: DayOfWeek;
  slotLabel?: string;
  theme: AppTheme;
  isDark: boolean;
  onPressRecipe: () => void;
  onToggleEatOut?: () => void;
}

export const EatenOutCard: React.FC<EatenOutCardProps> = ({
  recipe,
  dayOfWeek,
  slotLabel: effectiveSlotLabel,
  theme,
  isDark,
  onPressRecipe,
  onToggleEatOut,
}) => {
  return (
    <View
      {...glass('card')}
      style={[
        styles.card,
        styles.eatenOutCard,
        {
          backgroundColor: isDark ? 'rgba(24, 24, 27, 0.75)' : 'rgba(249, 250, 251, 0.9)',
          borderColor: isDark ? 'rgba(234, 179, 8, 0.35)' : '#fef08a',
          borderStyle: 'dashed',
        },
      ]}
    >
      <View style={styles.eatenOutHeader}>
        <View
          style={[
            styles.eatenOutDayBadge,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <Text style={[styles.dayBadgeText, { color: theme.textMuted }]}>
            {DAY_LABELS_RO[dayOfWeek].toUpperCase()} •{' '}
            {effectiveSlotLabel ? effectiveSlotLabel.toUpperCase() : 'MASĂ'}
          </Text>
        </View>
        <View
          style={[
            styles.pillBadge,
            {
              backgroundColor: isDark ? 'rgba(234, 179, 8, 0.2)' : '#fef9c3',
              borderColor: isDark ? '#ca8a04' : '#eab308',
            },
          ]}
        >
          <Text
            style={[styles.pillText, { color: isDark ? '#facc15' : '#854d0e', fontWeight: '800' }]}
          >
            🍽️ MÂNCAT ÎN ORAȘ
          </Text>
        </View>
      </View>

      <View style={styles.eatenOutBody}>
        <View
          style={[
            styles.eatenOutIconCircle,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' },
          ]}
        >
          <Text style={styles.eatenOutIconText}>🍽️</Text>
        </View>
        <Text style={[styles.eatenOutTitle, { color: theme.text }]}>Mâncat în oraș</Text>
        <Text style={[styles.eatenOutSubtitle, { color: theme.textMuted }]}>
          Nu gătești acasă pentru această masă. Ingredientele au fost scoase automat din lista de
          cumpărături.
        </Text>
        <Text style={[styles.eatenOutOriginalRef, { color: theme.textMuted }]}>
          Rețetă inițială:{' '}
          <Text style={{ fontWeight: '700', color: theme.text }}>{recipe.title}</Text>
        </Text>
      </View>

      <View style={styles.eatenOutActionsRow}>
        {onToggleEatOut && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Revino la gătit acasă"
            onPress={onToggleEatOut}
            style={[styles.revertEatOutBtn, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.revertEatOutBtnText, { color: theme.primaryText }]}>
              ↺ Gătește acasă
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Vezi detaliile rețetei inițiale"
          onPress={onPressRecipe}
          style={[
            styles.viewOriginalBtn,
            { backgroundColor: theme.btnBg, borderColor: theme.border },
          ]}
          activeOpacity={0.8}
        >
          <Text style={[styles.viewOriginalBtnText, { color: theme.text }]}>Detalii rețetă →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
