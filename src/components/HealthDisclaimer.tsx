import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HEALTH_DISCLAIMER_LONG_RO, HEALTH_DISCLAIMER_SHORT_RO } from '../data/healthDisclaimer';
import { getAppTheme } from '../styles/theme';

export type HealthDisclaimerVariant = 'short' | 'long';

interface HealthDisclaimerProps {
  isDark: boolean;
  /** Short under goals and on a recipe; long in Settings. Defaults to short. */
  variant?: HealthDisclaimerVariant;
}

const TEXT_BY_VARIANT: Record<HealthDisclaimerVariant, string> = {
  short: HEALTH_DISCLAIMER_SHORT_RO,
  long: HEALTH_DISCLAIMER_LONG_RO,
};

/** "Not medical advice": information only, so it is quiet text, not a warning banner. */
export const HealthDisclaimer: React.FC<HealthDisclaimerProps> = ({
  isDark,
  variant = 'short',
}) => {
  const theme = getAppTheme(isDark);
  const text = TEXT_BY_VARIANT[variant];

  return (
    <View
      accessible
      accessibilityLabel={text}
      style={[styles.box, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
    >
      <Text style={[styles.icon, { color: theme.textMuted }]} importantForAccessibility="no">
        ⓘ
      </Text>
      <Text
        style={[
          variant === 'long' ? styles.textLong : styles.textShort,
          { color: theme.textMuted },
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: { fontSize: 14, lineHeight: 18 },
  textShort: { flex: 1, fontSize: 12, lineHeight: 17 },
  textLong: { flex: 1, fontSize: 14, lineHeight: 20 },
});
