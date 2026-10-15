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
  icon?: string;
  accessibilityLabel?: string;
  tips?: string[];
  steps?: string[];
  onRetry?: () => void;
  retryLabel?: string;
  showRetryAfterMs?: number;
  overlay?: boolean;
}

const DEFAULT_TIPS = [
  'Optimizăm rețetele și ingredientele...',
  'Calculăm cele mai bune prețuri la magazinul ales...',
  'Personalizăm meniul conform numărului de persoane...',
  'Pregătim lista inteligentă de cumpărături...',
];

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  isDark,
  title = 'Se pregătește SmartMeal...',
  subtitle,
  icon = '🍽️',
  accessibilityLabel,
  tips = DEFAULT_TIPS,
  steps,
  onRetry,
  retryLabel = '↻ Reîncearcă',
  showRetryAfterMs = 6000,
  overlay = false,
}) => {
  const theme = getAppTheme(isDark);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const haloAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const tipFadeAnim = useRef(new Animated.Value(1)).current;
  const overlayFadeAnim = useRef(new Animated.Value(overlay ? 0 : 1)).current;

  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    if (overlay) {
      Animated.timing(overlayFadeAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [overlay, overlayFadeAnim]);

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

    // Glowing halo pulse behind the hero icon
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(haloAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(haloAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );
    haloLoop.start();

    // Infinite continuous smooth shimmer progress bar animation
    const progressLoop = Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: false,
      })
    );
    progressLoop.start();

    // Dynamic rotating tips every 2.4s if no custom static subtitle was provided
    let tipTimer: NodeJS.Timeout | null = null;
    if (!subtitle && tips.length > 1) {
      tipTimer = setInterval(() => {
        Animated.sequence([
          Animated.timing(tipFadeAnim, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(tipFadeAnim, {
            toValue: 1,
            duration: 260,
            useNativeDriver: true,
          }),
        ]).start();

        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      }, 2500);
    }

    // Timeout fallback so user is never blocked
    const retryTimer = setTimeout(() => {
      setShowRetry(true);
    }, showRetryAfterMs);

    return () => {
      pulseLoop.stop();
      haloLoop.stop();
      progressLoop.stop();
      if (tipTimer) clearInterval(tipTimer);
      clearTimeout(retryTimer);
    };
  }, [pulseAnim, haloAnim, progressAnim, tipFadeAnim, subtitle, tips.length, showRetryAfterMs]);

  const haloScale = haloAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.45],
  });

  const haloOpacity = haloAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.05],
  });

  const progressLeft = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-35%', '100%'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['28%', '46%', '28%'],
  });

  const displaySubtitle = subtitle ?? tips[currentTipIndex] ?? 'Optimizăm rețetele și ingredientele...';

  const content = (
    <View style={styles.centerContainer}>
      {/* Modernist Glass Hero Box */}
      <View
        {...glass('card')}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(18, 18, 18, 0.96)' : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        {/* Pulsing Brand Hero Icon with Glowing Halo Aura */}
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.haloAura,
              {
                transform: [{ scale: haloScale }],
                opacity: haloOpacity,
                backgroundColor: isDark ? '#ffffff' : '#000000',
              },
            ]}
          />
          <Animated.View style={[styles.iconWrap, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={isDark ? ['#ffffff', '#8e8e93'] : ['#000000', '#3a3a3c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Text style={styles.heroEmoji}>{icon}</Text>
            </LinearGradient>
          </Animated.View>
        </View>

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

        {/* Rotating Subtitle with Smooth Fade */}
        <Animated.View style={{ opacity: tipFadeAnim, minHeight: 40, justifyContent: 'center' }}>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>{displaySubtitle}</Text>
        </Animated.View>

        {/* Modern Slim Loading Bar */}
        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <Animated.View
            style={[
              styles.progressBar,
              {
                left: progressLeft,
                width: progressWidth,
                backgroundColor: theme.primary,
              },
            ]}
          />
        </View>

        {/* Dynamic Progress Steps / Stages if provided */}
        {steps && steps.length > 0 && (
          <View style={styles.stepsContainer}>
            {steps.map((step, idx) => (
              <View key={idx} style={styles.stepItemRow}>
                <View
                  style={[
                    styles.stepItemBadge,
                    { backgroundColor: theme.surfaceTertiary, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.stepItemCheck, { color: theme.primary }]}>✓</Text>
                </View>
                <Text style={[styles.stepItemText, { color: theme.text }]}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Fallback Action when loading takes longer than normal */}
        {showRetry && onRetry && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Reîncearcă încărcarea"
            onPress={onRetry}
            activeOpacity={0.8}
            style={[
              styles.retryBtn,
              { borderColor: theme.border, backgroundColor: theme.accentBg },
            ]}
          >
            <Text style={[styles.retryBtnText, { color: theme.primary }]}>{retryLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (overlay) {
    return (
      <Animated.View
        accessibilityLabel={accessibilityLabel || title}
        accessibilityViewIsModal={true}
        style={[
          styles.overlayContainer,
          {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.90)',
            opacity: overlayFadeAnim,
          },
        ]}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        {content}
      </Animated.View>
    );
  }

  return (
    <SafeAreaView
      accessibilityLabel={accessibilityLabel || title}
      style={[
        styles.safeArea,
        { backgroundColor: theme.background },
      ]}
      {...glass('root')}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } : {}),
  },
  stepsContainer: {
    width: '100%',
    marginTop: 18,
    gap: 8,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepItemBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItemCheck: {
    fontSize: 11,
    fontWeight: '900',
  },
  stepItemText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
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
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: 88,
    height: 88,
  },
  haloAura: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  iconWrap: {
    position: 'relative',
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
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
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
