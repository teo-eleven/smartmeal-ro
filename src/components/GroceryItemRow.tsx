import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GroceryListItem } from '../types';

interface GroceryItemRowProps {
  item: GroceryListItem;
  onToggle: () => void;
  isDark: boolean;
}

export const GroceryItemRow: React.FC<GroceryItemRowProps> = ({ item, onToggle, isDark }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleToggleWithFeedback = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle();
  };

  const theme = {
    card: isDark ? '#131d31' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    primary: '#10b981',
    stapleBg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
    stapleText: isDark ? '#fbbf24' : '#b45309',
    checkedBg: isDark ? 'rgba(19, 29, 49, 0.4)' : '#f1f5f9',
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleToggleWithFeedback}
        style={[
          styles.row,
          {
            backgroundColor: item.isPurchased ? theme.checkedBg : theme.card,
            borderColor: item.isPurchased ? 'transparent' : theme.border,
            opacity: item.isPurchased ? 0.65 : 1,
          },
        ]}
      >
        {/* Animated Checkbox */}
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
            <Text style={{ fontWeight: '700', color: item.isPurchased ? theme.textMuted : theme.text }}>
              {item.packsToBuy} × pachet {item.packSize}{item.unit}
            </Text>
          </Text>
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
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
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  stapleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stapleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  details: {
    fontSize: 12,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
  },
});
