import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { SUPERMARKET_LIST } from '../../data/supermarkets';
import { DayOfWeek, DietType, FoodTier, MealSlot, SupermarketId } from '../../types';
import { BudgetSlider } from '../../components/BudgetSlider';
import { ApplianceSelector } from '../../components/ApplianceSelector';
import { LinearGradient } from 'expo-linear-gradient';
import { getRetailProductsByCategory } from '../../data/retailProducts';
import { useResponsive } from '../../hooks/useResponsive';
import { MOOD_OPTIONS_CATALOG } from '../../utils/moodCatalog';
import { DIET_OPTIONS_CATALOG, areDietsCompatible } from '../../utils/dietCompatibility';
import { getAppTheme } from '../../styles/theme';
import { glass } from '../../styles/glass';
import { EligibilityMeter } from '../../components/EligibilityMeter';
import { AllergenSelector } from '../../components/AllergenSelector';

interface OnboardingWizardProps {
  isDark: boolean;
  onPlanGenerated: () => void;
}

interface StepMeta {
  step: number;
  title: string;
  icon: string;
  shortDesc: string;
}

const ONBOARDING_STEPS_META: StepMeta[] = [
  { step: 1, title: 'Magazin', icon: '🏪', shortDesc: 'Alegere retail' },
  { step: 2, title: 'Persoane', icon: '👥', shortDesc: 'Porții' },
  { step: 3, title: 'Zile', icon: '📅', shortDesc: 'Zile de gătit' },
  { step: 4, title: 'Mese & Nivel', icon: '🍽️', shortDesc: 'Mese & Calitate' },
  { step: 5, title: 'Buget', icon: '💰', shortDesc: 'Optimizare cost' },
  { step: 6, title: 'Pofte', icon: '⚡', shortDesc: 'Stiluri & Vibe' },
  { step: 7, title: 'Dietă', icon: '🥗', shortDesc: 'Restricții' },
  { step: 8, title: 'Aparate', icon: '🍳', shortDesc: 'Dotare bucătărie' },
  { step: 9, title: 'Ronțăieli', icon: '🍿', shortDesc: 'Snacks & Băuturi' },
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Luni',
  tuesday: 'Marți',
  wednesday: 'Miercuri',
  thursday: 'Joi',
  friday: 'Vineri',
  saturday: 'Sâmbătă',
  sunday: 'Duminică',
};

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
];

const FOOD_TIER_OPTIONS: { id: FoodTier; label: string; icon: string; priceEst: string; desc: string }[] = [
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

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isDark, onPlanGenerated }) => {
  const {
    currentStep,
    maxVisitedStep,
    totalSteps,
    preferences,
    setSupermarket,
    setPeopleCount,
    toggleCookingDay,
    setCookingDays,
    setMealsPerDayCount,
    setMealSlots,
    setFoodTier,
    setBudget,
    toggleMoodTag,
    toggleDietType,
    toggleAvoidedAllergen,
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

  const handleNextOrFinish = () => {
    if (currentStep < totalSteps) {
      nextStep();
    } else {
      try {
        generatePlan();
        onPlanGenerated?.();
        setActiveView('generating');
      } catch (err) {
        console.error('[OnboardingWizard] generatePlan error:', err);
        const reason =
          err instanceof Error ? err.message : 'Nu s-a putut genera planul de mese.';
        showNotice('Eroare Planificare', reason, 'error');
      }
    }
  };

  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <View
      {...glass('root')}
      style={[styles.container, { backgroundColor: Platform.OS === 'web' ? 'transparent' : theme.background }]}
    >
      {/* Top Header: Stepped Water Flow for Desktop/Tablet, or Compact for Mobile */}
      {isLargeScreen ? (
        <View
          {...glass('card')}
          style={[styles.desktopHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
        >
          <View style={[styles.desktopHeaderInner, { maxWidth: containerMaxWidth }]}>
            {/* Top Brand & Status Line */}
            <View style={styles.desktopTopRow}>
              <View style={styles.brandGroup}>
                <Text style={[styles.logoText, { color: theme.text }]}>SmartMeal</Text>
                <View style={[styles.brandBadge, { backgroundColor: theme.surfaceTertiary, borderColor: theme.border, borderWidth: 1 }]}>
                  <Text style={[styles.brandBadgeText, { color: theme.text }]}>RO 🇷🇴</Text>
                </View>
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
                  style={[styles.desktopBackBtn, { borderColor: theme.border, backgroundColor: theme.accentBg }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.backButtonText, { color: theme.text }]}>← Înapoi</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 85 }} />
              )}
            </View>

            {/* Stepped Water Flow Nodes Bar ("ca un curs al apei în trepte") */}
            <View style={styles.waterFlowTrack}>
              {ONBOARDING_STEPS_META.map((stepItem, idx) => {
                const isCurrent = stepItem.step === currentStep;
                const isCompleted = stepItem.step < currentStep || (stepItem.step <= maxVisitedStep && !isCurrent);
                const isUpcoming = stepItem.step > maxVisitedStep;

                return (
                  <React.Fragment key={stepItem.step}>
                    {idx > 0 && (
                      <View style={[styles.flowStreamLine, { backgroundColor: isCompleted || isCurrent ? (isDark ? '#ffffff' : '#000000') : theme.border }]}>
                        {(isCompleted || isCurrent) && (
                          <LinearGradient
                            colors={isDark ? ['#ffffff', '#8e8e93'] : ['#000000', '#636366']}
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
                        isCurrent && [styles.stepNodeActive, { borderColor: isDark ? '#ffffff' : '#000000', backgroundColor: isDark ? '#ffffff' : '#000000' }],
                        isCompleted && [styles.stepNodeCompleted, { borderColor: theme.border, backgroundColor: theme.surfaceSecondary }],
                        isUpcoming && [styles.stepNodeUpcoming, { borderColor: theme.border, backgroundColor: theme.accentBg }],
                      ]}
                    >
                      <Text style={[styles.stepNodeIcon, isCurrent && { color: isDark ? '#000000' : '#ffffff' }, isCompleted && { color: theme.text, fontWeight: '900' }]}>
                        {isCompleted ? '✓' : stepItem.icon}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.stepNodeLabel,
                          { color: isCurrent ? (isDark ? '#000000' : '#ffffff') : isCompleted ? theme.text : theme.textMuted },
                          (isCurrent || isCompleted) && { fontWeight: '800' },
                        ]}
                      >
                        {stepItem.title}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
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

            <Text style={[styles.stepIndicator, { color: theme.textMuted }]}>
              Pasul {currentStep} din {totalSteps}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <LinearGradient
              colors={isDark ? ['#ffffff', '#8e8e93'] : ['#000000', '#636366']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBar, { width: `${progressPercent}%` }]}
            />
          </View>
        </View>
      )}

      {/* Step Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View
          {...glass('card')}
          style={[styles.contentCard, { backgroundColor: theme.card, borderColor: theme.border, maxWidth: containerMaxWidth }]}
        >
          {/* STEP 1: SUPERMARKET */}
          {currentStep === 1 && (
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

              <Text style={[styles.questionTitle, { color: theme.text }]}>Alege magazinul tău</Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Vom planifica meniul și coșul săptămânal în funcție de produsele și prețurile lui oficiale.
              </Text>

              <View style={[styles.supermarketGrid, isLargeScreen && styles.supermarketGridDesktop]}>
                {SUPERMARKET_LIST.map((market) => {
                  const isSelected = preferences.supermarketId === market.id;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
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
                        {isSelected && <Text style={styles.supermarketRadioCheck}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 2: PEOPLE COUNT */}
          {currentStep === 2 && (
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
                  style={[styles.circleBtn, { borderColor: theme.border, backgroundColor: theme.accentBg }]}
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
                  style={[styles.circleBtn, { borderColor: theme.border, backgroundColor: theme.accentBg }]}
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
                      key={num}
                      onPress={() => setPeopleCount(num)}
                      style={[
                        styles.peoplePresetPill,
                        {
                          backgroundColor: isActive ? (isDark ? '#ffffff' : '#000000') : theme.accentBg,
                          borderColor: isActive ? (isDark ? '#ffffff' : '#000000') : theme.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.peoplePresetText,
                          {
                            color: isActive ? (isDark ? '#000000' : '#ffffff') : theme.text,
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
            </View>
          )}

          {/* STEP 3: COOKING DAYS */}
          {currentStep === 3 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>În ce zile vei găti?</Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Alege zilele din săptămână pentru care dorești rețete planificate.
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
                          <Text style={[styles.dayCheckboxText, { color: theme.primaryText }]}>✓</Text>
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
                      accessibilityRole="button"
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
                        {DAY_LABELS[day]}
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
                        {isSelected && <Text style={[styles.dayCheckboxText, { color: theme.primaryText }]}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 4: MEALS PER DAY & FOOD TIER */}
          {currentStep === 4 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                Ce mese dorești să planifici în fiecare zi?
              </Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Selectează una, două sau toate cele trei mese principale (Mic Dejun, Prânz, Cină).
              </Text>

              <View style={[styles.mealCountGrid, isLargeScreen && styles.mealCountGridDesktop]}>
                {MEAL_MOMENT_OPTIONS.map((option) => {
                  const isSelected = preferences.mealSlots.includes(option.slot);
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={option.slot}
                      onPress={() => {
                        if (isSelected) {
                          const remaining = preferences.mealSlots.filter((s) => s !== option.slot);
                          if (remaining.filter((s) => ['breakfast', 'lunch', 'dinner'].includes(s)).length === 0) {
                            showNotice(
                              'Cel puțin o masă pe zi',
                              'Trebuie să selectezi cel puțin o masă principală pe zi (Mic Dejun, Prânz sau Cină) pentru a genera meniul.',
                              'info'
                            );
                            return;
                          }
                          setMealSlots(remaining);
                          const mainCount = remaining.filter((s) => ['breakfast', 'lunch', 'dinner'].includes(s)).length;
                          setMealsPerDayCount((mainCount >= 1 && mainCount <= 3 ? mainCount : 1) as 1 | 2 | 3);
                        } else {
                          const updated = [...preferences.mealSlots, option.slot];
                          setMealSlots(updated);
                          const mainCount = updated.filter((s) => ['breakfast', 'lunch', 'dinner'].includes(s)).length;
                          setMealsPerDayCount((mainCount >= 1 && mainCount <= 3 ? mainCount : 3) as 1 | 2 | 3);
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
                          <Text style={[styles.dayCheckboxText, { color: theme.primaryText }]}>✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.customizeSlotsHeading, { color: theme.textMuted, marginTop: 26 }]}>
                Nivelul ingredientelor & rețetelor (Food Tier):
              </Text>

              <View style={[styles.tierCardsGrid, isLargeScreen && styles.tierCardsGridDesktop]}>
                {FOOD_TIER_OPTIONS.map((tierOpt) => {
                  const isSelected = (preferences.foodTier || 'medium') === tierOpt.id;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
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
                          <Text style={[styles.tierCardPrice, { color: isSelected ? theme.primary : theme.textMuted }]}>
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
                          {isSelected && <Text style={[styles.extraCheckmark, { color: theme.primaryText }]}>✓</Text>}
                        </View>
                      </View>
                      <Text style={[styles.tierCardDesc, { color: theme.textMuted }]}>
                        {tierOpt.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 5: BUDGET SLIDER */}
          {currentStep === 5 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                Care este bugetul tău?
              </Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Suma totală pe care dorești să o cheltui la magazin pentru mesele din aceste zile.
              </Text>

              <BudgetSlider
                budget={preferences.budgetRon}
                peopleCount={preferences.peopleCount}
                daysCount={preferences.cookingDays.length}
                mealsPerDay={preferences.mealSlots.length}
                supermarketId={preferences.supermarketId}
                foodTier={preferences.foodTier}
                onChangeBudget={setBudget}
                isDark={isDark}
              />
            </View>
          )}

          {/* STEP 6: MOOD & STYLES (POFTE VARIATE) */}
          {currentStep === 6 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                Ce pofte ai săptămâna asta?
              </Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Alege stilurile culinare dorite (selectate: {preferences.moodTags.length}/5). Poți alege până la 5 pofte pentru un meniu săptămânal variat.
              </Text>

              <View style={[styles.moodGrid, isLargeScreen && styles.moodGridDesktop]}>
                {MOOD_OPTIONS_CATALOG.map((mood) => {
                  const isSelected = preferences.moodTags.includes(mood.id);
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      key={mood.id}
                      onPress={() => toggleMoodTag(mood.id)}
                      activeOpacity={0.75}
                      style={[
                        styles.moodCard,
                        isLargeScreen && styles.moodCardDesktop,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text style={styles.moodIcon}>{mood.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.moodLabel,
                            { color: isSelected ? theme.primary : theme.text, fontWeight: isSelected ? '800' : '600' },
                          ]}
                        >
                          {mood.label}
                        </Text>
                        <Text style={[styles.moodVibeText, { color: theme.textMuted }]}>
                          {mood.desc}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.moodCheckPill,
                          {
                            backgroundColor: isSelected ? theme.primary : 'transparent',
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        {isSelected && <Text style={{ color: theme.primaryText, fontSize: 11, fontWeight: '900' }}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 7: DIETARY RESTRICTIONS (MAX 2 COMPATIBLE) */}
          {currentStep === 7 && (() => {
            const selectedDiets: DietType[] =
              preferences.dietTypes && preferences.dietTypes.length > 0
                ? preferences.dietTypes
                : [preferences.dietType];

            return (
              <View style={styles.stepSection}>
                <Text style={[styles.questionTitle, { color: theme.text }]}>
                  Ai preferințe dietetice?
                </Text>
                <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                  Poți selecta până la 2 diete compatibile (selectate: {selectedDiets.length}/2). De exemplu: Vegetarian + Fără Gluten, sau Omnivor + Low-Carb.
                </Text>

                <View style={[styles.dietList, isLargeScreen && styles.dietListDesktop]}>
                  {DIET_OPTIONS_CATALOG.map((diet) => {
                    const isSelected = selectedDiets.includes(diet.id);
                    const isIncompatible =
                      !isSelected && selectedDiets.some((d) => !areDietsCompatible(d, diet.id));

                    return (
                      <TouchableOpacity
                        accessibilityRole="button"
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
                              <View style={[styles.incompatibleBadge, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2' }]}>
                                <Text style={{ fontSize: 10, color: '#ef4444', fontWeight: '800' }}>Incompatibil</Text>
                              </View>
                            )}
                            {isSelected && (
                              <View style={[styles.incompatibleBadge, { backgroundColor: theme.surfaceTertiary, borderColor: theme.border, borderWidth: 1 }]}>
                                <Text style={{ fontSize: 10, color: theme.text, fontWeight: '800' }}>Activ</Text>
                              </View>
                            )}
                          </View>
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
                          {isSelected && <Text style={{ color: theme.primaryText, fontSize: 12, fontWeight: '900' }}>✓</Text>}
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

                <EligibilityMeter preferences={preferences} isDark={isDark} />
              </View>
            );
          })()}

          {/* STEP 8: KITCHEN APPLIANCES */}
          {currentStep === 8 && (
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
            </View>
          )}

          {/* STEP 9: RETAIL SNACKS & BEVERAGES */}
          {currentStep === 9 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                🍿 Ronțăieli & 🥤 Băuturi de Magazin
              </Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Alege gustările pentru meci/film și băuturile preferate direct din catalogul oficial al magazinului.
              </Text>

              {/* Supermarket Banner */}
              <View style={[styles.retailSupermarketBanner, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
                <Text style={styles.retailBannerIcon}>🛒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.retailBannerTitle, { color: theme.primary }]}>
                    Catalog oficial {SUPERMARKET_LIST.find((s) => s.id === preferences.supermarketId)?.name || 'Supermarket'}
                  </Text>
                  <Text style={[styles.retailBannerSubtitle, { color: theme.textMuted }]}>
                    Prețuri reale extrase direct din revistele și rafturile {SUPERMARKET_LIST.find((s) => s.id === preferences.supermarketId)?.name}.
                  </Text>
                </View>
              </View>

              {/* SECTION 1: RONȚĂIELI SĂRATE */}
              <Text style={[styles.retailSectionHeading, { color: theme.text }]}>
                🍿 Chipsuri & Snacks sărate
              </Text>
              <View style={[styles.retailCardsGrid, isLargeScreen && styles.retailCardsGridDesktop]}>
                {getRetailProductsByCategory('snack_savory').map((prod) => {
                  const isSelected = (preferences.selectedSnackIds || []).includes(prod.id);
                  const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
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
                        <Text style={[styles.retailProductTitle, { color: isSelected ? theme.primary : theme.text }]}>
                          {prod.name}
                        </Text>
                        <Text style={[styles.retailProductBrand, { color: theme.textMuted }]}>
                          {prod.brand} • {prod.packageSize}
                        </Text>
                      </View>
                      <View style={styles.retailPriceBox}>
                        <Text style={[styles.retailProductPrice, { color: isSelected ? theme.primary : theme.text }]}>
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
                          {isSelected && <Text style={styles.retailCheckmark}>✓</Text>}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SECTION 2: DULCIURI & CIOCOLATĂ */}
              <Text style={[styles.retailSectionHeading, { color: theme.text, marginTop: 20 }]}>
                🍫 Ciocolată & Dulciuri
              </Text>
              <View style={[styles.retailCardsGrid, isLargeScreen && styles.retailCardsGridDesktop]}>
                {getRetailProductsByCategory('snack_sweet').map((prod) => {
                  const isSelected = (preferences.selectedSnackIds || []).includes(prod.id);
                  const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
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
                        <Text style={[styles.retailProductTitle, { color: isSelected ? theme.primary : theme.text }]}>
                          {prod.name}
                        </Text>
                        <Text style={[styles.retailProductBrand, { color: theme.textMuted }]}>
                          {prod.brand} • {prod.packageSize}
                        </Text>
                      </View>
                      <View style={styles.retailPriceBox}>
                        <Text style={[styles.retailProductPrice, { color: isSelected ? theme.primary : theme.text }]}>
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
                          {isSelected && <Text style={styles.retailCheckmark}>✓</Text>}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SECTION 3: BĂUTURI RĂCORITOARE & APĂ */}
              <Text style={[styles.retailSectionHeading, { color: theme.text, marginTop: 20 }]}>
                🥤 Băuturi Răcoritoare & Apă
              </Text>
              <View style={[styles.retailCardsGrid, isLargeScreen && styles.retailCardsGridDesktop]}>
                {getRetailProductsByCategory('drink_soft').map((prod) => {
                  const isSelected = (preferences.selectedDrinkIds || []).includes(prod.id);
                  const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
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
                        <Text style={[styles.retailProductTitle, { color: isSelected ? theme.primary : theme.text }]}>
                          {prod.name}
                        </Text>
                        <Text style={[styles.retailProductBrand, { color: theme.textMuted }]}>
                          {prod.brand} • {prod.packageSize}
                        </Text>
                      </View>
                      <View style={styles.retailPriceBox}>
                        <Text style={[styles.retailProductPrice, { color: isSelected ? theme.primary : theme.text }]}>
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
                          {isSelected && <Text style={styles.retailCheckmark}>✓</Text>}
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
                accessibilityRole="button"
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
                  {preferences.includeAlcohol && <Text style={styles.retailCheckmark}>✓</Text>}
                </View>
              </TouchableOpacity>

              {preferences.includeAlcohol && (
                <View style={[styles.retailCardsGrid, isLargeScreen && styles.retailCardsGridDesktop, { marginTop: 10 }]}>
                  {getRetailProductsByCategory('drink_alcoholic').map((prod) => {
                    const isSelected = (preferences.selectedDrinkIds || []).includes(prod.id);
                    const price = prod.typicalPriceRon[preferences.supermarketId] ?? 0;
                    return (
                      <TouchableOpacity
                        accessibilityRole="button"
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
                          <Text style={[styles.retailProductTitle, { color: isSelected ? theme.primary : theme.text }]}>
                            {prod.name}
                          </Text>
                          <Text style={[styles.retailProductBrand, { color: theme.textMuted }]}>
                            {prod.brand} • {prod.packageSize}
                          </Text>
                        </View>
                        <View style={styles.retailPriceBox}>
                          <Text style={[styles.retailProductPrice, { color: isSelected ? theme.primary : theme.text }]}>
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
                            {isSelected && <Text style={styles.retailCheckmark}>✓</Text>}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Total Extras Summary Pill */}
              {((preferences.selectedSnackIds?.length || 0) + (preferences.selectedDrinkIds?.length || 0) > 0) && (
                <View style={[styles.retailSummaryPill, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
                  <Text style={[styles.retailSummaryText, { color: theme.primary }]}>
                    ✨ {((preferences.selectedSnackIds?.length || 0) + (preferences.selectedDrinkIds?.length || 0))} gustări & băuturi selectate adăugate automat în lista de cumpărături
                  </Text>
                </View>
              )}
            </View>
          )}
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
            style={[styles.footerContinueWrap, { flex: isLargeScreen ? 1 : undefined, maxWidth: isLargeScreen ? 460 : '100%' }]}
          >
            <LinearGradient
              colors={isDark ? ['#ffffff', '#f2f2f7'] : ['#000000', '#1c1c1e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              <Text style={[styles.continueButtonText, { color: isDark ? '#000000' : '#ffffff' }]}>
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
    paddingVertical: 14,
    paddingHorizontal: 24,
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
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  desktopBackBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  waterFlowTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 4,
  },
  flowStreamLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  stepNode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 5,
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
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: '100%',
  },
  contentCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  stepSection: {
    width: '100%',
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    lineHeight: 30,
  },
  quickStartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  quickStartIcon: { fontSize: 20 },
  quickStartTitle: { fontSize: 14, fontWeight: '800' },
  quickStartSubtitle: { fontSize: 11, fontWeight: '500', marginTop: 2, lineHeight: 15 },
  quickStartArrow: { fontSize: 18, fontWeight: '800' },
  allergenBlock: {
    marginTop: 26,
    paddingTop: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.35)',
  },
  questionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
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
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    gap: 14,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    flex: 1,
    minWidth: 240,
  },
  retailCardsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
  },
  retailProductCardDesktop: {
    flexGrow: 1,
    flexShrink: 0,
    width: '31.5%',
    minWidth: 300,
    maxWidth: 440,
  },
  footerInner: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  footerBackBtn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBackText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footerContinueWrap: {
    width: '100%',
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
    paddingVertical: 30,
    gap: 28,
  },
  circleBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnText: {
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 32,
  },
  peopleValueBox: {
    alignItems: 'center',
    minWidth: 100,
  },
  peopleCountText: {
    fontSize: 54,
    fontWeight: '900',
    lineHeight: 58,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
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
    gap: 12,
    marginBottom: 20,
  },
  mealCountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    gap: 14,
  },
  mealCountIcon: {
    fontSize: 28,
  },
  mealCountInfo: {
    flex: 1,
  },
  mealCountTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  mealCountSubtitle: {
    fontSize: 12,
    lineHeight: 16,
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
    gap: 10,
    marginTop: 8,
  },
  tierCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  tierCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  tierCardIcon: {
    fontSize: 22,
  },
  tierCardTextContainer: {
    flex: 1,
  },
  tierCardTitle: {
    fontSize: 14,
  },
  tierCardPrice: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  tierCardDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 32,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodCard: {
    width: '48%',
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
    gap: 12,
  },
  dietCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    gap: 14,
  },
  dietIcon: {
    fontSize: 26,
  },
  dietInfo: {
    flex: 1,
  },
  dietLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  dietDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  continueButton: {
    width: '100%',
    maxWidth: 480,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
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
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  retailProductIcon: {
    fontSize: 24,
  },
  retailProductTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  retailProductBrand: {
    fontSize: 12,
    marginTop: 2,
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
});
