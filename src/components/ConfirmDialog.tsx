import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAppTheme } from '../styles/theme';
import { useBlockingWindow } from '../hooks/useBlockingWindow';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Marks the confirm button as destructive, so the dangerous choice never looks routine. */
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDark: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Anulează',
  isDestructive = false,
  onConfirm,
  onCancel,
  isDark,
}) => {
  useBlockingWindow(visible);
  const theme = getAppTheme(isDark);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        {/* The backdrop sits behind the card rather than around it. Wrapped around it, a
            screen reader read the whole dialog as one pressable element and the buttons
            inside were out of reach. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Închide fereastra"
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.textMuted }]}>{message}</Text>

          <View style={styles.actions}>
            {/* Cancel comes first so the safe choice is the one under the thumb. */}
            <TouchableOpacity
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              style={[styles.button, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              style={[
                styles.button,
                {
                  backgroundColor: isDestructive ? '#ef4444' : theme.primary,
                  borderColor: isDestructive ? '#ef4444' : theme.primary,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: isDestructive ? '#ffffff' : theme.primaryText },
                ]}
              >
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
