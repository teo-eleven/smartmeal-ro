import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SystemNotice, useAppStore } from '../store/useAppStore';
import { glass } from '../styles/glass';
import { getAppTheme } from '../styles/theme';
import { USE_NATIVE_DRIVER } from '../styles/motion';

interface InformativeNoticeModalProps {
  notice: SystemNotice | null;
  onDismiss: () => void;
  isDark: boolean;
}

export const InformativeNoticeModal: React.FC<InformativeNoticeModalProps> = ({
  notice: queuedNotice,
  onDismiss,
  isDark,
}) => {
  const theme = getAppTheme(isDark);
  // Shown over another Modal it would be dropped on iOS; it stays queued until they close.
  const isWindowOpen = useAppStore((state) => state.openWindowCount > 0);
  const notice = isWindowOpen ? null : queuedNotice;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!notice) return undefined;
    fadeAnim.setValue(0);
    slideAnim.setValue(25);
    scaleAnim.setValue(0.92);

    const enter = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 70,
        friction: 8,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 70,
        friction: 8,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);
    enter.start();
    // The next notice, or closing, stops this one mid-flight instead of animating a ghost.
    return () => enter.stop();
  }, [notice, fadeAnim, slideAnim, scaleAnim]);

  if (!notice) return null;

  const getNoticeBadge = () => {
    switch (notice.type) {
      case 'warning':
        return { icon: '⚠️', color: theme.warningText, bg: theme.warningBg };
      case 'error':
        return { icon: '🚫', color: theme.danger, bg: theme.dangerBg };
      case 'success':
        return {
          icon: '✨',
          color: theme.successText,
          bg: theme.successBg,
        };
      case 'info':
      default:
        return { icon: '💡', color: theme.category.frost, bg: theme.trackBg };
    }
  };

  const badge = getNoticeBadge();

  return (
    <Modal visible={!!notice} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
        {/* Behind the card, not around it: wrapped around it, a screen reader read the whole
            notice as one pressable element and "Am înțeles" was out of reach. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Închide fereastra"
          onPress={onDismiss}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          role="dialog"
          accessibilityViewIsModal
          {...glass('modal')}
          style={[
            styles.card,
            {
              backgroundColor: theme.glassBg,
              borderColor: theme.border,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* Apple Grabber Pill */}
          <View style={[styles.grabber, { backgroundColor: theme.trackBg }]} />

          <View style={styles.headerRow}>
            <View
              style={[styles.iconCircle, { backgroundColor: badge.bg, borderColor: badge.color }]}
            >
              <Text style={styles.iconText}>{badge.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>{notice.title}</Text>
              <Text style={[styles.typeSubtitle, { color: badge.color }]}>
                SmartMeal RO Notificare
              </Text>
            </View>
          </View>

          <Text style={[styles.message, { color: theme.textMuted }]}>{notice.message}</Text>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Am înțeles"
            onPress={onDismiss}
            {...glass('btn-primary')}
            style={[
              styles.dismissBtn,
              {
                backgroundColor: theme.primary,
                borderColor: theme.primary,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text style={[styles.dismissBtnText, { color: theme.primaryText }]}>Am înțeles</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 32,
    elevation: 10,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  typeSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  dismissBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
