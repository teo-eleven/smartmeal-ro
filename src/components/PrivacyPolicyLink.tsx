import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { env } from '../../config/env';
import { getAppTheme } from '../styles/theme';

interface LegalLinkProps {
  isDark: boolean;
}

/**
 * A link to a published legal document. Renders nothing when no address is configured,
 * rather than a link that goes nowhere; a production build cannot get that far, since
 * config/assertProductionEnv.js stops it first.
 */
const LegalLink: React.FC<LegalLinkProps & { url: string | null; label: string; text: string }> = ({
  isDark,
  url,
  label,
  text,
}) => {
  if (!url) return null;
  const theme = getAppTheme(isDark);
  return (
    <TouchableOpacity
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => void Linking.openURL(url)}
      style={styles.link}
    >
      <Text style={[styles.text, { color: theme.textMuted }]}>{text}</Text>
    </TouchableOpacity>
  );
};

/**
 * The privacy policy. Apple requires it to be reachable from inside the app (5.1.1(i)), and
 * consent at sign-up is only informed if the policy can be read right there.
 */
export const PrivacyPolicyLink: React.FC<LegalLinkProps> = ({ isDark }) => (
  <LegalLink
    isDark={isDark}
    url={env.privacyPolicyUrl}
    label="Citește politica de confidențialitate"
    text="Politica de confidențialitate"
  />
);

/** The terms of use. Apple 3.1.2 wants them linked from the subscription screen. */
export const TermsLink: React.FC<LegalLinkProps> = ({ isDark }) => (
  <LegalLink
    isDark={isDark}
    url={env.termsUrl}
    label="Citește termenii și condițiile"
    text="Termeni și condiții"
  />
);

const styles = StyleSheet.create({
  link: { alignSelf: 'flex-start', paddingVertical: 4 },
  text: { fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
});
