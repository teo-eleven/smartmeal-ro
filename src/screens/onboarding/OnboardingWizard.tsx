import React, { useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { glass } from '../../styles/glass';
import { USE_NATIVE_DRIVER } from '../../styles/motion';
import { getAppTheme } from '../../styles/theme';
import { ONBOARDING_STEPS_META } from './onboardingOptions';
import { useOnboardingState } from './useOnboardingState';
import { DietStep } from './steps/DietStep';
import { MoodStep } from './steps/MoodStep';
import { HouseholdStep } from './steps/HouseholdStep';
import { ScheduleStep } from './steps/ScheduleStep';
import { AppliancesStep } from './steps/AppliancesStep';
import { SupermarketStep } from './steps/SupermarketStep';
import { ExtrasStep } from './steps/ExtrasStep';
import { BudgetStep } from './steps/BudgetStep';

interface OnboardingWizardProps {
  isDark: boolean;
  onPlanGenerated: () => void;
  /**
   * Opens the account window. Eight steps allows users to sign out or
   * check which account is signed in at any point.
   */
  onOpenAccount?: () => void;
}

/** Web-only CSS that React Native's style types do not know about. */
const WEB_HIDDEN_SCROLLBAR = {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
} as unknown as ViewStyle;

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isDark,
  onPlanGenerated,
  onOpenAccount,
}) => {
  const state = useOnboardingState(onPlanGenerated);
  const {
    currentStep,
    goToStep,
    handleNextOrFinish,
    maxVisitedStep,
    prevStep,
    progressPercent,
    totalSteps,
  } = state;

  const { isDesktop, isTablet, contentMaxWidth } = useResponsive();
  const isLargeScreen = isDesktop || isTablet;
  const containerMaxWidth = Math.min(contentMaxWidth, 1180);

  const theme = getAppTheme(isDark);
  const stepProps = { ...state, isDark, isLargeScreen, theme, onOpenAccount, onPlanGenerated };

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
                              isCompleted || isCurrent ? theme.primary : theme.border,
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
                      accessibilityState={{
                        selected: isCurrent,
                        disabled: stepItem.step > maxVisitedStep,
                      }}
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
        style={[{ flex: 1 }, Platform.OS === 'web' && WEB_HIDDEN_SCROLLBAR]}
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
            {currentStep === 1 && <DietStep {...stepProps} />}
            {currentStep === 2 && <MoodStep {...stepProps} />}
            {currentStep === 3 && <HouseholdStep {...stepProps} />}
            {currentStep === 4 && <ScheduleStep {...stepProps} />}
            {currentStep === 5 && <AppliancesStep {...stepProps} />}
            {currentStep === 6 && <SupermarketStep {...stepProps} />}
            {currentStep === 7 && <ExtrasStep {...stepProps} />}
            {currentStep === 8 && <BudgetStep {...stepProps} />}
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
            accessibilityLabel={
              currentStep === totalSteps
                ? 'Generează Meniul Săptămânal'
                : 'Continuă la pasul următor'
            }
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
              <Text
                style={[
                  styles.continueButtonText,
                  { color: isDark ? '#131914' : '#ffffff', fontWeight: '800' },
                ]}
              >
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
});
