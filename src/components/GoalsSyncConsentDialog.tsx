import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useAuthSessionStore } from '../store/authSessionStore';
import { useGoalsSyncConsentStore } from '../store/goalsSyncConsentStore';
import { useBlockingWindow } from '../hooks/useBlockingWindow';
import { areHealthGoalsAvailable } from '../utils/platformHealth';
import { getAppTheme } from '../styles/theme';
import { titleFont } from '../styles/typography';

const DIALOG_WINDOW_ID = 'goals-sync-consent';

/** Dialog title, shown in GoalsSyncConsentDialog before the first upload of health goals. */
export const GOALS_SYNC_TITLE_RO = 'Sincronizăm și obiectivele tale de sănătate?';
/** Dialog body: goals are health data, kept in the account, deletable with it; shown under the title. */
export const GOALS_SYNC_MESSAGE_RO =
  'Obiectivele de sănătate sunt date privind sănătatea. Dacă răspunzi „Da", le păstrăm în contul tău, ca să le regăsești pe alt dispozitiv; le poți șterge oricând, odată cu contul. Dacă nu, rămân doar pe acest dispozitiv.';
/** Primary button of GoalsSyncConsentDialog: records the consent, then uploads the goals. */
export const GOALS_SYNC_YES_RO = 'Da, sincronizează';
/** Second button of GoalsSyncConsentDialog: goals stay on this device, the rest still syncs. */
export const GOALS_SYNC_NO_RO = 'Nu, doar pe acest dispozitiv';

const BACKDROP_PADDING_H = 24;
const CARD_MAX_WIDTH = 420;
const CARD_RADIUS = 20;
const CARD_PADDING = 22;
const TITLE_SIZE = 18;
const TITLE_SPACING = -0.3;
const MESSAGE_SIZE = 15;
const MESSAGE_LINE_HEIGHT = 21;
const SPACING_SM = 8;
const SPACING_LG = 20;
const MIN_TOUCH_TARGET = 44;
const BUTTON_PADDING_V = 12;
const BUTTON_RADIUS = 12;
const BUTTON_TEXT_SIZE = 14;

interface GoalsSyncConsentDialogProps {
  isDark: boolean;
  /** A window the store does not know about is open (the account window): wait for it. */
  isSuppressed?: boolean;
}

/**
 * Asks once, before the first upload of health goals, whether they may be kept in the account
 * (M2). The sync stops when it raises the question and carries on from the answer. Shown only
 * where goals exist (never on iOS), and only when no other window is open.
 */
export const GoalsSyncConsentDialog: React.FC<GoalsSyncConsentDialogProps> = ({
  isDark,
  isSuppressed = false,
}) => {
  const request = useGoalsSyncConsentStore((s) => s.request);
  const isOtherWindowOpen = useAppStore((s) => {
    const own = s.openWindowIds.filter((id) => id === DIALOG_WINDOW_ID).length;
    return Boolean(s.activeNotice || s.confirmRequest || s.openWindowCount > own);
  });
  const isSignedIn = useAppStore((s) => s.authStatus === 'signedIn' && Boolean(s.userEmail));
  // The Face ID offer is a Modal that does not register as a window: let it go first.
  const isBiometricOfferDue = useAuthSessionStore((s) => s.shouldOfferBiometric);
  const isAvailable = areHealthGoalsAvailable();

  // The question belongs to a signed-in account on a platform that has goals.
  useEffect(() => {
    if (request && (!isAvailable || !isSignedIn)) useGoalsSyncConsentStore.getState().dismiss();
  }, [request, isAvailable, isSignedIn]);

  const isVisible =
    Boolean(request) &&
    isAvailable &&
    isSignedIn &&
    !isSuppressed &&
    !isOtherWindowOpen &&
    !isBiometricOfferDue;
  useBlockingWindow(isVisible, DIALOG_WINDOW_ID);

  const theme = getAppTheme(isDark);
  const answer = (choice: 'yes' | 'no') => void useGoalsSyncConsentStore.getState().answer(choice);
  const dismiss = () => useGoalsSyncConsentStore.getState().dismiss();

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
        <View
          role="alertdialog"
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Text style={[styles.title, { color: theme.text }]}>{GOALS_SYNC_TITLE_RO}</Text>
          <Text style={[styles.message, { color: theme.text }]}>{GOALS_SYNC_MESSAGE_RO}</Text>
          <TouchableOpacity
            onPress={() => answer('yes')}
            accessibilityRole="button"
            accessibilityLabel={GOALS_SYNC_YES_RO}
            style={[styles.button, { backgroundColor: theme.primary, borderColor: theme.primary }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, { color: theme.primaryText }]}>
              {GOALS_SYNC_YES_RO}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => answer('no')}
            accessibilityRole="button"
            accessibilityLabel={GOALS_SYNC_NO_RO}
            style={[
              styles.button,
              styles.secondButton,
              { backgroundColor: theme.btnBg, borderColor: theme.border },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>{GOALS_SYNC_NO_RO}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    marginBottom: SPACING_LG,
  },
  button: {
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: BUTTON_PADDING_V,
    borderRadius: BUTTON_RADIUS,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondButton: { marginTop: SPACING_SM },
  buttonText: { fontSize: BUTTON_TEXT_SIZE, fontWeight: '800', textAlign: 'center' },
});
