import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UserPreferences } from '../types';
import {
  checkPlanFeasibility,
  suggestAppliancesToUnlock,
  getApplianceLabelRo,
} from '../engine/plannerEngine';
import { getAppTheme } from '../styles/theme';
import { glass } from '../styles/glass';

interface EligibilityMeterProps {
  preferences: UserPreferences;
  isDark: boolean;
}

/** Below this the week starts repeating dishes, so it is worth warning about. */
const COMFORTABLE_RECIPE_COUNT = 12;

/**
 * Shows, while the user is still choosing, how many recipes their current answers leave on
 * the table. Discovering that a combination is impossible after nine steps is the kind of
 * dead end this is meant to prevent.
 */
export const EligibilityMeter: React.FC<EligibilityMeterProps> = ({ preferences, isDark }) => {
  const theme = getAppTheme(isDark);
  const feasibility = checkPlanFeasibility(preferences);
  const count = feasibility.eligibleRecipeCount;

  const isBlocked = !feasibility.isFeasible;
  const isTight = !isBlocked && count < COMFORTABLE_RECIPE_COUNT;

  const unlocking = isBlocked
    ? suggestAppliancesToUnlock(preferences).map(getApplianceLabelRo)
    : [];

  const accent = isBlocked ? '#ef4444' : isTight ? '#f59e0b' : theme.text;
  const background = isBlocked || isTight ? theme.warningBg : theme.surfaceSecondary;

  let message: string;
  if (isBlocked) {
    message =
      unlocking.length > 0
        ? `Nicio rețetă disponibilă. Adaugă: ${unlocking.join(', ')}.`
        : feasibility.reasonRo || 'Nicio rețetă disponibilă cu aceste alegeri.';
  } else if (isTight) {
    message = `${count} rețete disponibile — puține, așa că săptămâna va repeta unele feluri.`;
  } else {
    message = `${count} rețete disponibile cu alegerile tale.`;
  }

  return (
    <View
      {...glass('pill')}
      accessibilityRole="text"
      accessibilityLabel={message}
      style={[styles.container, { backgroundColor: background, borderColor: theme.border }]}
    >
      <Text style={[styles.icon]}>{isBlocked ? '⚠️' : isTight ? '👀' : '✅'}</Text>
      <Text style={[styles.text, { color: isBlocked || isTight ? theme.warningText : accent }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
});
