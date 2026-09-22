import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAppTheme } from '../styles/theme';

interface UndoBannerProps {
  visible: boolean;
  message: string;
  actionLabel: string;
  onAction: () => void;
  onDismiss: () => void;
  isDark: boolean;
}

/**
 * Offered right after something was destroyed. Deliberately not on a timer: a confirmation
 * the user may have mis-clicked should not expire while they are still reading it.
 */
export const UndoBanner: React.FC<UndoBannerProps> = ({
  visible,
  message,
  actionLabel,
  onAction,
  onDismiss,
  isDark,
}) => {
  const theme = getAppTheme(isDark);

  if (!visible) return null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View
        accessibilityRole="alert"
        style={[styles.banner, { backgroundColor: theme.card, borderColor: theme.borderStrong }]}
      >
        <Text style={[styles.message, { color: theme.text }]} numberOfLines={2}>
          {message}
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={[styles.actionBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionText, { color: theme.primaryText }]}>{actionLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Ascunde mesajul"
          onPress={onDismiss}
          style={styles.dismissBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.dismissText, { color: theme.textMuted }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '100%',
    maxWidth: 460,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    elevation: 6,
  },
  message: { flex: 1, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  actionText: { fontSize: 12, fontWeight: '800' },
  dismissBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  dismissText: { fontSize: 14, fontWeight: '700' },
});
