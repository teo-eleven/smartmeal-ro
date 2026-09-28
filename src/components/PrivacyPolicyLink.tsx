import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { env } from '../../config/env';
import { getAppTheme } from '../styles/theme';

interface PrivacyPolicyLinkProps {
  isDark: boolean;
}

/**
 * Opens the published privacy policy. Apple requires it to be reachable from inside the app
 * (5.1.1(i)), and consent at sign-up is only informed if the policy can be read right there.
 *
 * Renders nothing when no address is configured, rather than a link that goes nowhere. A
 * production build cannot get that far: config/assertProductionEnv.js stops it first.
 */
export const PrivacyPolicyLink: React.FC<PrivacyPolicyLinkProps> = ({ isDark }) => {
  const url = env.privacyPolicyUrl;
  if (!url) return null;

  const theme = getAppTheme(isDark);
  return (
    <TouchableOpacity
      accessibilityRole="link"
      accessibilityLabel="Citește politica de confidențialitate"
      onPress={() => void Linking.openURL(url)}
      style={styles.link}
    >
      <Text style={[styles.text, { color: theme.textMuted }]}>Politica de confidențialitate</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  link: { alignSelf: 'flex-start', paddingVertical: 4 },
  text: { fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
});
