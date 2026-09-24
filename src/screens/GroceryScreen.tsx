import React, { useEffect, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { SUPERMARKETS } from '../data/supermarkets';
import { AisleCategory, GroceryListItem } from '../types';
import { GroceryAisleSection } from '../components/GroceryAisleSection';
import { PantryStapleToggle } from '../components/PantryStapleToggle';
import { SnacksAndDrinksModal } from './SnacksAndDrinksModal';
import { useResponsive } from '../hooks/useResponsive';
import { getAppTheme } from '../styles/theme';
import { glass } from '../styles/glass';

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
  'snacks',
  'beverages',
  'alcohol',
];

export const GroceryScreen: React.FC<GroceryScreenProps> = ({ isDark }) => {
  const {
    currentPlan,
    groceryItems,
    preferences,
    toggleGroceryItem,
    setExcludePantryStaples,
    carryOverSurplus,
  } = useAppStore();

  const [showSnacksModal, setShowSnacksModal] = useState(false);
  const [isShoppingMode, setIsShoppingMode] = useState(false);

  // Hands are full and the phone is in a trolley: keep the screen on while shopping, where
  // the browser allows it. Native builds would need expo-keep-awake; this degrades quietly.
  useEffect(() => {
    if (!isShoppingMode) return undefined;
    let sentinel: { release: () => Promise<void> } | null = null;
    let cancelled = false;

    const wakeLock = (
      globalThis as unknown as {
        navigator?: { wakeLock?: { request: (type: string) => Promise<typeof sentinel> } };
      }
    ).navigator?.wakeLock;

    if (wakeLock) {
      wakeLock
        .request('screen')
        .then((lock) => {
          if (cancelled) void lock?.release();
          else sentinel = lock;
        })
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
      void sentinel?.release().catch(() => undefined);
    };
  }, [isShoppingMode]);
  const [shareCopiedFeedback, setShareCopiedFeedback] = useState(false);
  const { isDesktop, isTablet, contentMaxWidth } = useResponsive();
  const isLargeScreen = isDesktop || isTablet;

  if (!currentPlan) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: isDark ? '#ffffff' : '#000000' }]}>
          Niciun meniu activ. Configurează preferințele pentru a genera lista de cumpărături.
        </Text>
      </View>
    );
  }

  const market = SUPERMARKETS[preferences.supermarketId] ?? SUPERMARKETS.carrefour;
  const totalItems = groceryItems.length;
  const purchasedItems = groceryItems.filter((i) => i.isPurchased).length;
  const remainingItems = totalItems - purchasedItems;
  const progressPercent = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;

  const leftovers = groceryItems.filter((item) => (item.leftoverAmount ?? 0) > 0 && !item.isFromPantry);
  const surplusCount = leftovers.length;
  const surplusValueRon = Math.round(
    leftovers.reduce(
      (total, item) =>
        total + (item.packSize > 0 ? (item.leftoverAmount! / item.packSize) * item.estimatedPriceRon : 0),
      0
    )
  );
  const isAllPurchased = totalItems > 0 && purchasedItems === totalItems;

  // Group items by aisle category
  const groupedItems = groceryItems.reduce<Record<string, GroceryListItem[]>>((acc, item) => {
    const cat = item.category || 'produce';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const handleShareList = async () => {
    const remaining = groceryItems.filter((i) => !i.isPurchased);
    if (remaining.length === 0) return;

    const listText = [
      `🛒 SmartMeal RO — Lista de Cumpărături la ${market.name}`,
      `Estimare totală: ~${currentPlan.totalCartCostRon} lei\n`,
      ...remaining.map((item) => `• [ ] ${item.name} (${item.packsToBuy} × ${item.packSize}${item.unit}) ~${item.estimatedPriceRon} lei`),
      `\nGenerat cu SmartMeal RO • Mănâncă sănătos și economisește!`,
    ].join('\n');

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(listText);
        setShareCopiedFeedback(true);
        setTimeout(() => setShareCopiedFeedback(false), 2500);
      } else {
        await Share.share({ message: listText });
      }
    } catch {
      try {
        await Share.share({ message: listText });
      } catch (err) {
        console.warn('Share error:', err);
      }
    }
  };

  const checkAll = () => {
    groceryItems.forEach((i) => {
      if (!i.isPurchased) toggleGroceryItem(i.ingredientId);
    });
  };

  const uncheckAll = () => {
    groceryItems.forEach((i) => {
      if (i.isPurchased) toggleGroceryItem(i.ingredientId);
    });
  };

  const theme = getAppTheme(isDark);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Shopping Overview Modernist Dashboard Card */}
      <View
        {...glass('card')}
        style={[styles.overviewCard, { backgroundColor: theme.card, borderColor: theme.border, maxWidth: contentMaxWidth }]}
      >
        <View style={[styles.overviewInner, isLargeScreen && styles.overviewDesktopRow]}>
          {/* Left Panel: Supermarket info + Total cost */}
          <View style={[styles.overviewCol, isLargeScreen && styles.overviewColDesktop]}>
            <View style={styles.supermarketHeader}>
              <View style={[styles.marketDot, { backgroundColor: market.brandColor }]} />
              <Text style={[styles.supermarketTitle, { color: theme.text }]}>
                Coșul tău la {market.name}
              </Text>
            </View>

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
          </View>

          {isLargeScreen && <View style={[styles.overviewDividerV, { backgroundColor: theme.border }]} />}

          {/* Center Panel: Progress Gauge & Stat Chips */}
          <View style={[styles.overviewCol, isLargeScreen && styles.overviewColDesktop]}>
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
                  colors={isDark ? ['#ffffff', '#8e8e93'] : ['#000000', '#636366']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBar, { width: `${progressPercent}%` }]}
                />
              </View>
            </View>

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
          </View>

          {isLargeScreen && <View style={[styles.overviewDividerV, { backgroundColor: theme.border }]} />}

          {/* Right Panel: Bulk Action Buttons */}
          <View style={[styles.overviewColRight, isLargeScreen && styles.overviewColRightDesktop]}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={checkAll}
              style={[styles.actionBtn, { backgroundColor: theme.primary, borderColor: theme.primary, borderWidth: 1 }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionBtnText, { color: theme.primaryText, fontWeight: '800' }]}>✓ Bifează tot</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={uncheckAll}
              style={[styles.actionBtn, { backgroundColor: theme.btnBg, borderColor: theme.border, borderWidth: 1 }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionBtnText, { color: theme.textMuted }]}>Deselectează</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleShareList}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: shareCopiedFeedback
                    ? theme.primary
                    : theme.btnBg,
                  borderColor: theme.border,
                  borderWidth: 1,
                },
              ]}
              activeOpacity={0.75}
            >
              <Text style={[styles.actionBtnText, { color: shareCopiedFeedback ? theme.primaryText : theme.text, fontWeight: '800' }]}>
                {shareCopiedFeedback ? '✓ Copiat în Clipboard!' : '📤 Trimite / Copiază'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* What this week will not use up is worth more than the trip itself, so it gets
              its own line rather than hiding inside the pantry screen. */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isShoppingMode ? 'Ieși din modul cumpărături' : 'Intră în modul cumpărături'}
            onPress={() => setIsShoppingMode((on) => !on)}
            style={[
              styles.shoppingModeBtn,
              {
                borderColor: isShoppingMode ? theme.primary : theme.border,
                backgroundColor: isShoppingMode ? theme.primary : theme.btnBg,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.shoppingModeText,
                { color: isShoppingMode ? theme.primaryText : theme.text },
              ]}
            >
              {isShoppingMode ? '✓ Sunt în magazin — rânduri mari' : '🛒 Sunt în magazin'}
            </Text>
          </TouchableOpacity>

          {surplusCount > 0 && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Pune surplusul în cămară"
              onPress={carryOverSurplus}
              style={[styles.surplusBtn, { borderColor: theme.border, backgroundColor: theme.accentBg }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.surplusTitle, { color: theme.text }]}>
                ↻ Îți rămân {surplusCount} {surplusCount === 1 ? 'ingredient' : 'ingrediente'} după săptămâna asta
              </Text>
              <Text style={[styles.surplusHint, { color: theme.textMuted }]}>
                Cam {surplusValueRon} lei. Apasă după ce ai făcut cumpărăturile și se scad din lista următoare.
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Celebratory Banner when shopping is complete */}
      {isAllPurchased && (
        <View
          style={[
            styles.celebrationCard,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f2f2f7',
              borderColor: theme.border,
              maxWidth: contentMaxWidth,
            },
          ]}
        >
          <Text style={styles.celebrationEmoji}>🎉 🛒 🥗</Text>
          <Text style={[styles.celebrationTitle, { color: theme.text }]}>Toate cumpărăturile sunt gata!</Text>
          <Text style={[styles.celebrationSubtitle, { color: theme.textMuted }]}>
            Ai toate ingredientele pentru cinele acestei săptămâni. Spor la gătit!
          </Text>
        </View>
      )}

      {/* Pantry Staples Toggle */}
      <View style={[styles.toggleWrapper, { maxWidth: contentMaxWidth }]}>
        <PantryStapleToggle
          excludeStaples={preferences.excludePantryStaples}
          onToggle={setExcludePantryStaples}
          isDark={isDark}
        />
      </View>

      {/* Retail Snacks & Drinks Supermarket Bar */}
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => setShowSnacksModal(true)}
        style={[
          styles.retailSnacksBanner,
          {
            backgroundColor: isDark ? 'rgba(249, 115, 22, 0.12)' : '#fff7ed',
            borderColor: '#f97316',
            maxWidth: contentMaxWidth,
          },
        ]}
        activeOpacity={0.8}
      >
        <Text style={styles.retailSnacksIcon}>🍿</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.retailSnacksTitle, { color: isDark ? '#fdba74' : '#c2410c' }]}>
            Ronțăieli & Băuturi de Magazin
          </Text>
          <Text style={[styles.retailSnacksSubtitle, { color: theme.textMuted }]}>
            {((preferences.selectedSnackIds?.length || 0) + (preferences.selectedDrinkIds?.length || 0)) === 0
              ? 'Adaugă chipsuri, popcorn, ciocolată, sucuri, bere din catalog'
              : `${((preferences.selectedSnackIds?.length || 0) + (preferences.selectedDrinkIds?.length || 0))} produse ambalate în coșul tău`}
          </Text>
        </View>
        <View style={[styles.retailSnacksBtn, { backgroundColor: '#f97316' }]}>
          <Text style={styles.retailSnacksBtnText}>
            {((preferences.selectedSnackIds?.length || 0) + (preferences.selectedDrinkIds?.length || 0)) === 0
              ? '+ Adaugă'
              : 'Modifică'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Aisle by Aisle Grouped Sections in Multi-Column Grid */}
      <View style={[styles.aislesContainer, isLargeScreen && styles.aislesGridDesktop, { maxWidth: contentMaxWidth }]}>
        {AISLE_ORDER.map((category) => {
          const items = groupedItems[category];
          if (!items || items.length === 0) return null;
          return (
            <View key={category} style={[styles.aisleCol, isLargeScreen && styles.aisleColDesktop]}>
              <GroceryAisleSection
                category={category}
                items={items}
                onToggleItem={toggleGroceryItem}
                isDark={isDark}
                isShoppingMode={isShoppingMode}
              />
            </View>
          );
        })}
      </View>

      {/* Retail Snacks & Drinks Modal */}
      <SnacksAndDrinksModal
        visible={showSnacksModal}
        onClose={() => setShowSnacksModal(false)}
        isDark={isDark}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  shoppingModeBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shoppingModeText: { fontSize: 13, fontWeight: '800' },
  surplusBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  surplusTitle: { fontSize: 13, fontWeight: '800' },
  surplusHint: { fontSize: 11, fontWeight: '500', marginTop: 3, lineHeight: 16 },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    width: '100%',
  },
  overviewCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 18,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
  },
  overviewInner: {
    width: '100%',
  },
  overviewDesktopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  overviewCol: {
    flex: 1,
    width: '100%',
  },
  overviewColDesktop: {
    minWidth: 260,
  },
  overviewColRight: {
    width: '100%',
    gap: 10,
    marginTop: 10,
  },
  overviewColRightDesktop: {
    minWidth: 150,
    marginTop: 0,
    justifyContent: 'center',
  },
  overviewDividerV: {
    width: 1,
    height: 72,
    marginHorizontal: 8,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
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
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  celebrationSubtitle: {
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
  toggleWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  retailSnacksBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 12,
  },
  retailSnacksIcon: {
    fontSize: 24,
  },
  retailSnacksTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  retailSnacksSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  retailSnacksBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  retailSnacksBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  aislesContainer: {
    width: '100%',
  },
  aislesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'flex-start',
  },
  aisleCol: {
    width: '100%',
  },
  aisleColDesktop: {
    flex: 1,
    minWidth: 360,
  },
});
