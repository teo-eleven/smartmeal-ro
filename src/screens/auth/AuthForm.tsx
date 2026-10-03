import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SignUpConsent } from '../../components/SignUpConsent';
import { DISPLAY_NAME_MAX } from '../../utils/displayName';
import { AuthFormState, AuthMode } from './useAuthForm';
import { AuthTheme, authStyles as styles } from './authStyles';

const DEFAULT_TAB_LABELS: Record<AuthMode, string> = {
  signin: 'Autentificare',
  signup: 'Creează cont',
};

/** Sign in or open an account: the two tabs, the fields, the consent, and the way to a reset. */
interface AuthFormProps {
  form: AuthFormState;
  theme: AuthTheme;
  isDark: boolean;
  /** The full-screen login says "Conectare" and "Cont nou"; the account window keeps its own. */
  tabLabels?: Record<AuthMode, string>;
  /** When given, the sign-in tab offers an emailed code instead of the password. */
  onUseCode?: () => void;
}

export function AuthForm({
  form,
  theme,
  isDark,
  tabLabels = DEFAULT_TAB_LABELS,
  onUseCode,
}: AuthFormProps) {
  const inputStyle = [
    styles.input,
    { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
  ];

  return (
    <View style={styles.formSection}>
      <View style={styles.tabSwitch}>
        {(['signin', 'signup'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            accessibilityRole="tab"
            accessibilityLabel={`Fila ${tabLabels[tab]}`}
            accessibilityState={{ selected: form.mode === tab }}
            style={[
              styles.tabItem,
              form.mode === tab && [styles.tabItemActive, { borderBottomColor: theme.primary }],
            ]}
            onPress={() => form.setMode(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: form.mode === tab ? theme.primary : theme.textMuted },
              ]}
            >
              {tabLabels[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {form.mode === 'signup' && (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Cum te numești?</Text>
          <TextInput
            style={inputStyle}
            placeholder="Prenumele tău"
            placeholderTextColor={theme.textMuted}
            accessibilityLabel="Cum te numești?"
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
            // Loose on purpose: the check counts characters as the database does, and says so
            // when a name is too long; this only stops a runaway paste.
            maxLength={DISPLAY_NAME_MAX * 2}
            value={form.displayName}
            onChangeText={form.editDisplayName}
          />
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>Email</Text>
        <TextInput
          style={inputStyle}
          placeholder="exemplu@email.ro"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          value={form.email}
          onChangeText={form.editEmail}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.text }]}>Parolă</Text>
        <TextInput
          style={inputStyle}
          placeholder="••••••••"
          placeholderTextColor={theme.textMuted}
          secureTextEntry
          // Lets password managers offer the saved one, or a new strong one on Creează cont.
          autoComplete={form.mode === 'signup' ? 'new-password' : 'current-password'}
          textContentType={form.mode === 'signup' ? 'newPassword' : 'password'}
          value={form.password}
          onChangeText={form.editPassword}
        />
      </View>

      {form.mode === 'signup' && (
        <SignUpConsent consent={form.consent} onChange={form.editConsent} isDark={isDark} />
      )}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={form.mode === 'signin' ? 'Conectare cu parola' : 'Înregistrare'}
        style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
        onPress={form.handleAuth}
        disabled={form.loading}
      >
        {form.loading ? (
          <ActivityIndicator color={theme.primaryText} size="small" />
        ) : (
          <Text style={[styles.primaryBtnText, { color: theme.primaryText }]}>
            {form.mode === 'signin' ? 'Conectare' : 'Înregistrare'}
          </Text>
        )}
      </TouchableOpacity>

      {form.mode === 'signin' && onUseCode && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Primește un cod pe email"
          onPress={onUseCode}
          style={styles.resetBackBtn}
          disabled={form.loading}
        >
          <Text style={[styles.resetBackText, { color: theme.primary }]}>
            Primește un cod pe email
          </Text>
        </TouchableOpacity>
      )}

      {form.mode === 'signin' && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Am uitat parola"
          onPress={form.startReset}
          style={styles.resetBackBtn}
          disabled={form.loading}
        >
          <Text style={[styles.resetBackText, { color: theme.textMuted }]}>Am uitat parola</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
