import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { SUPERMARKET_LIST } from '../../data/supermarkets';
import { DayOfWeek, DietType, FoodTier, MealSlot, SupermarketId } from '../../types';
import { BudgetSlider } from '../../components/BudgetSlider';
import { ApplianceSelector } from '../../components/ApplianceSelector';
import { LinearGradient } from 'expo-linear-gradient';
import { getRetailProductsByCategory, RETAIL_PRODUCTS_MAP } from '../../data/retailProducts';
import { useResponsive } from '../../hooks/useResponsive';
import {
  DIET_OPTIONS_CATALOG,
  areDietsCompatible,
  isBaseDiet,
  isModifierDiet,
} from '../../utils/dietCompatibility';
import { getAppTheme } from '../../styles/theme';
import { glass } from '../../styles/glass';
import { EligibilityMeter } from '../../components/EligibilityMeter';
import { AllergenSelector } from '../../components/AllergenSelector';
import { HEALTH_GOALS_CATALOG } from '../../data/healthTags';
import { PreGenerationSummaryCard } from '../../components/PreGenerationSummaryCard';
import { FoodMoodSwiper } from '../../components/FoodMoodSwiper';
import { DAY_LABELS_RO } from '../../constants/days';
import { USE_NATIVE_DRIVER } from '../../styles/motion';

interface OnboardingWizardProps {
  isDark: boolean;
  onPlanGenerated: () => void;
  /**
   * Opens the account window. Eight steps allows users to sign out or
   * check which account is signed in at any point.
   */
  onOpenAccount?: () => void;
}

interface StepMeta {
  step: number;
  title: string;
  icon: string;
  shortDesc: string;
}

const ONBOARDING_STEPS_META: StepMeta[] = [
  { step: 1, title: 'Dietă', icon: '🥗', shortDesc: 'Restricții & Sănătate' },
  { step: 2, title: 'Pofte', icon: '⚡', shortDesc: 'Stiluri & Vibe' },
  { step: 3, title: 'Persoane', icon: '👥', shortDesc: 'Porții' },
  { step: 4, title: 'Zile & Mese', icon: '🍽️', shortDesc: 'Program & Calitate' },
  { step: 5, title: 'Aparate', icon: '🍳', shortDesc: 'Dotare bucătărie' },
  { step: 6, title: 'Magazin', icon: '🏪', shortDesc: 'Alegere retail' },
  { step: 7, title: 'Ronțăieli', icon: '🍿', shortDesc: 'Snacks & Băuturi' },
  { step: 8, title: 'Buget', icon: '💰', shortDesc: 'Optimizare cost' },
];

const COOKING_DAY_PRESETS: {
  id: string;
  label: string;
  days: DayOfWeek[];
}[] = [
  {
    id: 'all_week',
    label: '🌟 Toată săptămâna (7 zile)',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  },
  {
    id: 'workdays',
    label: '💼 Luni - Vineri (5 zile)',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  },
  {
    id: 'weekend',
    label: '🎉 Weekend (2 zile)',
    days: ['saturday', 'sunday'],
  },
];

const MEAL_MOMENT_OPTIONS: {
  slot: MealSlot;
  title: string;
  icon: string;
  subtitle: string;
}[] = [
  {
    slot: 'breakfast',
    title: 'Mic Dejun',
    icon: '🥞',
    subtitle: 'Omlete pufoase, ouă, iaurt grecesc, terci de ovăz și preparate rapide de dimineață.',
  },
  {
    slot: 'lunch',
    title: 'Prânz',
    icon: '🍲',
    subtitle: 'Ciorbe calde, supe cremă, fripturi fragede cu garnituri și prânzuri consistente.',
  },
  {
    slot: 'dinner',
    title: 'Cină',
    icon: '🍽️',
    subtitle: 'Mâncăruri echilibrate, pește la cuptor, salate bogate și cine savuroase.',
  },
  {
    slot: 'dessert',
    title: 'Desert de Casă',
    icon: '🍰',
    subtitle: 'Papanași tradiționali, lava cake, clătite, budinci catifelate și delicii dulci.',
  },
];

const FOOD_TIER_OPTIONS: {
  id: FoodTier;
  label: string;
  icon: string;
  priceEst: string;
  desc: string;
}[] = [
  {
    id: 'basic',
    label: 'Basic (Economic & Buget)',
    icon: '🥉',
    priceEst: '~8-12 lei / porție',
    desc: 'Ingrediente de bază accesibile: pui, ouă, orez, cartofi, legume de sezon, paste, mămăligă.',
  },
  {
    id: 'medium',
    label: 'Medium (Echilibrat & Familie)',
    icon: '🥈',
    priceEst: '~13-18 lei / porție',
    desc: 'Calitate superioară: piept de pui dezosat, sos bolognese, ciorbe bogate, telemea superioară, iaurt grecesc.',
  },
  {
    id: 'premium',
    label: 'Premium (Gourmet & Răsfăț)',
    icon: '🥇',
    priceEst: '~20-35+ lei / porție',
    desc: 'Ingrediente fine: steak din antricot Black Angus, somon proaspăt, creveți aromați, budinci de chia, lava cake.',
  },
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isDark,
  onPlanGenerated,
  onOpenAccount,
}) => {
  const {
    currentStep,
    maxVisitedStep,
    totalSteps,
    preferences,
    setSupermarket,
    setPeopleCount,
    toggleCookingDay,
    setCookingDays,
    setMealSlots,
    setFoodTier,
    setBudget,
    toggleMoodTag,
    setMoodTags,
    toggleDietType,
    toggleAvoidedAllergen,
    toggleHealthGoalTag,
    setSnackTastePreference,
    toggleAppliance,
    toggleSnackProduct,
    toggleDrinkProduct,
    setIncludeAlcohol,
    nextStep,
    prevStep,
    goToStep,
    generatePlan,
    quickStart,
    setActiveView,
    showNotice,
  } = useAppStore();

  const { isDesktop, isTablet, contentMaxWidth } = useResponsive();
  const isLargeScreen = isDesktop || isTablet;
  const containerMaxWidth = Math.min(contentMaxWidth, 1180);

  const theme = getAppTheme(isDark);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(14);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [currentStep]);

  const extrasCost = useMemo(() => {
    const snackIds = preferences.selectedSnackIds || [];
    const drinkIds = preferences.selectedDrinkIds || [];
    return [...snackIds, ...drinkIds].reduce((sum, id) => {
      const prod = RETAIL_PRODUCTS_MAP[id];
      return sum + (prod?.typicalPriceRon[preferences.supermarketId] ?? 0);
    }, 0);
  }, [preferences.selectedSnackIds, preferences.selectedDrinkIds, preferences.supermarketId]);

  const handleNextOrFinish = () => {
    if (currentStep < totalSteps) {
      nextStep();
    } else {
      try {
        // An impossible combination stays on this step, where the notice explains it and the
        // user can change it. It used to navigate on and leave an empty board spinning.
        if (!generatePlan()) return;
        onPlanGenerated?.();
        setActiveView('generating');
      } catch (err) {
        console.error('[OnboardingWizard] generatePlan error:', err);
        const reason = err instanceof Error ? err.message : 'Nu s-a putut genera planul de mese.';
        showNotice('Eroare Planificare', reason, 'error');
      }
    }
  };

  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <View
      {...glass('root')}
      style={[
        styles.container,
        { backgroundColor: Platform.OS === 'web' ? 'transparent' : theme.background },
      ]}
    >
      {/* Top Header: Stepped Water Flow for Desktop/Tablet, or Compact for Mobile */}
      {isLargeScreen ? (
        <View
          {...glass('card')}
          style={[
            styles.desktopHeader,
            { backgroundColor: theme.card, borderBottomColor: theme.border },
          ]}
        >
          <View style={[styles.desktopHeaderInner, { maxWidth: containerMaxWidth }]}>
            {/* Top Brand & Status Line */}
            <View style={styles.desktopTopRow}>
              <View style={styles.brandGroup}>
                <Text style={[styles.logoText, { color: theme.text }]}>SmartMeal</Text>
                <View
                  style={[
                    styles.brandBadge,
                    {
                      backgroundColor: theme.surfaceTertiary,
                      borderColor: theme.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text style={[styles.brandBadgeText, { color: theme.text }]}>RO 🇷🇴</Text>
                </View>
                {onOpenAccount && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Contul meu"
                    onPress={onOpenAccount}
                    style={[
                      styles.accountBtn,
                      { borderColor: theme.border, backgroundColor: theme.accentBg },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.accountBtnText, { color: theme.text }]}>👤 Cont</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.desktopStepInfo}>
                <Text style={[styles.desktopCurrentStepTitle, { color: theme.text }]}>
                  {ONBOARDING_STEPS_META[currentStep - 1]?.title}
                </Text>
                <Text style={[styles.stepIndicator, { color: theme.textMuted }]}>
                  Pasul {currentStep} din {totalSteps} • {Math.round(progressPercent)}% complet
                </Text>
              </View>

              {currentStep > 1 ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={prevStep}
                  style={[
                    styles.desktopBackBtn,
                    { borderColor: theme.border, backgroundColor: theme.accentBg },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.backButtonText, { color: theme.text }]}>← Înapoi</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 85 }} />
              )}
            </View>

            {/* Stepped Water Flow Nodes Bar ("ca un curs al apei în trepte") */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.waterFlowTrack,
                { minWidth: isDesktop ? '100%' : 860 },
              ]}
            >
              {ONBOARDING_STEPS_META.map((stepItem, idx) => {
                const isCurrent = stepItem.step === currentStep;
                const isCompleted =
                  stepItem.step < currentStep || (stepItem.step <= maxVisitedStep && !isCurrent);
                const isUpcoming = stepItem.step > maxVisitedStep;

                return (
                  <React.Fragment key={stepItem.step}>
                    {idx > 0 && (
                      <View
                        style={[
                          styles.flowStreamLine,
                          {
                            backgroundColor:
                              isCompleted || isCurrent
                                ? theme.primary
                                : theme.border,
                          },
                        ]}
                      >
                        {(isCompleted || isCurrent) && (
                          <LinearGradient
                            colors={isDark ? ['#F3C06D', '#E6A756'] : ['#D98E3A', '#C88232']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                          />
                        )}
                      </View>
                    )}

                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => {
                        if (stepItem.step <= maxVisitedStep) {
                          goToStep(stepItem.step);
                        }
                      }}
                      disabled={isUpcoming}
                      activeOpacity={0.7}
                      style={[
                        styles.stepNode,
                        isCurrent && [
                          styles.stepNodeActive,
                          {
                            borderColor: theme.primary,
                            backgroundColor: theme.primary,
                            shadowColor: '#E6A756',
                          },
                        ],
                        isCompleted && [
                          styles.stepNodeCompleted,
                          { borderColor: theme.border, backgroundColor: theme.surfaceSecondary },
                        ],
                        isUpcoming && [
                          styles.stepNodeUpcoming,
                          { borderColor: theme.border, backgroundColor: theme.accentBg },
                        ],
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepNodeIcon,
                          isCurrent && { color: theme.primaryText },
                          isCompleted && { color: theme.text, fontWeight: '900' },
                        ]}
                      >
                        {isCompleted ? '✓' : stepItem.icon}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.stepNodeLabel,
                          {
                            color: isCurrent
                              ? theme.primaryText
                              : isCompleted
                                ? theme.text
                                : theme.textMuted,
                          },
                          (isCurrent || isCompleted) && { fontWeight: '800' },
                        ]}
                      >
                        {stepItem.title}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </ScrollView>
          </View>
        </View>
      ) : (
        <View
          style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}
        >
          <View style={styles.topRow}>
            {currentStep > 1 ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Înapoi la pasul anterior"
                onPress={prevStep}
                style={styles.backButton}
              >
                <Text style={[styles.backButtonText, { color: theme.text }]}>← Înapoi</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.logoText, { color: theme.text }]}>SmartMeal</Text>
            )}

            <View style={styles.topRowRight}>
              <Text style={[styles.stepIndicator, { color: theme.textMuted }]}>
                Pasul {currentStep} din {totalSteps}
              </Text>
              {onOpenAccount && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Contul meu"
                  onPress={onOpenAccount}
                  style={[
                    styles.accountBtn,
                    { borderColor: theme.border, backgroundColor: theme.accentBg },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.accountBtnText, { color: theme.text }]}>👤 Cont</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <LinearGradient
              colors={isDark ? ['#F3C06D', '#E6A756'] : ['#D98E3A', '#C88232']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBar, { width: `${progressPercent}%` }]}
            />
          </View>
        </View>
      )}

      {/* Step Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={[{ flex: 1 }, Platform.OS === 'web' && ({ scrollbarWidth: 'none', msOverflowStyle: 'none' } as any)]}
      >
        <View
          {...glass('card')}
          style={[
            styles.contentCard,
            { backgroundColor: theme.card, borderColor: theme.border, maxWidth: containerMaxWidth },
          ]}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              width: '100%',
            }}
          >
          {/* STEP 1: DIETARY RESTRICTIONS & HEALTH */}
          {currentStep === 1 &&
            (() => {
              const selectedDiets: DietType[] =
                preferences.dietTypes && preferences.dietTypes.length > 0
                  ? preferences.dietTypes
                  : [preferences.dietType];
              const activeBaseDiet: DietType =
                selectedDiets.find(isBaseDiet) || preferences.dietType || 'omnivore';

              const baseDietOptions = DIET_OPTIONS_CATALOG.filter((d) => isBaseDiet(d.id));
              const modifierDietOptions = DIET_OPTIONS_CATALOG.filter((d) => isModifierDiet(d.id));

              return (
                <View style={styles.stepSection}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Pornire rapidă: generează un plan cu setări implicite"
                onPress={() => {
                  quickStart();
                  if (useAppStore.getState().currentPlan) {
                    onPlanGenerated?.();
                    setActiveView('generating');
                  }
                }}
                {...glass('pill')}
                style={[
                  styles.quickStartCard,
                  { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderStrong },
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.quickStartIcon}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.quickStartTitle, { color: theme.text }]}>
                    Sari peste întrebări
                  </Text>
                  <Text style={[styles.quickStartSubtitle, { color: theme.textMuted }]}>
                    Îți facem un plan pentru 2 persoane, cina, luni–vineri. Schimbi orice după.
                  </Text>
                </View>
                <Text style={[styles.quickStartArrow, { color: theme.text }]}>→</Text>
              </TouchableOpacity>

                  <Text style={[styles.questionTitle, { color: theme.text }]}>
                    Ai preferințe dietetice?
                  </Text>
                  <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                    Alege stilul tău alimentar de bază și adaugă opțional restricții speciale (cum ar fi Fără Gluten sau Low-Carb).
                  </Text>

                  {/* 1. Base Diets Section */}
                  <Text
                    style={[
                      styles.customizeSlotsHeading,
                      { color: theme.textMuted, marginTop: 12, marginBottom: 12 },
                    ]}
                  >
                    Stilul alimentar principal (alege una):
                  </Text>

                  <View style={[styles.dietList, isLargeScreen && styles.dietListDesktop]}>
                    {baseDietOptions.map((diet) => {
                      const isSelected = activeBaseDiet === diet.id;

                      return (
                        <TouchableOpacity
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isSelected }}
                          accessibilityLabel={`${diet.label}, ${diet.desc}`}
                          key={diet.id}
                          onPress={() => toggleDietType(diet.id)}
                          activeOpacity={0.75}
                          style={[
                            styles.dietCard,
                            isLargeScreen && styles.dietCardDesktop,
                            {
                              backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                              borderColor: isSelected ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text style={styles.dietIcon}>{diet.icon}</Text>
                          <View style={styles.dietInfo}>
                            <Text style={[styles.dietLabel, { color: theme.text }]}>
                              {diet.label}
                            </Text>
                            <Text style={[styles.dietDesc, { color: theme.textMuted }]}>
                              {diet.desc}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.dietRadio,
                              {
                                borderColor: isSelected ? theme.primary : theme.border,
                                backgroundColor: isSelected ? theme.primary : 'transparent',
                              },
                            ]}
                          >
                            {isSelected && (
                              <Text
                                style={{
                                  color: theme.primaryText,
                                  fontSize: 12,
                                  fontWeight: '900',
                                }}
                              >
                                ✓
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* 2. Special Restrictions / Modifiers */}
                  <Text
                    style={[
                      styles.customizeSlotsHeading,
                      { color: theme.textMuted, marginTop: 24, marginBottom: 12 },
                    ]}
                  >
                    Restricții speciale suplimentare (opțional):
                  </Text>

                  <View style={[styles.dietList, isLargeScreen && styles.dietListDesktop]}>
                    {modifierDietOptions.map((diet) => {
                      const isSelected = selectedDiets.includes(diet.id);
                      const isIncompatible = !areDietsCompatible(activeBaseDiet, diet.id);

                      return (
                        <TouchableOpacity
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: isSelected }}
                          accessibilityLabel={`${diet.label}, ${diet.desc}`}
                          key={diet.id}
                          onPress={() => toggleDietType(diet.id)}
                          activeOpacity={0.75}
                          style={[
                            styles.dietCard,
                            isLargeScreen && styles.dietCardDesktop,
                            {
                              backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                              borderColor: isSelected ? theme.primary : theme.border,
                              opacity: isIncompatible ? 0.45 : 1,
                            },
                          ]}
                        >
                          <Text style={styles.dietIcon}>{diet.icon}</Text>
                          <View style={styles.dietInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={[styles.dietLabel, { color: theme.text }]}>
                                {diet.label}
                              </Text>
                              {isIncompatible && (
                                <View
                                  style={[
                                    styles.incompatibleBadge,
                                    {
                                      backgroundColor: isDark
                                        ? 'rgba(239, 68, 68, 0.2)'
                                        : '#fee2e2',
                                    },
                                  ]}
                                >
                                  <Text
                                    style={{ fontSize: 10, color: '#ef4444', fontWeight: '800' }}
                                  >
                                    Incompatibil cu {activeBaseDiet === 'vegan' ? 'Vegan' : activeBaseDiet}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={[styles.dietDesc, { color: theme.textMuted }]}>
                              {diet.desc}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.dayCheckbox,
                              {
                                borderColor: isSelected ? theme.primary : theme.border,
                                backgroundColor: isSelected ? theme.primary : 'transparent',
                              },
                            ]}
                          >
                            {isSelected && (
                              <Text
                                style={{
                                  color: theme.primaryText,
                                  fontSize: 12,
                                  fontWeight: '900',
                                }}
                              >
                                ✓
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.allergenBlock}>
                    <Text style={[styles.questionTitle, { color: theme.text, fontSize: 17 }]}>
                      Ai alergii alimentare?
                    </Text>
                    <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                      Opțional, dar important: orice alergen bifat aici este eliminat complet din
                      toate rețetele propuse.
                    </Text>

                    <AllergenSelector
                      avoidedAllergens={preferences.avoidedAllergens || []}
                      onToggleAllergen={toggleAvoidedAllergen}
                      isDark={isDark}
                    />
                  </View>

                  {/* HEALTH & WELLNESS GOALS */}
                  <View style={styles.healthGoalsBlock}>
                    <Text style={[styles.questionTitle, { color: theme.text, fontSize: 17 }]}>
                      🩺 Obiective de sănătate & stil de viață
                    </Text>
                    <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                      Opțional: filtre speciale nutriționale și medicale populare în România. Meniul
                      recomandat va prioritiza aceste criterii.
                    </Text>

                    <View style={[styles.dietList, isLargeScreen && styles.dietListDesktop]}>
                      {HEALTH_GOALS_CATALOG.map((goal) => {
                        const isSelected = (preferences.healthGoalTags || []).includes(goal.id);
                        return (
                          <TouchableOpacity
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isSelected }}
                            key={goal.id}
                            onPress={() => toggleHealthGoalTag(goal.id)}
                            activeOpacity={0.75}
                            style={[
                              styles.dietCard,
                              isLargeScreen && styles.dietCardDesktop,
                              {
                                backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                                borderColor: isSelected ? theme.primary : theme.border,
                              },
                            ]}
                          >
                            <Text style={styles.dietIcon}>{goal.icon}</Text>
                            <View style={styles.dietInfo}>
                              <Text style={[styles.dietLabel, { color: theme.text }]}>
                                {goal.labelRo}
                              </Text>
                              <Text style={[styles.dietDesc, { color: theme.textMuted }]}>
                                {goal.descriptionRo}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.dietRadio,
                                {
                                  borderColor: isSelected ? theme.primary : theme.border,
                                  backgroundColor: isSelected ? theme.primary : 'transparent',
                                },
                              ]}
                            >
                              {isSelected && (
                                <Text
                                  style={{
                                    color: theme.primaryText,
                                    fontSize: 12,
                                    fontWeight: '900',
                                  }}
                                >
                                  ✓
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <EligibilityMeter preferences={preferences} isDark={isDark} />
                </View>
              );
            })()}

          {/* STEP 2: MOOD & STYLES (POFTE VARIATE CU TINDER-STYLE FOOD SWIPER) */}
          {currentStep === 2 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                Ce pofte ai săptămâna asta?
              </Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Alege stilurile culinare dorite ({preferences.moodTags.length} selectate · fără limită). Răsfoiește caruselul culinar, alege poftele tale preferate sau selectează-le pe toate!
              </Text>

              {preferences.dietTypes &&
                preferences.dietTypes.length > 0 &&
                !preferences.dietTypes.includes('omnivore') && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.accentBg,
                      borderColor: theme.border,
                      borderWidth: 1,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      marginBottom: 12,
                      gap: 8,
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>🌱</Text>
                    <Text style={{ fontSize: 12, color: theme.text, flex: 1, lineHeight: 16 }}>
                      Cardurile și rețetele afișate sunt filtrate automat pentru stilul tău:{' '}
                      <Text style={{ fontWeight: '800', color: theme.primary }}>
                        {preferences.dietTypes
                          .map(
                            (d) =>
                              DIET_OPTIONS_CATALOG.find((o) => o.id === d)?.label || d
                          )
                          .join(', ')}
                      </Text>
                      .
                    </Text>
                  </View>
                )}

              <FoodMoodSwiper
                selectedMoods={preferences.moodTags}
                onToggleMood={toggleMoodTag}
                onSetMoods={setMoodTags}
                isDark={isDark}
                dietTypes={preferences.dietTypes}
              />

              <View
                style={[
                  styles.stepImpactCard,
                  { backgroundColor: theme.accentBg, borderColor: theme.border },
                ]}
              >
                <View style={styles.stepImpactHeaderRow}>
                  <Text style={styles.stepImpactIcon}>🎯</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stepImpactTitle, { color: theme.text }]}>
                      {preferences.moodTags.length > 0
                        ? `${preferences.moodTags.length} ${
                            preferences.moodTags.length === 1
                              ? 'stil culinar ales'
                              : 'stiluri culinare alese'
                          }`
                        : 'Alege poftele tale pentru săptămână'}
                    </Text>
                    <Text style={[styles.stepImpactDesc, { color: theme.textMuted }]}>
                      {preferences.moodTags.length > 0
                        ? `Toate cele ${preferences.moodTags.length} ${
                            preferences.moodTags.length === 1 ? 'poftă este inclusă' : 'stiluri alese sunt distribuite inteligent'
                          } pe zilele de gătit, oferindu-ți varietate culinară dedicată în fiecare zi.`
                        : 'Selectează poftele tale preferate — fiecare poftă aleasă va influența direct rețetele propuse.'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: PEOPLE COUNT */}
          {currentStep === 3 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                Pentru câte persoane gătești?
              </Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Vom scala cantitățile ingredientelor și porțiile fiecărei cine.
              </Text>

              <View style={styles.peopleCounterContainer}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setPeopleCount(preferences.peopleCount - 1)}
                  style={[
                    styles.circleBtn,
                    { borderColor: theme.border, backgroundColor: theme.accentBg },
                  ]}
                >
                  <Text style={[styles.circleBtnText, { color: theme.text }]}>−</Text>
                </TouchableOpacity>

                <View style={styles.peopleValueBox}>
                  <Text style={[styles.peopleCountText, { color: theme.text }]}>
                    {preferences.peopleCount}
                  </Text>
                  <Text style={[styles.peopleLabel, { color: theme.textMuted }]}>
                    {preferences.peopleCount === 1 ? 'persoană' : 'persoane'}
                  </Text>
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setPeopleCount(preferences.peopleCount + 1)}
                  style={[
                    styles.circleBtn,
                    { borderColor: theme.border, backgroundColor: theme.accentBg },
                  ]}
                >
                  <Text style={[styles.circleBtnText, { color: theme.text }]}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Select Presets Row */}
              <View style={styles.peoplePresetsRow}>
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const isActive = preferences.peopleCount === num;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      key={num}
                      onPress={() => setPeopleCount(num)}
                      style={[
                        styles.peoplePresetPill,
                        {
                          backgroundColor: isActive ? theme.primary : theme.accentBg,
                          borderColor: isActive ? theme.primary : theme.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.peoplePresetText,
                          {
                            color: isActive ? theme.primaryText : theme.text,
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {num} {num === 1 ? 'pers.' : 'pers.'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Step 3 Inter-step Cascade Impact */}
              <View
                style={[
                  styles.stepImpactCard,
                  { backgroundColor: theme.accentBg, borderColor: theme.border },
                ]}
              >
                <View style={styles.stepImpactHeaderRow}>
                  <Text style={styles.stepImpactIcon}>👨‍👩‍👧</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stepImpactTitle, { color: theme.text }]}>
                      Scalare automată: exact ×{preferences.peopleCount}{' '}
                      {preferences.peopleCount === 1 ? 'porție' : 'porții'} per masă
                    </Text>
                    <Text style={[styles.stepImpactDesc, { color: theme.textMuted }]}>
                      Gramajele ingredientelor și cantitățile din lista de cumpărături vor fi multiplicate exact pentru {preferences.peopleCount}{' '}
                      {preferences.peopleCount === 1 ? 'persoană' : 'persoane'}.
                    </Text>
                  </View>
                </View>

                <View style={styles.stepImpactPillsRow}>
                  <View
                    style={[
                      styles.stepImpactMiniPill,
                      { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.stepImpactMiniPillText, { color: theme.text }]}>
                      🥗 Dieta ta:{' '}
                      {preferences.dietTypes
                        ?.map((d) => DIET_OPTIONS_CATALOG.find((o) => o.id === d)?.label || d)
                        .join(', ') || 'Omnivor'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.stepImpactMiniPill,
                      { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.stepImpactMiniPillText, { color: theme.text }]}>
                      ✨ Pofte:{' '}
                      {preferences.moodTags.length > 0
                        ? `${preferences.moodTags.length} selectate`
                        : 'Diverse'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.stepImpactMiniPill,
                      { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.stepImpactMiniPillText, { color: theme.text }]}>
                      ⚖️ Fără risipă de alimente
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* STEP 4: COOKING DAYS & MEALS & FOOD TIER */}
          {currentStep === 4 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                Zile de gătit & Mese
              </Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Alege zilele în care gătești, mesele dorite și nivelul ingredientelor.
              </Text>

              {/* Quick Preset Buttons Row */}
              <View style={[styles.cookingDaysPresetRow, isLargeScreen && styles.daysGridDesktop]}>
                {COOKING_DAY_PRESETS.map((preset) => {
                  let isSelected = false;
                  if (preset.id === 'all_week') {
                    isSelected = preferences.cookingDays.length === 7;
                  } else if (preset.id === 'workdays') {
                    isSelected =
                      preferences.cookingDays.length === 5 &&
                      preferences.cookingDays.includes('monday') &&
                      !preferences.cookingDays.includes('saturday');
                  } else if (preset.id === 'weekend') {
                    isSelected =
                      preferences.cookingDays.length === 2 &&
                      preferences.cookingDays.includes('saturday') &&
                      preferences.cookingDays.includes('sunday');
                  }

                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      key={preset.id}
                      onPress={() => setCookingDays(preset.days)}
                      activeOpacity={0.7}
                      style={[
                        styles.dayRow,
                        isLargeScreen && styles.presetRowDesktop,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayName,
                          { color: theme.text, fontWeight: isSelected ? '700' : '500' },
                        ]}
                      >
                        {preset.label}
                      </Text>
                      <View
                        style={[
                          styles.dayCheckbox,
                          {
                            backgroundColor: isSelected ? theme.primary : 'transparent',
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        {isSelected && (
                          <Text style={[styles.dayCheckboxText, { color: theme.primaryText }]}>
                            ✓
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.daysCounterBadge}>
                <Text style={[styles.daysCounterText, { color: theme.text }]}>
                  {preferences.cookingDays.length}{' '}
                  {preferences.cookingDays.length === 1 ? 'zi selectată' : 'zile selectate'}
                </Text>
              </View>

              <View style={[styles.daysList, isLargeScreen && styles.daysGridDesktop]}>
                {(
                  [
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday',
                    'sunday',
                  ] as DayOfWeek[]
                ).map((day) => {
                  const isSelected = preferences.cookingDays.includes(day);
                  return (
                    <TouchableOpacity
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      key={day}
                      onPress={() => toggleCookingDay(day)}
                      style={[
                        styles.dayRow,
                        isLargeScreen && styles.dayRowDesktop,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayName,
                          { color: theme.text, fontWeight: isSelected ? '700' : '500' },
                        ]}
                      >
                        {DAY_LABELS_RO[day]}
                      </Text>
                      <View
                        style={[
                          styles.dayCheckbox,
                          {
                            backgroundColor: isSelected ? theme.primary : 'transparent',
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        {isSelected && (
                          <Text style={[styles.dayCheckboxText, { color: theme.primaryText }]}>
                            ✓
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.questionTitle, { color: theme.text }]}>
                Ce mese dorești să planifici în fiecare zi?
              </Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Alege mesele principale pentru fiecare zi, plus opțional un moment dulce de desert.
              </Text>

              <View style={[styles.mealCountGrid, isLargeScreen && styles.mealCountGridDesktop]}>
                {MEAL_MOMENT_OPTIONS.map((option) => {
                  const isSelected = preferences.mealSlots.includes(option.slot);
                  return (
                    <TouchableOpacity
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      key={option.slot}
                      onPress={() => {
                        if (isSelected) {
                          const remaining = preferences.mealSlots.filter((s) => s !== option.slot);
                          if (
                            remaining.filter((s) => ['breakfast', 'lunch', 'dinner'].includes(s))
                              .length === 0
                          ) {
                            showNotice(
                              'Cel puțin o masă pe zi',
                              'Trebuie să selectezi cel puțin o masă principală pe zi (Mic Dejun, Prânz sau Cină) pentru a genera meniul.',
                              'info'
                            );
                            return;
                          }
                          setMealSlots(remaining);
                        } else {
                          const updated = [...preferences.mealSlots, option.slot];
                          setMealSlots(updated);
                        }
                      }}
                      activeOpacity={0.7}
                      style={[
                        styles.mealCountCard,
                        isLargeScreen && styles.mealCountCardDesktop,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text style={styles.mealCountIcon}>{option.icon}</Text>
                      <View style={styles.mealCountInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text
                            style={[
                              styles.mealCountTitle,
                              {
                                color: isSelected ? theme.primary : theme.text,
                                fontWeight: isSelected ? '800' : '700',
                              },
                            ]}
                          >
                            {option.title}
                          </Text>
                          {option.slot === 'dessert' && preferences.moodTags.includes('sweet_treat') && (
                            <View
                              style={{
                                backgroundColor: isDark ? 'rgba(236, 72, 153, 0.22)' : '#fdf2f8',
                                borderColor: '#ec4899',
                                borderWidth: 1,
                                paddingHorizontal: 7,
                                paddingVertical: 2,
                                borderRadius: 6,
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: '800', color: '#ec4899' }}>
                                ✨ Recomandat din Pofte
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.mealCountSubtitle, { color: theme.textMuted }]}>
                          {option.subtitle}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.dayCheckbox,
                          {
                            backgroundColor: isSelected ? theme.primary : 'transparent',
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        {isSelected && (
                          <Text style={[styles.dayCheckboxText, { color: theme.primaryText }]}>
                            ✓
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={[styles.customizeSlotsHeading, { color: theme.textMuted, marginTop: 26 }]}
              >
                Nivelul ingredientelor & rețetelor (Food Tier):
              </Text>

              <View style={[styles.tierCardsGrid, isLargeScreen && styles.tierCardsGridDesktop]}>
                {FOOD_TIER_OPTIONS.map((tierOpt) => {
                  const isSelected = (preferences.foodTier || 'medium') === tierOpt.id;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      key={tierOpt.id}
                      onPress={() => setFoodTier(tierOpt.id)}
                      activeOpacity={0.7}
                      style={[
                        styles.tierCard,
                        isLargeScreen && styles.tierCardDesktop,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <View style={styles.tierCardHeader}>
                        <Text style={styles.tierCardIcon}>{tierOpt.icon}</Text>
                        <View style={styles.tierCardTextContainer}>
                          <Text
                            style={[
                              styles.tierCardTitle,
                              {
                                color: isSelected ? theme.primary : theme.text,
                                fontWeight: isSelected ? '800' : '700',
                              },
                            ]}
                          >
                            {tierOpt.label}
                          </Text>
                          <Text
                            style={[
                              styles.tierCardPrice,
                              { color: isSelected ? theme.primary : theme.textMuted },
                            ]}
                          >
                            {tierOpt.priceEst}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.extraCheckbox,
                            {
                              backgroundColor: isSelected ? theme.primary : 'transparent',
                              borderColor: isSelected ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          {isSelected && (
                            <Text style={[styles.extraCheckmark, { color: theme.primaryText }]}>
                              ✓
                            </Text>
                          )}
                        </View>
                      </View>
                      <Text style={[styles.tierCardDesc, { color: theme.textMuted }]}>
                        {tierOpt.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Step 4 Inter-step Cascade Impact */}
              {(() => {
                const totalMeals = preferences.cookingDays.length * preferences.mealSlots.length;
                const totalPortions = totalMeals * preferences.peopleCount;
                const tierName =
                  preferences.foodTier === 'basic'
                    ? 'Economic (Mărci de bază)'
                    : preferences.foodTier === 'premium'
                    ? 'Gourmet (Selecție Premium)'
                    : 'Echilibrat (Raport optim)';

                return (
                  <View
                    style={[
                      styles.stepImpactCard,
                      { backgroundColor: theme.accentBg, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.stepImpactHeaderRow}>
                      <Text style={styles.stepImpactIcon}>📅</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.stepImpactTitle, { color: theme.text }]}>
                          Structura planului: {totalMeals} mese ({totalPortions} porții totale)
                        </Text>
                        <Text style={[styles.stepImpactDesc, { color: theme.textMuted }]}>
                          {preferences.cookingDays.length} zile planificate cu{' '}
                          {preferences.mealSlots.length}{' '}
                          {preferences.mealSlots.length === 1 ? 'masă' : 'mese'}/zi pentru{' '}
                          {preferences.peopleCount}{' '}
                          {preferences.peopleCount === 1 ? 'persoană' : 'persoane'}.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.stepImpactPillsRow}>
                      <View
                        style={[
                          styles.stepImpactMiniPill,
                          { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                        ]}
                      >
                        <Text style={[styles.stepImpactMiniPillText, { color: theme.text }]}>
                          🎯 Pofte în meniu:{' '}
                          {preferences.moodTags.length > 0
                            ? `${preferences.moodTags.length} stiluri alese`
                            : 'Diversificate'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.stepImpactMiniPill,
                          { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                        ]}
                      >
                        <Text style={[styles.stepImpactMiniPillText, { color: theme.text }]}>
                          🏷️ Calitate ingrediente: {tierName}
                        </Text>
                      </View>
                      {preferences.moodTags.includes('sweet_treat') && (
                        <View
                          style={[
                            styles.stepImpactMiniPill,
                            {
                              backgroundColor: isDark ? 'rgba(236, 72, 153, 0.16)' : '#fdf2f8',
                              borderColor: '#ec4899',
                            },
                          ]}
                        >
                          <Text style={[styles.stepImpactMiniPillText, { color: '#ec4899', fontWeight: '800' }]}>
                            🍰 {preferences.mealSlots.includes('dessert') ? 'Desert de Casă inclus' : 'Poftă de Dulce (activabilă mai sus)'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })()}
            </View>
          )}

          {/* STEP 5: KITCHEN APPLIANCES */}
          {currentStep === 5 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                Ce aparate ai în bucătărie?
              </Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Selectează aparatele disponibile. Nu îți vom sugera niciodată o rețetă pe care nu o
                poți găti.
              </Text>

              <ApplianceSelector
                selectedAppliances={preferences.appliances}
                onToggleAppliance={toggleAppliance}
                isDark={isDark}
              />

              <EligibilityMeter preferences={preferences} isDark={isDark} />

              {/* Step 5 Inter-step Cascade Impact */}
              {(() => {
                const hasOven = preferences.appliances.includes('oven');
                const hasAirFryer = preferences.appliances.includes('air_fryer');
                let applianceMsg = 'Toate rețetele propuse vor putea fi gătite cu aparatele selectate.';
                if (!hasOven && !hasAirFryer) {
                  applianceMsg =
                    'Meniul va conține doar rețete la plită/tigaie (fără coacere la cuptor sau aer cald).';
                } else if (!hasOven) {
                  applianceMsg =
                    'Rețetele ce necesită cuptor mare sunt excluse automat; se vor folosi plita și air fryer-ul.';
                }

                return (
                  <View
                    style={[
                      styles.stepImpactCard,
                      { backgroundColor: theme.accentBg, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.stepImpactHeaderRow}>
                      <Text style={styles.stepImpactIcon}>🍳</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.stepImpactTitle, { color: theme.text }]}>
                          Garanție 100% fezabilitate în bucătărie
                        </Text>
                        <Text style={[styles.stepImpactDesc, { color: theme.textMuted }]}>
                          {applianceMsg} Nicio rețetă nu va cere aparate pe care nu le deții.
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}

          {/* STEP 6: SUPERMARKET */}
          {currentStep === 6 && (
            <View style={styles.stepSection}>
              

              <Text style={[styles.questionTitle, { color: theme.text }]}>Alege magazinul tău</Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Calculăm meniul și coșul săptămânal pe prețurile estimate ale magazinului ales.
              </Text>

              <View
                style={[styles.supermarketGrid, isLargeScreen && styles.supermarketGridDesktop]}
              >
                {SUPERMARKET_LIST.map((market) => {
                  const isSelected = preferences.supermarketId === market.id;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      key={market.id}
                      onPress={() => setSupermarket(market.id as SupermarketId)}
                      activeOpacity={0.7}
                      style={[
                        styles.supermarketCard,
                        isLargeScreen && styles.supermarketCardDesktop,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <View style={[styles.marketBadge, { backgroundColor: market.brandColor }]}>
                        <Text style={styles.marketBadgeText}>{market.name[0]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.supermarketName, { color: theme.text }]}>
                          {market.name}
                        </Text>
                        <Text style={[styles.supermarketTagline, { color: theme.textMuted }]}>
                          {market.tagline}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.supermarketRadio,
                          {
                            borderColor: isSelected ? theme.primary : theme.border,
                            backgroundColor: isSelected ? theme.primary : 'transparent',
                          },
                        ]}
                      >
                        {isSelected && (
                          <Text
                            style={[styles.supermarketRadioCheck, { color: theme.primaryText }]}
                          >
                            ✓
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Step 6 Inter-step Cascade Impact */}
              {(() => {
                const currentMarket =
                  SUPERMARKET_LIST.find((m) => m.id === preferences.supermarketId) ||
                  SUPERMARKET_LIST[0];
                const totalMeals = preferences.cookingDays.length * preferences.mealSlots.length;
                const totalPortions = totalMeals * preferences.peopleCount;

                return (
                  <View
                    style={[
                      styles.stepImpactCard,
                      { backgroundColor: theme.accentBg, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.stepImpactHeaderRow}>
                      <Text style={styles.stepImpactIcon}>🛒</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.stepImpactTitle, { color: theme.text }]}>
                          Prețuri optimizate la {currentMarket.name}
                        </Text>
                        <Text style={[styles.stepImpactDesc, { color: theme.textMuted }]}>
                          Ingredientele pentru cele {totalPortions} porții din săptămână vor fi estimate pe prețurile reale la raft din {currentMarket.name}.
                        </Text>
                      </View>
                    </View>
                    <View style={styles.stepImpactPillsRow}>
                      <View
                        style={[
                          styles.stepImpactMiniPill,
                          { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                        ]}
                      >
                        <Text style={[styles.stepImpactMiniPillText, { color: theme.text }]}>
                          💡 {currentMarket.tagline}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.stepImpactMiniPill,
                          { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                        ]}
                      >
                        <Text style={[styles.stepImpactMiniPillText, { color: theme.text }]}>
                          🍿 Gustările din pasul următor se vor adapta la acest magazin
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}

          {/* STEP 7: RETAIL SNACKS & BEVERAGES */}
          {currentStep === 7 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                🍿 Ronțăieli & 🥤 Băuturi de Magazin
              </Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Alege gustările pentru meci/film și băuturile preferate, cu prețuri estimate la
                magazinul ales.
              </Text>

              {/* Supermarket Banner */}
              <View
                style={[
                  styles.retailSupermarketBanner,
                  { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                ]}
              >
                <Text style={styles.retailBannerIcon}>🛒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.retailBannerTitle, { color: theme.primary }]}>
                    Produse la{' '}
                    {SUPERMARKET_LIST.find((s) => s.id === preferences.supermarketId)?.name ||
                      'magazinul ales'}
                  </Text>
                  <Text style={[styles.retailBannerSubtitle, { color: theme.textMuted }]}>
                    Prețuri estimate după prețurile obișnuite la raft. La casă pot diferi.
                  </Text>
                </View>
              </View>

              {/* SNACK TASTE SELECTOR [Dulce] vs [Sărat] vs [Ambele] */}
              <View
                style={[
                  styles.snackTasteBox,
                  { backgroundColor: theme.accentBg, borderColor: theme.border },
                ]}
              >
                <Text style={[styles.snackTasteTitle, { color: theme.text }]}>
                  Ce fel de gustări preferi de obicei?
                </Text>
                <View style={styles.snackTasteSegmentedRow}>
                  {[
                    { id: 'savory', label: '🍿 Gustări Sărate', desc: 'Chipsuri, pufuleți & alune' },
                    { id: 'sweet', label: '🍫 Gustări Dulci', desc: 'Ciocolată, biscuiți & napolitane' },
                  ].map((tab) => {
                    const activeTaste = preferences.snackTastePreference === 'sweet' ? 'sweet' : 'savory';
                    const isCurrent = activeTaste === tab.id;
                    return (
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityState={{ selected: isCurrent }}
                        key={tab.id}
                        onPress={() =>
                          setSnackTastePreference(tab.id as 'sweet' | 'savory')
                        }
                        style={[
                          styles.snackTasteTab,
                          {
                            backgroundColor: isCurrent ? theme.primaryLight : 'transparent',
                            borderColor: isCurrent ? theme.primary : theme.border,
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.snackTasteTabLabel,
                            {
                              color: isCurrent ? theme.primary : theme.text,
                              fontWeight: isCurrent ? '800' : '600',
                            },
                          ]}
                        >
                          {tab.label}
                        </Text>
                        <Text style={[styles.snackTasteTabDesc, { color: theme.textMuted }]}>
                          {tab.desc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* RETAIL SNACKS: DYNAMIC ORDER BASED ON PREFERENCE */}
              {(() => {
                const savorySection = (
                  <View key="savory-block" style={{ marginTop: 12 }}>
                    <Text style={[styles.retailSectionHeading, { color: theme.text }]}>
                      🍿 Chipsuri & Snacks sărate
                    </Text>
                    <View
                      style={[
                        styles.retailCardsGrid,
                        isLargeScreen && styles.retailCardsGridDesktop,
                      ]}
                    >
                      {getRetailProductsByCategory('snack_savory').map((prod) => {
                        const isSelected = (preferences.selectedSnackIds || []).includes(prod.id);
                        const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
                        return (
                          <TouchableOpacity
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isSelected }}
                            key={prod.id}
                            onPress={() => toggleSnackProduct(prod.id)}
                            activeOpacity={0.7}
                            style={[
                              styles.retailProductCard,
                              isLargeScreen && styles.retailProductCardDesktop,
                              {
                                backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                                borderColor: isSelected ? theme.primary : theme.border,
                              },
                            ]}
                          >
                            <Text style={styles.retailProductIcon}>{prod.icon}</Text>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.retailProductTitle,
                                  { color: isSelected ? theme.primary : theme.text },
                                ]}
                              >
                                {prod.name}
                              </Text>
                              <Text style={[styles.retailProductBrand, { color: theme.textMuted }]}>
                                {prod.brand} • {prod.packageSize}
                              </Text>
                            </View>
                            <View style={styles.retailPriceBox}>
                              <Text
                                style={[
                                  styles.retailProductPrice,
                                  { color: isSelected ? theme.primary : theme.text },
                                ]}
                              >
                                {price.toFixed(2)} lei
                              </Text>
                              <View
                                style={[
                                  styles.retailCheckbox,
                                  {
                                    backgroundColor: isSelected ? theme.primary : 'transparent',
                                    borderColor: isSelected ? theme.primary : theme.border,
                                  },
                                ]}
                              >
                                {isSelected && (
                                  <Text
                                    style={[styles.retailCheckmark, { color: theme.primaryText }]}
                                  >
                                    ✓
                                  </Text>
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );

                const sweetSection = (
                  <View key="sweet-block" style={{ marginTop: 16 }}>
                    <Text style={[styles.retailSectionHeading, { color: theme.text }]}>
                      🍫 Ciocolată & Dulciuri
                    </Text>
                    <View
                      style={[
                        styles.retailCardsGrid,
                        isLargeScreen && styles.retailCardsGridDesktop,
                      ]}
                    >
                      {getRetailProductsByCategory('snack_sweet').map((prod) => {
                        const isSelected = (preferences.selectedSnackIds || []).includes(prod.id);
                        const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
                        return (
                          <TouchableOpacity
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: isSelected }}
                            key={prod.id}
                            onPress={() => toggleSnackProduct(prod.id)}
                            activeOpacity={0.7}
                            style={[
                              styles.retailProductCard,
                              isLargeScreen && styles.retailProductCardDesktop,
                              {
                                backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                                borderColor: isSelected ? theme.primary : theme.border,
                              },
                            ]}
                          >
                            <Text style={styles.retailProductIcon}>{prod.icon}</Text>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.retailProductTitle,
                                  { color: isSelected ? theme.primary : theme.text },
                                ]}
                              >
                                {prod.name}
                              </Text>
                              <Text style={[styles.retailProductBrand, { color: theme.textMuted }]}>
                                {prod.brand} • {prod.packageSize}
                              </Text>
                            </View>
                            <View style={styles.retailPriceBox}>
                              <Text
                                style={[
                                  styles.retailProductPrice,
                                  { color: isSelected ? theme.primary : theme.text },
                                ]}
                              >
                                {price.toFixed(2)} lei
                              </Text>
                              <View
                                style={[
                                  styles.retailCheckbox,
                                  {
                                    backgroundColor: isSelected ? theme.primary : 'transparent',
                                    borderColor: isSelected ? theme.primary : theme.border,
                                  },
                                ]}
                              >
                                {isSelected && (
                                  <Text
                                    style={[styles.retailCheckmark, { color: theme.primaryText }]}
                                  >
                                    ✓
                                  </Text>
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );

                const activeTaste = preferences.snackTastePreference === 'sweet' ? 'sweet' : 'savory';
                return activeTaste === 'sweet' ? [sweetSection] : [savorySection];
              })()}

              {/* SECTION 3: BĂUTURI RĂCORITOARE & APĂ */}
              <Text style={[styles.retailSectionHeading, { color: theme.text, marginTop: 20 }]}>
                🥤 Băuturi Răcoritoare & Apă
              </Text>
              <View
                style={[styles.retailCardsGrid, isLargeScreen && styles.retailCardsGridDesktop]}
              >
                {getRetailProductsByCategory('drink_soft').map((prod) => {
                  const isSelected = (preferences.selectedDrinkIds || []).includes(prod.id);
                  const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
                  return (
                    <TouchableOpacity
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      key={prod.id}
                      onPress={() => toggleDrinkProduct(prod.id)}
                      activeOpacity={0.7}
                      style={[
                        styles.retailProductCard,
                        isLargeScreen && styles.retailProductCardDesktop,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text style={styles.retailProductIcon}>{prod.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.retailProductTitle,
                            { color: isSelected ? theme.primary : theme.text },
                          ]}
                        >
                          {prod.name}
                        </Text>
                        <Text style={[styles.retailProductBrand, { color: theme.textMuted }]}>
                          {prod.brand} • {prod.packageSize}
                        </Text>
                      </View>
                      <View style={styles.retailPriceBox}>
                        <Text
                          style={[
                            styles.retailProductPrice,
                            { color: isSelected ? theme.primary : theme.text },
                          ]}
                        >
                          {price.toFixed(2)} lei
                        </Text>
                        <View
                          style={[
                            styles.retailCheckbox,
                            {
                              backgroundColor: isSelected ? theme.primary : 'transparent',
                              borderColor: isSelected ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          {isSelected && (
                            <Text style={[styles.retailCheckmark, { color: theme.primaryText }]}>
                              ✓
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SECTION 4: BĂUTURI ALCOOLICE (18+) */}
              <Text style={[styles.retailSectionHeading, { color: theme.text, marginTop: 20 }]}>
                🍺 Băuturi Alcoolice (Bere, Vin, Spumant)
              </Text>

              <TouchableOpacity
                accessibilityRole="switch"
                accessibilityLabel="Activează secțiunea de băuturi alcoolice (18+)"
                accessibilityState={{ checked: Boolean(preferences.includeAlcohol) }}
                onPress={() => setIncludeAlcohol(!preferences.includeAlcohol)}
                activeOpacity={0.7}
                style={[
                  styles.alcoholToggleBox,
                  {
                    backgroundColor: preferences.includeAlcohol
                      ? isDark
                        ? 'rgba(239, 68, 68, 0.15)'
                        : '#fef2f2'
                      : theme.accentBg,
                    borderColor: preferences.includeAlcohol ? '#ef4444' : theme.border,
                  },
                ]}
              >
                <Text style={styles.retailBannerIcon}>🔞</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.retailBannerTitle,
                      { color: preferences.includeAlcohol ? '#ef4444' : theme.text },
                    ]}
                  >
                    Activează secțiunea de băuturi alcoolice (18+)
                  </Text>
                  <Text style={[styles.retailBannerSubtitle, { color: theme.textMuted }]}>
                    Beri reci, vinuri nobile românești și cidru pentru relaxare.
                  </Text>
                </View>
                <View
                  style={[
                    styles.retailCheckbox,
                    {
                      backgroundColor: preferences.includeAlcohol ? '#ef4444' : 'transparent',
                      borderColor: preferences.includeAlcohol ? '#ef4444' : theme.border,
                    },
                  ]}
                >
                  {preferences.includeAlcohol && (
                    <Text style={[styles.retailCheckmark, { color: '#ffffff' }]}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>

              {preferences.includeAlcohol && (
                <View
                  style={[
                    styles.retailCardsGrid,
                    isLargeScreen && styles.retailCardsGridDesktop,
                    { marginTop: 10 },
                  ]}
                >
                  {getRetailProductsByCategory('drink_alcoholic').map((prod) => {
                    const isSelected = (preferences.selectedDrinkIds || []).includes(prod.id);
                    const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
                    return (
                      <TouchableOpacity
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isSelected }}
                        key={prod.id}
                        onPress={() => toggleDrinkProduct(prod.id)}
                        activeOpacity={0.7}
                        style={[
                          styles.retailProductCard,
                          isLargeScreen && styles.retailProductCardDesktop,
                          {
                            backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text style={styles.retailProductIcon}>{prod.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.retailProductTitle,
                              { color: isSelected ? theme.primary : theme.text },
                            ]}
                          >
                            {prod.name}
                          </Text>
                          <Text style={[styles.retailProductBrand, { color: theme.textMuted }]}>
                            {prod.brand} • {prod.packageSize}
                          </Text>
                        </View>
                        <View style={styles.retailPriceBox}>
                          <Text
                            style={[
                              styles.retailProductPrice,
                              { color: isSelected ? theme.primary : theme.text },
                            ]}
                          >
                            {price.toFixed(2)} lei
                          </Text>
                          <View
                            style={[
                              styles.retailCheckbox,
                              {
                                backgroundColor: isSelected ? theme.primary : 'transparent',
                                borderColor: isSelected ? theme.primary : theme.border,
                              },
                            ]}
                          >
                            {isSelected && (
                              <Text style={[styles.retailCheckmark, { color: theme.primaryText }]}>
                                ✓
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Step 7 Inter-step Cascade Impact */}
              {(() => {
                const snacksCount = preferences.selectedSnackIds?.length || 0;
                const drinksCount = preferences.selectedDrinkIds?.length || 0;
                const totalExtras = snacksCount + drinksCount;
                const currentMarket =
                  SUPERMARKET_LIST.find((m) => m.id === preferences.supermarketId) ||
                  SUPERMARKET_LIST[0];

                return (
                  <View
                    style={[
                      styles.stepImpactCard,
                      { backgroundColor: theme.accentBg, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.stepImpactHeaderRow}>
                      <Text style={styles.stepImpactIcon}>🍿</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.stepImpactTitle, { color: theme.text }]}>
                          {totalExtras > 0
                            ? `${totalExtras} gustări & băuturi adăugate (+${extrasCost.toFixed(2)} lei)`
                            : 'Fără gustări sau băuturi extra adăugate'}
                        </Text>
                        <Text style={[styles.stepImpactDesc, { color: theme.textMuted }]}>
                          {totalExtras > 0
                            ? `Prețuri estimate la ${currentMarket.name}. Sunt incluse în bugetul de la Pasul 8 și direct în lista de cumpărături.`
                            : 'Poți alege gustări sau băuturi pentru seri de film/meci sau poți continua doar cu mesele principale.'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}

          {/* STEP 8: BUDGET SLIDER & PRE-GENERATION SUMMARY */}
          {currentStep === 8 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                Care este bugetul tău?
              </Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Suma totală pe care dorești să o cheltui la magazin pentru mesele și gustările din
                aceste zile.
              </Text>

              {/* Step 8 Comprehensive Pipeline Breadcrumb */}
              <View
                style={[
                  styles.pipelineSummaryCard,
                  { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderStrong },
                ]}
              >
                <View style={styles.pipelineTitleRow}>
                  <Text style={[styles.pipelineTitle, { color: theme.text }]}>
                    🔗 Lanț Decizional Sincronizat (Etapele 1 ➔ 8)
                  </Text>
                  <View style={[styles.pipelineStatusBadge, { backgroundColor: '#30d158' }]}>
                    <Text style={styles.pipelineStatusText}>✓ INTEGRAT</Text>
                  </View>
                </View>

                <View style={styles.pipelineStepsList}>
                  <View style={styles.pipelineStepItem}>
                    <Text style={styles.pipelineStepNumber}>1</Text>
                    <Text style={[styles.pipelineStepText, { color: theme.text }]}>
                      {preferences.dietTypes?.map(d => DIET_OPTIONS_CATALOG.find(o => o.id === d)?.label || d).join(', ') || 'Omnivor'}
                    </Text>
                  </View>
                  <Text style={[styles.pipelineArrow, { color: theme.textMuted }]}>➔</Text>

                  <View style={styles.pipelineStepItem}>
                    <Text style={styles.pipelineStepNumber}>2</Text>
                    <Text style={[styles.pipelineStepText, { color: theme.text }]}>
                      {preferences.moodTags.length} pofte
                    </Text>
                  </View>
                  <Text style={[styles.pipelineArrow, { color: theme.textMuted }]}>➔</Text>

                  <View style={styles.pipelineStepItem}>
                    <Text style={styles.pipelineStepNumber}>3</Text>
                    <Text style={[styles.pipelineStepText, { color: theme.text }]}>
                      {preferences.peopleCount} {preferences.peopleCount === 1 ? 'pers.' : 'pers.'}
                    </Text>
                  </View>
                  <Text style={[styles.pipelineArrow, { color: theme.textMuted }]}>➔</Text>

                  <View style={styles.pipelineStepItem}>
                    <Text style={styles.pipelineStepNumber}>4</Text>
                    <Text style={[styles.pipelineStepText, { color: theme.text }]}>
                      {preferences.cookingDays.length} zile ({preferences.mealSlots.length} mese/zi)
                    </Text>
                  </View>
                  <Text style={[styles.pipelineArrow, { color: theme.textMuted }]}>➔</Text>

                  <View style={styles.pipelineStepItem}>
                    <Text style={styles.pipelineStepNumber}>5</Text>
                    <Text style={[styles.pipelineStepText, { color: theme.text }]}>
                      {preferences.appliances.length} aparate
                    </Text>
                  </View>
                  <Text style={[styles.pipelineArrow, { color: theme.textMuted }]}>➔</Text>

                  <View style={styles.pipelineStepItem}>
                    <Text style={styles.pipelineStepNumber}>6</Text>
                    <Text style={[styles.pipelineStepText, { color: theme.text }]}>
                      {SUPERMARKET_LIST.find((s) => s.id === preferences.supermarketId)?.name || 'Kaufland'}
                    </Text>
                  </View>
                  <Text style={[styles.pipelineArrow, { color: theme.textMuted }]}>➔</Text>

                  <View style={styles.pipelineStepItem}>
                    <Text style={styles.pipelineStepNumber}>7</Text>
                    <Text style={[styles.pipelineStepText, { color: theme.text }]}>
                      {(preferences.selectedSnackIds?.length || 0) + (preferences.selectedDrinkIds?.length || 0)} extras
                    </Text>
                  </View>
                </View>
              </View>

              <BudgetSlider
                budget={preferences.budgetRon}
                peopleCount={preferences.peopleCount}
                daysCount={preferences.cookingDays.length}
                mealsPerDay={preferences.mealSlots.length}
                supermarketId={preferences.supermarketId}
                foodTier={preferences.foodTier}
                extrasCost={extrasCost}
                onChangeBudget={setBudget}
                isDark={isDark}
              />

              <PreGenerationSummaryCard
                preferences={preferences}
                isDark={isDark}
                extrasCost={extrasCost}
              />
            </View>
          )}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Bottom Floating Action Bar */}
      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <View style={[styles.footerInner, { maxWidth: containerMaxWidth }]}>
          {currentStep > 1 && (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={prevStep}
              activeOpacity={0.8}
              style={[
                styles.footerBackBtn,
                !isLargeScreen && { paddingHorizontal: 16, minWidth: 100 },
                { borderColor: theme.border, backgroundColor: theme.accentBg },
              ]}
            >
              <Text style={[styles.footerBackText, { color: theme.text }]}>← Înapoi</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleNextOrFinish}
            activeOpacity={0.85}
            {...glass('btn-primary')}
            style={[styles.footerContinueWrap, { flex: 1, maxWidth: isLargeScreen ? 460 : '100%' }]}
          >
            <LinearGradient
              colors={isDark ? ['#F3C06D', '#E6A756'] : ['#D98E3A', '#C88232']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              <Text style={[styles.continueButtonText, { color: isDark ? '#131914' : '#ffffff', fontWeight: '800' }]}>
                {currentStep === totalSteps ? '✨ Generează Meniul Săptămânal' : 'Continuă →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  desktopHeader: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
    width: '100%',
  },
  desktopHeaderInner: {
    width: '100%',
  },
  desktopTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  desktopStepInfo: {
    alignItems: 'center',
  },
  desktopCurrentStepTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  desktopBackBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  waterFlowTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 2,
  },
  flowStreamLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
    marginHorizontal: 3,
  },
  stepNode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
  },
  stepNodeActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  stepNodeCompleted: {},
  stepNodeUpcoming: {
    opacity: 0.55,
  },
  stepNodeIcon: {
    fontSize: 12,
  },
  stepNodeLabel: {
    fontSize: 11,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepIndicator: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    width: '100%',
    flexGrow: 1,
    justifyContent: 'center',
  },
  contentCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  stepSection: {
    width: '100%',
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
    lineHeight: 22,
  },
  quickStartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  quickStartIcon: { fontSize: 16 },
  quickStartTitle: { fontSize: 12, fontWeight: '800' },
  quickStartSubtitle: { fontSize: 11, fontWeight: '500', marginTop: 1, lineHeight: 13 },
  quickStartArrow: { fontSize: 14, fontWeight: '800' },
  allergenBlock: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.35)',
  },
  questionSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  supermarketGrid: {
    gap: 12,
  },
  supermarketGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  supermarketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 2,
    gap: 10,
  },
  supermarketCardDesktop: {
    flex: 1,
    minWidth: 230,
    maxWidth: 290,
  },
  supermarketRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supermarketRadioCheck: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  peoplePresetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  peoplePresetPill: {
    minHeight: 44,
    minWidth: 70,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  peoplePresetText: {
    fontSize: 13,
  },
  cookingDaysPresetRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  cookingPresetBtn: {
    flex: 1,
    minWidth: 170,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookingPresetBtnActive: {
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cookingPresetText: {
    fontSize: 13,
    fontWeight: '700',
  },
  daysGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  dayRowDesktop: {
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 135,
    maxWidth: 185,
  },
  presetRowDesktop: {
    flexGrow: 1,
    flexShrink: 0,
    minWidth: 230,
    maxWidth: 360,
  },
  mealCountGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  mealCountCardDesktop: {
    flex: 1,
    minWidth: 280,
  },
  tierCardsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  tierCardDesktop: {
    flex: 1,
    minWidth: 280,
  },
  moodGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  moodCardDesktop: {
    flexGrow: 1,
    flexShrink: 0,
    width: '23%',
    minWidth: 220,
    maxWidth: 320,
  },
  dietListDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  dietCardDesktop: {
    flexGrow: 0,
    flexShrink: 0,
    width: '48.5%',
    minWidth: 280,
    maxWidth: 520,
  },
  retailCardsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'flex-start',
  },
  retailProductCardDesktop: {
    flexGrow: 0,
    flexShrink: 0,
    width: '31.8%',
    minWidth: 280,
    maxWidth: 380,
  },
  footerInner: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  footerBackBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBackText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerContinueWrap: {
    flex: 1,
  },
  marketBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketBadgeText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  supermarketName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  supermarketTagline: {
    fontSize: 12,
    flex: 1,
  },
  peopleCounterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  circleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnText: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 28,
  },
  peopleValueBox: {
    alignItems: 'center',
    minWidth: 90,
  },
  peopleCountText: {
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 46,
  },
  peopleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  daysCounterBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  daysCounterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  daysList: {
    gap: 10,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  dayRowSelected: {
    borderColor: '#ffffff',
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayIcon: {
    fontSize: 20,
  },
  dayName: {
    fontSize: 15,
    fontWeight: '700',
  },
  daySubLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  dayCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCheckboxText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  dietRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealCountGrid: {
    gap: 8,
    marginBottom: 14,
  },
  mealCountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 2,
    gap: 10,
  },
  mealCountIcon: {
    fontSize: 22,
  },
  mealCountInfo: {
    flex: 1,
  },
  mealCountTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  mealCountSubtitle: {
    fontSize: 11,
    lineHeight: 14,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  customizeSlotsHeading: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  slotPillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  slotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  slotPillIcon: {
    fontSize: 16,
  },
  slotPillText: {
    fontSize: 13,
  },
  extraSlotsGrid: {
    gap: 10,
    marginTop: 4,
  },
  extraSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  extraSlotIcon: {
    fontSize: 24,
  },
  extraSlotInfo: {
    flex: 1,
  },
  extraSlotTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  extraSlotSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  extraCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraCheckmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  tierCardsGrid: {
    gap: 8,
    marginTop: 4,
  },
  tierCard: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  tierCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tierCardIcon: {
    fontSize: 18,
  },
  tierCardTextContainer: {
    flex: 1,
  },
  tierCardTitle: {
    fontSize: 13,
  },
  tierCardPrice: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  tierCardDesc: {
    fontSize: 11,
    lineHeight: 14,
    marginLeft: 26,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    minHeight: 72,
    gap: 10,
  },
  moodIcon: {
    fontSize: 22,
  },
  moodLabel: {
    fontSize: 13,
  },
  moodVibeText: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
  },
  moodCheckPill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incompatibleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dietList: {
    gap: 8,
  },
  dietCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
    minHeight: 52,
  },
  dietIcon: {
    fontSize: 22,
  },
  dietInfo: {
    flex: 1,
  },
  dietLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1,
  },
  dietDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  footer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    maxWidth: 480,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  retailSupermarketBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
    marginBottom: 16,
  },
  retailBannerIcon: {
    fontSize: 24,
  },
  retailBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  retailBannerSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  retailSectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  retailCardsGrid: {
    gap: 8,
  },
  retailProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  retailProductIcon: {
    fontSize: 20,
  },
  retailProductTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  retailProductBrand: {
    fontSize: 11,
    marginTop: 1,
  },
  retailPriceBox: {
    alignItems: 'flex-end',
    gap: 4,
  },
  retailProductPrice: {
    fontSize: 13,
    fontWeight: '800',
  },
  retailCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retailCheckmark: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  alcoholToggleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
    marginBottom: 10,
  },
  retailSummaryPill: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 20,
    alignItems: 'center',
  },
  retailSummaryText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accountBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  accountBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  healthGoalsBlock: {
    marginTop: 24,
    gap: 8,
  },
  snackTasteBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 10,
  },
  snackTasteTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  snackTasteSegmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  snackTasteTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snackTasteTabLabel: {
    fontSize: 13,
  },
  snackTasteTabDesc: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },

  /* Inter-step Cascading Connection Cards */
  stepImpactCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 14,
    marginBottom: 6,
    gap: 8,
  },
  stepImpactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepImpactIcon: {
    fontSize: 22,
  },
  stepImpactTitle: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  stepImpactDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  stepImpactPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  stepImpactMiniPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  stepImpactMiniPillText: {
    fontSize: 10,
    fontWeight: '600',
  },

  /* Step 8 Pipeline Breadcrumb Card */
  pipelineSummaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  pipelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pipelineTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  pipelineStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pipelineStatusText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  pipelineStepsList: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  pipelineStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  pipelineStepNumber: {
    fontSize: 9,
    fontWeight: '900',
    color: '#F3C06D',
  },
  pipelineStepText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pipelineArrow: {
    fontSize: 10,
  },
});
