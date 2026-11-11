import React from 'react';
import { Text, View } from 'react-native';
import { Recipe } from '../../types';
import { getHealthGoalMeta, isHealthGoal } from '../../data/healthTags';
import { shownGoalTags } from '../../utils/healthGoalVisibility';
import { getAppTheme } from '../../styles/theme';
import { HealthDisclaimer } from '../../components/HealthDisclaimer';
import { styles } from './styles';

interface HealthBadgesProps {
  recipe: Recipe;
  isDark: boolean;
}

/**
 * The recipe's health and wellness badges, with the short disclaimer under them; pork-free is
 * left out, the allergen notice covers it. None on iOS, where health goals are hidden (A.8).
 */
export const HealthBadges: React.FC<HealthBadgesProps> = ({ recipe, isDark }) => {
  const visibleTags = shownGoalTags(recipe.healthTags).filter(isHealthGoal);
  if (visibleTags.length === 0) return null;
  const theme = getAppTheme(isDark);
  return (
    <View style={styles.healthBlock}>
      <View style={styles.healthTagsRow}>
        {visibleTags.map((tag) => {
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
      <HealthDisclaimer isDark={isDark} />
    </View>
  );
};
