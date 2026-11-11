import React from 'react';
import { Text, View } from 'react-native';
import { getAppTheme } from '../../styles/theme';
import { authStyles as styles } from './authStyles';

/** The red and green boxes above a sign-in form. */
export function AuthMessages({
  errorMessage,
  successMessage,
  isDark,
}: {
  errorMessage: string | null;
  successMessage: string | null;
  isDark: boolean;
}) {
  const theme = getAppTheme(isDark);
  return (
    <>
      {errorMessage && (
        <View style={[styles.errorBox, { backgroundColor: theme.dangerBg }]}>
          <Text style={[styles.errorText, { color: theme.danger }]}>{errorMessage}</Text>
        </View>
      )}
      {successMessage && (
        <View style={[styles.successBox, { backgroundColor: theme.successBg }]}>
          <Text style={[styles.successText, { color: theme.successText }]}>{successMessage}</Text>
        </View>
      )}
    </>
  );
}
