import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Recipe, SupermarketId } from '../../types';
import { RecipeVisual } from '../../components/RecipeVisual';
import { PhotoCreditLine } from '../../components/PhotoCreditLine';
import { getStoreBadgeBg, getStoreSignatureBadge } from '../../utils/storeBadge';
import { RecipeDetailTheme } from './types';
import { styles } from './styles';

interface RecipeHeroProps {
  recipe: Recipe;
  theme: RecipeDetailTheme;
  isDark: boolean;
  totalTime: number;
  supermarketId: SupermarketId;
}

export const RecipeHero: React.FC<RecipeHeroProps> = ({
  recipe,
  theme,
  isDark,
  totalTime,
  supermarketId,
}) => (
  <>
    <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <RecipeVisual recipe={recipe} isDark={isDark} style={styles.heroImage} />
      <LinearGradient
        colors={['transparent', isDark ? 'rgba(11, 17, 32, 0.95)' : 'rgba(0, 0, 0, 0.65)']}
        style={styles.heroGradient}
      />

      <View style={styles.heroBadgesRow}>
        <View style={[styles.heroPill, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <Text style={styles.heroPillText}>⏱️ {totalTime} min</Text>
        </View>
        <View style={[styles.heroPill, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <Text style={styles.heroPillText}>
            🔥 {recipe.nutritionPerServing.calories} kcal/porție
          </Text>
        </View>
        {recipe.tier && (
          <View style={[styles.heroPill, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]}>
            <Text style={styles.heroPillText}>
              {recipe.tier === 'basic'
                ? '🥉 Basic'
                : recipe.tier === 'medium'
                  ? '🥈 Medium'
                  : '🥇 Premium'}
            </Text>
          </View>
        )}
        {getStoreSignatureBadge(recipe, supermarketId) && (
          <View
            style={[styles.heroPill, { backgroundColor: getStoreBadgeBg(recipe.storeSignature) }]}
          >
            <Text style={styles.heroPillText}>{recipe.storeBadgeLabel}</Text>
          </View>
        )}
      </View>
    </View>
    <PhotoCreditLine recipe={recipe} color={theme.textMuted} />
  </>
);
