import React, { useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ReminderSettings } from '../types';
import { getAppTheme } from '../styles/theme';
import { DataExportButton } from './DataExportButton';
import { PrivacyPolicyLink } from './PrivacyPolicyLink';
import { ReminderSettingsPanel } from './ReminderSettingsPanel';
import { AccountIdentity } from './AccountIdentity';
import { DevicesSection } from './DevicesSection';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { currentOs } from '../services/platformOs';

/**
 * The store's own subscriptions page, for when RevenueCat does not hand one over. Managing
 * and cancelling happen there, never inside the app.
 */
function storeSubscriptionsPage(): string | null {
  const os = currentOs();
  if (os === 'ios') return 'https://apps.apple.com/account/subscriptions';
  if (os === 'android') return 'https://play.google.com/store/account/subscriptions';
  return null;
}

interface AccountPanelProps {
  userEmail: string;
  isDark: boolean;
  /** False without a Supabase project: sync is then said to be unavailable, up front. */
  isCloudAvailable: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  /** A sign-out or deletion is in flight. */
  isBusy: boolean;
  onSync?: () => void;
  onDownload?: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => Promise<void>;
  reminders: ReminderSettings;
  onChangeReminders: (patch: Partial<ReminderSettings>) => void;
  /**
   * Wide screens: two columns, reminders on the right. One 440 px column as tall as the
   * window was cut off on any shorter one.
   */
  wide?: boolean;
}

const Section: React.FC<{ title: string; isDark: boolean; children: React.ReactNode }> = ({
  title,
  isDark,
  children,
}) => {
  const theme = getAppTheme(isDark);
  return (
    <View style={[styles.section, { borderTopColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title}</Text>
      {children}
    </View>
  );
};

/**
 * The account screen once signed in, in five sections: the account (with the name and Face
 * ID), the devices signed in to it, sync, reminders, and the person's data. It used to be one column of equally loud buttons, where syncing, signing
 * out and deleting the account all looked alike.
 */
export const AccountPanel: React.FC<AccountPanelProps> = ({
  userEmail,
  isDark,
  isCloudAvailable,
  isSyncing,
  lastSyncedAt,
  isBusy,
  onSync,
  onDownload,
  onSignOut,
  onDeleteAccount,
  reminders,
  onChangeReminders,
  wide = false,
}) => {
  const theme = getAppTheme(isDark);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const subscription = useSubscriptionStore((s) => s.status);
  const manageUrl = subscription.managementUrl ?? storeSubscriptionsPage();

  const confirmDelete = async () => {
    await onDeleteAccount();
    setConfirmingDelete(false);
  };

  const accountSection = (
    <Section title="CONTUL TĂU" isDark={isDark}>
      <View style={styles.accountRow}>
        <Text style={[styles.email, { color: theme.text }]} numberOfLines={1}>
          {userEmail}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Deconectare cont"
          onPress={onSignOut}
          disabled={isBusy}
          style={[styles.smallBtn, { borderColor: theme.border }]}
        >
          <Text style={[styles.smallBtnText, { color: '#ef4444' }]}>Deconectare</Text>
        </TouchableOpacity>
      </View>
      <AccountIdentity email={userEmail} isDark={isDark} />
      {subscription.isActive && (
        <View style={styles.subscriptionRow}>
          <Text style={[styles.note, styles.subscriptionText, { color: theme.textMuted }]}>
            {subscription.isTrial
              ? 'Abonament: în perioada gratuită.'
              : subscription.willRenew
                ? 'Abonament: activ, se reînnoiește lunar.'
                : 'Abonament: activ până la sfârșitul perioadei plătite.'}
          </Text>
          {manageUrl && (
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Gestionează abonamentul"
              onPress={() => void Linking.openURL(manageUrl)}
            >
              <Text style={[styles.manageText, { color: theme.text }]}>Gestionează</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Section>
  );

  const devicesSection = (
    <Section title="DISPOZITIVE" isDark={isDark}>
      <DevicesSection isDark={isDark} />
    </Section>
  );

  const syncSection = (
    <Section title="SINCRONIZARE" isDark={isDark}>
      <Text style={[styles.note, { color: theme.textMuted }]}>
        {!isCloudAvailable
          ? 'Sincronizarea între telefoane nu e disponibilă pe această versiune. Planul tău e salvat pe acest dispozitiv.'
          : lastSyncedAt
            ? `Ultima sincronizare: ${lastSyncedAt}`
            : 'Planul și lista, aceleași pe toate telefoanele tale.'}
      </Text>
      <View style={styles.syncRow}>
        {onSync && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Urcă planul în cloud"
            onPress={onSync}
            disabled={isSyncing}
            style={[styles.syncBtn, { backgroundColor: theme.primary }]}
          >
            {isSyncing ? (
              <ActivityIndicator color={theme.primaryText} size="small" />
            ) : (
              <Text style={[styles.syncBtnText, { color: theme.primaryText }]}>⬆ Urcă</Text>
            )}
          </TouchableOpacity>
        )}
        {onDownload && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Adu planul din cloud"
            onPress={onDownload}
            disabled={isSyncing}
            style={[styles.syncBtn, styles.syncBtnOutline, { borderColor: theme.border }]}
          >
            <Text style={[styles.syncBtnText, { color: theme.text }]}>⬇ Adu</Text>
          </TouchableOpacity>
        )}
      </View>
    </Section>
  );

  const remindersSection = (
    <Section title="MEMENTOURI" isDark={isDark}>
      <ReminderSettingsPanel
        reminders={reminders}
        onChange={onChangeReminders}
        hasAccount
        isDark={isDark}
        embedded
      />
    </Section>
  );

  const dataSection = (
    <Section title="DATELE TALE" isDark={isDark}>
      <DataExportButton isDark={isDark} />
      <PrivacyPolicyLink isDark={isDark} />

      {/* Required by both stores, and the account holds declared allergies, which is
          special-category data under GDPR. Asked for twice because it cannot be undone. */}
      {confirmingDelete ? (
        <View style={styles.deleteConfirm}>
          <Text style={[styles.note, { color: theme.textMuted }]}>
            Se șterg definitiv contul, planul din cloud și preferințele salvate pe el. Acțiunea nu
            poate fi anulată.
          </Text>
          {subscription.isActive && (
            // Apple 5.1.1(v): the subscription lives in the store, and deleting the account
            // does not stop the payments. Said here, where it matters.
            <Text style={[styles.note, { color: theme.text }]}>
              Ștergerea contului nu anulează abonamentul. Îl anulezi din setările abonamentelor
              contului tău Apple sau Google Play, altfel plata continuă.
            </Text>
          )}
          <View style={styles.syncRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Renunță la ștergerea contului"
              onPress={() => setConfirmingDelete(false)}
              disabled={isBusy}
              style={[styles.syncBtn, styles.syncBtnOutline, { borderColor: theme.border }]}
            >
              <Text style={[styles.syncBtnText, { color: theme.text }]}>Renunț</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Confirmă ștergerea definitivă a contului"
              onPress={() => void confirmDelete()}
              disabled={isBusy}
              style={[styles.syncBtn, { backgroundColor: '#ef4444' }]}
            >
              <Text style={[styles.syncBtnText, { color: '#ffffff' }]}>Șterge definitiv</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Șterge contul"
          onPress={() => setConfirmingDelete(true)}
          disabled={isBusy}
          style={styles.deleteLink}
        >
          <Text style={[styles.deleteLinkText, { color: theme.textMuted }]}>
            Șterge contul și datele mele
          </Text>
        </TouchableOpacity>
      )}
    </Section>
  );

  if (wide) {
    return (
      <View style={styles.columns}>
        <View testID="account-column-left" style={styles.column}>
          {accountSection}
          {devicesSection}
          {syncSection}
          {dataSection}
        </View>
        <View testID="account-column-right" style={styles.column}>
          {remindersSection}
        </View>
      </View>
    );
  }

  return (
    <View>
      {accountSection}
      {devicesSection}
      {syncSection}
      {remindersSection}
      {dataSection}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { borderTopWidth: 1, paddingTop: 14, marginTop: 14 },
  columns: { flexDirection: 'row', gap: 28, alignItems: 'flex-start' },
  column: { flex: 1, minWidth: 0 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 10 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  email: { flex: 1, fontSize: 15, fontWeight: '700' },
  smallBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  smallBtnText: { fontSize: 13, fontWeight: '700' },
  note: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  syncRow: { flexDirection: 'row', gap: 10 },
  syncBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBtnOutline: { borderWidth: 1, backgroundColor: 'transparent' },
  syncBtnText: { fontSize: 14, fontWeight: '800' },
  deleteConfirm: { marginTop: 12 },
  subscriptionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  subscriptionText: { flex: 1, marginBottom: 0 },
  manageText: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  deleteLink: { alignSelf: 'center', paddingVertical: 10, marginTop: 6 },
  deleteLinkText: { fontSize: 12, textDecorationLine: 'underline' },
});
