import React from 'react';
import { Text, View } from 'react-native';
import { Recipe, SupermarketId } from '../../types';
import { AppTheme } from '../../styles/theme';
import { getHealthGoalMeta } from '../../data/healthTags';
import { getStoreBadgeBg, getStoreSignatureBadge } from '../../utils/storeBadge';
import { MOOD_LABELS, getTierBadgeStyle, getTierLabel } from './cardLabels';
import { styles } from './styles';

interface CardChipsProps {
  recipe: Recipe;
  supermarketId: SupermarketId;
  theme: AppTheme;
  isDark: boolean;
}

/**
 * Under the picture, not on it. Laid over the image, four chips did not fit a phone's width:
 * the row ran off the edge, and allowed to wrap, its second line covered the ingredient line.
 * Here the row wraps into space of its own. Time first, as the thing people look for.
 */
export const CardChips: React.FC<CardChipsProps> = ({ recipe, supermarketId, theme, isDark }) => {
  const totalCookingTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const primaryMood = recipe.moodTags[0]
    ? (MOOD_LABELS[recipe.moodTags[0]] ?? recipe.moodTags[0])
    : 'Delicios';

  return (
    <View style={styles.chipsRow}>
      <View style={[styles.pillBadge, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
        <Text style={[styles.pillText, { color: theme.text }]}>⏱️ {totalCookingTime} min</Text>
      </View>
      {recipe.tier &&
        (() => {
          const tierStyle = getTierBadgeStyle(recipe.tier, isDark);
          return (
            <View style={[styles.pillBadge, { backgroundColor: tierStyle.bg }]}>
              <Text style={[styles.pillText, { color: tierStyle.text }]}>
                {getTierLabel(recipe.tier)}
              </Text>
            </View>
          );
        })()}
      {getStoreSignatureBadge(recipe, supermarketId) && (
        <View
          style={[styles.pillBadge, { backgroundColor: getStoreBadgeBg(recipe.storeSignature) }]}
        >
          <Text style={styles.pillText}>{recipe.storeBadgeLabel}</Text>
        </View>
      )}
      <View style={[styles.pillBadge, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
        <Text style={[styles.pillText, { color: theme.text }]}>{primaryMood}</Text>
      </View>
      {(() => {
        const metaTag = recipe.healthTags?.find((t) => t !== 'pork_free');
        if (!metaTag) return null;
        const meta = getHealthGoalMeta(metaTag);
        if (!meta) return null;
        return (
          <View
            style={[
              styles.pillBadge,
              {
                backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : '#e8f5e9',
                borderColor: isDark ? 'rgba(52, 199, 89, 0.4)' : '#c8e6c9',
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { color: isDark ? '#4ade80' : '#15803d', fontWeight: '800' },
              ]}
            >
              {meta.icon} {meta.shortBadgeRo}
            </Text>
          </View>
        );
      })()}
    </View>
  );
};
