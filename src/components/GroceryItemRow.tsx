import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GroceryListItem } from '../types';

import { getAppTheme } from '../styles/theme';

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

  const theme = getAppTheme(isDark);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
      <TouchableOpacity
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.isPurchased }}
        accessibilityLabel={`${item.name}, ${item.packsToBuy} ${item.packsToBuy === 1 ? 'pachet' : 'pachete'}, ${item.estimatedPriceRon} lei`}
        accessibilityHint="Bifează produsul ca fiind cumpărat"
        activeOpacity={0.8}
        onPress={handleToggleWithFeedback}
        style={[
          styles.row,
          {
            backgroundColor: item.isPurchased ? (isDark ? 'rgba(28, 28, 30, 0.45)' : '#f2f2f7') : theme.card,
            borderColor: item.isPurchased ? 'transparent' : theme.border,
            opacity: item.isPurchased ? 0.60 : 1,
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
          {item.isPurchased && <Text style={[styles.checkmark, { color: theme.primaryText }]}>✓</Text>}
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

            {item.isFromPantry ? (
              <View style={[styles.stapleBadge, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.stapleText, { color: theme.primary }]}>🏠 Ai acasă</Text>
              </View>
            ) : item.isPantryStaple ? (
              <View style={[styles.stapleBadge, { backgroundColor: theme.accentBg }]}>
                <Text style={[styles.stapleText, { color: theme.textMuted }]}>Cămară</Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.details, { color: theme.textMuted }]}>
            Necesar: <Text style={{ fontWeight: '700' }}>{item.neededAmount}{item.unit}</Text>
          {(item.leftoverAmount ?? 0) > 0 && !item.isFromPantry && (
            <Text style={[styles.leftover, { color: theme.textMuted }]} numberOfLines={1}>
              ↻ îți rămân {item.leftoverAmount}{item.unit} pentru săptămâna viitoare
            </Text>
          )} • {item.isFromPantry ? 'Ai deja în cămară (0 lei la casă)' : item.packsToBuy === 0 ? `Acoperit din cămară (${item.fromStockAmount}${item.unit})` : `Cumperi: ${item.packsToBuy} × pachet ${item.packSize}${item.unit}`}
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
  leftover: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    fontStyle: 'italic',
  },
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
