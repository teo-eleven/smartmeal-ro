import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SignUpConsent as Consent } from '../types';
import { getAppTheme } from '../styles/theme';

interface SignUpConsentProps {
  consent: Consent;
  onChange: (next: Consent) => void;
  isDark: boolean;
}

interface Row {
  key: keyof Consent;
  label: string;
  detail: string | null;
}

// The labels double as the accessibility labels, so a screen reader says exactly what the
// person is agreeing to.
const ROWS: Row[] = [
  { key: 'isAtLeast16', label: 'Am cel puțin 16 ani', detail: null },
  {
    key: 'healthDataConsent',
    label: 'Sunt de acord ca alergiile și dieta mea să fie păstrate în cont',
    detail:
      'Sunt date de sănătate. Le folosim doar ca să nu-ți propunem ce nu poți mânca și ' +
      'le poți șterge oricând, odată cu contul.',
  },
];

/**
 * The two statements an account needs before it can hold allergies. Both start unticked:
 * consent that is ticked for you is not consent.
 */
export const SignUpConsent: React.FC<SignUpConsentProps> = ({ consent, onChange, isDark }) => {
  const theme = getAppTheme(isDark);

  return (
    <View style={styles.group}>
      {ROWS.map((row) => {
        const isChecked = consent[row.key];
        return (
          <TouchableOpacity
            key={row.key}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isChecked }}
            accessibilityLabel={row.label}
            onPress={() => onChange({ ...consent, [row.key]: !isChecked })}
            activeOpacity={0.7}
            style={styles.row}
          >
            <View
              style={[
                styles.box,
                {
                  borderColor: isChecked ? theme.primary : theme.border,
                  backgroundColor: isChecked ? theme.primary : 'transparent',
                },
              ]}
            >
              {isChecked && <Text style={[styles.tick, { color: theme.primaryText }]}>✓</Text>}
            </View>
            <View style={styles.texts}>
              <Text style={[styles.label, { color: theme.text }]}>{row.label}</Text>
              {row.detail && (
                <Text style={[styles.detail, { color: theme.textMuted }]}>{row.detail}</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  group: { gap: 10, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tick: { fontSize: 13, fontWeight: '900' },
  texts: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  detail: { fontSize: 11, lineHeight: 15, marginTop: 2 },
});
