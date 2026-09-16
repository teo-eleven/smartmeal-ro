import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { SUPERMARKET_LIST } from '../../data/supermarkets';
import { DayOfWeek, DietType, MoodTag, SupermarketId } from '../../types';
import { BudgetSlider } from '../../components/BudgetSlider';
import { ApplianceSelector } from '../../components/ApplianceSelector';
import { LinearGradient } from 'expo-linear-gradient';

interface OnboardingWizardProps {
  isDark: boolean;
  onPlanGenerated: () => void;
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

const MOOD_OPTIONS: { id: MoodTag; label: string; icon: string }[] = [
  { id: 'speedy', label: 'Mese Rapide', icon: '⚡' },
  { id: 'low_calorie', label: 'Low Calorie', icon: '🥗' },
  { id: 'family_fav', label: 'Favoritele Familiei', icon: '👨‍👩‍👧' },
  { id: 'healthy_comfort', label: 'Healthy Comfort', icon: '🍲' },
  { id: 'fakeaway', label: 'Fakeaway (Fast Food acasă)', icon: '🍔' },
  { id: 'high_protein', label: 'Bogat în Proteine', icon: '💪' },
  { id: 'romanian_classic', label: 'Tradițional Românesc', icon: '🇷🇴' },
];

const DIET_OPTIONS: { id: DietType; label: string; icon: string; desc: string }[] = [
  { id: 'omnivore', label: 'Fără restricții (Omnivor)', icon: '🍖', desc: 'Carne, pește, legume și lactate' },
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥕', desc: 'Fără carne sau pește, cu lactate și ouă' },
  { id: 'vegan', label: 'Vegan (De post)', icon: '🌱', desc: '100% ingrediente pe bază de plante' },
  { id: 'pescatarian', label: 'Pescatarian', icon: '🐟', desc: 'Pește, fructe de mare și legume' },
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isDark, onPlanGenerated }) => {
  const {
    currentStep,
    totalSteps,
    preferences,
    setSupermarket,
    setPeopleCount,
    toggleCookingDay,
    setBudget,
    toggleMoodTag,
    setDietType,
    toggleAppliance,
    nextStep,
    prevStep,
    generatePlan,
    setActiveView,
  } = useAppStore();

  const theme = {
    background: isDark ? '#0f172a' : '#f8fafc',
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    primary: '#10b981',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
    border: isDark ? '#334155' : '#e2e8f0',
    accentBg: isDark ? '#1e293b' : '#ffffff',
  };

  const handleNextOrFinish = () => {
    if (currentStep < totalSteps) {
      nextStep();
    } else {
      setActiveView('generating');
      setTimeout(() => {
        generatePlan();
        onPlanGenerated();
      }, 1800);
    }
  };

  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header & Progress */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.topRow}>
          {currentStep > 1 ? (
            <TouchableOpacity onPress={prevStep} style={styles.backButton}>
              <Text style={[styles.backButtonText, { color: theme.text }]}>← Înapoi</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.logoText, { color: theme.primary }]}>SmartMeal</Text>
          )}

          <Text style={[styles.stepIndicator, { color: theme.textMuted }]}>
            Pasul {currentStep} din {totalSteps}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <LinearGradient
            colors={['#10b981', '#06b6d4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBar, { width: `${progressPercent}%` }]}
          />
        </View>
      </View>

      {/* Step Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.contentCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* STEP 1: SUPERMARKET */}
          {currentStep === 1 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>Alege magazinul tău</Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Vom planifica meniul și coșul săptămânal în funcție de produsele și prețurile lui.
              </Text>

              <View style={styles.supermarketGrid}>
                {SUPERMARKET_LIST.map((market) => {
                  const isSelected = preferences.supermarketId === market.id;
                  return (
                    <TouchableOpacity
                      key={market.id}
                      onPress={() => setSupermarket(market.id as SupermarketId)}
                      activeOpacity={0.7}
                      style={[
                        styles.supermarketCard,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <View style={[styles.marketBadge, { backgroundColor: market.brandColor }]}>
                        <Text style={styles.marketBadgeText}>{market.name[0]}</Text>
                      </View>
                      <Text style={[styles.supermarketName, { color: theme.text }]}>
                        {market.name}
                      </Text>
                      <Text style={[styles.supermarketTagline, { color: theme.textMuted }]}>
                        {market.tagline}
                      </Text>
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
                  onPress={() => setPeopleCount(preferences.peopleCount + 1)}
                  style={[styles.circleBtn, { borderColor: theme.border, backgroundColor: theme.accentBg }]}
                >
                  <Text style={[styles.circleBtnText, { color: theme.text }]}>+</Text>
                </TouchableOpacity>
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

              <View style={styles.daysCounterBadge}>
                <Text style={[styles.daysCounterText, { color: theme.primary }]}>
                  {preferences.cookingDays.length}{' '}
                  {preferences.cookingDays.length === 1 ? 'zi selectată' : 'zile selectate'}
                </Text>
              </View>

              <View style={styles.daysList}>
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
                      key={day}
                      onPress={() => toggleCookingDay(day)}
                      style={[
                        styles.dayRow,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayRowText,
                          { color: isSelected ? theme.primary : theme.text, fontWeight: isSelected ? '700' : '500' },
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
                        {isSelected && <Text style={styles.dayCheckmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 4: BUDGET SLIDER */}
          {currentStep === 4 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                Care este bugetul tău?
              </Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Suma totală pe care dorești să o cheltui la magazin pentru cinele din aceste zile.
              </Text>

              <BudgetSlider
                budget={preferences.budgetRon}
                peopleCount={preferences.peopleCount}
                daysCount={preferences.cookingDays.length}
                supermarketId={preferences.supermarketId}
                onChangeBudget={setBudget}
                isDark={isDark}
              />
            </View>
          )}

          {/* STEP 5: MOOD & STYLES */}
          {currentStep === 5 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                Ce pofte ai săptămâna asta?
              </Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Alege până la 3 stiluri culinare preferate (selectate:{' '}
                {preferences.moodTags.length}/3).
              </Text>

              <View style={styles.moodGrid}>
                {MOOD_OPTIONS.map((mood) => {
                  const isSelected = preferences.moodTags.includes(mood.id);
                  return (
                    <TouchableOpacity
                      key={mood.id}
                      onPress={() => toggleMoodTag(mood.id)}
                      style={[
                        styles.moodCard,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.accentBg,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text style={styles.moodIcon}>{mood.icon}</Text>
                      <Text
                        style={[
                          styles.moodLabel,
                          { color: isSelected ? theme.primary : theme.text, fontWeight: isSelected ? '700' : '600' },
                        ]}
                      >
                        {mood.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 6: DIETARY RESTRICTIONS */}
          {currentStep === 6 && (
            <View style={styles.stepSection}>
              <Text style={[styles.questionTitle, { color: theme.text }]}>
                Ai preferințe dietetice?
              </Text>
              <Text style={[styles.questionSubtitle, { color: theme.textMuted }]}>
                Vom exclude automat ingredientele care nu corespund dietei tale.
              </Text>

              <View style={styles.dietList}>
                {DIET_OPTIONS.map((diet) => {
                  const isSelected = preferences.dietType === diet.id;
                  return (
                    <TouchableOpacity
                      key={diet.id}
                      onPress={() => setDietType(diet.id)}
                      style={[
                        styles.dietCard,
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
                        {isSelected && <View style={styles.radioInnerDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 7: KITCHEN APPLIANCES */}
          {currentStep === 7 && (
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
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Floating Action Bar */}
      <View style={[styles.footer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity
          onPress={handleNextOrFinish}
          activeOpacity={0.85}
          style={{ width: '100%', maxWidth: 480 }}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>
              {currentStep === totalSteps ? '✨ Generează Meniul Săptămânal' : 'Continuă →'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  contentCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
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
  questionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  supermarketGrid: {
    gap: 12,
  },
  supermarketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    gap: 14,
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
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
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
  dayRowText: {
    fontSize: 15,
  },
  dayCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCheckmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 85,
    gap: 6,
  },
  moodIcon: {
    fontSize: 24,
  },
  moodLabel: {
    fontSize: 13,
    textAlign: 'center',
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
  dietRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowColor: '#10b981',
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
});
