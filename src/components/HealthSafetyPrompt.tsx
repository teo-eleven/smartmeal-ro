import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useBlockingWindow } from '../hooks/useBlockingWindow';
import { getAppTheme } from '../styles/theme';
import { titleFont } from '../styles/typography';
import { HEALTH_SAFETY_QUESTION_RO } from '../utils/healthSafety';

interface HealthSafetyPromptProps {
  visible: boolean;
  onAnswer: (answer: 'yes' | 'no') => void;
  /** Closed without an answer: nothing is ticked and nothing is saved. */
  onDismiss: () => void;
  isDark: boolean;
}

const STAYS_ON_PHONE_RO = 'Răspunsul rămâne doar pe acest telefon.';

/**
 * The yes/no safety question before the first health goal. Not a ConfirmDialog: that one
 * reports "no" and "closed" the same way, and closing must not be saved as a "no".
 */
export const HealthSafetyPrompt: React.FC<HealthSafetyPromptProps> = ({
  visible,
  onAnswer,
  onDismiss,
  isDark,
}) => {
  useBlockingWindow(visible);
  const theme = getAppTheme(isDark);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Închide întrebarea"
          onPress={onDismiss}
          style={StyleSheet.absoluteFill}
        />
        <View
          role="alertdialog"
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Text style={[styles.title, { color: theme.text }]}>O întrebare de siguranță</Text>
          <Text style={[styles.message, { color: theme.text }]}>{HEALTH_SAFETY_QUESTION_RO}</Text>
          <Text style={[styles.note, { color: theme.textMuted }]}>{STAYS_ON_PHONE_RO}</Text>

          <View style={styles.actions}>
            {/* "Da" first: the cautious answer is the one under the thumb. */}
            <AnswerButton
              label="Da, mi se aplică"
              onPress={() => onAnswer('yes')}
              isDark={isDark}
            />
            <AnswerButton label="Nu, niciuna" onPress={() => onAnswer('no')} isDark={isDark} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const AnswerButton: React.FC<{ label: string; onPress: () => void; isDark: boolean }> = ({
  label,
  onPress,
  isDark,
}) => {
  const theme = getAppTheme(isDark);
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.button, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonText, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: { width: '100%', maxWidth: 420, borderRadius: 20, borderWidth: 1, padding: 22 },
  title: { fontSize: 18, ...titleFont, letterSpacing: -0.3, marginBottom: 8 },
  message: { fontSize: 15, fontWeight: '500', lineHeight: 21, marginBottom: 8 },
  note: { fontSize: 12, lineHeight: 16, marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 10 },
  button: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
});
