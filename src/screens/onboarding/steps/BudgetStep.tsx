import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BudgetSlider } from '../../../components/BudgetSlider';
import { PreGenerationSummaryCard } from '../../../components/PreGenerationSummaryCard';
import { SUPERMARKET_LIST } from '../../../data/supermarkets';
import { DIET_OPTIONS_CATALOG } from '../../../utils/dietCompatibility';
import { sharedStyles } from '../onboardingStyles';
import { OnboardingStepProps } from './stepProps';

/** Step 8: budget slider & pre-generation summary */
export function BudgetStep({
  extrasCost,
  isDark,
  preferences,
  setBudget,
  theme,
}: OnboardingStepProps) {
  return (
    <View style={sharedStyles.stepSection}>
      <Text style={[sharedStyles.questionTitle, { color: theme.text }]}>
        Care este bugetul tău?
      </Text>
      <Text style={[sharedStyles.questionSubtitle, { color: theme.textMuted }]}>
        Suma totală pe care dorești să o cheltui la magazin pentru mesele și gustările din aceste
        zile.
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
              {preferences.dietTypes
                ?.map((d) => DIET_OPTIONS_CATALOG.find((o) => o.id === d)?.label || d)
                .join(', ') || 'Omnivor'}
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
              {(preferences.selectedSnackIds?.length || 0) +
                (preferences.selectedDrinkIds?.length || 0)}{' '}
              extras
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

      <PreGenerationSummaryCard preferences={preferences} isDark={isDark} extrasCost={extrasCost} />
    </View>
  );
}

const styles = StyleSheet.create({
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
