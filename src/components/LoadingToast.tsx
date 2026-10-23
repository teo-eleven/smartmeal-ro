import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { getAppTheme } from '../styles/theme';
import { glass } from '../styles/glass';
import { USE_NATIVE_DRIVER } from '../styles/motion';

export interface LoadingToastProps {
  visible: boolean;
  message?: string;
  accessibilityLabel?: string;
  isDark: boolean;
}

export const LoadingToast: React.FC<LoadingToastProps> = ({
  visible,
  message = 'Se actualizează...',
  accessibilityLabel,
  isDark,
}) => {
  const theme = getAppTheme(isDark);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  // Kept on screen until the exit has played; returning null the moment `visible` went false
  // cut the exit animation off before it started.
  const [isRendered, setIsRendered] = useState(visible);
  const runningRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    runningRef.current?.stop();
    if (visible) setIsRendered(true);

    const motion = visible
      ? Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 7,
            tension: 70,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 80,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ])
      : Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 220,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.85,
            duration: 220,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]);

    runningRef.current = motion;
    motion.start(({ finished }) => {
      // Interrupted by the opposite change: that one decides what stays on screen.
      if (finished && !visible) setIsRendered(false);
    });
  }, [visible, slideAnim, scaleAnim, opacityAnim]);

  useEffect(() => () => runningRef.current?.stop(), []);

  if (!isRendered) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLabel={accessibilityLabel || message}
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View
        {...glass('card')}
        style={[
          styles.pill,
          {
            backgroundColor: isDark ? 'rgba(24, 24, 27, 0.94)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: theme.border,
          },
        ]}
      >
        <ActivityIndicator size="small" color={theme.primary} style={styles.spinner} />
        <Text style={[styles.text, { color: theme.text }]}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 54,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    gap: 10,
    maxWidth: '90%',
  },
  spinner: {
    marginRight: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
