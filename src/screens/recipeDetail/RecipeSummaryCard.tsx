import React from 'react';
import { Text, View } from 'react-native';
import { Recipe, SupermarketId } from '../../types';
import { SUPERMARKETS } from '../../data/supermarkets';
import { HealthBadges } from './HealthBadges';
import { RecipeDetailTheme } from './types';
import { styles } from './styles';

interface RecipeSummaryCardProps {
  recipe: Recipe;
  theme: RecipeDetailTheme;
  isDark: boolean;
  activeServings: number;
  supermarketId: SupermarketId;
  formattedTotalCost: string;
}

export const RecipeSummaryCard: React.FC<RecipeSummaryCardProps> = ({
  recipe,
  theme,
  isDark,
  activeServings,
  supermarketId,
  formattedTotalCost,
}) => (
  <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <Text style={[styles.title, { color: theme.text }]}>{recipe.title}</Text>
    <Text style={[styles.description, { color: theme.textMuted }]}>{recipe.description}</Text>

    <HealthBadges recipe={recipe} isDark={isDark} />

    {/* Price transparent indicator */}
    <View
      style={[styles.priceBox, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
    >
      {/* flex: 1 lets the text wrap. Without it the block kept its full width and
                      pushed the price itself off the card on a 360 px phone. */}
      <View style={styles.rowText}>
        <Text style={[styles.priceBoxLabel, { color: theme.primary }]}>
          COST TOTAL ESTIMAT ({activeServings} PORȚII)
        </Text>
        <Text style={[styles.priceBoxSub, { color: theme.textMuted }]}>
          Prețuri estimate la {SUPERMARKETS[supermarketId]?.name ?? supermarketId}
          {recipe.availableSupermarkets && recipe.availableSupermarkets.length > 0
            ? ` • Doar la: ${recipe.availableSupermarkets.map((s) => SUPERMARKETS[s]?.name ?? s).join(', ')}`
            : ' • Disponibil în toate magazinele'}
        </Text>
      </View>
      <Text style={[styles.priceBoxValue, { color: theme.primary }]}>
        ~{formattedTotalCost} LEI
      </Text>
    </View>
  </View>
);
