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
  /** Registered with the window registry under this id, so its owner can tell its own window. */
  windowId?: string;
}

const STAYS_ON_PHONE_RO = 'Răspunsul rămâne doar pe acest telefon.';

const BACKDROP_PADDING_H = 24;
const CARD_MAX_WIDTH = 420;
const CARD_RADIUS = 20;
const CARD_PADDING = 22;
const TITLE_SIZE = 18;
const TITLE_SPACING = -0.3;
const MESSAGE_SIZE = 15;
const MESSAGE_LINE_HEIGHT = 21;
const NOTE_SIZE = 12;
const NOTE_LINE_HEIGHT = 16;
const SPACING_SM = 8;
const SPACING_LG = 20;
const BUTTON_GAP = 10;
const MIN_TOUCH_TARGET = 44;
const BUTTON_PADDING_V = 12;
const BUTTON_RADIUS = 12;
const BUTTON_TEXT_SIZE = 14;

/**
 * The yes/no safety question before the first health goal. Not a ConfirmDialog: that one
 * reports "no" and "closed" the same way, and closing must not be saved as a "no".
 */
export const HealthSafetyPrompt: React.FC<HealthSafetyPromptProps> = ({
  visible,
  onAnswer,
  onDismiss,
  isDark,
  windowId,
}) => {
  useBlockingWindow(visible, windowId);
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
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: BACKDROP_PADDING_H,
  },
  card: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    padding: CARD_PADDING,
  },
  title: {
    fontSize: TITLE_SIZE,
    ...titleFont,
    letterSpacing: TITLE_SPACING,
    marginBottom: SPACING_SM,
  },
  message: {
    fontSize: MESSAGE_SIZE,
    fontWeight: '500',
    lineHeight: MESSAGE_LINE_HEIGHT,
    marginBottom: SPACING_SM,
  },
  note: { fontSize: NOTE_SIZE, lineHeight: NOTE_LINE_HEIGHT, marginBottom: SPACING_LG },
  actions: { flexDirection: 'row', gap: BUTTON_GAP },
  button: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: BUTTON_PADDING_V,
    borderRadius: BUTTON_RADIUS,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: BUTTON_TEXT_SIZE, fontWeight: '800', textAlign: 'center' },
});
