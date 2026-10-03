import React from 'react';
import { Text, View } from 'react-native';
import { authStyles as styles } from './authStyles';

/** The red and green boxes above a sign-in form. */
export function AuthMessages({
  errorMessage,
  successMessage,
}: {
  errorMessage: string | null;
  successMessage: string | null;
}) {
  return (
    <>
      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
      {successMessage && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}
    </>
  );
}
