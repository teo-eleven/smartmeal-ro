import React from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MealPlan } from '../types';
import { useResponsive } from '../hooks/useResponsive';
import { getAppTheme } from '../styles/theme';

interface WeeklyMacroModalProps {
  visible: boolean;
  onClose: () => void;
  plan: MealPlan | null;
  isDark: boolean;
}

export const WeeklyMacroModal: React.FC<WeeklyMacroModalProps> = ({
  visible,
  onClose,
  plan,
  isDark,
}) => {
  const { contentMaxWidth } = useResponsive();

  if (!visible || !plan) return null;

  const totalDays = plan.days.length;
  const people = plan.peopleCount;

  // Aggregate macros
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  // Every meal, not just the day's headline dish. With three meal slots this read one dish
  // in three and then divided by the number of days, so the "medie zilnică" it presents as
  // nutritional guidance came out at about a third of what the week actually contains.
  plan.days
    .flatMap((day) => day.meals || [])
    .forEach((meal) => {
      const nutrition = meal.recipe.nutritionPerServing;
      totalCalories += nutrition.calories;
      totalProtein += nutrition.proteinGrams;
      totalCarbs += nutrition.carbsGrams;
      totalFat += nutrition.fatGrams;
    });

  const avgDailyCalories = Math.round(totalCalories / Math.max(1, totalDays));
  const avgDailyProtein = Math.round(totalProtein / Math.max(1, totalDays));
  const avgDailyCarbs = Math.round(totalCarbs / Math.max(1, totalDays));
  const avgDailyFat = Math.round(totalFat / Math.max(1, totalDays));

  // Calories from macros: P = 4 kcal/g, C = 4 kcal/g, F = 9 kcal/g
  const calFromProtein = avgDailyProtein * 4;
  const calFromCarbs = avgDailyCarbs * 4;
  const calFromFat = avgDailyFat * 9;
  const macroCalSum = calFromProtein + calFromCarbs + calFromFat || 1;

  const proteinPct = Math.round((calFromProtein / macroCalSum) * 100);
  const carbsPct = Math.round((calFromCarbs / macroCalSum) * 100);
  const fatPct = Math.max(0, 100 - proteinPct - carbsPct);

  // No "nutrition score". The one here was clamped to 65–98, so it could never report a
  // badly balanced week: a health claim built to look good, whatever the plan contained.

  const theme = getAppTheme(isDark);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Top Header */}
          <View style={[styles.topBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <View style={styles.titleGroup}>
              <Text style={[styles.title, { color: theme.text }]}>📊 Nutriție & Macro Săptămânale</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                {totalDays} zile ({people} {people === 1 ? 'persoană' : 'persoane'})
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Închide"
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeBtnText, { color: theme.text }]}>✕ Închide</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.contentCard}>
            {/* What the plan's own dishes add up to, per portion per day. A dinner-only week is
                not a day's intake, and calling it "calorii medii zilnice" read as one, and a
                dangerously low one. */}
            <View
              style={[
                styles.calorieCard,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f2f2f7',
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.calorieTexts}>
                <Text style={[styles.calorieCardLabel, { color: theme.text }]}>
                  DIN MESELE PLANIFICATE · O PORȚIE PE ZI
                </Text>
                <Text style={[styles.calorieCardVal, { color: theme.text }]}>
                  ~{avgDailyCalories} <Text style={styles.calorieUnit}>kcal</Text>
                </Text>
                <Text style={[styles.calorieCardSub, { color: theme.textMuted }]}>
                  Doar felurile din plan, în medie pe zi. Nu e tot ce mănânci într-o zi.
                </Text>
              </View>
            </View>

            {/* Macro Breakdown Bars */}
            <View style={[styles.macrosCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Distribuție Macronutrienți</Text>

              {/* Multi-segmented Macro Line */}
              <View style={styles.segmentedMacroTrack}>
                <View style={[styles.macroSegment, { width: `${proteinPct}%`, backgroundColor: '#3b82f6' }]} />
                <View style={[styles.macroSegment, { width: `${carbsPct}%`, backgroundColor: '#eab308' }]} />
                <View style={[styles.macroSegment, { width: `${fatPct}%`, backgroundColor: '#f59e0b' }]} />
              </View>

              {/* Macro Cards Grid */}
              <View style={styles.macroGrid}>
                {/* Protein */}
                <View style={[styles.macroItem, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
                  <View style={styles.macroItemHeader}>
                    <View style={[styles.macroDot, { backgroundColor: '#3b82f6' }]} />
                    <Text style={[styles.macroName, { color: theme.text }]}>Proteine</Text>
                  </View>
                  <Text style={[styles.macroAmount, { color: '#3b82f6' }]}>{avgDailyProtein}g</Text>
                  <Text style={[styles.macroPercent, { color: theme.textMuted }]}>
                    {proteinPct}% din calorii
                  </Text>
                </View>

                {/* Carbs */}
                <View style={[styles.macroItem, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
                  <View style={styles.macroItemHeader}>
                    <View style={[styles.macroDot, { backgroundColor: '#eab308' }]} />
                    <Text style={[styles.macroName, { color: theme.text }]}>Carbohidrați</Text>
                  </View>
                  <Text style={[styles.macroAmount, { color: '#eab308' }]}>{avgDailyCarbs}g</Text>
                  <Text style={[styles.macroPercent, { color: theme.textMuted }]}>
                    {carbsPct}% din calorii
                  </Text>
                </View>

                {/* Fats */}
                <View style={[styles.macroItem, { backgroundColor: theme.btnBg, borderColor: theme.border }]}>
                  <View style={styles.macroItemHeader}>
                    <View style={[styles.macroDot, { backgroundColor: '#f59e0b' }]} />
                    <Text style={[styles.macroName, { color: theme.text }]}>Grăsimi</Text>
                  </View>
                  <Text style={[styles.macroAmount, { color: '#f59e0b' }]}>{avgDailyFat}g</Text>
                  <Text style={[styles.macroPercent, { color: theme.textMuted }]}>
                    {fatPct}% din calorii
                  </Text>
                </View>
              </View>
            </View>

            {/* This card used to hold three fixed health claims, identical for every plan. What
                can honestly be said is where the numbers come from. */}
            <View style={[styles.insightsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.insightsTitle, { color: theme.text }]}>De unde vin cifrele</Text>
              <Text style={[styles.insightsBody, { color: theme.textMuted }]}>
                Valori estimate din rețete, pe o porție. Diferă după mărcile și cantitățile pe care
                le folosești. Nu înlocuiesc sfatul unui medic sau nutriționist.
              </Text>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Închide"
              onPress={onClose}
              style={[styles.doneBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.doneBtnText, { color: theme.primaryText }]}>✓ Închide & Înapoi la Meniu</Text>
            </TouchableOpacity>
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
    maxWidth: 620,
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
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
  },
  titleGroup: {
    flex: 1,
    paddingRight: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  closeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  contentCard: {
    width: '100%',
  },
  calorieCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  calorieCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  calorieCardVal: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  calorieUnit: {
    fontSize: 15,
    fontWeight: '600',
  },
  calorieCardSub: {
    fontSize: 12,
  },
  calorieTexts: {
    flex: 1,
  },
  macrosCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 14,
  },
  segmentedMacroTrack: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 18,
  },
  macroSegment: {
    height: '100%',
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroItem: {
    flexGrow: 1,
    flexBasis: 88,
    minWidth: 88,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  macroItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
    flexWrap: 'nowrap',
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  macroName: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  macroAmount: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  macroPercent: {
    fontSize: 11,
  },
  insightsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  insightsBody: {
    fontSize: 12,
    lineHeight: 20,
  },
  doneBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
});
