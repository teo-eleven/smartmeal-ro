import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MealPlanDay, PlannedMeal, Recipe } from '../../types';
import { RecipeVisual } from '../RecipeVisual';
import { AppTheme } from '../../styles/theme';
import { DAY_LABELS_RO } from '../../constants/days';
import { getSlotColor } from './cardLabels';
import { styles } from './styles';

interface CardHeroProps {
  day: MealPlanDay;
  meal?: PlannedMeal;
  recipe: Recipe;
  effectiveSlotLabel?: string;
  isDessert: boolean;
  costRon: number;
  servings: number;
  portionCost: number;
  theme: AppTheme;
  isDark: boolean;
  onPressRecipe: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
  onRemoveMeal?: () => void;
}

/**
 * The picture is the button; the badges float over it and let taps through, so the dessert's
 * ✕ is a sibling of the button, not inside it (nested, a screen reader saw one element with
 * two actions).
 */
export const CardHero: React.FC<CardHeroProps> = ({
  day,
  meal,
  recipe,
  effectiveSlotLabel,
  isDessert,
  costRon,
  servings,
  portionCost,
  theme,
  isDark,
  onPressRecipe,
  onPressIn: handlePressIn,
  onPressOut: handlePressOut,
  onRemoveMeal,
}) => (
  <View style={[styles.imageContainer, { backgroundColor: theme.card }]}>
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${recipe.title}. Vezi rețeta.`}
      activeOpacity={0.92}
      onPress={onPressRecipe}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={StyleSheet.absoluteFill}
    >
      <RecipeVisual recipe={recipe} isDark={isDark} style={styles.image} />

      {/* Smooth Bottom Subtle Edge Shading for Contrast */}
      <LinearGradient colors={['transparent', theme.photoScrim]} style={styles.gradientOverlay} />
    </TouchableOpacity>

    {/* Floating Day Badge (Top-Left) */}
    <View
      pointerEvents="box-none"
      style={[
        styles.floatingBadge,
        styles.dayBadge,
        isDessert && styles.dessertBadgeRow,
        { backgroundColor: theme.cardGlass, borderColor: theme.onPhotoBorder },
      ]}
    >
      <View pointerEvents="none" style={styles.dayBadgeLabel}>
        <Text
          style={[styles.dayBadgeText, { color: getSlotColor(meal?.slot, isDark) }]}
          numberOfLines={1}
        >
          {isDessert
            ? '🍰 DESERT'
            : `${DAY_LABELS_RO[day.dayOfWeek].toUpperCase()}${effectiveSlotLabel ? ` • ${effectiveSlotLabel.toUpperCase()}` : ''}`}
        </Text>
      </View>
      {isDessert && onRemoveMeal && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Șterge desertul din această zi"
          onPress={onRemoveMeal}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.headerRemoveBtn, { backgroundColor: theme.dangerBg }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.headerRemoveBtnText, { color: theme.danger }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>

    {/* Floating Price Badge (Top-Right) */}
    <View
      pointerEvents="none"
      style={[
        styles.floatingBadge,
        styles.priceBadge,
        { backgroundColor: theme.cardGlass, borderColor: theme.onPhotoBorder },
      ]}
    >
      <View style={styles.priceMainRow}>
        <Text style={[styles.priceBadgeText, { color: theme.primary }]} numberOfLines={1}>
          ~{costRon} lei
        </Text>
        {servings === 1 && (
          <Text style={[styles.priceSubText, { color: theme.textMuted }]} numberOfLines={1}>
            / porție
          </Text>
        )}
      </View>
      {servings > 1 && (
        <Text style={[styles.priceSubText, { color: theme.textMuted }]} numberOfLines={1}>
          total • ~{portionCost.toFixed(2)}/p
        </Text>
      )}
    </View>
  </View>
);
