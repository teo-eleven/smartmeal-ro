import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useAuthSessionStore } from '../store/authSessionStore';
import { REAUTH_INTERVAL_DAYS } from '../services/reauth';
import { getAppTheme } from '../styles/theme';

interface BiometricOptInPromptProps {
  isDark: boolean;
  /**
   * A window the store does not know about is open (the account window). iOS shows one at a
   * time, and a second would be dropped, so the question waits until the screen is clear.
   * Notices and confirmations are read from the store here, so no caller can forget them.
   */
  isSuppressed?: boolean;
}

/**
 * "Folosești Face ID data viitoare?" — asked once, after signing in, on a phone where Face ID
 * or a fingerprint is set up (authSessionStore decides when). Either answer is remembered;
 * the choice can be changed later in Cont.
 *
 * Not behind the monthly lock: the offer waits until the person has been verified.
 */
export function BiometricOptInPrompt({ isDark, isSuppressed = false }: BiometricOptInPromptProps) {
  const theme = getAppTheme(isDark);
  const email = useAppStore((s) => s.userEmail);
  const isSignedIn = useAppStore((s) => s.authStatus === 'signedIn');
  const { shouldOfferBiometric, biometricLabel, answerBiometricOffer } = useAuthSessionStore();
  const isStoreWindowOpen = useAppStore((s) =>
    Boolean(s.activeNotice || s.confirmRequest || s.openWindowCount > 0)
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!email || !isSignedIn || !shouldOfferBiometric || isSuppressed || isStoreWindowOpen) {
    return null;
  }

  const answer = async (accepted: boolean) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await answerBiometricOffer(email, accepted);
    } catch (e) {
      // The question comes back next time; nothing else depends on the answer being saved.
      console.warn('[SmartMeal] Alegerea pentru biometrie nu a putut fi salvată.', e);
      useAuthSessionStore.setState({ shouldOfferBiometric: false });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // Android's back button answers like "Nu acum"; without it the prompt could not be left.
    <Modal visible transparent animationType="fade" onRequestClose={() => void answer(false)}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={styles.mark}>🔐</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            {`Folosești ${biometricLabel} data viitoare?`}
          </Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            {`O dată la ${REAUTH_INTERVAL_DAYS} de zile îți cerem să confirmi că ești tu. Cu ${biometricLabel}, nu mai scrii parola.`}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Da, folosește ${biometricLabel}`}
            onPress={() => void answer(true)}
            disabled={isSaving}
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={[styles.primaryText, { color: theme.primaryText }]}>
              {`Da, folosește ${biometricLabel}`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Nu acum"
            onPress={() => void answer(false)}
            disabled={isSaving}
            style={styles.laterBtn}
          >
            <Text style={[styles.laterText, { color: theme.textMuted }]}>Nu acum</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: { width: '100%', maxWidth: 380, borderRadius: 20, borderWidth: 1, padding: 24 },
  mark: { fontSize: 36, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  body: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 19, marginTop: 8 },
  primaryBtn: {
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  primaryText: { fontSize: 15, fontWeight: '700' },
  laterBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  laterText: { fontSize: 13, fontWeight: '700' },
});
