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
  onPressRecipe: () => void;
  onToggleEatOut?: () => void;
}

export const EatenOutCard: React.FC<EatenOutCardProps> = ({
  recipe,
  dayOfWeek,
  slotLabel: effectiveSlotLabel,
  theme,
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
          backgroundColor: theme.cardGlass,
          borderColor: theme.warningBorder,
          borderStyle: 'dashed',
        },
      ]}
    >
      <View style={styles.eatenOutHeader}>
        <View
          style={[
            styles.eatenOutDayBadge,
            {
              backgroundColor: theme.trackBg,
              borderColor: theme.border,
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
              backgroundColor: theme.warningBg,
              borderColor: theme.warningBorder,
            },
          ]}
        >
          <Text style={[styles.pillText, { color: theme.warningText, fontWeight: '800' }]}>
            🍽️ MÂNCAT ÎN ORAȘ
          </Text>
        </View>
      </View>

      <View style={styles.eatenOutBody}>
        <View style={[styles.eatenOutIconCircle, { backgroundColor: theme.accentBg }]}>
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
