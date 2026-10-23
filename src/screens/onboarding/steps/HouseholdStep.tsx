import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DIET_OPTIONS_CATALOG } from '../../../utils/dietCompatibility';
import { sharedStyles } from '../onboardingStyles';
import { OnboardingStepProps } from './stepProps';

/** Step 3: people count */
export function HouseholdStep({ preferences, setPeopleCount, theme }: OnboardingStepProps) {
  return (
    <View style={sharedStyles.stepSection}>
      <Text style={[sharedStyles.questionTitle, { color: theme.text }]}>
        Pentru câte persoane gătești?
      </Text>
      <Text style={[sharedStyles.questionSubtitle, { color: theme.textMuted }]}>
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
          sharedStyles.stepImpactCard,
          { backgroundColor: theme.accentBg, borderColor: theme.border },
        ]}
      >
        <View style={sharedStyles.stepImpactHeaderRow}>
          <Text style={sharedStyles.stepImpactIcon}>👨‍👩‍👧</Text>
          <View style={{ flex: 1 }}>
            <Text style={[sharedStyles.stepImpactTitle, { color: theme.text }]}>
              Scalare automată: exact ×{preferences.peopleCount}{' '}
              {preferences.peopleCount === 1 ? 'porție' : 'porții'} per masă
            </Text>
            <Text style={[sharedStyles.stepImpactDesc, { color: theme.textMuted }]}>
              Gramajele ingredientelor și cantitățile din lista de cumpărături vor fi multiplicate
              exact pentru {preferences.peopleCount}{' '}
              {preferences.peopleCount === 1 ? 'persoană' : 'persoane'}.
            </Text>
          </View>
        </View>

        <View style={sharedStyles.stepImpactPillsRow}>
          <View
            style={[
              sharedStyles.stepImpactMiniPill,
              { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
            ]}
          >
            <Text style={[sharedStyles.stepImpactMiniPillText, { color: theme.text }]}>
              🥗 Dieta ta:{' '}
              {preferences.dietTypes
                ?.map((d) => DIET_OPTIONS_CATALOG.find((o) => o.id === d)?.label || d)
                .join(', ') || 'Omnivor'}
            </Text>
          </View>
          <View
            style={[
              sharedStyles.stepImpactMiniPill,
              { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
            ]}
          >
            <Text style={[sharedStyles.stepImpactMiniPillText, { color: theme.text }]}>
              ✨ Pofte:{' '}
              {preferences.moodTags.length > 0
                ? `${preferences.moodTags.length} selectate`
                : 'Diverse'}
            </Text>
          </View>
          <View
            style={[
              sharedStyles.stepImpactMiniPill,
              { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
            ]}
          >
            <Text style={[sharedStyles.stepImpactMiniPillText, { color: theme.text }]}>
              ⚖️ Fără risipă de alimente
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
