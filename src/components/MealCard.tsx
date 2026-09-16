import React, { useRef } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DayOfWeek, FoodTier, MealPlanDay, MealSlot, PlannedMeal } from '../types';
import { LOCAL_RECIPE_IMAGES } from '../../assets/recipes';

interface MealCardProps {
  day: MealPlanDay;
  meal?: PlannedMeal;
  slotLabel?: string;
  onPressRecipe: () => void;
  onSwapMeal: () => void;
  onRemoveMeal?: () => void;
  isDark: boolean;
}

function getSlotColor(slot?: MealSlot): string {
  switch (slot) {
    case 'breakfast':
      return '#f59e0b';
    case 'lunch':
      return '#06b6d4';
    case 'dinner':
      return '#10b981';
    case 'snack':
      return '#f97316';
    case 'dessert':
      return '#ec4899';
    default:
      return '#10b981';
  }
}

function getTierLabel(tier?: FoodTier): string {
  switch (tier) {
    case 'basic':
      return '🥉 Basic';
    case 'medium':
      return '🥈 Medium';
    case 'premium':
      return '🥇 Premium';
    default:
      return '';
  }
}

function getTierBadgeBg(tier?: FoodTier): string {
  switch (tier) {
    case 'basic':
      return 'rgba(16, 185, 129, 0.85)';
    case 'medium':
      return 'rgba(59, 130, 246, 0.85)';
    case 'premium':
      return 'rgba(217, 119, 6, 0.9)';
    default:
      return 'rgba(0, 0, 0, 0.6)';
  }
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Luni',
  tuesday: 'Marți',
  wednesday: 'Miercuri',
  thursday: 'Joi',
  friday: 'Vineri',
  saturday: 'Sâmbătă',
  sunday: 'Duminică',
};

const MOOD_LABELS: Record<string, string> = {
  speedy: '⚡ Rapid',
  low_calorie: '🥗 Low Calorie',
  family_fav: '❤️ Favorit Familie',
  healthy_comfort: '🍲 Comfort Food',
  fakeaway: '🍟 Fakeaway',
  high_protein: '💪 Proteic',
  romanian_classic: '🇷🇴 Tradițional',
};

export const MealCard: React.FC<MealCardProps> = ({
  day,
  meal,
  slotLabel,
  onPressRecipe,
  onSwapMeal,
  onRemoveMeal,
  isDark,
}) => {
  const recipe = meal ? meal.recipe : day.recipe;
  const costRon = meal ? meal.estimatedCostRon : day.estimatedCostRon;
  const servings = meal ? meal.servings : day.servings;
  const effectiveSlotLabel = slotLabel || meal?.slotLabelRo;

  const primaryMood = recipe.moodTags[0]
    ? MOOD_LABELS[recipe.moodTags[0]] ?? recipe.moodTags[0]
    : 'Delicios';

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const theme = {
    card: isDark ? '#131d31' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    primary: '#10b981',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ecfdf5',
    glassBg: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
    accentBg: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
    shadowColor: isDark ? '#000000' : '#0f172a',
  };

  const totalCookingTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
  const localAsset = LOCAL_RECIPE_IMAGES[recipe.id];
  const imageSource: ImageSourcePropType = localAsset
    ? localAsset
    : recipe.imageUrl
    ? { uri: recipe.imageUrl }
    : { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onPressRecipe}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            shadowColor: theme.shadowColor,
          },
        ]}
      >
        {/* Visual Hero Image Container */}
        <View style={styles.imageContainer}>
          <Image source={imageSource} style={styles.image} resizeMode="cover" />

          {/* Smooth Bottom Gradient for Contrast */}
          <LinearGradient
            colors={['transparent', isDark ? 'rgba(19, 29, 49, 0.95)' : 'rgba(0, 0, 0, 0.6)']}
            style={styles.gradientOverlay}
          />

          {/* Floating Day Badge (Top-Left) */}
          <View style={[styles.floatingBadge, styles.dayBadge, { backgroundColor: theme.glassBg }]}>
            <Text style={[styles.dayBadgeText, { color: getSlotColor(meal?.slot) }]}>
              {DAY_LABELS[day.dayOfWeek].toUpperCase()}
              {effectiveSlotLabel ? ` • ${effectiveSlotLabel.toUpperCase()}` : ''}
            </Text>
          </View>

          {/* Floating Price Badge (Top-Right) */}
          <View style={[styles.floatingBadge, styles.priceBadge, { backgroundColor: theme.glassBg }]}>
            <Text style={styles.priceBadgeText}>~{costRon} lei</Text>
            <Text style={[styles.priceSubText, { color: theme.textMuted }]}>/ porție</Text>
          </View>

          {/* Bottom Info Floating on Image */}
          <View style={styles.imageBottomRow}>
            {recipe.tier && (
              <View style={[styles.pillBadge, { backgroundColor: getTierBadgeBg(recipe.tier) }]}>
                <Text style={styles.pillText}>{getTierLabel(recipe.tier)}</Text>
              </View>
            )}
            {Boolean(localAsset) && (
              <View style={[styles.pillBadge, { backgroundColor: 'rgba(99, 102, 241, 0.85)' }]}>
                <Text style={styles.pillText}>✨ AI Studio</Text>
              </View>
            )}
            <View style={[styles.pillBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <Text style={styles.pillText}>{primaryMood}</Text>
            </View>
            <View style={[styles.pillBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <Text style={styles.pillText}>⏱️ {totalCookingTime} min</Text>
            </View>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {recipe.title}
          </Text>

          <Text style={[styles.description, { color: theme.textMuted }]} numberOfLines={2}>
            {recipe.description}
          </Text>

          {/* Macro Mini-Grid */}
          <View style={[styles.macroRow, { backgroundColor: theme.accentBg, borderColor: theme.border }]}>
            <View style={styles.macroCol}>
              <Text style={[styles.macroVal, { color: theme.text }]}>
                {recipe.nutritionPerServing.calories}
              </Text>
              <Text style={[styles.macroLbl, { color: theme.textMuted }]}>kcal</Text>
            </View>
            <View style={styles.macroDivider} />

            <View style={styles.macroCol}>
              <Text style={[styles.macroVal, { color: '#38bdf8' }]}>
                {recipe.nutritionPerServing.proteinGrams}g
              </Text>
              <Text style={[styles.macroLbl, { color: theme.textMuted }]}>proteină</Text>
            </View>
            <View style={styles.macroDivider} />

            <View style={styles.macroCol}>
              <Text style={[styles.macroVal, { color: '#fbbf24' }]}>
                {recipe.nutritionPerServing.carbsGrams}g
              </Text>
              <Text style={[styles.macroLbl, { color: theme.textMuted }]}>carbo</Text>
            </View>
            <View style={styles.macroDivider} />

            <View style={styles.macroCol}>
              <Text style={[styles.macroVal, { color: '#f87171' }]}>
                {recipe.nutritionPerServing.fatGrams}g
              </Text>
              <Text style={[styles.macroLbl, { color: theme.textMuted }]}>grăsimi</Text>
            </View>
          </View>

          {/* Footer Action Bar */}
          <View style={styles.footerRow}>
            <View style={styles.servingsIndicator}>
              <Text style={[styles.servingsText, { color: theme.textMuted }]}>
                👥 {servings} {servings === 1 ? 'porție' : 'porții'}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              {onRemoveMeal && (
                <TouchableOpacity
                  onPress={onRemoveMeal}
                  style={[
                    styles.removeBtn,
                    { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2' },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.removeBtnText, { color: '#ef4444' }]}>✕</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={onSwapMeal}
                style={[styles.swapBtn, { backgroundColor: theme.accentBg, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.swapBtnText, { color: theme.text }]}>🔄 Schimbă</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onPressRecipe}
                style={[styles.viewBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.7}
              >
                <Text style={styles.viewBtnText}>Vezi Rețeta →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: 190,
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  floatingBadge: {
    position: 'absolute',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dayBadge: {
    top: 14,
    left: 14,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  priceBadge: {
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceBadgeText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '900',
  },
  priceSubText: {
    fontSize: 10,
    fontWeight: '600',
  },
  imageBottomRow: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    gap: 8,
  },
  pillBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  contentBody: {
    padding: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
    lineHeight: 24,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  macroCol: {
    alignItems: 'center',
  },
  macroVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  macroLbl: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  macroDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servingsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swapBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  swapBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  removeBtn: {
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  viewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  viewBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
