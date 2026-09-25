import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ReminderSettings } from '../types';
import { getAppTheme } from '../styles/theme';

interface ReminderSettingsPanelProps {
  reminders: ReminderSettings;
  onChange: (patch: Partial<ReminderSettings>) => void;
  /** Email reminders come from the server, so they need an account to mean anything. */
  hasAccount: boolean;
  isDark: boolean;
}

const DAY_LABELS = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];

/** Half-hour steps: nobody sets a cooking reminder for 17:23. */
const COOKING_TIMES = ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'];
const SHOPPING_TIMES = ['08:00', '09:00', '10:00', '11:00', '16:00', '17:00', '18:00', '19:00'];

/**
 * The reminder controls.
 *
 * The notifications are scheduled on the phone, so these work whether or not the user has an
 * account; with one, the choices follow them to a second device.
 */
export const ReminderSettingsPanel: React.FC<ReminderSettingsPanelProps> = ({
  reminders,
  onChange,
  hasAccount,
  isDark,
}) => {
  const theme = getAppTheme(isDark);

  const renderTimes = (times: string[], selected: string, onPick: (t: string) => void, what: string) => (
    <View style={styles.chipRow}>
      {times.map((time) => {
        const active = selected === time;
        return (
          <TouchableOpacity
            key={time}
            accessibilityRole="button"
            accessibilityLabel={`${what} la ora ${time}`}
            onPress={() => onPick(time)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? theme.primary : theme.btnBg,
                borderColor: active ? theme.primary : theme.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.chipText, { color: active ? theme.primaryText : theme.textMuted }]}
            >
              {time}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.panel, { borderColor: theme.border }]}>
      <Text style={[styles.title, { color: theme.text }]}>Mementouri</Text>
      <Text style={[styles.hint, { color: theme.textMuted }]}>
        Sună pe telefon, și fără internet. Dacă ai cont, alegerile te urmează pe alt telefon.
      </Text>

      <TouchableOpacity
        accessibilityRole="switch"
        accessibilityState={{ checked: reminders.cookingEnabled }}
        accessibilityLabel="Memento pentru gătit"
        onPress={() => onChange({ cookingEnabled: !reminders.cookingEnabled })}
        style={[styles.toggleRow, { borderColor: theme.border }]}
        activeOpacity={0.8}
      >
        <View style={styles.toggleText}>
          <Text style={[styles.toggleTitle, { color: theme.text }]}>Amintește-mi să gătesc</Text>
          <Text style={[styles.toggleHint, { color: theme.textMuted }]}>
            În fiecare zi de gătit, cu felul din plan
          </Text>
        </View>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: reminders.cookingEnabled ? theme.primary : theme.btnBg,
              borderColor: reminders.cookingEnabled ? theme.primary : theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.pillText,
              { color: reminders.cookingEnabled ? theme.primaryText : theme.textMuted },
            ]}
          >
            {reminders.cookingEnabled ? 'Pornit' : 'Oprit'}
          </Text>
        </View>
      </TouchableOpacity>

      {reminders.cookingEnabled &&
        renderTimes(COOKING_TIMES, reminders.cookingTime, (t) => onChange({ cookingTime: t }), 'Gătesc')}

      <TouchableOpacity
        accessibilityRole="switch"
        accessibilityState={{ checked: reminders.shoppingEnabled }}
        accessibilityLabel="Memento pentru cumpărături"
        onPress={() => onChange({ shoppingEnabled: !reminders.shoppingEnabled })}
        style={[styles.toggleRow, { borderColor: theme.border }]}
        activeOpacity={0.8}
      >
        <View style={styles.toggleText}>
          <Text style={[styles.toggleTitle, { color: theme.text }]}>Ziua de cumpărături</Text>
          <Text style={[styles.toggleHint, { color: theme.textMuted }]}>
            O dată pe săptămână, cu lista pregătită
          </Text>
        </View>
        <View
          style={[
            styles.pill,
            {
              backgroundColor: reminders.shoppingEnabled ? theme.primary : theme.btnBg,
              borderColor: reminders.shoppingEnabled ? theme.primary : theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.pillText,
              { color: reminders.shoppingEnabled ? theme.primaryText : theme.textMuted },
            ]}
          >
            {reminders.shoppingEnabled ? 'Pornit' : 'Oprit'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Sent from the server, so it only means anything with an account. Offering it to a
          guest would be a switch that quietly does nothing. */}
      {hasAccount && (
        <>
          <TouchableOpacity
            accessibilityRole="switch"
            accessibilityState={{ checked: reminders.emailEnabled }}
            accessibilityLabel="Mementouri pe email"
            onPress={() => onChange({ emailEnabled: !reminders.emailEnabled })}
            style={[styles.toggleRow, { borderColor: theme.border }]}
            activeOpacity={0.8}
          >
            <View style={styles.toggleText}>
              <Text style={[styles.toggleTitle, { color: theme.text }]}>Și pe email</Text>
              <Text style={[styles.toggleHint, { color: theme.textMuted }]}>
                Rar, nu zilnic — doar cât să nu uiți de plan
              </Text>
            </View>
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: reminders.emailEnabled ? theme.primary : theme.btnBg,
                  borderColor: reminders.emailEnabled ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: reminders.emailEnabled ? theme.primaryText : theme.textMuted },
                ]}
              >
                {reminders.emailEnabled ? 'Pornit' : 'Oprit'}
              </Text>
            </View>
          </TouchableOpacity>

          {reminders.emailEnabled && (
            <View style={styles.chipRow}>
              {[2, 3, 7].map((days) => {
                const active = reminders.emailFrequencyDays === days;
                return (
                  <TouchableOpacity
                    key={days}
                    accessibilityRole="button"
                    accessibilityLabel={`Email la ${days} zile`}
                    onPress={() => onChange({ emailFrequencyDays: days })}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? theme.primary : theme.btnBg,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? theme.primaryText : theme.textMuted },
                      ]}
                    >
                      {days === 7 ? 'săptămânal' : `la ${days} zile`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </>
      )}

      {reminders.shoppingEnabled && (
        <>
          <View style={styles.chipRow}>
            {DAY_LABELS.map((label, index) => {
              const active = reminders.shoppingWeekday === index;
              return (
                <TouchableOpacity
                  key={label}
                  accessibilityRole="button"
                  accessibilityLabel={`Cumpărături ${label}`}
                  onPress={() => onChange({ shoppingWeekday: index })}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? theme.primary : theme.btnBg,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? theme.primaryText : theme.textMuted },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {renderTimes(
            SHOPPING_TIMES,
            reminders.shoppingTime,
            (t) => onChange({ shoppingTime: t }),
            'Cumpărături'
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 14 },
  title: { fontSize: 15, fontWeight: '900' },
  hint: { fontSize: 11, fontWeight: '500', lineHeight: 16, marginTop: 4, marginBottom: 12 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 8,
  },
  toggleText: { flex: 1 },
  toggleTitle: { fontSize: 13, fontWeight: '800' },
  toggleHint: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  pill: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 5 },
  pillText: { fontSize: 11, fontWeight: '800' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 11, fontWeight: '700' },
});
