import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DeviceInfo, listDevices, revokeDevice } from '../services/devices';
import { describeLastSeen } from '../utils/deviceLabel';
import { getAppTheme } from '../styles/theme';
import { ConfirmDialog } from './ConfirmDialog';

const PLATFORM_ICONS: Record<DeviceInfo['platform'], string> = {
  ios: '📱',
  android: '📱',
  web: '💻',
};

/**
 * Cont → Dispozitive: every phone and browser signed in to the account, this one first, and
 * a way to sign any other out (services/devices.ts, migration 0007). This device is signed
 * out with "Deconectare" above, as everywhere else, so it has no button here.
 *
 * The other device keeps a working access token until it expires, so the dialog says the
 * sign-out takes effect within the hour rather than promising it at once.
 */
export function DevicesSection({ isDark }: { isDark: boolean }) {
  const theme = getAppTheme(isDark);
  const [devices, setDevices] = useState<DeviceInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState<DeviceInfo | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!isMountedRef.current) return;
    setError(null);
    const result = await listDevices();
    if (!isMountedRef.current) return;
    setDevices(result.devices);
    setError(result.error);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmRevoke = async () => {
    const device = pending;
    setPending(null);
    if (!device) return;
    setIsRevoking(true);
    setNotice(null);
    try {
      const result = await revokeDevice(device.deviceId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setNotice(`${device.name} a fost deconectat.`);
      await load();
    } finally {
      setIsRevoking(false);
    }
  };

  if (devices === null) {
    return <ActivityIndicator color={theme.text} accessibilityLabel="Se încarcă dispozitivele" />;
  }

  const others = devices.filter((d) => !d.isCurrent);

  return (
    <View>
      {error && (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Încearcă din nou"
            onPress={() => void load()}
          >
            <Text style={[styles.link, { color: theme.text }]}>Încearcă din nou</Text>
          </TouchableOpacity>
        </View>
      )}
      {notice && <Text style={[styles.note, { color: theme.textMuted }]}>{notice}</Text>}

      {devices.map((device) => (
        <View key={device.deviceId} style={[styles.row, { borderColor: theme.border }]}>
          <Text style={styles.icon}>{PLATFORM_ICONS[device.platform]}</Text>
          <View style={styles.rowText}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {device.name}
            </Text>
            <Text style={[styles.meta, { color: theme.textMuted }]}>
              {device.isCurrent
                ? 'Acest dispozitiv'
                : `Ultima activitate: ${describeLastSeen(device.lastSeenAt)}`}
            </Text>
          </View>
          {!device.isCurrent && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Deconectează ${device.name}`}
              onPress={() => setPending(device)}
              disabled={isRevoking}
              style={[styles.revokeBtn, { borderColor: theme.border }]}
            >
              <Text style={styles.revokeText}>Deconectează</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {!error && others.length === 0 && (
        <Text style={[styles.note, { color: theme.textMuted }]}>
          Doar acest dispozitiv e conectat la cont.
        </Text>
      )}

      <ConfirmDialog
        visible={pending !== null}
        title={`Deconectezi ${pending?.name ?? 'dispozitivul'}?`}
        message="Va trebui să se conecteze din nou cu parola sau cu un cod pe email. Deconectarea are efect în cel mult o oră."
        confirmLabel="Deconectează-l"
        cancelLabel="Renunță"
        isDestructive
        onConfirm={() => void confirmRevoke()}
        onCancel={() => setPending(null)}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  icon: { fontSize: 20 },
  rowText: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  revokeBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  revokeText: { fontSize: 12, fontWeight: '700', color: '#ef4444' },
  note: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  errorText: { flex: 1, color: '#ef4444', fontSize: 12, fontWeight: '600' },
  link: { fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
});
