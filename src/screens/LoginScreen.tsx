import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthForm } from './auth/useAuthForm';
import { useEmailCodeSignIn } from './auth/useEmailCodeSignIn';
import { AuthForm } from './auth/AuthForm';
import { EmailCodeForm } from './auth/EmailCodeForm';
import { ResetPasswordFlow } from './auth/ResetPasswordFlow';
import { AuthMessages } from './auth/AuthMessages';
import { getAuthTheme } from './auth/authStyles';
import { PrivacyPolicyLink } from '../components/PrivacyPolicyLink';
import { localAuthSimulation } from '../services/localAuthSimulation';
import { getAppTheme } from '../styles/theme';

interface LoginScreenProps {
  isDark: boolean;
  /** A session now exists for this address. */
  onSignedIn: (email: string | null) => void;
  onContinueAsGuest: () => void;
}

const TAB_LABELS = { signin: 'Conectare', signup: 'Cont nou' } as const;

/**
 * The first screen for anyone not signed in: sign in (password or an emailed code), open an
 * account, or reset a password, all on one page.
 *
 * An account is what this app is built around — it carries the week, the cupboard and the
 * reminders to a second phone. But the planner works offline without one, and Apple's
 * guideline 5.1.1(i) says an app like that may not force registration. So the account comes
 * first, and carrying on without one is offered quietly rather than hidden.
 */
export function LoginScreen({ isDark, onSignedIn, onContinueAsGuest }: LoginScreenProps) {
  const theme = getAuthTheme(isDark);
  // The screen is replaced the moment a session exists, so there is nothing to close.
  const form = useAuthForm({ onUserChanged: onSignedIn, onSignedIn: () => undefined });
  const code = useEmailCodeSignIn(form);
  const [isCodeMode, setIsCodeMode] = useState(false);

  const showCode = () => {
    form.clearMessages();
    setIsCodeMode(true);
  };
  const showPassword = () => {
    code.restart();
    setIsCodeMode(false);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: getAppTheme(isDark).background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.mark}>🍽️</Text>
        <Text style={[styles.title, { color: theme.text }]}>SmartMeal RO</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Meniul săptămânii și lista de cumpărături, cu prețuri estimate la magazinul tău.
        </Text>

        <View style={styles.formArea}>
          <AuthMessages errorMessage={form.errorMessage} successMessage={form.successMessage} />
          {form.resetStep !== 'off' ? (
            <ResetPasswordFlow form={form} theme={theme} />
          ) : isCodeMode && form.mode === 'signin' ? (
            <EmailCodeForm
              code={code}
              theme={theme}
              isBusy={form.loading}
              askForEmail
              onUsePassword={showPassword}
            />
          ) : (
            <AuthForm
              form={form}
              theme={theme}
              isDark={isDark}
              tabLabels={TAB_LABELS}
              onUseCode={showCode}
            />
          )}
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Continuă fără cont"
          onPress={onContinueAsGuest}
          style={styles.guestBtn}
        >
          <Text style={[styles.guestText, { color: theme.textMuted }]}>Continuă fără cont</Text>
        </TouchableOpacity>
        <Text style={[styles.footnote, { color: theme.textMuted }]}>
          Fără cont, aplicația merge la fel — planul rămâne doar pe dispozitivul ăsta.
        </Text>

        {/* Apple requires the policy to be reachable in the app, account or not (5.1.1(i)). */}
        <View style={styles.policy}>
          <PrivacyPolicyLink isDark={isDark} />
        </View>

        {localAuthSimulation.isActive() && (
          <View style={[styles.simBanner, { borderColor: theme.border }]}>
            <Text style={[styles.simText, { color: theme.textMuted }]}>
              ⚙️ Simulare locală: conturile se salvează pe dispozitivul ăsta, nu pe server. Codul
              pentru conectare și pentru resetarea parolei este{' '}
              {localAuthSimulation.SIMULATED_LOGIN_CODE}.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  mark: { fontSize: 44, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontWeight: '500', textAlign: 'center', lineHeight: 20, marginTop: 8 },
  formArea: { marginTop: 24 },
  guestBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  guestText: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  footnote: { fontSize: 11, fontWeight: '500', textAlign: 'center', lineHeight: 16 },
  policy: { alignItems: 'center', marginTop: 8 },
  simBanner: { borderWidth: 1, borderRadius: 12, padding: 11, marginTop: 20 },
  simText: { fontSize: 10, fontWeight: '600', lineHeight: 15 },
});
