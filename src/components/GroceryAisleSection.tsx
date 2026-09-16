import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AisleCategory, GroceryListItem } from '../types';
import { GroceryItemRow } from './GroceryItemRow';

interface GroceryAisleSectionProps {
  category: AisleCategory;
  items: GroceryListItem[];
  onToggleItem: (ingredientId: string) => void;
  isDark: boolean;
}

const AISLE_METADATA: Record<
  AisleCategory,
  { name: string; icon: string; color: string }
> = {
  produce: { name: 'Legume & Fructe Proaspete', icon: '🥦', color: '#10b981' },
  meat_fish: { name: 'Carne & Pește', icon: '🥩', color: '#ef4444' },
  dairy: { name: 'Lactate & Ouă', icon: '🧀', color: '#f59e0b' },
  pantry: { name: 'Cămară & Condimente', icon: '🌾', color: '#8b5cf6' },
  canned_sauces: { name: 'Conserve & Sosuri', icon: '🥫', color: '#ec4899' },
  bakery: { name: 'Panificație & Pâine', icon: '🥖', color: '#d97706' },
  frozen: { name: 'Produse Congelate', icon: '❄️', color: '#06b6d4' },
};

export const GroceryAisleSection: React.FC<GroceryAisleSectionProps> = ({
  category,
  items,
  onToggleItem,
  isDark,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!items || items.length === 0) return null;

  const meta = AISLE_METADATA[category] ?? {
    name: 'Alte produse',
    icon: '🛒',
    color: '#64748b',
  };

  const purchasedCount = items.filter((i) => i.isPurchased).length;
  const isAllPurchased = purchasedCount === items.length;

  const theme = {
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    headerBg: isDark ? '#1e293b' : '#f8fafc',
  };

  return (
    <View style={styles.sectionContainer}>
      {/* Aisle Header */}
      <TouchableOpacity
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
              { color: isAllPurchased ? '#10b981' : theme.textMuted },
            ]}
          >
            {purchasedCount}/{items.length} {isAllPurchased ? '✓' : ''}
          </Text>
          <Text style={[styles.arrow, { color: theme.textMuted }]}>
            {collapsed ? '▼' : '▲'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Items list */}
      {!collapsed && (
        <View style={styles.itemsList}>
          {items.map((item) => (
            <GroceryItemRow
              key={item.ingredientId}
              item={item}
              onToggle={() => onToggleItem(item.ingredientId)}
              isDark={isDark}
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
    maxWidth: 480,
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
  itemsList: {
    paddingLeft: 2,
    paddingRight: 2,
  },
});
