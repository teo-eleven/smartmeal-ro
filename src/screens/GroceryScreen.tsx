import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? '#334155' : '#e2e8f0',
    primary: '#10b981',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
    btnBg: isDark ? '#334155' : '#f1f5f9',
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Shopping Overview Card */}
      <View style={[styles.overviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.supermarketHeader}>
          <View style={[styles.marketDot, { backgroundColor: market.brandColor }]} />
          <Text style={[styles.supermarketTitle, { color: theme.text }]}>
            Coșul tău la {market.name}
          </Text>
        </View>

        {/* Total to pay */}
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, { color: theme.textMuted }]}>
            Total de plată la casă:
          </Text>
          <View style={styles.priceWithUnit}>
            <Text style={[styles.priceAmount, { color: theme.primary }]}>
              {currentPlan.totalCartCostRon}
            </Text>
            <Text style={[styles.priceCurrency, { color: theme.primary }]}>lei</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeaderRow}>
            <Text style={[styles.progressLabel, { color: theme.text }]}>
              Progres cumpărături: {purchasedItems} din {totalItems} bifate
            </Text>
            <Text style={[styles.progressPercent, { color: theme.primary }]}>
              {progressPercent}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressBar,
                { width: `${progressPercent}%`, backgroundColor: theme.primary },
              ]}
            />
          </View>
        </View>

        {/* Bulk Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={checkAll}
            style={[styles.actionBtn, { backgroundColor: theme.btnBg }]}
          >
            <Text style={[styles.actionBtnText, { color: theme.text }]}>✓ Bifează tot</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={uncheckAll}
            style={[styles.actionBtn, { backgroundColor: theme.btnBg }]}
          >
            <Text style={[styles.actionBtnText, { color: theme.text }]}>✕ Debifează tot</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Celebratory Banner when shopping is done */}
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
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  supermarketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  marketDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  supermarketTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceWithUnit: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  priceCurrency: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
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
    backgroundColor: '#d1fae5',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  celebrationEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  celebrationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#065f46',
    marginBottom: 2,
  },
  celebrationSubtitle: {
    fontSize: 12,
    color: '#047857',
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
