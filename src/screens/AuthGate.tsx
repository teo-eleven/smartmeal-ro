import React from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { getAppTheme } from '../styles/theme';
import { LoginScreen } from './LoginScreen';
import { ReauthScreen } from './ReauthScreen';

/** True while the gate, not the app, owns the screen. */
export function isGateShowing(isHydrated: boolean, authStatus: string): boolean {
  return !isHydrated || authStatus === 'checking' || authStatus === 'locked';
}

/**
 * What stands in front of the app until there is someone to show it to:
 * - while the stored session is read, a spinner — so the login never flashes in front of
 *   somebody signed in three weeks ago;
 * - nobody signed in (and "without an account" not chosen this time): the login;
 * - signed in, but past the monthly check: the re-verification.
 */
export function AuthGate({ isDark }: { isDark: boolean }) {
  const isHydrated = useAppStore((s) => s.isHydrated);
  const authStatus = useAppStore((s) => s.authStatus);
  const setUserEmail = useAppStore((s) => s.setUserEmail);
  const continueAsGuest = useAppStore((s) => s.continueAsGuest);
  const theme = getAppTheme(isDark);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {!isHydrated ? (
        <ActivityIndicator
          style={styles.spinner}
          color={theme.text}
          accessibilityLabel="Se încarcă"
        />
      ) : authStatus === 'locked' ? (
        <ReauthScreen isDark={isDark} />
      ) : (
        <LoginScreen
          isDark={isDark}
          onSignedIn={setUserEmail}
          onContinueAsGuest={() => void continueAsGuest()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  spinner: { flex: 1 },
});
