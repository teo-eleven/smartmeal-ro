import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DAY_LABELS_RO } from '../../../constants/days';
import { DayOfWeek } from '../../../types';
import { COOKING_DAY_PRESETS, MEAL_MOMENT_OPTIONS, FOOD_TIER_OPTIONS } from '../onboardingOptions';
import { sharedStyles } from '../onboardingStyles';
import { OnboardingStepProps } from './stepProps';

/** Step 4: cooking days & meals & food tier */
export function ScheduleStep({
  isDark,
  isLargeScreen,
  preferences,
  setCookingDays,
  setFoodTier,
  setMealSlots,
  showNotice,
  theme,
  toggleCookingDay,
}: OnboardingStepProps) {
  return (
    <View style={sharedStyles.stepSection}>
      <Text style={[sharedStyles.questionTitle, { color: theme.text }]}>Zile de gătit & Mese</Text>
      <Text style={[sharedStyles.questionSubtitle, { color: theme.textMuted }]}>
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
                  sharedStyles.dayCheckbox,
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
                  sharedStyles.dayCheckbox,
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

      <Text style={[sharedStyles.questionTitle, { color: theme.text }]}>
        Ce mese dorești să planifici în fiecare zi?
      </Text>
      <Text style={[sharedStyles.questionSubtitle, { color: theme.textMuted }]}>
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
                    remaining.filter((s) => ['breakfast', 'lunch', 'dinner'].includes(s)).length ===
                    0
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
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
                >
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
                  sharedStyles.dayCheckbox,
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

      <Text style={[sharedStyles.customizeSlotsHeading, { color: theme.textMuted, marginTop: 26 }]}>
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
                    <Text style={[styles.extraCheckmark, { color: theme.primaryText }]}>✓</Text>
                  )}
                </View>
              </View>
              <Text style={[styles.tierCardDesc, { color: theme.textMuted }]}>{tierOpt.desc}</Text>
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
              sharedStyles.stepImpactCard,
              { backgroundColor: theme.accentBg, borderColor: theme.border },
            ]}
          >
            <View style={sharedStyles.stepImpactHeaderRow}>
              <Text style={sharedStyles.stepImpactIcon}>📅</Text>
              <View style={{ flex: 1 }}>
                <Text style={[sharedStyles.stepImpactTitle, { color: theme.text }]}>
                  Structura planului: {totalMeals} mese ({totalPortions} porții totale)
                </Text>
                <Text style={[sharedStyles.stepImpactDesc, { color: theme.textMuted }]}>
                  {preferences.cookingDays.length} zile planificate cu{' '}
                  {preferences.mealSlots.length}{' '}
                  {preferences.mealSlots.length === 1 ? 'masă' : 'mese'}/zi pentru{' '}
                  {preferences.peopleCount}{' '}
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
                  🎯 Pofte în meniu:{' '}
                  {preferences.moodTags.length > 0
                    ? `${preferences.moodTags.length} stiluri alese`
                    : 'Diversificate'}
                </Text>
              </View>
              <View
                style={[
                  sharedStyles.stepImpactMiniPill,
                  { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                ]}
              >
                <Text style={[sharedStyles.stepImpactMiniPillText, { color: theme.text }]}>
                  🏷️ Calitate ingrediente: {tierName}
                </Text>
              </View>
              {preferences.moodTags.includes('sweet_treat') && (
                <View
                  style={[
                    sharedStyles.stepImpactMiniPill,
                    {
                      backgroundColor: isDark ? 'rgba(236, 72, 153, 0.16)' : '#fdf2f8',
                      borderColor: '#ec4899',
                    },
                  ]}
                >
                  <Text
                    style={[
                      sharedStyles.stepImpactMiniPillText,
                      { color: '#ec4899', fontWeight: '800' },
                    ]}
                  >
                    🍰{' '}
                    {preferences.mealSlots.includes('dessert')
                      ? 'Desert de Casă inclus'
                      : 'Poftă de Dulce (activabilă mai sus)'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  cookingDaysPresetRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
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
  dayName: {
    fontSize: 15,
    fontWeight: '700',
  },
  dayCheckboxText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
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
});
