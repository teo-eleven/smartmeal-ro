import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthFormState, ResetStep } from './useAuthForm';
import { AuthTheme, authStyles as styles } from './authStyles';

const TITLES: Record<Exclude<ResetStep, 'off'>, string> = {
  email: 'Ți-ai uitat parola?',
  code: 'Codul din email',
  password: 'Alege o parolă nouă',
};
const BUTTON_LABELS: Record<Exclude<ResetStep, 'off'>, string> = {
  email: 'Trimite codul',
  code: 'Verifică codul',
  password: 'Salvează parola',
};
const BUTTON_A11Y: Record<Exclude<ResetStep, 'off'>, string> = {
  email: 'Trimite codul pe email',
  code: 'Verifică codul',
  password: 'Salvează parola nouă',
};

/** Password reset: the address, then the emailed code, then the new password. */
export function ResetPasswordFlow({ form, theme }: { form: AuthFormState; theme: AuthTheme }) {
  const step = form.resetStep === 'off' ? 'email' : form.resetStep;
  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.inputBg }];
  const onSubmit =
    step === 'email'
      ? form.handleRequestReset
      : step === 'code'
        ? form.handleVerifyCode
        : form.handleSetNewPassword;
  const hint =
    step === 'email'
      ? 'Scrie adresa contului și îți trimitem un cod pe email.'
      : step === 'code'
        ? `Am trimis un cod la ${form.email.trim()}. Verifică și în spam.`
        : 'Minimum 10 caractere, cu cel puțin o literă și o cifră.';

  return (
    <View style={styles.formSection}>
      <Text style={[styles.resetTitle, { color: theme.text }]}>{TITLES[step]}</Text>
      <Text style={[styles.resetHint, { color: theme.textMuted }]}>{hint}</Text>

      {step === 'email' && (
        <TextInput
          value={form.email}
          onChangeText={form.editEmail}
          placeholder="exemplu@email.ro"
          placeholderTextColor={theme.textMuted}
          accessibilityLabel="Adresa de email pentru resetare"
          autoCapitalize="none"
          keyboardType="email-address"
          style={inputStyle}
        />
      )}

      {step === 'code' && (
        <TextInput
          value={form.resetCode}
          onChangeText={form.setResetCode}
          placeholder="123456"
          placeholderTextColor={theme.textMuted}
          accessibilityLabel="Codul primit pe email"
          keyboardType="number-pad"
          // Supabase sends 6 to 10 digits, depending on the project's OTP length setting.
          // Stopping at 6 made the rest of a real code untypable.
          maxLength={10}
          style={inputStyle}
        />
      )}

      {step === 'password' && (
        <TextInput
          value={form.newPassword}
          onChangeText={form.setNewPassword}
          placeholder="••••••••••"
          placeholderTextColor={theme.textMuted}
          accessibilityLabel="Parola nouă"
          secureTextEntry
          style={inputStyle}
        />
      )}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={BUTTON_A11Y[step]}
        onPress={onSubmit}
        style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
        disabled={form.loading}
      >
        {form.loading ? (
          <ActivityIndicator color={theme.primaryText} size="small" />
        ) : (
          <Text style={[styles.primaryBtnText, { color: theme.primaryText }]}>
            {BUTTON_LABELS[step]}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Renunță la resetarea parolei"
        onPress={form.leaveReset}
        style={styles.resetBackBtn}
        disabled={form.loading}
      >
        <Text style={[styles.resetBackText, { color: theme.textMuted }]}>
          ← Înapoi la autentificare
        </Text>
      </TouchableOpacity>
    </View>
  );
}
