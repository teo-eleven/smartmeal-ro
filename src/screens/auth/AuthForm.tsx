import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SignUpConsent } from '../../components/SignUpConsent';
import { DISPLAY_NAME_MAX } from '../../utils/displayName';
import { AuthFormState, AuthMode } from './useAuthForm';
import { AuthTheme, authStyles as styles } from './authStyles';

const TAB_LABELS: Record<AuthMode, string> = {
  signin: 'Autentificare',
  signup: 'Creează cont',
};

/** Sign in or open an account: the two tabs, the fields, the consent, and the way to a reset. */
export function AuthForm({
  form,
  theme,
  isDark,
}: {
  form: AuthFormState;
  theme: AuthTheme;
  isDark: boolean;
}) {
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
            accessibilityRole="button"
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
              {TAB_LABELS[tab]}
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
            maxLength={DISPLAY_NAME_MAX}
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
          value={form.password}
          onChangeText={form.editPassword}
        />
      </View>

      {form.mode === 'signup' && (
        <SignUpConsent consent={form.consent} onChange={form.editConsent} isDark={isDark} />
      )}

      <TouchableOpacity
        accessibilityRole="button"
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
