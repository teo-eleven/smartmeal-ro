import React, { useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useAuthSessionStore } from '../store/authSessionStore';
import { useIosGoalsNoticeStore } from '../store/iosGoalsNoticeStore';
import { useBlockingWindow } from '../hooks/useBlockingWindow';
import { isHealthGoal } from '../data/healthTags';
import { areHealthGoalsAvailable } from '../utils/platformHealth';
import { IOS_DEVICE_NAME } from '../utils/storeWording';
import { getAppTheme } from '../styles/theme';
import { titleFont } from '../styles/typography';

const NOTICE_WINDOW_ID = 'ios-goals-notice';

/** Title of the one-time iPhone notice (IosGoalsNotice) about hidden health goals. */
export const IOS_GOALS_NOTICE_TITLE_RO = 'Obiectivele de sănătate';
/** Body of the one-time iPhone notice: goals are unavailable here, kept for Android and web. */
export const IOS_GOALS_NOTICE_MESSAGE_RO =
  `Pe ${IOS_DEVICE_NAME}, obiectivele de sănătate nu sunt disponibile deocamdată. Preferințele tale sunt păstrate în cont.`;
const ACKNOWLEDGE_LABEL_RO = 'Am înțeles';

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

/** Goals are kept in the data on iOS but hidden: only people who have some need the message. */
function useHasStoredHealthGoal(): boolean {
  return useAppStore((s) => (s.preferences.healthGoalTags ?? []).some(isHealthGoal));
}

/**
 * One-time message for iPhone users who saved health goals before A.8 hid them (A.9). Waits
 * for hydration and for every other window (iOS shows one Modal at a time), then asks nothing:
 * "Am înțeles" is remembered on this phone only. The goals themselves are never touched.
 */
interface IosGoalsNoticeProps {
  isDark: boolean;
  /** A window the store does not know about is open (the account window): wait for it. */
  isSuppressed?: boolean;
}

/** The one-time iPhone notice; see the description above IosGoalsNoticeProps for when it shows. */
export const IosGoalsNotice: React.FC<IosGoalsNoticeProps> = ({ isDark, isSuppressed = false }) => {
  const isHydrated = useAppStore((s) => s.isHydrated);
  const hasGoal = useHasStoredHealthGoal();
  const isOtherWindowOpen = useAppStore((s) => {
    const own = s.openWindowIds.filter((id) => id === NOTICE_WINDOW_ID).length;
    return Boolean(s.activeNotice || s.confirmRequest || s.openWindowCount > own);
  });
  // The Face ID offer is a Modal that does not register as a window: let it go first.
  const isBiometricOfferDue = useAuthSessionStore((s) => s.shouldOfferBiometric);
  const isSignedIn = useAppStore((s) => s.authStatus === 'signedIn' && Boolean(s.userEmail));
  const status = useIosGoalsNoticeStore((s) => s.status);
  const isRelevant = !areHealthGoalsAvailable() && isHydrated && hasGoal;

  useEffect(() => {
    if (isRelevant) void useIosGoalsNoticeStore.getState().load();
  }, [isRelevant]);

  const isVisible =
    isRelevant &&
    status === 'unseen' &&
    !isSuppressed &&
    !isOtherWindowOpen &&
    !(isSignedIn && isBiometricOfferDue);
  useBlockingWindow(isVisible, NOTICE_WINDOW_ID);
  const theme = getAppTheme(isDark);
  const acknowledge = () => void useIosGoalsNoticeStore.getState().acknowledge();

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={acknowledge}>
      <View style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
        <View
          role="alertdialog"
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Text style={[styles.title, { color: theme.text }]}>{IOS_GOALS_NOTICE_TITLE_RO}</Text>
          <Text style={[styles.message, { color: theme.text }]}>{IOS_GOALS_NOTICE_MESSAGE_RO}</Text>
          <TouchableOpacity
            onPress={acknowledge}
            accessibilityRole="button"
            accessibilityLabel={ACKNOWLEDGE_LABEL_RO}
            style={[styles.button, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>{ACKNOWLEDGE_LABEL_RO}</Text>
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
  buttonText: { fontSize: BUTTON_TEXT_SIZE, fontWeight: '800', textAlign: 'center' },
});
