import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { cloudSyncService } from '../services/supabase';
import { AccountPanel } from '../components/AccountPanel';
import { SignUpConsent } from '../components/SignUpConsent';
import { useAppStore } from '../store/useAppStore';
import { SignUpConsent as Consent } from '../types';
import { describeWeakPassword } from '../utils/passwordPolicy';
import { describeMissingConsent } from '../utils/signUpConsent';

const NO_CONSENT: Consent = { isAtLeast16: false, healthDataConsent: false };
import { getAppTheme } from '../styles/theme';
import { useResponsive } from '../hooks/useResponsive';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  userEmail: string | null;
  onUserChanged: (email: string | null) => void;
  onSyncTriggered?: () => Promise<void>;
  onDownloadTriggered?: () => Promise<void>;
  isSyncing?: boolean;
  lastSyncedAt?: string | null;
}

export function AuthModal({
  visible,
  onClose,
  isDark,
  userEmail,
  onUserChanged,
  onSyncTriggered,
  onDownloadTriggered,
  isSyncing = false,
  lastSyncedAt = null,
}: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  // The reset runs as its own little machine: ask for the address, take the emailed code,
  // then set the password. Each step only unlocks once the one before it succeeded.
  const [resetStep, setResetStep] = useState<'off' | 'email' | 'code' | 'password'>('off');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [consent, setConsent] = useState<Consent>(NO_CONSENT);
  const { reminders, updateReminders } = useAppStore();

  const appTheme = getAppTheme(isDark);
  const { isMobile, height: windowHeight } = useResponsive();
  const theme = {
    card: appTheme.card,
    text: appTheme.text,
    textMuted: appTheme.textMuted,
    border: appTheme.border,
    primary: appTheme.primary,
    primaryText: appTheme.primaryText,
    inputBg: isDark ? '#1c1c1e' : '#f2f2f7',
    overlayBg: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)',
  };

  // Once someone is signed in, nothing they typed stays behind. The form used to keep the
  // password and the ticked consent boxes, and signing out showed them again, ready for
  // whoever used the phone next.
  const clearForm = () => {
    setEmail('');
    setPassword('');
    setConsent(NO_CONSENT);
    setMode('signin');
  };

  // Any edit clears the last error. One left on screen after the person has fixed the field
  // it was about reads as a second, new error.
  const editEmail = (value: string) => {
    setErrorMessage(null);
    setEmail(value);
  };
  const editPassword = (value: string) => {
    setErrorMessage(null);
    setPassword(value);
  };
  const editConsent = (value: Consent) => {
    setErrorMessage(null);
    setConsent(value);
  };

  const handleAuth = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Te rugăm să completezi atât adresa de email, cât și parola.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { user, error } = await cloudSyncService.signInWithEmail(email.trim(), password);
        if (error) {
          setErrorMessage(error);
        } else {
          onUserChanged(user?.email || email.trim());
          clearForm();
          setSuccessMessage('Te-ai conectat cu succes!');
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else {
        const weak = describeWeakPassword(password);
        if (weak) {
          setErrorMessage(weak);
          return;
        }
        const missing = describeMissingConsent(consent);
        if (missing) {
          setErrorMessage(missing);
          return;
        }
        const { user, error, needsConfirmation } = await cloudSyncService.signUpWithEmail(
          email.trim(),
          password,
          consent
        );
        if (error) {
          setErrorMessage(error);
        } else if (needsConfirmation) {
          // No session until the address is confirmed, so nobody is signed in yet. The
          // sign-in tab is where they come back to, with the address already filled in.
          setMode('signin');
          setPassword('');
          setSuccessMessage(
            'Cont creat. Verifică emailul și apasă linkul de confirmare, apoi conectează-te aici.'
          );
        } else {
          onUserChanged(user?.email || email.trim());
          clearForm();
          setSuccessMessage('Cont creat. Te-ai conectat.');
          // Closed the same way as after signing in. Left open, the window came back on its
          // own over the plan once the main screen mounted.
          setTimeout(() => {
            onClose();
          }, 800);
        }
      }
    } catch {
      setErrorMessage('A apărut o problemă la comunicarea cu serverul.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const { success, error } = await cloudSyncService.deleteAccount();
      if (!success) {
        setErrorMessage(error ?? 'Contul nu a putut fi șters.');
        return;
      }
      onUserChanged(null);
      setSuccessMessage('Contul și datele lui au fost șterse.');
    } finally {
      setLoading(false);
    }
  };

  const leaveReset = () => {
    setResetStep('off');
    setResetCode('');
    setNewPassword('');
    setErrorMessage(null);
  };

  const handleRequestReset = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!email.trim()) {
      setErrorMessage('Scrie adresa de email a contului.');
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await cloudSyncService.requestPasswordReset(email);
      if (!success) {
        setErrorMessage(error ?? 'Codul nu a putut fi trimis.');
        return;
      }
      // Deliberately the same message whether the address has an account or not: anything
      // else turns this into a way of finding out who is registered.
      setSuccessMessage('Dacă adresa are cont, îți trimitem un cod pe email în câteva minute.');
      setResetStep('code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (resetCode.trim().length < 6) {
      setErrorMessage('Codul din email are cel puțin 6 cifre.');
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await cloudSyncService.verifyPasswordResetCode(email, resetCode);
      if (!success) {
        setErrorMessage(error ?? 'Codul nu este valid.');
        return;
      }
      setResetStep('password');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const weak = describeWeakPassword(newPassword);
    if (weak) {
      setErrorMessage(weak);
      return;
    }

    setLoading(true);
    try {
      // The address is needed by the local simulation, which has no session to hang the new
      // password on; the real backend ignores it and uses the session the code produced.
      const { success, error } = await cloudSyncService.updatePassword(newPassword, email.trim());
      if (!success) {
        setErrorMessage(error ?? 'Parola nu a putut fi schimbată.');
        return;
      }
      onUserChanged(email.trim());
      clearForm();
      leaveReset();
      setSuccessMessage('Parola a fost schimbată. Ești conectat.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await cloudSyncService.signOut();
      onUserChanged(null);
      clearForm();
      setSuccessMessage('Te-ai deconectat.');
    } finally {
      setLoading(false);
    }
  };

  // The signed-in account was one 440 px card as tall as the screen that did not scroll: on
  // a phone its title was cut off at the top and "Închide" fell below the bottom edge. Now a
  // phone gets the whole screen, a wide screen a wide two-column panel, and both scroll
  // inside a height that fits. The sign-in forms stay a narrow card; they are short.
  const isAccount = Boolean(userEmail);
  const isFullScreen = isAccount && isMobile;
  const isWide = isAccount && !isMobile;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={[
          styles.backdrop,
          isFullScreen && styles.backdropFull,
          { backgroundColor: theme.overlayBg },
        ]}
      >
        <SafeAreaView
          style={[
            styles.modalContainer,
            isWide && styles.modalContainerWide,
            isFullScreen && styles.modalContainerFull,
          ]}
        >
          <View
            style={[
              styles.card,
              isFullScreen ? styles.cardFull : { maxHeight: windowHeight - 32 },
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <ScrollView
              testID="account-scroll"
              contentContainerStyle={styles.cardContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    Sincronizare Cloud & Cont
                  </Text>
                  <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                    Păstrează planul alimentar și lista de cumpărături pe toate dispozitivele tale.
                  </Text>
                </View>
                {isAccount && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Închide fereastra de cont"
                    onPress={onClose}
                    style={[styles.headerClose, { borderColor: theme.border }]}
                  >
                    <Text style={[styles.headerCloseText, { color: theme.text }]}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Error or Success alerts */}
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

              {/* Authenticated State */}
              {userEmail ? (
                <AccountPanel
                  userEmail={userEmail}
                  isDark={isDark}
                  isCloudAvailable={cloudSyncService.isConfigured()}
                  isSyncing={isSyncing}
                  lastSyncedAt={lastSyncedAt}
                  isBusy={loading}
                  onSync={onSyncTriggered}
                  onDownload={onDownloadTriggered}
                  onSignOut={handleSignOut}
                  onDeleteAccount={handleDeleteAccount}
                  reminders={reminders}
                  onChangeReminders={updateReminders}
                  wide={isWide}
                />
              ) : resetStep !== 'off' ? (
                /* Password reset: address, then the emailed code, then the new password. */
                <View style={styles.formSection}>
                  <Text style={[styles.resetTitle, { color: theme.text }]}>
                    {resetStep === 'email'
                      ? 'Ți-ai uitat parola?'
                      : resetStep === 'code'
                        ? 'Codul din email'
                        : 'Alege o parolă nouă'}
                  </Text>
                  <Text style={[styles.resetHint, { color: theme.textMuted }]}>
                    {resetStep === 'email'
                      ? 'Scrie adresa contului și îți trimitem un cod pe email.'
                      : resetStep === 'code'
                        ? `Am trimis un cod la ${email.trim()}. Verifică și în spam.`
                        : 'Minimum 10 caractere, cu cel puțin o literă și o cifră.'}
                  </Text>

                  {resetStep === 'email' && (
                    <TextInput
                      value={email}
                      onChangeText={editEmail}
                      placeholder="exemplu@email.ro"
                      placeholderTextColor={theme.textMuted}
                      accessibilityLabel="Adresa de email pentru resetare"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg }]}
                    />
                  )}

                  {resetStep === 'code' && (
                    <TextInput
                      value={resetCode}
                      onChangeText={setResetCode}
                      placeholder="123456"
                      placeholderTextColor={theme.textMuted}
                      accessibilityLabel="Codul primit pe email"
                      keyboardType="number-pad"
                      // Supabase sends 6 to 10 digits, depending on the project's OTP length
                      // setting. Stopping at 6 made the rest of a real code untypable.
                      maxLength={10}
                      style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg }]}
                    />
                  )}

                  {resetStep === 'password' && (
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="••••••••••"
                      placeholderTextColor={theme.textMuted}
                      accessibilityLabel="Parola nouă"
                      secureTextEntry
                      style={[styles.input, { color: theme.text, backgroundColor: theme.inputBg }]}
                    />
                  )}

                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={
                      resetStep === 'email'
                        ? 'Trimite codul pe email'
                        : resetStep === 'code'
                          ? 'Verifică codul'
                          : 'Salvează parola nouă'
                    }
                    onPress={
                      resetStep === 'email'
                        ? handleRequestReset
                        : resetStep === 'code'
                          ? handleVerifyCode
                          : handleSetNewPassword
                    }
                    style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={theme.primaryText} size="small" />
                    ) : (
                      <Text style={[styles.primaryBtnText, { color: theme.primaryText }]}>
                        {resetStep === 'email'
                          ? 'Trimite codul'
                          : resetStep === 'code'
                            ? 'Verifică codul'
                            : 'Salvează parola'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Renunță la resetarea parolei"
                    onPress={leaveReset}
                    style={styles.resetBackBtn}
                    disabled={loading}
                  >
                    <Text style={[styles.resetBackText, { color: theme.textMuted }]}>
                      ← Înapoi la autentificare
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Unauthenticated Form */
                <View style={styles.formSection}>
                  <View style={styles.tabSwitch}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      style={[
                        styles.tabItem,
                        mode === 'signin' && [
                          styles.tabItemActive,
                          { borderBottomColor: theme.primary },
                        ],
                      ]}
                      onPress={() => setMode('signin')}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          { color: mode === 'signin' ? theme.primary : theme.textMuted },
                        ]}
                      >
                        Autentificare
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      style={[
                        styles.tabItem,
                        mode === 'signup' && [
                          styles.tabItemActive,
                          { borderBottomColor: theme.primary },
                        ],
                      ]}
                      onPress={() => setMode('signup')}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          { color: mode === 'signup' ? theme.primary : theme.textMuted },
                        ]}
                      >
                        Creează cont
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Email</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.inputBg,
                          color: theme.text,
                          borderColor: theme.border,
                        },
                      ]}
                      placeholder="exemplu@email.ro"
                      placeholderTextColor={theme.textMuted}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={editEmail}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Parolă</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.inputBg,
                          color: theme.text,
                          borderColor: theme.border,
                        },
                      ]}
                      placeholder="••••••••"
                      placeholderTextColor={theme.textMuted}
                      secureTextEntry
                      value={password}
                      onChangeText={editPassword}
                    />
                  </View>

                  {mode === 'signup' && (
                    <SignUpConsent consent={consent} onChange={editConsent} isDark={isDark} />
                  )}

                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                    onPress={handleAuth}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={theme.primaryText} size="small" />
                    ) : (
                      <Text style={[styles.primaryBtnText, { color: theme.primaryText }]}>
                        {mode === 'signin' ? 'Conectare' : 'Înregistrare'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {mode === 'signin' && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Am uitat parola"
                      onPress={() => {
                        setErrorMessage(null);
                        setSuccessMessage(null);
                        setResetStep('email');
                      }}
                      style={styles.resetBackBtn}
                      disabled={loading}
                    >
                      <Text style={[styles.resetBackText, { color: theme.textMuted }]}>
                        Am uitat parola
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Close Button */}
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={userEmail ? 'Închide' : 'Continuă fără cont'}
                style={styles.closeBtn}
                onPress={onClose}
              >
                <Text style={[styles.closeBtnText, { color: theme.textMuted }]}>
                  {userEmail ? 'Închide' : 'Continuă fără cont (Mod Oaspete)'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  resetTitle: { fontSize: 16, fontWeight: '900', marginBottom: 6 },
  resetHint: { fontSize: 12, fontWeight: '500', lineHeight: 18, marginBottom: 14 },
  resetBackBtn: { paddingVertical: 12, alignItems: 'center' },
  resetBackText: { fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdropFull: {
    padding: 0,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
  },
  modalContainerWide: {
    maxWidth: 880,
  },
  modalContainerFull: {
    maxWidth: '100%',
    height: '100%',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardFull: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 0,
  },
  cardContent: {
    padding: 24,
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCloseText: {
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  successText: {
    color: '#30d158',
    fontSize: 13,
    fontWeight: '600',
  },
  formSection: {
    gap: 14,
  },
  tabSwitch: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#ffffff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  primaryBtn: {
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 8,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
