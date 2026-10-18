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
import { getHealthGoalMeta } from '../data/healthTags';

interface MealCardProps {
  day: MealPlanDay;
  meal?: PlannedMeal;
  slotLabel?: string;
  onPressRecipe: () => void;
  onSwapMeal: () => void;
  onRemoveMeal?: () => void;
  onToggleEatOut?: () => void;
  /** Cook a double portion here and reheat it the next day. Absent when there is no next day. */
  onCookDouble?: () => void;
  /** Turn a reheated day back into a meal of its own. */
  onUndoCookDouble?: () => void;
  onChangeServings?: (servings: number) => void;
  isDark: boolean;
}

function getSlotColor(slot?: MealSlot, isDark: boolean = true): string {
  switch (slot) {
    case 'breakfast':
      return '#f59e0b';
    case 'lunch':
      return isDark ? '#88B27A' : '#4E7A40';
    case 'dinner':
      return isDark ? '#E6A756' : '#C88232';
    case 'snack':
      return '#ff9f0a';
    case 'dessert':
      return isDark ? '#F3C06D' : '#D98E3A';
    default:
      return isDark ? '#E6A756' : '#C88232';
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

function getTierBadgeStyle(tier?: FoodTier, isDark: boolean = true): { bg: string; text: string } {
  switch (tier) {
    case 'basic':
      return {
        bg: isDark ? 'rgba(245, 239, 235, 0.12)' : 'rgba(42, 32, 26, 0.08)',
        text: isDark ? '#F5EFEB' : '#2A201A',
      };
    case 'medium':
      return {
        bg: isDark ? 'rgba(230, 167, 86, 0.22)' : 'rgba(217, 142, 58, 0.18)',
        text: isDark ? '#F3C06D' : '#C88232',
      };
    case 'premium':
      return {
        bg: isDark ? '#E6A756' : '#C88232',
        text: '#131914',
      };
    default:
      return {
        bg: isDark ? 'rgba(245, 239, 235, 0.12)' : 'rgba(42, 32, 26, 0.08)',
        text: isDark ? '#F5EFEB' : '#2A201A',
      };
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
  onCookDouble,
  onUndoCookDouble,
  onChangeServings,
  onToggleEatOut,
  isDark,
}) => {
  const recipe = meal ? meal.recipe : day.recipe;
  const costRon = meal ? meal.estimatedCostRon : day.estimatedCostRon;
  const servings = meal ? meal.servings : day.servings;
  const portionCost = servings > 0 ? Math.round((costRon / servings) * 100) / 100 : costRon;
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

  if (meal?.isEatenOut) {
    return (
      <View
        {...glass('card')}
        style={[
          styles.card,
          styles.eatenOutCard,
          {
            backgroundColor: isDark ? 'rgba(24, 24, 27, 0.75)' : 'rgba(249, 250, 251, 0.9)',
            borderColor: isDark ? 'rgba(234, 179, 8, 0.35)' : '#fef08a',
            borderStyle: 'dashed',
          },
        ]}
      >
        <View style={styles.eatenOutHeader}>
          <View style={[styles.floatingBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <Text style={[styles.dayBadgeText, { color: theme.textMuted }]}>
              {DAY_LABELS[day.dayOfWeek].toUpperCase()} • {effectiveSlotLabel ? effectiveSlotLabel.toUpperCase() : 'MASĂ'}
            </Text>
          </View>
          <View style={[styles.pillBadge, { backgroundColor: isDark ? 'rgba(234, 179, 8, 0.2)' : '#fef9c3', borderColor: isDark ? '#ca8a04' : '#eab308' }]}>
            <Text style={[styles.pillText, { color: isDark ? '#facc15' : '#854d0e', fontWeight: '800' }]}>
              🍽️ MÂNCAT ÎN ORAȘ
            </Text>
          </View>
        </View>

        <View style={styles.eatenOutBody}>
          <View style={[styles.eatenOutIconCircle, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' }]}>
            <Text style={styles.eatenOutIconText}>🍽️</Text>
          </View>
          <Text style={[styles.eatenOutTitle, { color: theme.text }]}>Mâncat în oraș</Text>
          <Text style={[styles.eatenOutSubtitle, { color: theme.textMuted }]}>
            Nu gătești acasă pentru această masă. Ingredientele au fost scoase automat din lista de cumpărături.
          </Text>
          <Text style={[styles.eatenOutOriginalRef, { color: theme.textMuted }]}>
            Rețetă inițială: <Text style={{ fontWeight: '700', color: theme.text }}>{recipe.title}</Text>
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
            style={[styles.viewOriginalBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.viewOriginalBtnText, { color: theme.text }]}>
              Detalii rețetă →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const totalCookingTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  const isDessert = meal?.slot === 'dessert';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%', flex: 1, height: '100%' }}>
      {/* A container, not a button. The whole card used to be one button with five buttons
          inside it: VoiceOver read it as a single element, so the portion stepper, "cook
          double" and "Schimbă" were out of reach, and on the web it was invalid HTML. The
          picture now opens the recipe, as does "Vezi Rețeta" below. */}
      <View
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
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${recipe.title}. Vezi rețeta.`}
          activeOpacity={0.92}
          onPress={onPressRecipe}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.imageContainer}
        >
          <RecipeVisual recipe={recipe} isDark={isDark} style={styles.image} />

          {/* Smooth Bottom Gradient for Contrast */}
          <LinearGradient
            colors={['transparent', isDark ? 'rgba(0, 0, 0, 0.88)' : 'rgba(0, 0, 0, 0.6)']}
            style={styles.gradientOverlay}
          />

          {/* Floating Day Badge (Top-Left) */}
          <View style={[styles.floatingBadge, styles.dayBadge, { backgroundColor: isDark ? 'rgba(28, 36, 30, 0.92)' : 'rgba(255, 255, 255, 0.94)' }]}>
            <Text style={[styles.dayBadgeText, { color: getSlotColor(meal?.slot, isDark) }]} numberOfLines={1}>
              {isDessert
                ? '🍰 DESERT'
                : `${DAY_LABELS[day.dayOfWeek].toUpperCase()}${effectiveSlotLabel ? ` • ${effectiveSlotLabel.toUpperCase()}` : ''}`}
            </Text>
          </View>

          {/* Floating Price Badge (Top-Right) */}
          <View
            style={[
              styles.floatingBadge,
              styles.priceBadge,
              { backgroundColor: isDark ? 'rgba(28, 36, 30, 0.92)' : 'rgba(255, 255, 255, 0.94)' },
            ]}
          >
            <Text style={[styles.priceBadgeText, { color: theme.primary }]} numberOfLines={1}>~{costRon} lei</Text>
            <Text style={[styles.priceSubText, { color: theme.textMuted }]} numberOfLines={1}>
              {servings > 1 ? `total • ~${portionCost.toFixed(2)}/p` : '/ porție'}
            </Text>
          </View>

          {/* Bottom Info Floating on Image */}
        </TouchableOpacity>

        {/* Content Body */}
        <View style={styles.contentBody}>
          {/* Under the picture, not on it. Laid over the image, four chips did not fit a
              phone's width: the row ran off the edge, and allowed to wrap, its second line
              covered the ingredient line. Here the row wraps into space of its own. Time first,
              as the thing people look for. */}
          <View style={styles.chipsRow}>
            <View style={[styles.pillBadge, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
              <Text style={[styles.pillText, { color: theme.text }]}>⏱️ {totalCookingTime} min</Text>
            </View>
            {recipe.tier && (() => {
              const tierStyle = getTierBadgeStyle(recipe.tier, isDark);
              return (
                <View style={[styles.pillBadge, { backgroundColor: tierStyle.bg }]}>
                  <Text style={[styles.pillText, { color: tierStyle.text }]}>{getTierLabel(recipe.tier)}</Text>
                </View>
              );
            })()}
            {recipe.storeBadgeLabel && (
              <View style={[styles.pillBadge, { backgroundColor: getStoreBadgeBg(recipe.storeSignature) }]}>
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
                  <Text style={[styles.pillText, { color: isDark ? '#4ade80' : '#15803d', fontWeight: '800' }]}>
                    {meta.icon} {meta.shortBadgeRo}
                  </Text>
                </View>
              );
            })()}
          </View>

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
              <Text style={[styles.macroLbl, { color: theme.textMuted }]}>kcal/p</Text>
            </View>
            <View style={styles.macroDivider} />

            <View style={styles.macroCol}>
              <Text style={[styles.macroVal, { color: '#38bdf8' }]}>
                {recipe.nutritionPerServing.proteinGrams}g
              </Text>
              <Text style={[styles.macroLbl, { color: theme.textMuted }]}>proteină/p</Text>
            </View>
            <View style={styles.macroDivider} />

            <View style={styles.macroCol}>
              <Text style={[styles.macroVal, { color: '#fbbf24' }]}>
                {recipe.nutritionPerServing.carbsGrams}g
              </Text>
              <Text style={[styles.macroLbl, { color: theme.textMuted }]}>carbo/p</Text>
            </View>
            <View style={styles.macroDivider} />

            <View style={styles.macroCol}>
              <Text style={[styles.macroVal, { color: '#f87171' }]}>
                {recipe.nutritionPerServing.fatGrams}g
              </Text>
              <Text style={[styles.macroLbl, { color: theme.textMuted }]}>grăsimi/p</Text>
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

            {/* Cheapest suggestion the planner can make, so it sits with the other actions */}
            {meal?.isLeftover ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Gătesc din nou în ziua asta"
                onPress={onUndoCookDouble}
                style={[
                  styles.leftoverBtn,
                  {
                    borderColor: isDark ? 'rgba(52, 211, 153, 0.45)' : '#a7f3d0',
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text style={[styles.leftoverBtnText, { color: isDark ? '#34d399' : '#059669' }]}>
                  ♻️ Reîncălzit din ziua de dinainte · gătesc din nou
                </Text>
              </TouchableOpacity>
            ) : (
              onCookDouble && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Gătesc porție dublă și reîncălzesc mâine"
                  onPress={onCookDouble}
                  style={[styles.leftoverBtn, { borderColor: theme.border, backgroundColor: theme.accentBg }]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.leftoverBtnText, { color: theme.textMuted }]}>
                    ♻️ Gătesc dublu · mâine doar reîncălzesc
                  </Text>
                </TouchableOpacity>
              )
            )}

            {/* Main Action Buttons: Perfectly sized, zero cutoff */}
            <View style={styles.actionButtonsRow}>
              {/* A reheated portion belongs to the day it was cooked on; the store refuses
                  to swap it, so offering the button would only be a dead tap. */}
              {!meal?.isLeftover && (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={onSwapMeal}
                  style={[styles.swapBtn, { backgroundColor: theme.accentBg, borderColor: theme.border }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.swapBtnText, { color: theme.text }]}>🔄 Schimbă</Text>
                </TouchableOpacity>
              )}

              {onToggleEatOut && !meal?.isLeftover && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Mănânc în oraș la această masă"
                  onPress={onToggleEatOut}
                  style={[styles.eatOutBtn, { backgroundColor: theme.accentBg, borderColor: theme.border }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.swapBtnText, { color: theme.text }]}>🍽️ În oraș</Text>
                </TouchableOpacity>
              )}

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
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  leftoverBtn: {
    borderWidth: 1,
    borderRadius: 11,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  leftoverBtnText: { fontSize: 11, fontWeight: '700' },
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
    backgroundColor: '#1C241E',
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
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  dayBadge: {
    top: 12,
    left: 12,
    maxWidth: '48%',
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  priceBadge: {
    top: 12,
    right: 12,
    maxWidth: '48%',
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  pillBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    borderRadius: 12,
    paddingHorizontal: 4,
    minHeight: 34,
  },
  servingsStepBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
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
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  swapBtn: {
    flex: 1,
    minWidth: 85,
    minHeight: 44,
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
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    minWidth: 100,
    minHeight: 44,
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
  eatOutBtn: {
    flex: 1,
    minWidth: 85,
    minHeight: 44,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eatenOutCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    minHeight: 280,
    justifyContent: 'space-between',
  },
  eatenOutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  eatenOutBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: '100%',
  },
  eatenOutIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  eatenOutIconText: {
    fontSize: 32,
  },
  eatenOutTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  eatenOutSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  eatenOutOriginalRef: {
    fontSize: 12,
    textAlign: 'center',
  },
  eatenOutActionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 14,
  },
  revertEatOutBtn: {
    flex: 1.2,
    minHeight: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  revertEatOutBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  viewOriginalBtn: {
    flex: 1.4,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  viewOriginalBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
