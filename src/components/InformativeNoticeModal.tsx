import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SystemNotice } from '../store/useAppStore';
import { glass } from '../styles/glass';

interface InformativeNoticeModalProps {
  notice: SystemNotice | null;
  onDismiss: () => void;
  isDark: boolean;
}

export const InformativeNoticeModal: React.FC<InformativeNoticeModalProps> = ({
  notice,
  onDismiss,
  isDark,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (notice) {
      fadeAnim.setValue(0);
      slideAnim.setValue(25);
      scaleAnim.setValue(0.92);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [notice, fadeAnim, slideAnim, scaleAnim]);

  if (!notice) return null;

  const getNoticeBadge = () => {
    switch (notice.type) {
      case 'warning':
        return { icon: '⚠️', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'error':
        return { icon: '🚫', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
      case 'success':
        return {
          icon: '✨',
          color: isDark ? '#ffffff' : '#000000',
          bg: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        };
      case 'info':
      default:
        return { icon: '💡', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
    }
  };

  const badge = getNoticeBadge();

  return (
    <Modal visible={!!notice} transparent animationType="none" onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View
              {...glass('modal')}
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? 'rgba(28, 28, 30, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.1)',
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                },
              ]}
            >
              {/* Apple Grabber Pill */}
              <View style={[styles.grabber, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }]} />

              <View style={styles.headerRow}>
                <View style={[styles.iconCircle, { backgroundColor: badge.bg, borderColor: badge.color }]}>
                  <Text style={styles.iconText}>{badge.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
                    {notice.title}
                  </Text>
                  <Text style={[styles.typeSubtitle, { color: badge.color }]}>
                    SmartMeal RO Notificare
                  </Text>
                </View>
              </View>

              <Text style={[styles.message, { color: isDark ? '#8e8e93' : '#3a3a3c' }]}>
                {notice.message}
              </Text>

              <TouchableOpacity
                accessibilityRole="button"
                onPress={onDismiss}
                {...glass('btn-primary')}
                style={[
                  styles.dismissBtn,
                  {
                    backgroundColor: isDark ? '#ffffff' : '#000000',
                    borderColor: isDark ? '#ffffff' : '#000000',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.dismissBtnText, { color: isDark ? '#000000' : '#ffffff' }]}>Am înțeles</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
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
    shadowColor: '#000',
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
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
});
