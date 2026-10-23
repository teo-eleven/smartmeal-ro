import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AllergenSelector } from '../../../components/AllergenSelector';
import { EligibilityMeter } from '../../../components/EligibilityMeter';
import { HEALTH_GOALS_CATALOG } from '../../../data/healthTags';
import { useAppStore } from '../../../store/useAppStore';
import { glass } from '../../../styles/glass';
import { DietType } from '../../../types';
import {
  DIET_OPTIONS_CATALOG,
  areDietsCompatible,
  isBaseDiet,
  isModifierDiet,
} from '../../../utils/dietCompatibility';
import { sharedStyles } from '../onboardingStyles';
import { OnboardingStepProps } from './stepProps';

/** Step 1: dietary restrictions & health */
export function DietStep({
  isDark,
  isLargeScreen,
  onPlanGenerated,
  preferences,
  quickStart,
  setActiveView,
  theme,
  toggleAvoidedAllergen,
  toggleDietType,
  toggleHealthGoalTag,
}: OnboardingStepProps) {
  const selectedDiets: DietType[] =
    preferences.dietTypes && preferences.dietTypes.length > 0
      ? preferences.dietTypes
      : [preferences.dietType];
  const activeBaseDiet: DietType =
    selectedDiets.find(isBaseDiet) || preferences.dietType || 'omnivore';

  const baseDietOptions = DIET_OPTIONS_CATALOG.filter((d) => isBaseDiet(d.id));
  const modifierDietOptions = DIET_OPTIONS_CATALOG.filter((d) => isModifierDiet(d.id));

  return (
    <View style={sharedStyles.stepSection}>
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
          <Text style={[styles.quickStartTitle, { color: theme.text }]}>Sari peste întrebări</Text>
          <Text style={[styles.quickStartSubtitle, { color: theme.textMuted }]}>
            Îți facem un plan pentru 2 persoane, cina, luni–vineri. Schimbi orice după.
          </Text>
        </View>
        <Text style={[styles.quickStartArrow, { color: theme.text }]}>→</Text>
      </TouchableOpacity>

      <Text style={[sharedStyles.questionTitle, { color: theme.text }]}>
        Ai preferințe dietetice?
      </Text>
      <Text style={[sharedStyles.questionSubtitle, { color: theme.textMuted }]}>
        Alege stilul tău alimentar de bază și adaugă opțional restricții speciale (cum ar fi Fără
        Gluten sau Low-Carb).
      </Text>

      {/* 1. Base Diets Section */}
      <Text
        style={[
          sharedStyles.customizeSlotsHeading,
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
                <Text style={[styles.dietLabel, { color: theme.text }]}>{diet.label}</Text>
                <Text style={[styles.dietDesc, { color: theme.textMuted }]}>{diet.desc}</Text>
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
          sharedStyles.customizeSlotsHeading,
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
                  <Text style={[styles.dietLabel, { color: theme.text }]}>{diet.label}</Text>
                  {isIncompatible && (
                    <View
                      style={[
                        styles.incompatibleBadge,
                        {
                          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 10, color: '#ef4444', fontWeight: '800' }}>
                        Incompatibil cu {activeBaseDiet === 'vegan' ? 'Vegan' : activeBaseDiet}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.dietDesc, { color: theme.textMuted }]}>{diet.desc}</Text>
              </View>
              <View
                style={[
                  sharedStyles.dayCheckbox,
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
        <Text style={[sharedStyles.questionTitle, { color: theme.text, fontSize: 17 }]}>
          Ai alergii alimentare?
        </Text>
        <Text style={[sharedStyles.questionSubtitle, { color: theme.textMuted }]}>
          Opțional, dar important: orice alergen bifat aici este eliminat complet din toate rețetele
          propuse.
        </Text>

        <AllergenSelector
          avoidedAllergens={preferences.avoidedAllergens || []}
          onToggleAllergen={toggleAvoidedAllergen}
          isDark={isDark}
        />
      </View>

      {/* HEALTH & WELLNESS GOALS */}
      <View style={styles.healthGoalsBlock}>
        <Text style={[sharedStyles.questionTitle, { color: theme.text, fontSize: 17 }]}>
          🩺 Obiective de sănătate & stil de viață
        </Text>
        <Text style={[sharedStyles.questionSubtitle, { color: theme.textMuted }]}>
          Opțional: filtre speciale nutriționale și medicale populare în România. Meniul recomandat
          va prioritiza aceste criterii.
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
                  <Text style={[styles.dietLabel, { color: theme.text }]}>{goal.labelRo}</Text>
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
}

const styles = StyleSheet.create({
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
  dietRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
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
  healthGoalsBlock: {
    marginTop: 24,
    gap: 8,
  },
});
