import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { cloudSyncService } from '../services/supabase';
import { getAppTheme } from '../styles/theme';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const appTheme = getAppTheme(isDark);
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
          setSuccessMessage('Te-ai conectat cu succes!');
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else {
        const { user, error } = await cloudSyncService.signUpWithEmail(email.trim(), password);
        if (error) {
          setErrorMessage(error);
        } else {
          onUserChanged(user?.email || email.trim());
          setSuccessMessage('Cont creat cu succes! Verifică email-ul pentru confirmare.');
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
        setConfirmingDelete(false);
        return;
      }
      onUserChanged(null);
      setConfirmingDelete(false);
      setSuccessMessage('Contul și datele lui au fost șterse.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await cloudSyncService.signOut();
      onUserChanged(null);
      setSuccessMessage('Te-ai deconectat.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: theme.overlayBg }]}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Sincronizare Cloud & Cont</Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                  Păstrează planul alimentar și lista de cumpărături pe toate dispozitivele tale.
                </Text>
              </View>
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
              <View style={styles.userSection}>
                <View style={[styles.userBadge, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
                  <Text style={[styles.userLabel, { color: theme.textMuted }]}>Autentificat ca:</Text>
                  <Text style={[styles.userEmailText, { color: theme.text }]}>{userEmail}</Text>
                  {lastSyncedAt && (
                    <Text style={[styles.syncTimeText, { color: theme.primary }]}>
                      ✓ Sincronizat: {lastSyncedAt}
                    </Text>
                  )}
                </View>

                {onSyncTriggered && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Urcă planul în cloud"
                    style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                    onPress={onSyncTriggered}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <ActivityIndicator color={theme.primaryText} size="small" />
                    ) : (
                      <Text style={[styles.primaryBtnText, { color: theme.primaryText }]}>⬆ Urcă planul de aici</Text>
                    )}
                  </TouchableOpacity>
                )}

                {onDownloadTriggered && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Adu planul din cloud"
                    style={[styles.secondaryBtn, { borderColor: theme.border }]}
                    onPress={onDownloadTriggered}
                    disabled={isSyncing}
                  >
                    <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
                      ⬇ Adu planul de pe alt dispozitiv
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  accessibilityRole="button"
                  style={[styles.secondaryBtn, { borderColor: theme.border }]}
                  onPress={handleSignOut}
                  disabled={loading}
                >
                  <Text style={[styles.secondaryBtnText, { color: '#ef4444' }]}>Deconectare cont</Text>
                </TouchableOpacity>

                {/* Required by both stores, and the account holds declared allergies, which
                    is special-category data under GDPR. Asked for twice because it cannot
                    be undone. */}
                {confirmingDelete ? (
                  <View style={styles.deleteConfirmRow}>
                    <Text style={[styles.deleteWarning, { color: theme.textMuted }]}>
                      Se șterg definitiv contul, planul din cloud și preferințele salvate pe el.
                      Acțiunea nu poate fi anulată.
                    </Text>
                    <View style={styles.deleteActions}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Renunță la ștergerea contului"
                        onPress={() => setConfirmingDelete(false)}
                        style={[styles.deleteBtn, { borderColor: theme.border }]}
                        disabled={loading}
                      >
                        <Text style={[styles.deleteBtnText, { color: theme.text }]}>Renunț</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Confirmă ștergerea definitivă a contului"
                        onPress={handleDeleteAccount}
                        style={[styles.deleteBtn, { backgroundColor: '#ef4444', borderColor: '#ef4444' }]}
                        disabled={loading}
                      >
                        <Text style={[styles.deleteBtnText, { color: '#ffffff' }]}>
                          Șterge definitiv
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Șterge contul"
                    onPress={() => setConfirmingDelete(true)}
                    style={styles.deleteLink}
                    disabled={loading}
                  >
                    <Text style={[styles.deleteLinkText, { color: theme.textMuted }]}>
                      Șterge contul și datele mele
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              /* Unauthenticated Form */
              <View style={styles.formSection}>
                <View style={styles.tabSwitch}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    style={[
                      styles.tabItem,
                      mode === 'signin' && [styles.tabItemActive, { borderBottomColor: theme.primary }],
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
                      mode === 'signup' && [styles.tabItemActive, { borderBottomColor: theme.primary }],
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
                      { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
                    ]}
                    placeholder="exemplu@email.ro"
                    placeholderTextColor={theme.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.text }]}>Parolă</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border },
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

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
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  deleteLink: { paddingVertical: 12, alignItems: 'center' },
  deleteLinkText: { fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
  deleteConfirmRow: { marginTop: 10 },
  deleteWarning: { fontSize: 11, fontWeight: '500', lineHeight: 16, marginBottom: 10 },
  deleteActions: { flexDirection: 'row', gap: 10 },
  deleteBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  deleteBtnText: { fontSize: 12, fontWeight: '800' },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    marginBottom: 20,
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
  userSection: {
    gap: 12,
    marginBottom: 12,
  },
  userBadge: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  userLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  userEmailText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  syncTimeText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
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
  secondaryBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
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
