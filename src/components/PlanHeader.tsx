import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MealPlan } from '../types';
import { SUPERMARKETS } from '../data/supermarkets';
import { getAppTheme } from '../styles/theme';
import { buildBudgetMessageRo, summarizeBudget } from '../utils/budgetMessaging';
import { glass } from '../styles/glass';

interface PlanHeaderProps {
  plan: MealPlan;
  onRebuildPlan: () => void;
  onResetOnboarding: () => void;
  onOpenFilters?: () => void;
  onRaiseBudget?: (amountRon: number) => void;
  isDark: boolean;
}

export const PlanHeader: React.FC<PlanHeaderProps> = ({
  plan,
  onRebuildPlan,
  onResetOnboarding,
  onOpenFilters,
  onRaiseBudget,
  isDark,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [shuffledFeedback, setShuffledFeedback] = useState(false);

  const handleRebuild = () => {
    Animated.sequence([
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(spinAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();

    onRebuildPlan();
    setShuffledFeedback(true);
    setTimeout(() => setShuffledFeedback(false), 2400);
  };

  const market = SUPERMARKETS[plan.supermarketId];
  const savings = Math.round((plan.totalBudgetRon - plan.totalCartCostRon) * 10) / 10;
  const isOverBudget = plan.totalCartCostRon > plan.totalBudgetRon;
  const budgetSummary = summarizeBudget(plan);
  const budgetMessage = buildBudgetMessageRo(budgetSummary, plan.totalBudgetRon);
  const minimumRon = budgetSummary.minimumAchievableRon;
  const percentageUsed = Math.min(
    100,
    Math.round((plan.totalCartCostRon / (plan.totalBudgetRon || 1)) * 100)
  );

  const theme = getAppTheme(isDark);

  return (
    <View
      {...glass('card')}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      {/* Supermarket Brand & Quick Controls */}
      <View style={styles.topRow}>
        <View style={styles.marketBadgeGroup}>
          <View style={[styles.marketDot, { backgroundColor: market.brandColor }]} />
          <Text style={[styles.marketName, { color: theme.text }]}>{market.name}</Text>
          <View
            {...glass('pill')}
            style={[styles.pill, { backgroundColor: theme.btnBg }]}
          >
            <Text style={[styles.pillText, { color: theme.textMuted }]}>
              👥 {plan.peopleCount} {plan.peopleCount === 1 ? 'persoană' : 'persoane'}
            </Text>
          </View>
          <View
            {...glass('pill')}
            style={[styles.pill, { backgroundColor: theme.btnBg }]}
          >
            <Text style={[styles.pillText, { color: theme.textMuted }]}>
              📅 {plan.days.length} {plan.days.length === 1 ? 'zi' : 'zile'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={onOpenFilters || onResetOnboarding}
          {...glass('pill')}
          style={[
            styles.resetLink,
            {
              backgroundColor: theme.btnBg,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 10,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text style={[styles.resetLinkText, { color: theme.text }]}>Filtre ⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Futuristic Financial Visual Display */}
      <View style={styles.financeContainer}>
        <View style={styles.financeItem}>
          <Text style={[styles.label, { color: theme.textMuted }]}>COST TOTAL ESTIMAT</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.mainAmount, { color: theme.text }]}>{plan.totalCartCostRon}</Text>
            <Text style={[styles.currencyLabel, { color: theme.textMuted }]}>LEI</Text>
          </View>
          <Text style={[styles.subLabel, { color: theme.textMuted }]}>la casa de marcat</Text>
        </View>

        <View style={styles.dividerVertical} />

        <View style={styles.financeItem}>
          <Text style={[styles.label, { color: theme.textMuted }]}>BUGET SĂPTĂMÂNAL</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.mainAmount, { color: theme.text }]}>{plan.totalBudgetRon}</Text>
            <Text style={[styles.currencyLabel, { color: theme.textMuted }]}>LEI</Text>
          </View>
          <Text style={[styles.subLabel, { color: savings >= 0 ? theme.text : '#ef4444' }]}>
            {savings >= 0 ? `Economisești ~${savings} lei` : `Depășire de ${Math.abs(savings)} lei`}
          </Text>
        </View>
      </View>

      {/* Sleek Budget Progress Gauge */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
            Utilizare buget:{' '}
            <Text style={{ fontWeight: '800', color: theme.text }}>{percentageUsed}%</Text>
          </Text>
          <Text style={[styles.progressStatus, { color: isOverBudget ? '#ef4444' : theme.text }]}>
            {isOverBudget ? 'Peste buget' : 'În buget ✓'}
          </Text>
        </View>

        <View style={[styles.progressBarTrack, { backgroundColor: theme.trackBg }]}>
          <LinearGradient
            colors={
              isOverBudget
                ? ['#f59e0b', '#ef4444']
                : isDark
                  ? ['#ffffff', '#a1a1a6']
                  : ['#000000', '#3a3a3c']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${percentageUsed}%` }]}
          />
        </View>
      </View>

      {/* Status Notice Banner */}
      <View
        style={[
          styles.statusBanner,
          {
            backgroundColor: isOverBudget ? theme.warningBg : theme.surfaceSecondary,
            borderColor: theme.border,
            borderWidth: 1,
          },
        ]}
      >
        <Text style={[styles.statusText, { color: isOverBudget ? theme.warningText : theme.text }]}>
          {budgetMessage}
        </Text>

        {minimumRon !== null && onRaiseBudget && (
          <TouchableOpacity
            onPress={() => onRaiseBudget(minimumRon)}
            accessibilityRole="button"
            accessibilityLabel={`Ridică bugetul la ${minimumRon} lei`}
            style={[styles.raiseBudgetBtn, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.raiseBudgetBtnText, { color: theme.primaryText }]}>
              Ridică bugetul la {minimumRon} lei
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleRebuild}
          {...glass('btn-primary')}
          style={[
            styles.rebuildBtn,
            {
              backgroundColor: shuffledFeedback
                ? theme.surfaceTertiary
                : isDark
                  ? '#ffffff'
                  : '#000000',
              borderColor: isDark ? '#ffffff' : '#000000',
              borderWidth: 1,
            },
          ]}
          activeOpacity={0.75}
        >
          <Animated.Text
            style={[
              {
                fontSize: 18,
                marginRight: 8,
                transform: [
                  {
                    rotate: spinAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            ✨
          </Animated.Text>
          <Text
            style={[
              styles.rebuildBtnText,
              {
                color: shuffledFeedback ? theme.text : isDark ? '#000000' : '#ffffff',
                fontWeight: '800',
              },
            ]}
          >
            {shuffledFeedback ? '✓ Meniu Re-amestecat cu Succes!' : 'Re-amestecă Meniul Săptămânal'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 18,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  marketBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  marketDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  marketName: {
    fontSize: 15,
    fontWeight: '800',
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resetLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  financeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  financeItem: {
    flex: 1,
  },
  dividerVertical: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginHorizontal: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  mainAmount: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  currencyLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
  },
  progressStatus: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statusBanner: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  raiseBudgetBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  raiseBudgetBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionRow: {
    width: '100%',
  },
  rebuildBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rebuildBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
