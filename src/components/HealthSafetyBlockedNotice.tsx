import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAppTheme } from '../styles/theme';
import { HEALTH_SAFETY_BLOCKED_RO } from '../utils/healthSafety';

interface HealthSafetyBlockedNoticeProps {
  isDark: boolean;
  /** "Am răspuns greșit": forget the answer, so the question is asked again. */
  onChangeAnswer: () => void;
}

/** Shown in place of usable health goals after a "yes" to the safety question. */
export const HealthSafetyBlockedNotice: React.FC<HealthSafetyBlockedNoticeProps> = ({
  isDark,
  onChangeAnswer,
}) => {
  const theme = getAppTheme(isDark);
  return (
    <View
      style={[styles.box, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
    >
      <Text style={[styles.text, { color: theme.text }]}>{HEALTH_SAFETY_BLOCKED_RO}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Am răspuns greșit"
        onPress={onChangeAnswer}
        style={styles.link}
      >
        <Text style={[styles.linkText, { color: theme.primary }]}>Am răspuns greșit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  box: { padding: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, gap: 4 },
  text: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  link: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  linkText: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});
