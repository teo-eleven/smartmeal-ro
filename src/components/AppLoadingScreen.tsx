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

  const progressAnim = useRef(new Animated.Value(0)).current;
  const tipFadeAnim = useRef(new Animated.Value(1)).current;
  const overlayFadeAnim = useRef(new Animated.Value(overlay ? 0 : 1)).current;

  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    if (overlay) {
      Animated.timing(overlayFadeAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [overlay, overlayFadeAnim]);

  useEffect(() => {
    // Continuous hardware-accelerated progress bar shimmer
    const progressLoop = Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    progressLoop.start();

    // In-place opacity-only fade for rotating tips (no layout shift)
    let tipTimer: NodeJS.Timeout | null = null;
    if (!subtitle && tips.length > 1) {
      tipTimer = setInterval(() => {
        Animated.sequence([
          Animated.timing(tipFadeAnim, {
            toValue: 0,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(tipFadeAnim, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();

        setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      }, 2500);
    }

    // Fallback retry trigger
    const retryTimer = setTimeout(() => {
      setShowRetry(true);
    }, showRetryAfterMs);

    return () => {
      progressLoop.stop();
      if (tipTimer) clearInterval(tipTimer);
      clearTimeout(retryTimer);
    };
  }, [progressAnim, tipFadeAnim, subtitle, tips.length, showRetryAfterMs]);

  // Shimmer translates across track from -100% to 320% width
  const progressTranslateX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 320],
  });

  const displaySubtitle = subtitle ?? tips[currentTipIndex] ?? 'Optimizăm rețetele și ingredientele...';

  const cardNode = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#18181b' : '#ffffff',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
    >
      {/* Rock-Solid Stationary Brand Icon */}
      <View
        style={[
          styles.iconSquircle,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <LinearGradient
          colors={isDark ? ['#27272a', '#18181b'] : ['#f4f4f5', '#e4e4e7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <Text style={styles.heroEmoji}>{icon}</Text>
        </LinearGradient>
      </View>

      {/* Brand Row */}
      <View style={styles.brandRow}>
        <Text style={[styles.brandName, { color: theme.text }]}>SmartMeal</Text>
        <View
          style={[
            styles.countryBadge,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
        >
          <Text style={[styles.countryBadgeText, { color: theme.text }]}>RO 🇷🇴</Text>
        </View>
      </View>

      {/* Status Heading */}
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

      {/* Fixed Height Subtitle Container (Zero vertical layout shift) */}
      <View style={styles.subContainer}>
        <Animated.View style={{ opacity: tipFadeAnim, width: '100%', alignItems: 'center' }}>
          <Text numberOfLines={2} style={[styles.subtitle, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
            {displaySubtitle}
          </Text>
        </Animated.View>
      </View>

      {/* Clean Shimmer Progress Bar Track */}
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
              backgroundColor: theme.primary,
              transform: [{ translateX: progressTranslateX }],
            },
          ]}
        />
      </View>

      {/* Steps List (Optional) */}
      {steps && steps.length > 0 && (
        <View style={styles.stepsContainer}>
          {steps.map((step, idx) => (
            <View key={idx} style={styles.stepItemRow}>
              <View
                style={[
                  styles.stepItemBadge,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text style={[styles.stepItemCheck, { color: theme.primary }]}>✓</Text>
              </View>
              <Text style={[styles.stepItemText, { color: theme.text }]}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Fallback Action */}
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
  );

  if (overlay) {
    return (
      <Animated.View
        accessibilityLabel={accessibilityLabel || title}
        accessibilityViewIsModal={true}
        style={[
          styles.overlayContainer,
          {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.82)' : 'rgba(255, 255, 255, 0.88)',
            opacity: overlayFadeAnim,
          },
        ]}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        {cardNode}
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
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {cardNode}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } : {}),
  },
  card: {
    width: 360,
    maxWidth: '90%',
    minHeight: 270,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 8,
  },
  iconSquircle: {
    width: 68,
    height: 68,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 32,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  countryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subContainer: {
    height: 38,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '32%',
    borderRadius: 2,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItemCheck: {
    fontSize: 10,
    fontWeight: '900',
  },
  stepItemText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  retryBtn: {
    marginTop: 18,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
