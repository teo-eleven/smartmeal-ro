import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAppTheme } from '../styles/theme';
import { useBlockingWindow } from '../hooks/useBlockingWindow';

interface BudgetOverrunModalProps {
  visible: boolean;
  currentCostRon: number;
  currentBudgetRon: number;
  onConfirmIncrease: (newBudgetRon: number) => void;
  onDismiss: () => void;
  isDark: boolean;
}

export const BudgetOverrunModal: React.FC<BudgetOverrunModalProps> = ({
  visible,
  currentCostRon,
  currentBudgetRon,
  onConfirmIncrease,
  onDismiss,
  isDark,
}) => {
  useBlockingWindow(visible);
  const theme = getAppTheme(isDark);

  if (!visible) return null;

  let nextRoundBudget = Math.ceil(currentCostRon / 10) * 10;
  if (nextRoundBudget - currentCostRon < 3) {
    nextRoundBudget += 10;
  }

  const excessRon = Math.round((currentCostRon - currentBudgetRon) * 10) / 10;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Icon Badge */}
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isDark ? 'rgba(230, 167, 86, 0.18)' : '#fef3c7',
                borderColor: theme.primary,
              },
            ]}
          >
            <Text style={styles.iconText}>💰</Text>
          </View>

          {/* Title & Subtitle */}
          <Text style={[styles.title, { color: theme.text }]}>
            Bugetul a fost depășit
          </Text>

          <Text style={[styles.description, { color: theme.textMuted }]}>
            Preparatele și opțiunile alese ridică totalul coșului la{' '}
            <Text style={[styles.boldText, { color: theme.text }]}>
              ~{currentCostRon.toFixed(1)} lei
            </Text>
            , depășind bugetul tău săptămânal de{' '}
            <Text style={[styles.boldText, { color: theme.text }]}>
              {currentBudgetRon} lei
            </Text>{' '}
            cu{' '}
            <Text style={[styles.excessText, { color: '#f87171' }]}>
              +{excessRon.toFixed(1)} lei
            </Text>
            .
          </Text>

          {/* Proposal Card */}
          <View
            style={[
              styles.proposalCard,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.proposalLabel, { color: theme.textMuted }]}>
              Nivel sugerat rotund pentru întreaga listă:
            </Text>
            <Text style={[styles.proposalAmount, { color: theme.primary }]}>
              {nextRoundBudget} LEI
            </Text>
            <Text style={[styles.proposalHint, { color: theme.textMuted }]}>
              Acoperă 100% toate mesele și ingredientele fără compromisuri.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsGroup}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => onConfirmIncrease(nextRoundBudget)}
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryBtnText, { color: theme.primaryText }]}>
                ✓ Mărește bugetul la {nextRoundBudget} lei
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={onDismiss}
              style={[styles.secondaryBtn, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
              activeOpacity={0.75}
            >
              <Text style={[styles.secondaryBtnText, { color: theme.textMuted }]}>
                ✕ Păstrează bugetul actual ({currentBudgetRon} lei)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 25,
    elevation: 8,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  boldText: {
    fontWeight: '800',
  },
  excessText: {
    fontWeight: '900',
  },
  proposalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    gap: 4,
  },
  proposalLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  proposalAmount: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  proposalHint: {
    fontSize: 11,
    textAlign: 'center',
  },
  buttonsGroup: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
