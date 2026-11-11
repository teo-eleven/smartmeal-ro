import React from 'react';
import { Text, View } from 'react-native';
import { Recipe } from '../../types';
import { APPLIANCE_MAP } from './recipeContent';
import { RecipeDetailTheme } from './types';
import { styles } from './styles';

interface AppliancesCardProps {
  recipe: Recipe;
  theme: RecipeDetailTheme;
}

export const AppliancesCard: React.FC<AppliancesCardProps> = ({ recipe, theme }) => {
  if (!recipe.appliances || recipe.appliances.length === 0) return null;
  return (
    <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.sectionHeading, { color: theme.text }]}>
        🍳 Dotare bucătărie necesară
      </Text>
      <View style={styles.appliancesGrid}>
        {recipe.appliances.map((app) => {
          const item = APPLIANCE_MAP[app] || { name: app, icon: '🍽️' };
          return (
            <View
              key={app}
              style={[
                styles.appliancePill,
                { backgroundColor: theme.badgeBg, borderColor: theme.border },
              ]}
            >
              <Text style={styles.applianceIcon}>{item.icon}</Text>
              <Text style={[styles.applianceName, { color: theme.text }]}>{item.name}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
