import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Appliance } from '../types';
import { getAppTheme } from '../styles/theme';

interface ApplianceSelectorProps {
  selectedAppliances: Appliance[];
  onToggleAppliance: (appliance: Appliance) => void;
  isDark: boolean;
}

interface ApplianceOption {
  id: Appliance;
  name: string;
  icon: string;
  description: string;
}

const APPLIANCE_OPTIONS: ApplianceOption[] = [
  {
    id: 'hob',
    name: 'Plită / Aragaz',
    icon: '🍳',
    description: 'Tigaie, fiert, călit clasic',
  },
  {
    id: 'oven',
    name: 'Cuptor',
    icon: '♨️',
    description: 'Coacere la tavă, gratinare',
  },
  {
    id: 'air_fryer',
    name: 'Air Fryer',
    icon: '🌪️',
    description: 'Prăjire rapidă în aer cald',
  },
  {
    id: 'microwave',
    name: 'Cuptor cu Microunde',
    icon: '⚡',
    description: 'Încălzire și gătire rapidă',
  },
];

export const ApplianceSelector: React.FC<ApplianceSelectorProps> = ({
  selectedAppliances,
  onToggleAppliance,
  isDark,
}) => {
  const appTheme = getAppTheme(isDark);
  const theme = {
    text: appTheme.text,
    textMuted: appTheme.textMuted,
    primary: appTheme.primary,
    primaryText: appTheme.primaryText,
    cardBg: appTheme.card,
    border: appTheme.border,
    selectedBg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f2f2f7',
  };

  return (
    <View style={styles.grid}>
      {APPLIANCE_OPTIONS.map((app) => {
        const isSelected = selectedAppliances.includes(app.id);

        return (
          <TouchableOpacity
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={app.name}
            key={app.id}
            onPress={() => onToggleAppliance(app.id)}
            activeOpacity={0.7}
            style={[
              styles.card,
              {
                backgroundColor: isSelected ? theme.selectedBg : theme.cardBg,
                borderColor: isSelected ? theme.primary : theme.border,
              },
            ]}
          >
            <View style={styles.headerRow}>
              <Text style={styles.icon}>{app.icon}</Text>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: isSelected ? theme.primary : 'transparent',
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                {isSelected && <Text style={[styles.checkmark, { color: theme.primaryText }]}>✓</Text>}
              </View>
            </View>

            <Text style={[styles.title, { color: theme.text }]}>{app.name}</Text>
            <Text style={[styles.desc, { color: theme.textMuted }]}>{app.description}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  card: {
    flex: 1,
    minWidth: 180,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 28,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  desc: {
    fontSize: 11,
    lineHeight: 15,
  },
});
