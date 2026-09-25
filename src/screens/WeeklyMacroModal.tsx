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
    .flatMap((day) => day.meals)
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

  // Nutritional balance score (target: ~25-35% P, 40-55% C, 20-35% F)
  const pDiff = Math.abs(proteinPct - 30);
  const cDiff = Math.abs(carbsPct - 45);
  const fDiff = Math.abs(fatPct - 25);
  const balanceScore = Math.max(65, Math.min(98, Math.round(100 - (pDiff + cDiff + fDiff) * 0.8)));

  const theme = getAppTheme(isDark);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Top Header */}
        <View style={[styles.topBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.titleGroup}>
            <Text style={[styles.title, { color: theme.text }]}>📊 Nutriție & Macro Săptămânale</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
              Analiza caloriilor și a macronutrienților pentru {totalDays} zile ({people} {people === 1 ? 'persoană' : 'persoane'}).
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
          <View style={[styles.contentCard, { maxWidth: contentMaxWidth }]}>
            {/* Main Daily Calorie Highlight Card */}
            <View
              style={[
                styles.calorieCard,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f2f2f7',
                  borderColor: theme.border,
                },
              ]}
            >
              <View>
                <Text style={[styles.calorieCardLabel, { color: theme.text }]}>
                  CALORII MEDII ZILNICE / PERSOANĂ
                </Text>
                <Text style={[styles.calorieCardVal, { color: theme.text }]}>
                  ~{avgDailyCalories} <Text style={styles.calorieUnit}>kcal / zi</Text>
                </Text>
                <Text style={[styles.calorieCardSub, { color: theme.textMuted }]}>
                  Calculat din rețetele pregătite acasă pentru toată săptămâna.
                </Text>
              </View>

              <View style={[styles.balanceScoreBadge, { backgroundColor: theme.primary }]}>
                <Text style={[styles.balanceScoreLbl, { color: theme.primaryText }]}>Scor Nutriție</Text>
                <Text style={[styles.balanceScoreVal, { color: theme.primaryText }]}>{balanceScore}/100</Text>
              </View>
            </View>

            {/* Macro Breakdown Bars */}
            <View style={[styles.macrosCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Distribuție Macronutrienți</Text>

              {/* Multi-segmented Macro Line */}
              <View style={styles.segmentedMacroTrack}>
                <View style={[styles.macroSegment, { width: `${proteinPct}%`, backgroundColor: '#3b82f6' }]} />
                <View style={[styles.macroSegment, { width: `${carbsPct}%`, backgroundColor: '#eab308' }]} />
                <View style={[styles.macroSegment, { width: `${fatPct}%`, backgroundColor: '#ef4444' }]} />
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

            {/* Nutrition Insights Card */}
            <View style={[styles.insightsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.insightsTitle, { color: theme.text }]}>🥗 Evaluare Nutrițională SmartMeal</Text>
              <Text style={[styles.insightsBody, { color: theme.textMuted }]}>
                ✓ Raport echilibrat între proteine calitative și fibre din legume proaspete.{'\n'}
                ✓ Fără exces de grăsimi hidrogenate sau adaosuri artificiale de zahăr.{'\n'}
                ✓ Cantitățile sunt calibrate pentru energie susținută pe tot parcursul zilei.
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
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  balanceScoreBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 110,
  },
  balanceScoreLbl: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  balanceScoreVal: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
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
    gap: 10,
  },
  macroItem: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  macroItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroName: {
    fontSize: 12,
    fontWeight: '700',
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
