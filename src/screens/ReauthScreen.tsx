import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useAuthSessionStore } from '../store/authSessionStore';
import { cloudSyncService } from '../services/supabase';
import { REAUTH_INTERVAL_DAYS } from '../services/reauth';
import { getAppTheme } from '../styles/theme';
import { useAuthForm } from './auth/useAuthForm';
import { useEmailCodeSignIn } from './auth/useEmailCodeSignIn';
import { EmailCodeForm } from './auth/EmailCodeForm';
import { AuthMessages } from './auth/AuthMessages';
import { authStyles, getAuthTheme } from './auth/authStyles';

/**
 * The monthly lock (services/reauth.ts): the session is still valid, but it has been thirty
 * days since this person last proved it is them. Face ID where it is on for the account,
 * otherwise the password or an emailed code.
 *
 * There is no "Continuă fără cont" here: on this screen it would be a way round the lock.
 * Signing out is always offered instead.
 */
export function ReauthScreen({ isDark }: { isDark: boolean }) {
  const theme = getAuthTheme(isDark);
  const background = getAppTheme(isDark).background;
  const email = useAppStore((s) => s.userEmail) ?? '';
  const setUserEmail = useAppStore((s) => s.setUserEmail);
  const signOutToLogin = useAppStore((s) => s.signOutToLogin);
  const { displayName, biometricEnabled, biometricLabel, unlockWithBiometrics } =
    useAuthSessionStore();

  // setUserEmail at the lock unlocks only once the verification is on record (useAppStore).
  const form = useAuthForm({ onUserChanged: setUserEmail, onSignedIn: () => undefined });
  const code = useEmailCodeSignIn(form, email);
  const [password, setPassword] = useState('');
  const [isCodeMode, setIsCodeMode] = useState(false);

  const unlockWithPassword = () =>
    form.run(async () => {
      const { user, error } = await cloudSyncService.signInWithEmail(email, password);
      if (error || !user) {
        form.showError(error ?? 'Parola nu a putut fi verificată.');
        return;
      }
      setPassword('');
      setUserEmail(user.email ?? email);
    });

  const unlockWithFace = () =>
    form.run(async () => {
      const result = await unlockWithBiometrics(email);
      if (result.error) form.showError(result.error);
      else if (result.success && useAppStore.getState().authStatus === 'locked') {
        form.showError('Nu am putut confirma. Folosește parola sau un cod pe email.');
      }
    });

  // Face ID is asked for once on its own, as soon as it is known to be on; after a cancel
  // the button stays for another try.
  const hasPrompted = useRef(false);
  useEffect(() => {
    if (!biometricEnabled || hasPrompted.current || form.loading || isCodeMode) return;
    hasPrompted.current = true;
    void unlockWithFace();
  }, [biometricEnabled]); // Only when Face ID becomes known to be on; once.

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.mark}>🔒</Text>
        <Text style={[styles.title, { color: theme.text }]}>
          {displayName ? `Bine ai revenit, ${displayName}` : 'Bine ai revenit'}
        </Text>
        <Text style={[styles.email, { color: theme.textMuted }]}>{email}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {`O dată la ${REAUTH_INTERVAL_DAYS} de zile confirmăm că ești tu.`}
        </Text>

        <View style={styles.formArea}>
          <AuthMessages errorMessage={form.errorMessage} successMessage={form.successMessage} />

          {biometricEnabled && !isCodeMode && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Deblochează cu ${biometricLabel}`}
              onPress={unlockWithFace}
              disabled={form.loading}
              style={[authStyles.primaryBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={[authStyles.primaryBtnText, { color: theme.primaryText }]}>
                {`Deblochează cu ${biometricLabel}`}
              </Text>
            </TouchableOpacity>
          )}

          {isCodeMode ? (
            <EmailCodeForm
              code={code}
              theme={theme}
              isBusy={form.loading}
              askForEmail={false}
              onUsePassword={() => {
                code.restart();
                setIsCodeMode(false);
              }}
            />
          ) : (
            <View style={authStyles.formSection}>
              <TextInput
                style={[
                  authStyles.input,
                  { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
                ]}
                value={password}
                onChangeText={(value) => {
                  form.clearMessages();
                  setPassword(value);
                }}
                placeholder="Parola"
                placeholderTextColor={theme.textMuted}
                accessibilityLabel="Parola contului"
                secureTextEntry
                autoComplete="current-password"
                textContentType="password"
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Deblochează cu parola"
                onPress={unlockWithPassword}
                disabled={form.loading}
                style={[
                  authStyles.primaryBtn,
                  biometricEnabled
                    ? [styles.secondaryBtn, { borderColor: theme.border }]
                    : { backgroundColor: theme.primary },
                ]}
              >
                {form.loading ? (
                  <ActivityIndicator color={theme.text} size="small" />
                ) : (
                  <Text
                    style={[
                      authStyles.primaryBtnText,
                      { color: biometricEnabled ? theme.text : theme.primaryText },
                    ]}
                  >
                    Deblochează
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Primește un cod pe email"
                onPress={() => {
                  form.clearMessages();
                  setIsCodeMode(true);
                }}
                style={authStyles.resetBackBtn}
              >
                <Text style={[authStyles.resetBackText, { color: theme.primary }]}>
                  Primește un cod pe email
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Nu ești tu? Deconectează-te"
          onPress={() => void signOutToLogin()}
          style={styles.signOutBtn}
        >
          <Text style={[styles.signOutText, { color: theme.textMuted }]}>
            Nu ești tu? Deconectează-te
          </Text>
        </TouchableOpacity>
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
  mark: { fontSize: 40, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  email: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 6 },
  subtitle: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 19, marginTop: 10 },
  formArea: { marginTop: 24, gap: 12 },
  secondaryBtn: { backgroundColor: 'transparent', borderWidth: 1 },
  signOutBtn: { paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  signOutText: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});
