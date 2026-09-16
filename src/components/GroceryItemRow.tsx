import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GroceryListItem } from '../types';

interface GroceryItemRowProps {
  item: GroceryListItem;
  onToggle: () => void;
  isDark: boolean;
}

export const GroceryItemRow: React.FC<GroceryItemRowProps> = ({ item, onToggle, isDark }) => {
  const theme = {
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#10b981',
    stapleBg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
    stapleText: isDark ? '#fbbf24' : '#b45309',
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggle}
      style={[
        styles.row,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: item.isPurchased ? 0.6 : 1,
        },
      ]}
    >
      {/* Checkbox */}
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: item.isPurchased ? theme.primary : 'transparent',
            borderColor: item.isPurchased ? theme.primary : theme.border,
          },
        ]}
      >
        {item.isPurchased && <Text style={styles.checkmark}>✓</Text>}
      </View>

      {/* Item info */}
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.name,
              {
                color: theme.text,
                textDecorationLine: item.isPurchased ? 'line-through' : 'none',
              },
            ]}
          >
            {item.name}
          </Text>

          {item.isPantryStaple && (
            <View style={[styles.stapleBadge, { backgroundColor: theme.stapleBg }]}>
              <Text style={[styles.stapleText, { color: theme.stapleText }]}>Cămară</Text>
            </View>
          )}
        </View>

        <Text style={[styles.details, { color: theme.textMuted }]}>
          Necesar: <Text style={{ fontWeight: '700' }}>{item.neededAmount}{item.unit}</Text> • Cumperi:{' '}
          <Text style={{ fontWeight: '700' }}>{item.packsToBuy} × pachet {item.packSize}{item.unit}</Text>
        </Text>
      </View>

      {/* Price */}
      <Text
        style={[
          styles.price,
          {
            color: item.isPurchased ? theme.textMuted : theme.primary,
            textDecorationLine: item.isPurchased ? 'line-through' : 'none',
          },
        ]}
      >
        {item.estimatedPriceRon} lei
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
  },
  stapleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  stapleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  details: {
    fontSize: 11,
    lineHeight: 16,
  },
  price: {
    fontSize: 13,
    fontWeight: '800',
  },
});
