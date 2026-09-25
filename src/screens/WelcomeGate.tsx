import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAppTheme } from '../styles/theme';
import { localAuthSimulation } from '../services/localAuthSimulation';
import { SESSION_DAYS } from '../services/localAuthSimulation';

interface WelcomeGateProps {
  onOpenAuth: () => void;
  onContinueAsGuest: () => void;
  isDark: boolean;
}

/**
 * The first screen of a fresh install.
 *
 * An account is the path this app is built around — it is what carries the week, the
 * cupboard and the reminders to a second phone. But the planner itself works offline and
 * without one, and Apple's guideline 5.1.1(i) says an app like that may not force
 * registration. So the account is offered first and loudly, and carrying on without one is
 * offered quietly rather than hidden.
 */
export const WelcomeGate: React.FC<WelcomeGateProps> = ({
  onOpenAuth,
  onContinueAsGuest,
  isDark,
}) => {
  const theme = getAppTheme(isDark);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={styles.mark}>🍽️</Text>
        <Text style={[styles.title, { color: theme.text }]}>SmartMeal RO</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Meniul săptămânii și lista de cumpărături, calculate pe prețurile din magazinul tău.
        </Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Cu un cont primești</Text>
          {[
            'Planul și cămara pe toate telefoanele tale',
            `Rămâi conectat ${SESSION_DAYS} de zile, fără să reintroduci parola`,
            'Mementouri care știu ce gătești azi',
          ].map((line) => (
            <Text key={line} style={[styles.cardLine, { color: theme.textMuted }]}>
              • {line}
            </Text>
          ))}
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Conectează-te sau creează cont"
          onPress={onOpenAuth}
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryBtnText, { color: theme.primaryText }]}>
            Conectare sau cont nou
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Continuă fără cont"
          onPress={onContinueAsGuest}
          style={styles.guestBtn}
          activeOpacity={0.7}
        >
          <Text style={[styles.guestText, { color: theme.textMuted }]}>
            Continuă fără cont
          </Text>
        </TouchableOpacity>

        <Text style={[styles.footnote, { color: theme.textMuted }]}>
          Fără cont, aplicația merge la fel — planul rămâne doar pe telefonul ăsta.
        </Text>

        {localAuthSimulation.isActive() && (
          <View style={[styles.simBanner, { borderColor: theme.border }]}>
            <Text style={[styles.simText, { color: theme.textMuted }]}>
              ⚙️ Simulare locală: conturile se salvează pe telefonul ăsta, nu pe server. Codul
              de resetare a parolei este {localAuthSimulation.SIMULATED_RESET_CODE}.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, maxWidth: 480, width: '100%', alignSelf: 'center' },
  mark: { fontSize: 46, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20, marginTop: 8 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 26 },
  cardTitle: { fontSize: 13, fontWeight: '900', marginBottom: 8 },
  cardLine: { fontSize: 12, fontWeight: '500', lineHeight: 19 },
  primaryBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  primaryBtnText: { fontSize: 15, fontWeight: '800' },
  guestBtn: { paddingVertical: 14, alignItems: 'center' },
  guestText: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  footnote: { fontSize: 11, fontWeight: '500', textAlign: 'center', lineHeight: 16 },
  simBanner: { borderWidth: 1, borderRadius: 12, padding: 11, marginTop: 20 },
  simText: { fontSize: 10, fontWeight: '600', lineHeight: 15 },
});
