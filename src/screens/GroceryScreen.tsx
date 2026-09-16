import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { SUPERMARKETS } from '../data/supermarkets';
import { AisleCategory, GroceryListItem } from '../types';
import { GroceryAisleSection } from '../components/GroceryAisleSection';
import { PantryStapleToggle } from '../components/PantryStapleToggle';

interface GroceryScreenProps {
  isDark: boolean;
}

const AISLE_ORDER: AisleCategory[] = [
  'produce',
  'meat_fish',
  'dairy',
  'pantry',
  'canned_sauces',
  'bakery',
  'frozen',
];

export const GroceryScreen: React.FC<GroceryScreenProps> = ({ isDark }) => {
  const {
    currentPlan,
    groceryItems,
    preferences,
    toggleGroceryItem,
    setExcludePantryStaples,
  } = useAppStore();

  if (!currentPlan || groceryItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Lista este goală. Generează un meniu mai întâi!</Text>
      </View>
    );
  }

  const market = SUPERMARKETS[currentPlan.supermarketId];
  const totalItems = groceryItems.length;
  const purchasedItems = groceryItems.filter((i) => i.isPurchased).length;
  const progressPercent = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;
  const isAllPurchased = totalItems > 0 && purchasedItems === totalItems;
  const remainingItems = totalItems - purchasedItems;

  // Group items by category
  const groupedItems: Record<AisleCategory, GroceryListItem[]> = {
    produce: [],
    meat_fish: [],
    dairy: [],
    pantry: [],
    canned_sauces: [],
    bakery: [],
    frozen: [],
  };

  groceryItems.forEach((item) => {
    if (groupedItems[item.category]) {
      groupedItems[item.category].push(item);
    }
  });

  const checkAll = () => {
    groceryItems.forEach((item) => {
      if (!item.isPurchased) {
        toggleGroceryItem(item.ingredientId);
      }
    });
  };

  const uncheckAll = () => {
    groceryItems.forEach((item) => {
      if (item.isPurchased) {
        toggleGroceryItem(item.ingredientId);
      }
    });
  };

  const theme = {
    card: isDark ? '#131d31' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    primary: '#10b981',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ecfdf5',
    btnBg: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
    trackBg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Shopping Overview Modernist Dashboard Card */}
      <View style={[styles.overviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.supermarketHeader}>
          <View style={[styles.marketDot, { backgroundColor: market.brandColor }]} />
          <Text style={[styles.supermarketTitle, { color: theme.text }]}>
            Coșul tău la {market.name}
          </Text>
        </View>

        {/* Total to pay Display */}
        <View style={styles.priceRow}>
          <View>
            <Text style={[styles.priceLabel, { color: theme.textMuted }]}>
              TOTAL DE PLATĂ LA CASĂ
            </Text>
            <Text style={[styles.subText, { color: theme.textMuted }]}>ambalaje întregi de magazin</Text>
          </View>
          <View style={styles.priceWithUnit}>
            <Text style={[styles.priceAmount, { color: theme.primary }]}>
              {currentPlan.totalCartCostRon}
            </Text>
            <Text style={[styles.priceCurrency, { color: theme.primary }]}>LEI</Text>
          </View>
        </View>

        {/* Modern Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeaderRow}>
            <Text style={[styles.progressLabel, { color: theme.text }]}>
              Bifate: <Text style={{ fontWeight: '800' }}>{purchasedItems}</Text> din {totalItems}
            </Text>
            <Text style={[styles.progressPercent, { color: theme.primary }]}>
              {progressPercent}%
            </Text>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: theme.trackBg }]}>
            <LinearGradient
              colors={['#10b981', '#06b6d4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBar, { width: `${progressPercent}%` }]}
            />
          </View>
        </View>

        {/* Shopping Stat Chips */}
        <View style={styles.chipsRow}>
          <View style={[styles.statChip, { backgroundColor: theme.btnBg }]}>
            <Text style={[styles.statChipVal, { color: theme.text }]}>{totalItems}</Text>
            <Text style={[styles.statChipLbl, { color: theme.textMuted }]}>total</Text>
          </View>

          <View style={[styles.statChip, { backgroundColor: theme.btnBg }]}>
            <Text style={[styles.statChipVal, { color: theme.primary }]}>{purchasedItems}</Text>
            <Text style={[styles.statChipLbl, { color: theme.textMuted }]}>în coș</Text>
          </View>

          <View style={[styles.statChip, { backgroundColor: theme.btnBg }]}>
            <Text style={[styles.statChipVal, { color: '#f59e0b' }]}>{remainingItems}</Text>
            <Text style={[styles.statChipLbl, { color: theme.textMuted }]}>rămase</Text>
          </View>
        </View>

        {/* Bulk Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={checkAll}
            style={[styles.actionBtn, { backgroundColor: theme.btnBg }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: theme.text }]}>✓ Bifează tot</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={uncheckAll}
            style={[styles.actionBtn, { backgroundColor: theme.btnBg }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionBtnText, { color: theme.textMuted }]}>Deselectează</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Celebratory Banner when shopping is complete */}
      {isAllPurchased && (
        <View style={styles.celebrationCard}>
          <Text style={styles.celebrationEmoji}>🎉 🛒 🥗</Text>
          <Text style={styles.celebrationTitle}>Toate cumpărăturile sunt gata!</Text>
          <Text style={styles.celebrationSubtitle}>
            Ai toate ingredientele pentru cinele acestei săptămâni. Spor la gătit!
          </Text>
        </View>
      )}

      {/* Pantry Staples Toggle */}
      <PantryStapleToggle
        excludeStaples={preferences.excludePantryStaples}
        onToggle={setExcludePantryStaples}
        isDark={isDark}
      />

      {/* Aisle by Aisle Grouped Sections */}
      {AISLE_ORDER.map((category) => (
        <GroceryAisleSection
          key={category}
          category={category}
          items={groupedItems[category]}
          onToggleItem={toggleGroceryItem}
          isDark={isDark}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    width: '100%',
  },
  overviewCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 18,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
  },
  supermarketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  marketDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  supermarketTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  subText: {
    fontSize: 11,
    marginTop: 2,
  },
  priceWithUnit: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  priceCurrency: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressContainer: {
    marginBottom: 14,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '900',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  statChipVal: {
    fontSize: 14,
    fontWeight: '900',
  },
  statChipLbl: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  celebrationCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  celebrationEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  celebrationTitle: {
    color: '#065f46',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  celebrationSubtitle: {
    color: '#047857',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
