import React, { useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DayOfWeek, FoodTier, MealPlanDay, MealSlot, PlannedMeal, SupermarketId } from '../types';
import { RecipeVisual } from './RecipeVisual';

import { getAppTheme } from '../styles/theme';
import { glass } from '../styles/glass';

interface MealCardProps {
  day: MealPlanDay;
  meal?: PlannedMeal;
  slotLabel?: string;
  onPressRecipe: () => void;
  onSwapMeal: () => void;
  onRemoveMeal?: () => void;
  onChangeServings?: (servings: number) => void;
  isDark: boolean;
}

function getSlotColor(slot?: MealSlot, isDark: boolean = true): string {
  switch (slot) {
    case 'breakfast':
      return '#f59e0b';
    case 'lunch':
      return '#0a84ff';
    case 'dinner':
      return isDark ? '#ffffff' : '#000000';
    case 'snack':
      return '#ff9f0a';
    case 'dessert':
      return '#ff375f';
    default:
      return isDark ? '#ffffff' : '#000000';
  }
}

function getStoreBadgeBg(store?: SupermarketId): string {
  switch (store) {
    case 'carrefour':
      return 'rgba(2, 132, 199, 0.9)';
    case 'kaufland':
      return 'rgba(220, 38, 38, 0.9)';
    case 'mega_image':
      return 'rgba(147, 51, 234, 0.9)';
    case 'lidl':
      return 'rgba(217, 119, 6, 0.9)';
    case 'auchan':
      return 'rgba(225, 29, 72, 0.9)';
    case 'penny':
      return 'rgba(185, 28, 28, 0.9)';
    case 'profi':
      return 'rgba(234, 88, 12, 0.9)';
    case 'sezamo':
      return 'rgba(21, 128, 61, 0.9)';
    default:
      return 'rgba(255, 255, 255, 0.2)';
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
      return 'rgba(255, 255, 255, 0.2)';
    case 'medium':
      return 'rgba(10, 132, 255, 0.85)';
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
  soups_stews: '🍲 Ciorbe & Supe',
  pasta_italian: '🍝 Paste Italiene',
  grill_meat: '🥩 Grătar & Fripturi',
  spicy_fiesta: '🌶️ Spicy & Aromat',
  light_dinner: '🌙 Cină Ușoară',
  fresh_salad: '🥗 Salate Fresh',
  sweet_treat: '🍰 Deserturi',
};

export const MealCard: React.FC<MealCardProps> = ({
  day,
  meal,
  slotLabel,
  onPressRecipe,
  onSwapMeal,
  onRemoveMeal,
  onChangeServings,
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

  const theme = getAppTheme(isDark);

  const totalCookingTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  const isDessert = meal?.slot === 'dessert';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%', flex: 1, height: '100%' }}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${recipe.title}. Vezi rețeta.`}
        activeOpacity={0.92}
        onPress={onPressRecipe}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...glass('card')}
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: isDessert ? (isDark ? 'rgba(236, 72, 153, 0.45)' : '#fbcfe8') : theme.border,
            shadowColor: '#000000',
            flex: 1,
            height: '100%',
            marginBottom: 0,
          },
        ]}
      >
        {/* Visual Hero Image Container */}
        <View style={styles.imageContainer}>
          <RecipeVisual recipe={recipe} isDark={isDark} style={styles.image} />

          {/* Smooth Bottom Gradient for Contrast */}
          <LinearGradient
            colors={['transparent', isDark ? 'rgba(0, 0, 0, 0.88)' : 'rgba(0, 0, 0, 0.6)']}
            style={styles.gradientOverlay}
          />

          {/* Floating Day Badge (Top-Left) */}
          <View style={[styles.floatingBadge, styles.dayBadge, { backgroundColor: isDark ? 'rgba(28, 28, 30, 0.90)' : 'rgba(255, 255, 255, 0.92)' }]}>
            <Text style={[styles.dayBadgeText, { color: getSlotColor(meal?.slot, isDark) }]}>
              {isDessert
                ? '🍰 DESERT DE CASĂ'
                : `${DAY_LABELS[day.dayOfWeek].toUpperCase()}${effectiveSlotLabel ? ` • ${effectiveSlotLabel.toUpperCase()}` : ''}`}
            </Text>
          </View>

          {/* Floating Price Badge (Top-Right) */}
          <View style={[styles.floatingBadge, styles.priceBadge, { backgroundColor: isDark ? 'rgba(28, 28, 30, 0.90)' : 'rgba(255, 255, 255, 0.92)' }]}>
            <Text style={[styles.priceBadgeText, { color: theme.primary }]}>~{costRon} lei</Text>
            <Text style={[styles.priceSubText, { color: theme.textMuted }]}>/ porție</Text>
          </View>

          {/* Bottom Info Floating on Image */}
          <View style={styles.imageBottomRow}>
            {recipe.tier && (
              <View style={[styles.pillBadge, { backgroundColor: getTierBadgeBg(recipe.tier) }]}>
                <Text style={styles.pillText}>{getTierLabel(recipe.tier)}</Text>
              </View>
            )}
            {recipe.storeBadgeLabel && (
              <View style={[styles.pillBadge, { backgroundColor: getStoreBadgeBg(recipe.storeSignature) }]}>
                <Text style={styles.pillText}>{recipe.storeBadgeLabel}</Text>
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
          {/* The dish name is set over the visual just above; repeating it here said the
              same thing twice in the space of two lines. */}
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
          <View style={styles.footerContainer}>
            {/* Servings Meta Row & Optional Remove Button */}
            <View style={styles.footerMetaRow}>
              {onChangeServings ? (
                <View style={[styles.servingsStepper, { borderColor: theme.border }]}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Scade o porție"
                    onPress={() => onChangeServings(servings - 1)}
                    disabled={servings <= 1}
                    style={styles.servingsStepBtn}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.servingsStepText, { color: servings <= 1 ? theme.border : theme.text }]}>
                      −
                    </Text>
                  </TouchableOpacity>

                  <Text
                    accessibilityLabel={`${servings} ${servings === 1 ? 'porție' : 'porții'}`}
                    style={[styles.servingsText, { color: theme.textMuted }]}
                  >
                    👥 {servings}
                  </Text>

                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Adaugă o porție"
                    onPress={() => onChangeServings(servings + 1)}
                    disabled={servings >= 12}
                    style={styles.servingsStepBtn}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.servingsStepText, { color: servings >= 12 ? theme.border : theme.text }]}>
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.servingsIndicator}>
                  <Text style={[styles.servingsText, { color: theme.textMuted }]}>
                    👥 {servings} {servings === 1 ? 'porție' : 'porții'}
                  </Text>
                </View>
              )}

              {onRemoveMeal && (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={onRemoveMeal}
                  style={[
                    styles.removeBtn,
                    { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#fee2e2' },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.removeBtnText, { color: '#ef4444' }]}>✕ Șterge desert</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Main Action Buttons: Perfectly sized, zero cutoff */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onSwapMeal}
                style={[styles.swapBtn, { backgroundColor: theme.accentBg, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.swapBtnText, { color: theme.text }]}>🔄 Schimbă</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                onPress={onPressRecipe}
                style={[styles.viewBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.viewBtnText, { color: theme.primaryText }]}>Vezi Rețeta →</Text>
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
    // A fixed height let the hero stretch with the window: on a desktop browser the card is
    // over 1300px wide, so 190px tall made every dish a ~7:1 strip through the middle of the
    // photograph -- unreadable whatever the picture was. Holding the shape instead keeps the
    // dish legible at any width. The floor matches the old phone height, so phones are
    // unchanged; the ceiling stops the hero swallowing the screen on a wide monitor.
    aspectRatio: 2.85,
    minHeight: 190,
    maxHeight: 380,
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
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
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
  footerContainer: {
    gap: 8,
    marginTop: 8,
  },
  footerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 24,
  },
  servingsStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  servingsStepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  servingsStepText: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  servingsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  swapBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  removeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  viewBtn: {
    flex: 1.3,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
