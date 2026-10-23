import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated, Easing } from 'react-native';
import { getAppTheme } from '../styles/theme';
import { USE_NATIVE_DRIVER } from '../styles/motion';

interface UndoBannerProps {
  visible: boolean;
  message: string;
  actionLabel: string;
  onAction: () => void;
  onDismiss: () => void;
  isDark: boolean;
  autoDismissTimeoutMs?: number;
  /** Changes when a different plan is held for undo, so the countdown starts again. */
  resetKey?: unknown;
}

/**
 * Offered right after something was destroyed.
 * Enters with a smooth slide & fade, shows a subtle progress indicator,
 * and automatically dismisses after 5 seconds with a gentle fade-out transition.
 */
export const UndoBanner: React.FC<UndoBannerProps> = ({
  visible,
  message,
  actionLabel,
  onAction,
  onDismiss,
  isDark,
  autoDismissTimeoutMs = 5000,
  resetKey,
}) => {
  const theme = getAppTheme(isDark);
  const [isRendered, setIsRendered] = useState(visible);

  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(visible ? 0 : 20)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef<Animated.CompositeAnimation | null>(null);
  const isDismissing = useRef(false);

  /** Stops whatever is moving; an interrupted exit then reports finished=false and does nothing. */
  const stopMotion = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    runningRef.current?.stop();
    runningRef.current = null;
  }, []);

  const startDismissTransition = useCallback(() => {
    if (isDismissing.current) return;
    isDismissing.current = true;

    if (process.env.NODE_ENV === 'test') {
      setIsRendered(false);
      onDismiss();
      return;
    }

    runningRef.current?.stop();
    const exit = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(slideAnim, {
        toValue: 24,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);
    runningRef.current = exit;
    exit.start(({ finished }) => {
      // A new undo arrived mid-exit: it stopped this animation, and dismissing now would
      // throw away the plan that undo is holding.
      if (!finished || !isDismissing.current) return;
      runningRef.current = null;
      setIsRendered(false);
      isDismissing.current = false;
      onDismiss();
    });
  }, [fadeAnim, onDismiss, slideAnim]);

  // Restarts on `resetKey` too: a second replacement while the banner is up keeps `visible`
  // true, and must still get the full countdown.
  useEffect(() => {
    if (!visible) {
      stopMotion();
      startDismissTransition();
      return undefined;
    }

    stopMotion();
    setIsRendered(true);
    isDismissing.current = false;
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    progressAnim.setValue(1);

    if (process.env.NODE_ENV !== 'test') {
      const enter = Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: autoDismissTimeoutMs,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ]);
      runningRef.current = enter;
      enter.start();
    }

    if (autoDismissTimeoutMs > 0) {
      timerRef.current = setTimeout(startDismissTransition, autoDismissTimeoutMs);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    visible,
    resetKey,
    autoDismissTimeoutMs,
    fadeAnim,
    slideAnim,
    progressAnim,
    startDismissTransition,
    stopMotion,
  ]);

  // Nothing keeps animating, or calls back into a component that is gone.
  useEffect(() => stopMotion, [stopMotion]);

  if (!isRendered) return null;

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        accessibilityRole="alert"
        style={[
          styles.banner,
          {
            backgroundColor: theme.card,
            borderColor: theme.borderStrong,
          },
        ]}
      >
        <Text style={[styles.message, { color: theme.text }]} numberOfLines={2}>
          {message}
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            onAction();
          }}
          style={[styles.actionBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionText, { color: theme.primaryText }]}>{actionLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Ascunde mesajul"
          onPress={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            startDismissTransition();
          }}
          style={styles.dismissBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.dismissText, { color: theme.textMuted }]}>✕</Text>
        </TouchableOpacity>

        {/* Subtle timer progress bar at bottom of the banner */}
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressBarWidth,
                backgroundColor: theme.primary,
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 9999,
  },
  banner: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '100%',
    maxWidth: 480,
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 8,
  },
  message: { flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  actionText: { fontSize: 12, fontWeight: '800' },
  dismissBtn: { paddingHorizontal: 6, paddingVertical: 6 },
  dismissText: { fontSize: 14, fontWeight: '700' },
  progressBarTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  progressBarFill: {
    height: '100%',
  },
});
