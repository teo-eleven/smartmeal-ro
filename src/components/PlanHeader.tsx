import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const theme = {
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#10b981',
    successBg: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
    successText: isDark ? '#34d399' : '#059669',
    warningBg: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
    warningText: isDark ? '#f87171' : '#dc2626',
    btnBg: isDark ? '#334155' : '#f1f5f9',
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Supermarket info row */}
      <View style={styles.topInfoRow}>
        <View style={styles.marketBadgeGroup}>
          <View style={[styles.marketDot, { backgroundColor: market.brandColor }]} />
          <Text style={[styles.marketName, { color: theme.text }]}>{market.name}</Text>
          <Text style={[styles.peopleBadge, { color: theme.textMuted }]}>
            • {plan.peopleCount} {plan.peopleCount === 1 ? 'persoană' : 'persoane'} •{' '}
            {plan.days.length} {plan.days.length === 1 ? 'zi' : 'zile'}
          </Text>
        </View>

        <TouchableOpacity onPress={onResetOnboarding} style={styles.resetLink}>
          <Text style={[styles.resetLinkText, { color: theme.primary }]}>Schimbă preferințele</Text>
        </TouchableOpacity>
      </View>

      {/* Main financial breakdown */}
      <View style={styles.financesRow}>
        <View style={styles.costBlock}>
          <Text style={[styles.label, { color: theme.textMuted }]}>Total estimat magazin:</Text>
          <View style={styles.valueWithCurrency}>
            <Text style={[styles.costAmount, { color: theme.text }]}>
              {plan.totalCartCostRon}
            </Text>
            <Text style={[styles.currency, { color: theme.textMuted }]}>lei</Text>
          </View>
        </View>

        <View style={styles.budgetBlock}>
          <Text style={[styles.label, { color: theme.textMuted }]}>Buget setat:</Text>
          <View style={styles.valueWithCurrency}>
            <Text style={[styles.budgetAmount, { color: theme.primary }]}>
              {plan.totalBudgetRon}
            </Text>
            <Text style={[styles.currency, { color: theme.textMuted }]}>lei</Text>
          </View>
        </View>
      </View>

      {/* Status banner */}
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
            ? `⚠️ Coșul depășește bugetul cu ${Math.abs(savings)} lei din cauza ambalajelor minime.`
            : `✓ Te încadrezi în buget! Economisești ~${savings} lei săptămâna aceasta.`}
        </Text>
      </View>

      {/* Action: Rebuild Plan */}
      <TouchableOpacity
        onPress={onRebuildPlan}
        style={[styles.rebuildBtn, { backgroundColor: theme.btnBg }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.rebuildBtnText, { color: theme.text }]}>
          🔄 Reconstruiește întregul plan
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  marketBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  marketDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  marketName: {
    fontSize: 14,
    fontWeight: '800',
  },
  peopleBadge: {
    fontSize: 12,
  },
  resetLink: {
    paddingVertical: 2,
  },
  resetLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  financesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  costBlock: {},
  budgetBlock: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  valueWithCurrency: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  costAmount: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  budgetAmount: {
    fontSize: 24,
    fontWeight: '800',
  },
  currency: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBanner: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  rebuildBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rebuildBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
