import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { EmailCodeState } from './useEmailCodeSignIn';
import { AuthTheme, authStyles as styles } from './authStyles';

interface EmailCodeFormProps {
  code: EmailCodeState;
  theme: AuthTheme;
  isBusy: boolean;
  /** Hidden at the lock, where the account is already known. */
  askForEmail: boolean;
  /** "Folosește parola": back to the password form. */
  onUsePassword: () => void;
}

/** The address, then the code from the email. */
export function EmailCodeForm({
  code,
  theme,
  isBusy,
  askForEmail,
  onUsePassword,
}: EmailCodeFormProps) {
  const inputStyle = [
    styles.input,
    { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
  ];
  const isCodeStep = code.step === 'code';

  return (
    <View style={styles.formSection}>
      <Text style={[styles.resetHint, { color: theme.textMuted }]}>
        {isCodeStep
          ? `Am trimis un cod la ${code.address}. Verifică și în spam.`
          : 'Îți trimitem pe email un cod cu care intri fără parolă.'}
      </Text>

      {!isCodeStep && askForEmail && (
        <TextInput
          style={inputStyle}
          value={code.email}
          onChangeText={code.editEmail}
          placeholder="exemplu@email.ro"
          placeholderTextColor={theme.textMuted}
          accessibilityLabel="Adresa de email pentru cod"
          returnKeyType="go"
          onSubmitEditing={() => void code.requestCode()}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
      )}

      {isCodeStep && (
        <TextInput
          style={inputStyle}
          value={code.code}
          onChangeText={code.editCode}
          placeholder="123456"
          placeholderTextColor={theme.textMuted}
          accessibilityLabel="Codul de conectare"
          returnKeyType="go"
          onSubmitEditing={() => void code.verifyCode()}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          // Supabase sends 6 to 10 digits, depending on the project's setting.
          maxLength={10}
        />
      )}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={isCodeStep ? 'Intră în cont cu codul' : 'Trimite codul de conectare'}
        onPress={isCodeStep ? code.verifyCode : code.requestCode}
        style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
        disabled={isBusy}
      >
        {isBusy ? (
          <ActivityIndicator color={theme.primaryText} size="small" />
        ) : (
          <Text style={[styles.primaryBtnText, { color: theme.primaryText }]}>
            {isCodeStep ? 'Intră în cont' : 'Trimite codul'}
          </Text>
        )}
      </TouchableOpacity>

      {isCodeStep && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={code.restart}
          style={styles.resetBackBtn}
          disabled={isBusy}
        >
          <Text style={[styles.resetBackText, { color: theme.textMuted }]}>
            Nu a venit? Cere altul
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Folosește parola"
        onPress={onUsePassword}
        style={styles.resetBackBtn}
        disabled={isBusy}
      >
        <Text style={[styles.resetBackText, { color: theme.textMuted }]}>← Folosește parola</Text>
      </TouchableOpacity>
    </View>
  );
}
