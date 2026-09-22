import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAppTheme } from '../styles/theme';

interface PantryStapleToggleProps {
  excludeStaples: boolean;
  onToggle: (exclude: boolean) => void;
  isDark: boolean;
}

export const PantryStapleToggle: React.FC<PantryStapleToggleProps> = ({
  excludeStaples,
  onToggle,
  isDark,
}) => {
  const appTheme = getAppTheme(isDark);
  const theme = {
    card: appTheme.card,
    text: appTheme.text,
    textMuted: appTheme.textMuted,
    border: appTheme.border,
    primary: appTheme.primary,
    activeBg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f2f2f7',
  };

  return (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityState={{ checked: excludeStaples }}
      accessibilityLabel="Exclude ingredientele de bază din cămară"
      activeOpacity={0.8}
      onPress={() => onToggle(!excludeStaples)}
      style={[
        styles.card,
        {
          backgroundColor: excludeStaples ? theme.activeBg : theme.card,
          borderColor: excludeStaples ? theme.primary : theme.border,
        },
      ]}
    >
      <View style={styles.leftCol}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>🌾</Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Am ingredientele de bază în cămară
          </Text>
        </View>

        <Text style={[styles.description, { color: theme.textMuted }]}>
          Exclude sarea, piperul, uleiul, untul și făina din coșul de cumpărături și din totalul de plată.
        </Text>
      </View>

      {/* Switch visual */}
      <View
        style={[
          styles.switchTrack,
          {
            backgroundColor: excludeStaples ? theme.primary : (isDark ? '#3a3a3c' : '#e5e5ea'),
          },
        ]}
      >
        <View
          style={[
            styles.switchThumb,
            excludeStaples ? styles.switchThumbActive : styles.switchThumbInactive,
            { backgroundColor: excludeStaples ? (isDark ? '#000000' : '#ffffff') : '#ffffff' },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  leftCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  icon: {
    fontSize: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  description: {
    fontSize: 11,
    lineHeight: 16,
  },
  switchTrack: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  switchThumbInactive: {
    alignSelf: 'flex-start',
  },
});
