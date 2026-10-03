import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuthSessionStore } from '../store/authSessionStore';
import { updateDisplayName } from '../services/profile';
import { DISPLAY_NAME_MAX } from '../utils/displayName';
import { getAppTheme } from '../styles/theme';

/**
 * Under the address in Cont: the name the account greets with (profiles, migration 0006),
 * and — on a phone where it works — Face ID / the fingerprint for the monthly check.
 */
export function AccountIdentity({ email, isDark }: { email: string; isDark: boolean }) {
  const theme = getAppTheme(isDark);
  const {
    displayName,
    setDisplayName,
    isBiometricAvailable,
    biometricEnabled,
    biometricLabel,
    setBiometricEnabled,
  } = useAuthSessionStore();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const toggleBiometric = async () => {
    if (isSwitching) return;
    setIsSwitching(true);
    setError(null);
    try {
      const result = await setBiometricEnabled(email, !biometricEnabled);
      if (result.error) setError(result.error);
    } catch {
      setError('Setarea nu a putut fi salvată. Încearcă din nou.');
    } finally {
      setIsSwitching(false);
    }
  };

  const save = async () => {
    if (draft === null || isSaving) return;
    setIsSaving(true);
    try {
      const result = await updateDisplayName(draft);
      if (!result.name) {
        setError(result.error);
        return;
      }
      setDisplayName(result.name);
      setDraft(null);
      setError(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.block}>
      {draft === null ? (
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: displayName ? theme.text : theme.textMuted }]}>
            {displayName ?? 'Fără nume'}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={displayName ? 'Schimbă numele' : 'Adaugă un nume'}
            onPress={() => setDraft(displayName ?? '')}
          >
            <Text style={[styles.link, { color: theme.text }]}>
              {displayName ? 'Schimbă numele' : 'Adaugă un nume'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.editRow}>
          <TextInput
            value={draft}
            onChangeText={(value) => {
              setError(null);
              setDraft(value);
            }}
            accessibilityLabel="Numele tău"
            placeholder="Prenumele tău"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="words"
            maxLength={DISPLAY_NAME_MAX * 2}
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Salvează numele"
            onPress={() => void save()}
            disabled={isSaving}
          >
            <Text style={[styles.link, { color: theme.text }]}>Salvează</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Renunță la schimbarea numelui"
            onPress={() => {
              setDraft(null);
              setError(null);
            }}
          >
            <Text style={[styles.link, { color: theme.textMuted }]}>Renunță</Text>
          </TouchableOpacity>
        </View>
      )}
      {error && <Text style={styles.error}>{error}</Text>}

      {isBiometricAvailable && (
        <TouchableOpacity
          accessibilityRole="switch"
          accessibilityState={{ checked: biometricEnabled, disabled: isSwitching }}
          accessibilityLabel={`Deblochează cu ${biometricLabel}`}
          onPress={() => void toggleBiometric()}
          disabled={isSwitching}
          style={[styles.toggleRow, { borderColor: theme.border }]}
          activeOpacity={0.8}
        >
          <View style={styles.toggleText}>
            <Text style={[styles.toggleTitle, { color: theme.text }]}>
              {`Deblochează cu ${biometricLabel}`}
            </Text>
            <Text style={[styles.toggleHint, { color: theme.textMuted }]}>
              La verificarea de o dată pe lună, în loc de parolă
            </Text>
          </View>
          <View
            style={[
              styles.pill,
              {
                backgroundColor: biometricEnabled ? theme.primary : theme.btnBg,
                borderColor: biometricEnabled ? theme.primary : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { color: biometricEnabled ? theme.primaryText : theme.textMuted },
              ]}
            >
              {biometricEnabled ? 'Pornit' : 'Oprit'}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: 10, gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { flex: 1, fontSize: 13, fontWeight: '600' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  link: { fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  error: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  toggleText: { flex: 1 },
  toggleTitle: { fontSize: 13, fontWeight: '800' },
  toggleHint: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 11, fontWeight: '800' },
});
