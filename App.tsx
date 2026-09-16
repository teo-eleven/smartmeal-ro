import React from 'react';
import { StyleSheet, Text, View, useColorScheme, SafeAreaView, StatusBar } from 'react-native';
import { env } from './config/env';

export default function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    background: isDark ? '#0f172a' : '#f8fafc',
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    primary: '#10b981', // emerald
    border: isDark ? '#334155' : '#e2e8f0',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>🌱 SmartMeal RO</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>SmartMeal RO</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Planificare inteligentă de mese & optimizare buget supermarket
        </Text>

        <View style={styles.statusBox}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.textMuted }]}>Mediu:</Text>
            <Text style={[styles.statusValue, { color: theme.primary }]}>{env.appEnv}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.textMuted }]}>Port Web:</Text>
            <Text style={[styles.statusValue, { color: theme.text }]}>{env.port}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.textMuted }]}>Temă activă:</Text>
            <Text style={[styles.statusValue, { color: theme.text }]}>
              {isDark ? 'Dark Mode 🌙' : 'Light Mode ☀️'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.textMuted }]}>Stare Auth:</Text>
            <Text style={[styles.statusValue, { color: theme.primary }]}>Guest First (Local)</Text>
          </View>
        </View>

        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          Setup verificat cu succes. Gata pentru generarea planului.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    marginBottom: 16,
  },
  badgeText: {
    color: '#065f46',
    fontWeight: '700',
    fontSize: 13,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  statusBox: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
