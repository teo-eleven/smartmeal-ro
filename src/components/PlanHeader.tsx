import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MealPlan } from '../types';
import { SUPERMARKETS } from '../data/supermarkets';

interface PlanHeaderProps {
  plan: MealPlan;
  onRebuildPlan: () => void;
  onResetOnboarding: () => void;
  isDark: boolean;
}

export const PlanHeader: React.FC<PlanHeaderProps> = ({
  plan,
  onRebuildPlan,
  onResetOnboarding,
  isDark,
}) => {
  const market = SUPERMARKETS[plan.supermarketId];
  const savings = Math.round((plan.totalBudgetRon - plan.totalCartCostRon) * 10) / 10;
  const isOverBudget = plan.totalCartCostRon > plan.totalBudgetRon;
  const percentageUsed = Math.min(
    100,
    Math.round((plan.totalCartCostRon / (plan.totalBudgetRon || 1)) * 100)
  );

  const theme = {
    card: isDark ? '#131d31' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    primary: '#10b981',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ecfdf5',
    successBg: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
    successText: isDark ? '#34d399' : '#059669',
    warningBg: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
    warningText: isDark ? '#f87171' : '#dc2626',
    btnBg: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
    trackBg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Supermarket Brand & Quick Controls */}
      <View style={styles.topRow}>
        <View style={styles.marketBadgeGroup}>
          <View style={[styles.marketDot, { backgroundColor: market.brandColor }]} />
          <Text style={[styles.marketName, { color: theme.text }]}>{market.name}</Text>
          <View style={[styles.pill, { backgroundColor: theme.btnBg }]}>
            <Text style={[styles.pillText, { color: theme.textMuted }]}>
              👥 {plan.peopleCount} {plan.peopleCount === 1 ? 'persoană' : 'persoane'}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: theme.btnBg }]}>
            <Text style={[styles.pillText, { color: theme.textMuted }]}>
              📅 {plan.days.length} {plan.days.length === 1 ? 'zi' : 'zile'}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={onResetOnboarding} style={styles.resetLink}>
          <Text style={[styles.resetLinkText, { color: theme.primary }]}>Filtre ⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Futuristic Financial Visual Display */}
      <View style={styles.financeContainer}>
        <View style={styles.financeItem}>
          <Text style={[styles.label, { color: theme.textMuted }]}>COST TOTAL ESTIMAT</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.mainAmount, { color: theme.text }]}>
              {plan.totalCartCostRon}
            </Text>
            <Text style={[styles.currencyLabel, { color: theme.textMuted }]}>LEI</Text>
          </View>
          <Text style={[styles.subLabel, { color: theme.textMuted }]}>la casa de marcat</Text>
        </View>

        <View style={styles.dividerVertical} />

        <View style={styles.financeItem}>
          <Text style={[styles.label, { color: theme.textMuted }]}>BUGET SĂPTĂMÂNAL</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.mainAmount, { color: theme.primary }]}>
              {plan.totalBudgetRon}
            </Text>
            <Text style={[styles.currencyLabel, { color: theme.textMuted }]}>LEI</Text>
          </View>
          <Text style={[styles.subLabel, { color: theme.primary }]}>
            {savings >= 0 ? `Economisești ~${savings} lei` : `Depășire de ${Math.abs(savings)} lei`}
          </Text>
        </View>
      </View>

      {/* Sleek Budget Progress Gauge */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
            Utilizare buget: <Text style={{ fontWeight: '800', color: theme.text }}>{percentageUsed}%</Text>
          </Text>
          <Text style={[styles.progressStatus, { color: isOverBudget ? '#ef4444' : '#10b981' }]}>
            {isOverBudget ? 'Peste buget' : 'În buget ✓'}
          </Text>
        </View>

        <View style={[styles.progressBarTrack, { backgroundColor: theme.trackBg }]}>
          <LinearGradient
            colors={isOverBudget ? ['#f59e0b', '#ef4444'] : ['#10b981', '#06b6d4']}
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
          { backgroundColor: isOverBudget ? theme.warningBg : theme.successBg },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            { color: isOverBudget ? theme.warningText : theme.successText },
          ]}
        >
          {isOverBudget
            ? `⚠️ Coșul depășește bugetul cu ${Math.abs(savings)} lei datorită achiziționării pachetelor minime din magazin.`
            : `✓ Plan optimizat! Mese delicioase și variate în limita a ${plan.totalBudgetRon} lei.`}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={onRebuildPlan}
          style={[styles.rebuildBtn, { backgroundColor: theme.primaryLight }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.rebuildBtnText, { color: theme.primary }]}>
            ✨ Re-amestecă Meniul Săptămânal
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
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
