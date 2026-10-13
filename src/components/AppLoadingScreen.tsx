import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAppTheme } from '../styles/theme';
import { glass } from '../styles/glass';
import { LinearGradient } from 'expo-linear-gradient';

export interface AppLoadingScreenProps {
  isDark: boolean;
  title?: string;
  subtitle?: string;
  accessibilityLabel?: string;
  onRetry?: () => void;
  retryLabel?: string;
  showRetryAfterMs?: number;
}

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  isDark,
  title = 'Se pregătește SmartMeal...',
  subtitle = 'Optimizăm rețetele, ingredientele și prețurile la magazinul ales.',
  accessibilityLabel,
  onRetry,
  retryLabel = '↻ Reîncearcă',
  showRetryAfterMs = 6000,
}) => {
  const theme = getAppTheme(isDark);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    // Breathing pulse animation on logo badge
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Infinite progress bar animation
    const progressLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );
    progressLoop.start();

    // Timeout fallback so user is never blocked
    const timer = setTimeout(() => {
      setShowRetry(true);
    }, showRetryAfterMs);

    return () => {
      pulseLoop.stop();
      progressLoop.stop();
      clearTimeout(timer);
    };
  }, [pulseAnim, progressAnim, showRetryAfterMs]);

  const progressInterpolate = progressAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0%', '70%', '100%'],
  });

  return (
    <SafeAreaView
      accessibilityLabel={accessibilityLabel || title}
      style={[
        styles.safeArea,
        { backgroundColor: Platform.OS === 'web' ? 'transparent' : theme.background },
      ]}
      {...glass('root')}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.centerContainer}>
        {/* Modernist Glass Hero Box */}
        <View
          {...glass('card')}
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(28, 28, 30, 0.75)' : 'rgba(255, 255, 255, 0.90)',
              borderColor: theme.border,
            },
          ]}
        >
          {/* Pulsing Brand Hero Icon */}
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={isDark ? ['#ffffff', '#8e8e93'] : ['#000000', '#3a3a3c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Text style={styles.heroEmoji}>🍽️</Text>
            </LinearGradient>
          </Animated.View>

          {/* Brand Header */}
          <View style={styles.brandRow}>
            <Text style={[styles.brandName, { color: theme.text }]}>SmartMeal</Text>
            <View
              style={[
                styles.countryBadge,
                { backgroundColor: theme.surfaceTertiary, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.countryBadgeText, { color: theme.text }]}>RO 🇷🇴</Text>
            </View>
          </View>

          {/* Contextual Status Heading */}
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>

          {/* Modern Slim Loading Bar */}
          <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' }]}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressInterpolate,
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>

          {/* Fallback Action when loading takes longer than normal */}
          {showRetry && onRetry && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Reîncearcă încărcarea"
              onPress={onRetry}
              activeOpacity={0.8}
              style={[styles.retryBtn, { borderColor: theme.border, backgroundColor: theme.accentBg }]}
            >
              <Text style={[styles.retryBtnText, { color: theme.primary }]}>{retryLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    width: '100%',
    maxWidth: 440,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1.5,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  iconWrap: {
    marginBottom: 18,
  },
  iconGradient: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 5,
  },
  heroEmoji: {
    fontSize: 36,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  countryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  countryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  retryBtn: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
