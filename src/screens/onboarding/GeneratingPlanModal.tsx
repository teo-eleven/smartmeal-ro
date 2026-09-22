import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getAppTheme } from '../../styles/theme';

interface GeneratingPlanModalProps {
  onComplete: () => void;
  isDark: boolean;
}

export const GeneratingPlanModal: React.FC<GeneratingPlanModalProps> = ({
  onComplete,
  isDark,
}) => {
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStep1Done(true), 400);
    const t2 = setTimeout(() => setStep2Done(true), 900);
    const t3 = setTimeout(() => {
      setStep3Done(true);
      setTimeout(onComplete, 400);
    }, 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  const appTheme = getAppTheme(isDark);
  const theme = {
    background: appTheme.background,
    text: appTheme.text,
    textMuted: appTheme.textMuted,
    primary: appTheme.primary,
    card: appTheme.card,
    border: appTheme.border,
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.centerBox}>
        {/* Animated Food Circle */}
        <View style={styles.iconCircle}>
          <Text style={styles.circleEmoji}>🥑 🍗 🍅</Text>
          <Text style={[styles.centerLogo, { color: theme.primary }]}>SmartMeal</Text>
          <Text style={styles.circleEmoji}>🍋 🥦 🧄</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Construim săptămâna ta...</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Optimizăm mesele, macro-urile și lista de cumpărături
        </Text>

        <View style={[styles.checklistCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.checkRow}>
            <Text style={styles.checkIcon}>{step1Done ? '✅' : '⏳'}</Text>
            <Text
              style={[
                styles.checkText,
                { color: step1Done ? theme.text : theme.textMuted, fontWeight: step1Done ? '600' : '400' },
              ]}
            >
              Potrivim rețetele cu magazinul și bugetul tău
            </Text>
          </View>

          <View style={styles.checkRow}>
            <Text style={styles.checkIcon}>{step2Done ? '✅' : '⏳'}</Text>
            <Text
              style={[
                styles.checkText,
                { color: step2Done ? theme.text : theme.textMuted, fontWeight: step2Done ? '600' : '400' },
              ]}
            >
              Aliniem mesele pentru zilele selectate
            </Text>
          </View>

          <View style={styles.checkRow}>
            <Text style={styles.checkIcon}>{step3Done ? '✅' : '⏳'}</Text>
            <Text
              style={[
                styles.checkText,
                { color: step3Done ? theme.text : theme.textMuted, fontWeight: step3Done ? '600' : '400' },
              ]}
            >
              Compunem lista de cumpărături pe ambalaje
            </Text>
          </View>
        </View>

        <ActivityIndicator size="small" color={theme.primary} style={styles.spinner} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerBox: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  iconCircle: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 6,
  },
  circleEmoji: {
    fontSize: 22,
    letterSpacing: 4,
  },
  centerLogo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
  },
  checklistCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    marginBottom: 24,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    fontSize: 16,
  },
  checkText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  spinner: {
    marginTop: 8,
  },
});
