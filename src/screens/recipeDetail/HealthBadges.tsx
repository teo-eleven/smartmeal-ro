import React from 'react';
import { Text, View } from 'react-native';
import { Recipe } from '../../types';
import { getHealthGoalMeta } from '../../data/healthTags';
import { getAppTheme } from '../../styles/theme';
import { styles } from './styles';

interface HealthBadgesProps {
  recipe: Recipe;
  isDark: boolean;
}

/** The recipe's health and wellness badges; pork-free is left out, the allergen notice covers it. */
export const HealthBadges: React.FC<HealthBadgesProps> = ({ recipe, isDark }) => {
  if (!recipe.healthTags || recipe.healthTags.filter((t) => t !== 'pork_free').length === 0) {
    return null;
  }
  const theme = getAppTheme(isDark);
  return (
    <View style={styles.healthTagsRow}>
      {recipe.healthTags
        .filter((t) => t !== 'pork_free')
        .map((tag) => {
          const meta = getHealthGoalMeta(tag);
          if (!meta) return null;
          return (
            <View
              key={tag}
              style={[
                styles.healthTagBadge,
                {
                  backgroundColor: theme.successBg,
                  borderColor: theme.successBorder,
                },
              ]}
            >
              <Text style={styles.healthTagIcon}>{meta.icon}</Text>
              <Text style={[styles.healthTagText, { color: theme.successText }]}>
                {meta.shortBadgeRo}
              </Text>
            </View>
          );
        })}
    </View>
  );
};
