import React from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { cloudSyncService } from '../services/supabase';
import { AccountPanel } from '../components/AccountPanel';
import { useAppStore } from '../store/useAppStore';
import { useResponsive } from '../hooks/useResponsive';
import { useAuthForm } from './auth/useAuthForm';
import { AuthForm } from './auth/AuthForm';
import { ResetPasswordFlow } from './auth/ResetPasswordFlow';
import { AuthMessages } from './auth/AuthMessages';
import { getAuthTheme } from './auth/authStyles';
import { useBlockingWindow } from '../hooks/useBlockingWindow';
import { useShallow } from 'zustand/react/shallow';

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

/**
 * The account window: the sign-in forms when nobody is signed in, the account panel when
 * somebody is. The forms themselves live in ./auth, shared with the full-screen login.
 */
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
  useBlockingWindow(visible);
  const form = useAuthForm({ onUserChanged, onSignedIn: onClose });
  const {
    reminders,
    updateReminders,
  } = useAppStore(
    useShallow((state) => ({
      reminders: state.reminders,
      updateReminders: state.updateReminders,
    }))
  );
  const theme = getAuthTheme(isDark);
  const { isMobile, height: windowHeight } = useResponsive();

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

              <AuthMessages errorMessage={form.errorMessage} successMessage={form.successMessage} />

              {/* Authenticated State */}
              {userEmail ? (
                <AccountPanel
                  userEmail={userEmail}
                  isDark={isDark}
                  isCloudAvailable={cloudSyncService.isConfigured()}
                  isSyncing={isSyncing}
                  lastSyncedAt={lastSyncedAt}
                  isBusy={form.loading}
                  onSync={onSyncTriggered}
                  onDownload={onDownloadTriggered}
                  onSignOut={form.handleSignOut}
                  onDeleteAccount={form.handleDeleteAccount}
                  reminders={reminders}
                  onChangeReminders={updateReminders}
                  wide={isWide}
                />
              ) : form.resetStep !== 'off' ? (
                <ResetPasswordFlow form={form} theme={theme} />
              ) : (
                <AuthForm form={form} theme={theme} isDark={isDark} />
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
