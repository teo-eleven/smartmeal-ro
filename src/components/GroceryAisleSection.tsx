import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AisleCategory, GroceryListItem } from '../types';
import { GroceryItemRow } from './GroceryItemRow';

import { getAppTheme } from '../styles/theme';

interface GroceryAisleSectionProps {
  category: AisleCategory;
  items: GroceryListItem[];
  onToggleItem: (ingredientId: string) => void;
  isDark: boolean;
  /** Bigger targets for a phone held in one hand in a supermarket aisle. */
  isShoppingMode?: boolean;
}

export const AISLE_METADATA: Record<
  AisleCategory,
  { name: string; icon: string; color: string }
> = {
  produce: { name: 'Legume & Fructe Proaspete', icon: '🥦', color: '#30d158' },
  meat_fish: { name: 'Carne & Pește', icon: '🥩', color: '#ff453a' },
  dairy: { name: 'Lactate & Ouă', icon: '🧀', color: '#ff9f0a' },
  pantry: { name: 'Cămară & Condimente', icon: '🌾', color: '#bf5af2' },
  canned_sauces: { name: 'Conserve & Sosuri', icon: '🥫', color: '#ff375f' },
  bakery: { name: 'Panificație & Pâine', icon: '🥖', color: '#d97706' },
  frozen: { name: 'Produse Congelate', icon: '❄️', color: '#64d2ff' },
  snacks: { name: 'Ronțăieli & Dulciuri de Magazin', icon: '🍿', color: '#ff9f0a' },
  beverages: { name: 'Băuturi Răcoritoare & Apă', icon: '🥤', color: '#0a84ff' },
  alcohol: { name: 'Băuturi Alcoolice (18+)', icon: '🍺', color: '#af52de' },
};

export const GroceryAisleSection: React.FC<GroceryAisleSectionProps> = ({
  category,
  items,
  onToggleItem,
  isDark,
  isShoppingMode = false,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!items || items.length === 0) return null;

  const meta = AISLE_METADATA[category] ?? {
    name: 'Alte produse',
    icon: '🛒',
    color: '#8e8e93',
  };

  const purchasedCount = items.filter((i) => i.isPurchased).length;
  const isAllPurchased = purchasedCount === items.length;

  const appTheme = getAppTheme(isDark);
  const theme = {
    text: appTheme.text,
    textMuted: appTheme.textMuted,
    border: appTheme.border,
    headerBg: appTheme.card,
  };

  return (
    <View style={styles.sectionContainer}>
      {/* Aisle Header */}
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.7}
        onPress={() => setCollapsed(!collapsed)}
        style={[styles.header, { backgroundColor: theme.headerBg, borderColor: theme.border }]}
      >
        <View style={styles.titleGroup}>
          <Text style={styles.icon}>{meta.icon}</Text>
          <Text style={[styles.name, { color: theme.text }]}>{meta.name}</Text>
        </View>

        <View style={styles.statusGroup}>
          <Text
            style={[
              styles.countBadge,
              { color: isAllPurchased ? (isDark ? '#30d158' : '#34c759') : theme.textMuted },
            ]}
          >
            {purchasedCount}/{items.length} {isAllPurchased ? '✓' : ''}
          </Text>
          <Text style={[styles.arrow, { color: theme.textMuted }]}>
            {collapsed ? '▼' : '▲'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Mini Progress Bar per Aisle */}
      <View
        style={[
          styles.progressBarTrack,
          { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
        ]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${(purchasedCount / items.length) * 100}%`,
              backgroundColor: isAllPurchased ? (isDark ? '#30d158' : '#34c759') : meta.color,
            },
          ]}
        />
      </View>

      {/* Items list */}
      {!collapsed && (
        <View style={styles.itemsList}>
          {items.map((item) => (
            <GroceryItemRow
              key={item.ingredientId}
              item={item}
              onToggle={() => onToggleItem(item.ingredientId)}
              isDark={isDark}
              isShoppingMode={isShoppingMode}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    width: '100%',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  arrow: {
    fontSize: 10,
  },
  progressBarTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: -4,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  itemsList: {
    paddingLeft: 2,
    paddingRight: 2,
  },
});
