import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HealthDisclaimer } from './HealthDisclaimer';
import { getAppTheme } from '../styles/theme';

interface HealthGoalsAboutProps {
  isDark: boolean;
}

const LINK_LABEL = 'Despre obiectivele de sănătate';
/** 44 pt is the minimum comfortable touch target; the link text itself is small. */
const MIN_TOUCH_TARGET = 44;

/**
 * "About the health goals": a link that opens the long disclaimer in place. The app has no
 * Settings screen, and the filters are where everyone, with or without an account, changes
 * their goals, so the long text lives here, closed by default.
 */
export const HealthGoalsAbout: React.FC<HealthGoalsAboutProps> = ({ isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = getAppTheme(isDark);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={LINK_LABEL}
        aria-expanded={isOpen}
        onPress={() => setIsOpen((open) => !open)}
        style={styles.link}
      >
        <Text style={[styles.linkText, { color: theme.primary }]}>
          {LINK_LABEL} {isOpen ? '▴' : '▾'}
        </Text>
      </TouchableOpacity>
      {isOpen && <HealthDisclaimer isDark={isDark} variant="long" />}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  link: { minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' },
  linkText: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});
