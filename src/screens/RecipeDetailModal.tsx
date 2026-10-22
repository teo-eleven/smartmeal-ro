import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SUPERMARKETS } from '../data/supermarkets';
import { LinearGradient } from 'expo-linear-gradient';
import { Appliance, DayOfWeek, MealSlot, Recipe, SupermarketId } from '../types';
import { INGREDIENTS } from '../data/ingredients';
import { MacroBar } from '../components/MacroBar';
import { useResponsive } from '../hooks/useResponsive';
import { useAppStore } from '../store/useAppStore';
import { RecipeVisual } from '../components/RecipeVisual';
import { PhotoCreditLine } from '../components/PhotoCreditLine';

import { getAppTheme } from '../styles/theme';
import { getRecipeAllergens } from '../utils/allergenFilter';
import { ALLERGEN_CATALOG } from '../data/allergens';
import { getEligibleRecipes, getEligibleDessertRecipes } from '../engine/plannerEngine';
import { calculateRecipePortionCost } from '../engine/budgetCalculator';
import { formatIngredientWithHousehold } from '../utils/householdUnits';
import { getHealthGoalMeta } from '../data/healthTags';

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

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  servings: number;
  visible: boolean;
  onClose: () => void;
  onSwap: () => void;
  onChangeServings?: (servings: number) => void;
  isDark: boolean;
  targetDay?: DayOfWeek | null;
  targetSlot?: MealSlot | null;
}

const APPLIANCE_MAP: Record<Appliance, { name: string; icon: string }> = {
  hob: { name: 'Plită / Tigaie', icon: '🍳' },
  oven: { name: 'Cuptor', icon: '♨️' },
  air_fryer: { name: 'Air Fryer', icon: '🍟' },
  microwave: { name: 'Microunde', icon: '📻' },
};

function getChefTipsForRecipe(recipe: Recipe): string[] {
  const tips: string[] = [];
  if (recipe.prepTimeMinutes <= 10) {
    tips.push('⚡ Rețetă rapidă: pregătește toate ingredientele pe blat înainte de a aprinde focul (mise en place).');
  }
  if (recipe.appliances.includes('oven')) {
    tips.push('♨️ Preîncălzește cuptorul cu 10-15 minute înainte pentru rumenire aurie și textură crocantă.');
  }
  if (recipe.appliances.includes('hob')) {
    tips.push('🍳 Încinge tigaia bine înainte de a adăuga uleiul pentru a sigila sucurile și aromele.');
  }
  if (recipe.suitableSlots?.includes('dessert')) {
    tips.push('🍰 Lasă desertul să se tempereze 5 minute înainte de servire pentru consistență cremoasă.');
  }
  if (tips.length === 0) {
    tips.push('🧂 Gustă sosul spre final și ajustează sarea și piperul proaspăt măcinat după preferință.');
  }
  tips.push('💡 Păstrează porțiile rămase într-o caserolă etanșă la rece — aromele se întrepătrund excelent până a doua zi.');
  return tips;
}

function getSubstitutionsForRecipe(recipe: Recipe): { original: string; substitute: string }[] {
  const subs: { original: string; substitute: string }[] = [];
  recipe.ingredients.forEach((ing) => {
    if (ing.ingredientId.includes('smantana') || ing.ingredientId.includes('iaurt')) {
      subs.push({ original: 'Smântână / Iaurt', substitute: 'Iaurt grecesc 10% sau cremă vegetală' });
    } else if (ing.ingredientId.includes('unt')) {
      subs.push({ original: 'Unt', substitute: 'Ulei de măsline extravirgin' });
    } else if (ing.ingredientId.includes('piept_pui')) {
      subs.push({ original: 'Piept de pui', substitute: 'Pulpă de pui dezosată sau tofu marinat' });
    } else if (ing.ingredientId.includes('orez')) {
      subs.push({ original: 'Orez', substitute: 'Quinoa sau bulgur' });
    } else if (ing.ingredientId.includes('paste')) {
      subs.push({ original: 'Paste făinoase', substitute: 'Paste integrale sau tăiței de orez' });
    }
  });
  if (subs.length === 0) {
    subs.push({ original: 'Condimente', substitute: 'Boia dulce afumată, oregano uscat sau cimbru după gust' });
  }
  return subs.slice(0, 2);
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  servings: initialServings,
  visible,
  onClose,
  onSwap,
  onChangeServings,
  isDark,
  targetDay,
  targetSlot,
}) => {
  const [personalNotes, setPersonalNotes] = useState('');
  const [activeServings, setActiveServings] = useState(initialServings);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});

  const handleServingsChange = (newServings: number) => {
    const clamped = Math.max(1, Math.min(12, newServings));
    setActiveServings(clamped);
    if (onChangeServings) {
      onChangeServings(clamped);
    }
  };

  const { isDesktop, isTablet, contentMaxWidth } = useResponsive();
  const isWide = isDesktop || isTablet;
  const {
    preferences,
    currentPlan,
    replaceMealWithRecipe,
    toggleFavouriteRecipe,
    toggleDislikedRecipe,
    toggleEatOut,
    showNotice,
  } = useAppStore();

  const targetMeal = useMemo(() => {
    if (!currentPlan || !targetDay) return null;
    const dayPlan = currentPlan.days.find((d) => d.dayOfWeek === targetDay);
    if (!dayPlan) return null;
    return dayPlan.meals.find((m) => (targetSlot ? m.slot === targetSlot : m.recipe.id === recipe?.id));
  }, [currentPlan, targetDay, targetSlot, recipe]);

  const isEatenOut = Boolean(targetMeal?.isEatenOut);

  const suggestedReplacement = useMemo(() => {
    if (!recipe) return null;
    const target = targetSlot || (recipe.suitableSlots && recipe.suitableSlots[0]) || 'dinner';
    const isDessert = target === 'dessert' || Boolean(recipe.suitableSlots?.includes('dessert'));
    const eligible = isDessert
      ? getEligibleDessertRecipes(preferences)
      : getEligibleRecipes(preferences);
    const slotFiltered = isDessert
      ? eligible.filter((r) => r.id !== recipe.id)
      : eligible.filter(
          (r) => r.id !== recipe.id && (r.suitableSlots ? r.suitableSlots.includes(target) : true)
        );
    const baseCandidates =
      slotFiltered.length > 0 ? slotFiltered : eligible.filter((r) => r.id !== recipe.id);

    const usedRecipeIds = new Set<string>();
    if (currentPlan) {
      currentPlan.days.forEach((d) => {
        d.meals?.forEach((m) => usedRecipeIds.add(m.recipe.id));
      });
    }

    const unusedCandidates = baseCandidates.filter((r) => !usedRecipeIds.has(r.id));
    const pool = unusedCandidates.length > 0 ? unusedCandidates : baseCandidates;

    if (pool.length === 0) return null;

    // Prioritize favorites if any
    const favs = pool.filter((r) => (preferences.favouriteRecipeIds ?? []).includes(r.id));
    if (favs.length > 0) return favs[0];

    // Prioritize same tier
    const sameTier = pool.filter((r) => r.tier === recipe.tier);
    if (sameTier.length > 0) return sameTier[0];

    return pool[0];
  }, [recipe, preferences, currentPlan, targetSlot]);

  useEffect(() => {
    setActiveServings(initialServings);
    setCompletedSteps({});
    setCheckedIngredients({});
  }, [initialServings, recipe]);

  if (!recipe) return null;

  const recipeAllergens = getRecipeAllergens(recipe);
  const recipeAllergenLabels = recipeAllergens
    .map((id) => ALLERGEN_CATALOG.find((a) => a.id === id)?.label ?? id)
    .join(', ');

  const appTheme = getAppTheme(isDark);
  const theme = {
    ...appTheme,
    stepDoneBg: isDark ? 'rgba(230, 167, 86, 0.15)' : '#f0fdf4',
    badgeBg: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
    accentCard: isDark ? '#243027' : '#f8fafc',
  };

  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  const isFavourite = (preferences.favouriteRecipeIds ?? []).includes(recipe.id);
  const isDisliked = (preferences.dislikedRecipeIds ?? []).includes(recipe.id);

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const toggleIngredient = (id: string) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const completedStepsCount = Object.values(completedSteps).filter(Boolean).length;
  const totalStepsCount = recipe.steps.length;
  const progressPercent = totalStepsCount > 0 ? Math.round((completedStepsCount / totalStepsCount) * 100) : 0;

  const chefTips = getChefTipsForRecipe(recipe);
  const substitutions = getSubstitutionsForRecipe(recipe);

  // Calculate live dynamic cost
  const estimatedCostPerServing = recipe.ingredients.reduce((acc, ing) => {
    const item = INGREDIENTS[ing.ingredientId];
    if (!item) return acc;
    const unitPrice = (item.typicalPriceRon[preferences.supermarketId] ?? 5) / (item.standardPackSize || 100);
    return acc + unitPrice * ing.amountPerServing;
  }, 0);
  const formattedCostPerServing = Math.max(3.5, Math.round(estimatedCostPerServing * 10) / 10).toFixed(2);
  const formattedTotalCost = (parseFloat(formattedCostPerServing) * activeServings).toFixed(2);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, isWide && styles.modalCardWide, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Floating Top Navigation Header */}
          <View style={[styles.topBar, { backgroundColor: theme.glassBg, borderBottomColor: theme.border }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Închide"
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeIcon, { color: theme.text }]}>✕ Închide</Text>
          </TouchableOpacity>

          <View style={styles.topCenter}>
            <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
              {recipe.title}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.primary }]} numberOfLines={1}>
              ⏱️ {totalTime} min • ~{formattedCostPerServing} lei/porție
            </Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Înlocuiește rețeta"
            onPress={onSwap}
            style={[styles.swapHeaderBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.swapHeaderText, { color: theme.text }]}>🔄 Înlocuiește</Text>
          </TouchableOpacity>

          {targetDay && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={isEatenOut ? 'Gătește acasă' : 'Mănânc în oraș'}
              onPress={() => {
                const effectiveSlot = targetSlot || targetMeal?.slot || 'dinner';
                toggleEatOut(targetDay, effectiveSlot);
                showNotice(
                  isEatenOut ? 'Gătești acasă' : 'Mâncat în oraș',
                  isEatenOut
                    ? `Am reintrodus masa în planul de gătit și în lista de cumpărături.`
                    : `Am marcat masa ca mâncată în oraș. Ingredientele au fost scoase din lista de cumpărături.`,
                  'info'
                );
              }}
              style={[
                styles.swapHeaderBtn,
                {
                  backgroundColor: isEatenOut
                    ? (isDark ? 'rgba(234, 179, 8, 0.2)' : '#fef9c3')
                    : theme.btnBg,
                  borderColor: isEatenOut
                    ? (isDark ? '#ca8a04' : '#eab308')
                    : theme.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.swapHeaderText,
                  { color: isEatenOut ? (isDark ? '#facc15' : '#854d0e') : theme.text },
                ]}
              >
                {isEatenOut ? '↺ Acasă' : '🍽️ În oraș'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.mainLayoutWrapper, isWide && styles.mainLayoutWrapperWide, { maxWidth: Math.min(contentMaxWidth, 1440) }]}>
            
            {/* ============================================================ */}
            {/* LEFT COLUMN: HERO IMAGE, STATS, MACROS & INGREDIENTS         */}
            {/* ============================================================ */}
            <View style={[styles.leftColumn, isWide && styles.leftColumnWide]}>
              
              {/* Hero Image Card */}
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
                    <Text style={styles.heroPillText}>🔥 {recipe.nutritionPerServing.calories} kcal/porție</Text>
                  </View>
                  {recipe.tier && (
                    <View style={[styles.heroPill, { backgroundColor: 'rgba(255, 255, 255, 0.18)' }]}>
                      <Text style={styles.heroPillText}>
                        {recipe.tier === 'basic' ? '🥉 Basic' : recipe.tier === 'medium' ? '🥈 Medium' : '🥇 Premium'}
                      </Text>
                    </View>
                  )}
                  {recipe.storeBadgeLabel && (
                    <View style={[styles.heroPill, { backgroundColor: getStoreBadgeBg(recipe.storeSignature) }]}>
                      <Text style={styles.heroPillText}>{recipe.storeBadgeLabel}</Text>
                    </View>
                  )}
                </View>
              </View>
              <PhotoCreditLine recipe={recipe} color={theme.textMuted} />

              {/* Title & Description */}
              <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.title, { color: theme.text }]}>{recipe.title}</Text>
                <Text style={[styles.description, { color: theme.textMuted }]}>{recipe.description}</Text>

                {/* Health & Wellness Badges Strip */}
                {recipe.healthTags && recipe.healthTags.filter((t) => t !== 'pork_free').length > 0 && (
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
                                backgroundColor: isDark ? 'rgba(52, 199, 89, 0.15)' : '#e8f5e9',
                                borderColor: isDark ? 'rgba(52, 199, 89, 0.35)' : '#a5d6a7',
                              },
                            ]}
                          >
                            <Text style={styles.healthTagIcon}>{meta.icon}</Text>
                            <Text style={[styles.healthTagText, { color: isDark ? '#4ade80' : '#2e7d32' }]}>
                              {meta.shortBadgeRo}
                            </Text>
                          </View>
                        );
                      })}
                  </View>
                )}

                {/* Price transparent indicator */}
                <View style={[styles.priceBox, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
                  {/* flex: 1 lets the text wrap. Without it the block kept its full width and
                      pushed the price itself off the card on a 360 px phone. */}
                  <View style={styles.rowText}>
                    <Text style={[styles.priceBoxLabel, { color: theme.primary }]}>COST TOTAL ESTIMAT ({activeServings} PORȚII)</Text>
                    <Text style={[styles.priceBoxSub, { color: theme.textMuted }]}>
                      Prețuri estimate la {SUPERMARKETS[preferences.supermarketId]?.name ?? preferences.supermarketId}
                      {recipe.availableSupermarkets && recipe.availableSupermarkets.length > 0
                        ? ` • Doar la: ${recipe.availableSupermarkets.map((s) => SUPERMARKETS[s]?.name ?? s).join(', ')}`
                        : ' • Disponibil în toate magazinele'}
                    </Text>
                  </View>
                  <Text style={[styles.priceBoxValue, { color: theme.primary }]}>~{formattedTotalCost} LEI</Text>
                </View>
              </View>

              {/* Servings Stepper */}
              <View style={[styles.stepperCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.rowText}>
                  <Text style={[styles.stepperLabel, { color: theme.text }]}>Porții calculate</Text>
                  <Text style={[styles.stepperSubtext, { color: theme.primary }]}>
                    Ingredientele se scalează automat
                  </Text>
                </View>

                <View style={styles.stepperControls}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Scade o porție"
                    onPress={() => handleServingsChange(activeServings - 1)}
                    style={[styles.stepBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.stepBtnText, { color: theme.text }]}>−</Text>
                  </TouchableOpacity>

                  <Text style={[styles.servingsCountText, { color: theme.text }]}>
                    {activeServings}
                  </Text>

                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Adaugă o porție"
                    onPress={() => handleServingsChange(activeServings + 1)}
                    style={[styles.stepBtn, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.stepBtnText, { color: theme.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Macro Nutrițional Bento Bar */}
              <View style={[styles.macroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionHeading, { color: theme.text }]}>
                  Valori nutriționale per porție
                </Text>
                <MacroBar nutrition={recipe.nutritionPerServing} isDark={isDark} />
              </View>

              {/* Allergens present in this dish, stated plainly before the ingredient list */}
              {recipeAllergens.length > 0 && (
                <View
                  accessibilityRole="text"
                  accessibilityLabel={`Atenție, conține alergeni: ${recipeAllergenLabels}`}
                  style={[
                    styles.allergenNotice,
                    { backgroundColor: theme.warningBg, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.allergenNoticeText, { color: theme.warningText }]}>
                    ⚠️ Conține: {recipeAllergenLabels}
                  </Text>
                </View>
              )}

              {/* Ingredients Scaled Checklist */}
              <View style={[styles.ingredientsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.ingredientsHeaderRow}>
                  <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 0 }]}>
                    🛒 Ingrediente necesare ({activeServings} {activeServings === 1 ? 'porție' : 'porții'})
                  </Text>
                  <Text style={[styles.ingredientsHint, { color: theme.textMuted }]}>
                    Bifează ce ai acasă
                  </Text>
                </View>

                <View style={[styles.ingredientsList, isWide && styles.ingredientsListWide]}>
                  {recipe.ingredients.map((ing, i) => {
                    const dbIng = INGREDIENTS[ing.ingredientId];
                    const scaledAmount = Math.round(ing.amountPerServing * activeServings * 10) / 10;
                    const isChecked = Boolean(checkedIngredients[ing.ingredientId]);

                    return (
                      <TouchableOpacity
                        accessibilityRole="button"
                        key={ing.ingredientId}
                        onPress={() => toggleIngredient(ing.ingredientId)}
                        activeOpacity={0.7}
                        style={[
                          styles.ingredientRow,
                          isWide && styles.ingredientRowWide,
                          !isWide && i < recipe.ingredients.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                          isWide && { borderColor: theme.border, borderWidth: 1, borderRadius: 12 },
                          isChecked && { backgroundColor: theme.stepDoneBg },
                        ]}
                      >
                        <View
                          style={[
                            styles.ingCheckSquare,
                            {
                              backgroundColor: isChecked ? theme.primary : 'transparent',
                              borderColor: isChecked ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          {isChecked && <Text style={[styles.checkMark, { color: theme.primaryText }]}>✓</Text>}
                        </View>

                        <Text
                          style={[
                            styles.ingredientName,
                            {
                              color: isChecked ? theme.textMuted : theme.text,
                              textDecorationLine: isChecked ? 'line-through' : 'none',
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {dbIng ? dbIng.name : ing.ingredientId}
                        </Text>

                        <View style={[styles.amountBadge, { backgroundColor: theme.inputBg }]}>
                          <Text style={[styles.ingredientAmount, { color: theme.primary }]} numberOfLines={2}>
                            {formatIngredientWithHousehold(ing.ingredientId, scaledAmount, ing.unit)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Actions Section under Ingredients */}
              <View
                style={[
                  styles.cardSection,
                  styles.actionsCardSection,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 12 }]}>
                  ⚡ Opțiuni pentru această masă
                </Text>

                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Schimbă cu alt preparat"
                    onPress={onSwap}
                    style={[
                      styles.actionBtn,
                      styles.swapActionBtn,
                      { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.actionBtnText, { color: theme.primary }]}>
                      🔄 Schimbă cu alt preparat
                    </Text>
                  </TouchableOpacity>

                  {targetDay && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={isEatenOut ? 'Gătește acasă' : 'Mănâncă în oraș'}
                      onPress={() => {
                        const effectiveSlot = targetSlot || targetMeal?.slot || 'dinner';
                        toggleEatOut(targetDay, effectiveSlot);
                        showNotice(
                          isEatenOut ? 'Gătești acasă' : 'Mâncat în oraș',
                          isEatenOut
                            ? `Am reintrodus masa în planul de gătit și în lista de cumpărături.`
                            : `Am marcat masa ca mâncată în oraș. Ingredientele au fost scoase din lista de cumpărături.`,
                          'info'
                        );
                      }}
                      style={[
                        styles.actionBtn,
                        styles.eatOutActionBtn,
                        {
                          backgroundColor: isEatenOut
                            ? (isDark ? 'rgba(234, 179, 8, 0.2)' : '#fef9c3')
                            : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#f3f4f6'),
                          borderColor: isEatenOut
                            ? (isDark ? '#ca8a04' : '#eab308')
                            : theme.border,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: isEatenOut ? (isDark ? '#facc15' : '#854d0e') : theme.text },
                        ]}
                      >
                        {isEatenOut ? '↺ Gătește acasă această masă' : '🍽️ Mâncat în oraș la această masă'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Închide"
                    onPress={onClose}
                    style={[styles.actionBtn, styles.doneActionBtn, { backgroundColor: theme.primary }]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.actionBtnText, { color: theme.primaryText, fontWeight: '800' }]}>
                      ✓ Închide & Înapoi la Meniu
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* ============================================================ */}
            {/* RIGHT COLUMN: PREPARATION STEPS, APPLIANCES, CHEF TIPS & NOTES */}
            {/* ============================================================ */}
            <View style={[styles.rightColumn, isWide && styles.rightColumnWide]}>
              
              {/* Cooking Instructions with interactive progress */}
              <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.stepsHeaderRow}>
                  <View>
                    <Text style={[styles.sectionHeading, { color: theme.text }]}>
                      👨‍🍳 Mod de preparare pas cu pas
                    </Text>
                    <Text style={[styles.stepsSubtitle, { color: theme.textMuted }]}>
                      {completedStepsCount} din {totalStepsCount} pași finalizați ({progressPercent}%)
                    </Text>
                  </View>

                  <View style={[styles.progressBadge, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
                    <Text style={[styles.progressBadgeText, { color: theme.primary }]}>
                      {progressPercent === 100 ? '🎉 Gata de servit!' : `${progressPercent}%`}
                    </Text>
                  </View>
                </View>

                {/* Micro Progress Bar */}
                <View style={[styles.progressTrack, { backgroundColor: theme.inputBg }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressPercent}%`, backgroundColor: theme.primary },
                    ]}
                  />
                </View>

                {/* Steps Cards List */}
                <View style={styles.stepsList}>
                  {recipe.steps.map((step) => {
                    const isDone = Boolean(completedSteps[step.stepNumber]);

                    return (
                      <TouchableOpacity
                        accessibilityRole="button"
                        key={step.stepNumber}
                        activeOpacity={0.8}
                        onPress={() => toggleStep(step.stepNumber)}
                        style={[
                          styles.stepCard,
                          {
                            backgroundColor: isDone ? theme.stepDoneBg : theme.accentCard,
                            borderColor: isDone ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.stepBadge,
                            {
                              backgroundColor: isDone ? theme.primary : theme.primaryLight,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.stepNumberText,
                              { color: isDone ? theme.primaryText : theme.primary },
                            ]}
                          >
                            {isDone ? '✓' : `0${step.stepNumber}`}
                          </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.stepInstruction,
                              {
                                color: theme.text,
                                textDecorationLine: isDone ? 'line-through' : 'none',
                                opacity: isDone ? 0.65 : 1,
                              },
                            ]}
                          >
                            {step.instruction}
                          </Text>
                          <Text style={[styles.stepDonePrompt, { color: isDone ? theme.primary : theme.textMuted }]}>
                            {isDone ? '✓ Pas bifat ca finalizat' : 'Apasă pentru a bifa pasul'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Kitchen Appliances & Equipment */}
              {recipe.appliances && recipe.appliances.length > 0 && (
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
                          style={[styles.appliancePill, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}
                        >
                          <Text style={styles.applianceIcon}>{item.icon}</Text>
                          <Text style={[styles.applianceName, { color: theme.text }]}>{item.name}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Chef's Culinary Tips (Ponturi de la Bucătar) */}
              <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionHeading, { color: theme.text }]}>
                  💡 Ponturile Bucătarului SmartMeal
                </Text>
                <View style={styles.tipsList}>
                  {chefTips.map((tip, idx) => (
                    <View key={idx} style={[styles.tipCard, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
                      <Text style={[styles.tipText, { color: theme.text }]}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Smart Substitutions */}
              {substitutions.length > 0 && (
                <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.sectionHeading, { color: theme.text }]}>
                    🔄 Substituiri & Alternative în caz că-ți lipsește ceva
                  </Text>
                  <View style={styles.subsGrid}>
                    {substitutions.map((sub, idx) => (
                      <View key={idx} style={[styles.subCard, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
                        <Text style={[styles.subOriginal, { color: theme.textMuted }]}>
                          Fără <Text style={{ fontWeight: '700', color: theme.text }}>{sub.original}</Text>?
                        </Text>
                        <Text style={[styles.subReplacement, { color: theme.primary }]}>
                          ➜ Înlocuiește cu: <Text style={{ fontWeight: '700' }}>{sub.substitute}</Text>
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Personal Notes Box */}
              <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionHeading, { color: theme.text }]}>
                  📝 Notițele tale personale pentru această rețetă
                </Text>
                <TextInput
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Ex: Adaugă mai mult ardei iute data viitoare, iese perfect la 200°C..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={3}
                  value={personalNotes}
                  onChangeText={setPersonalNotes}
                />
              </View>

              {/* What the planner should remember about this dish */}
              <View style={styles.verdictRow}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={isFavourite ? 'Scoate de la preferate' : 'Marchează ca preferat'}
                  onPress={() => toggleFavouriteRecipe(recipe.id)}
                  style={[
                    styles.verdictBtn,
                    {
                      borderColor: isFavourite ? '#16a34a' : theme.border,
                      backgroundColor: isFavourite ? 'rgba(22,163,74,0.12)' : theme.btnBg,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.verdictText, { color: isFavourite ? '#16a34a' : theme.textMuted }]}
                  >
                    {isFavourite ? '👍 Îmi place' : '👍 Îmi place'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={isDisliked ? 'Adu rețeta înapoi în propuneri' : 'Nu mai propune rețeta'}
                  onPress={() => toggleDislikedRecipe(recipe.id)}
                  style={[
                    styles.verdictBtn,
                    {
                      borderColor: isDisliked ? '#ef4444' : theme.border,
                      backgroundColor: isDisliked ? 'rgba(239,68,68,0.12)' : theme.btnBg,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.verdictText, { color: isDisliked ? '#ef4444' : theme.textMuted }]}
                  >
                    {isDisliked ? '↩︎ Adu-o înapoi' : '👎 Nu mai propune'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Intelligent Automatic Replacement Suggestion when Disliked */}
              {isDisliked && suggestedReplacement && (
                <View
                  style={[
                    styles.dislikeSuggestionCard,
                    {
                      backgroundColor: isDark ? '#1C241E' : '#f8fafc',
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#fca5a5',
                    },
                  ]}
                >
                  <View style={styles.dislikeSuggestionHeader}>
                    <Text style={styles.dislikeSuggestionBadge}>💡 Sugestie de înlocuire recomandată</Text>
                  </View>
                  <Text style={[styles.dislikeSuggestionSubtext, { color: theme.textMuted }]}>
                    Rețeta „{recipe.title}” a fost exclusă definitiv de pe acest cont. Iată alternativa optimă pentru acest loc:
                  </Text>

                  <View
                    style={[
                      styles.suggestedDishBox,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.suggestedDishHeader}>
                      <Text style={[styles.suggestedDishTitle, { color: theme.text }]}>
                        {suggestedReplacement.title}
                      </Text>
                      {suggestedReplacement.tier && (
                        <View style={[styles.suggestedTierBadge, { backgroundColor: theme.inputBg }]}>
                          <Text style={[styles.suggestedTierText, { color: theme.textMuted }]}>
                            {suggestedReplacement.tier === 'basic'
                              ? '🥉 Basic'
                              : suggestedReplacement.tier === 'medium'
                                ? '🥈 Medium'
                                : '🥇 Premium'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.suggestedDishDesc, { color: theme.textMuted }]} numberOfLines={2}>
                      {suggestedReplacement.description}
                    </Text>

                    <View style={styles.suggestedMetaRow}>
                      <View style={[styles.suggestedMetaPill, { backgroundColor: theme.inputBg }]}>
                        <Text style={[styles.suggestedMetaText, { color: theme.text }]}>
                          ⏱️ {suggestedReplacement.prepTimeMinutes} min
                        </Text>
                      </View>
                      <View style={[styles.suggestedMetaPill, { backgroundColor: theme.inputBg }]}>
                        <Text style={[styles.suggestedMetaText, { color: theme.text }]}>
                          🔥 {suggestedReplacement.nutritionPerServing.calories} kcal
                        </Text>
                      </View>
                      <View style={[styles.suggestedMetaPill, { backgroundColor: theme.primaryLight }]}>
                        <Text style={[styles.suggestedMetaText, { color: theme.primary }]}>
                          💰 ~
                          {Math.round(
                            calculateRecipePortionCost(
                              suggestedReplacement,
                              activeServings,
                              preferences.supermarketId,
                              preferences.excludePantryStaples
                            )
                          )}{' '}
                          lei
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.suggestedActionsColumn}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Înlocuiește cu ${suggestedReplacement.title}`}
                      onPress={() => {
                        if (targetDay) {
                          replaceMealWithRecipe(targetDay, suggestedReplacement, targetSlot || undefined);
                          showNotice(
                            'Rețetă înlocuită',
                            `Am adăugat „${suggestedReplacement.title}” în meniul tău.`,
                            'success'
                          );
                          onClose();
                        } else {
                          onSwap();
                        }
                      }}
                      style={[styles.confirmReplacementBtn, { backgroundColor: '#16a34a' }]}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.confirmReplacementBtnText}>✓ Înlocuiește cu această rețetă</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Alege altceva din catalog"
                      onPress={onSwap}
                      style={[
                        styles.browseCatalogBtn,
                        { backgroundColor: theme.btnBg, borderColor: theme.border },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.browseCatalogBtnText, { color: theme.text }]}>
                        🔄 Alege altceva din catalog
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

          </View>
        </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  modalCardWide: {
    maxWidth: 1140,
    maxHeight: '92%',
  },
  verdictRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  verdictBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  verdictText: { fontSize: 12, fontWeight: '800' },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  closeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeIcon: {
    fontSize: 13,
    fontWeight: '800',
  },
  topCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  swapHeaderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    flexShrink: 0,
  },
  swapHeaderText: {
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  scrollContentWide: {
    alignItems: 'center',
  },
  mainLayoutWrapper: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 20,
  },
  mainLayoutWrapperWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  leftColumn: {
    width: '100%',
    gap: 16,
  },
  leftColumnWide: {
    flex: 1,
    maxWidth: 480,
  },
  rightColumn: {
    width: '100%',
    gap: 16,
  },
  rightColumnWide: {
    flex: 1.4,
  },
  heroCard: {
    width: '100%',
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  heroBadgesRow: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroPill: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  detailsCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 6,
    lineHeight: 28,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  healthTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  healthTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  healthTagIcon: {
    fontSize: 13,
  },
  healthTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rowText: {
    flex: 1,
    paddingRight: 10,
  },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  priceBoxLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  priceBoxSub: {
    fontSize: 11,
    marginTop: 2,
  },
  priceBoxValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  stepperCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  stepperSubtext: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 20,
    fontWeight: '700',
  },
  servingsCountText: {
    fontSize: 18,
    fontWeight: '900',
    minWidth: 24,
    textAlign: 'center',
  },
  macroCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  allergenNotice: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  allergenNoticeText: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  ingredientsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ingredientsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
  },
  ingredientsHint: {
    fontSize: 12,
    fontWeight: '600',
  },
  ingredientsList: {},
  ingredientsListWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  ingredientRowWide: {
    flexBasis: '48%',
    flexGrow: 0,
    width: '48.5%',
    maxWidth: '50%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  ingCheckSquare: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  ingredientName: {
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  amountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
    maxWidth: '52%',
    alignSelf: 'center',
  },
  ingredientAmount: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  cardSection: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  stepsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepsSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  progressBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepsList: {
    gap: 12,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '900',
  },
  stepInstruction: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  stepDonePrompt: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  appliancesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  appliancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  applianceIcon: {
    fontSize: 18,
  },
  applianceName: {
    fontSize: 13,
    fontWeight: '700',
  },
  tipsList: {
    gap: 10,
  },
  tipCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  subsGrid: {
    gap: 10,
  },
  subCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  subOriginal: {
    fontSize: 12,
  },
  subReplacement: {
    fontSize: 13,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  actionsCardSection: {
    marginTop: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  actionBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  swapActionBtn: {},
  eatOutActionBtn: {},
  doneActionBtn: {
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  bigSwapBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigSwapBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  aiVisualCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 14,
    gap: 10,
  },
  aiVisualHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiVisualTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  aiVisualSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  aiVisualPrompt: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  aiIngredientsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  aiIngredientsLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  aiIngredientsList: {
    fontSize: 11,
    fontWeight: '600',
  },
  dislikeSuggestionCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    marginTop: 14,
    gap: 12,
  },
  dislikeSuggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dislikeSuggestionBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ef4444',
  },
  dislikeSuggestionSubtext: {
    fontSize: 12,
    lineHeight: 18,
  },
  suggestedDishBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  suggestedDishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  suggestedDishTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  suggestedTierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  suggestedTierText: {
    fontSize: 11,
    fontWeight: '700',
  },
  suggestedDishDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  suggestedMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  suggestedMetaPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  suggestedMetaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  suggestedActionsColumn: {
    gap: 8,
    marginTop: 4,
  },
  confirmReplacementBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmReplacementBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  browseCatalogBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseCatalogBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
