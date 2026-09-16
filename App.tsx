import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useAppStore } from './src/store/useAppStore';
import { OnboardingWizard } from './src/screens/onboarding/OnboardingWizard';
import { GeneratingPlanModal } from './src/screens/onboarding/GeneratingPlanModal';
import { SUPERMARKETS } from './src/data/supermarkets';

const DAY_LABELS: Record<string, string> = {
  monday: 'Luni',
  tuesday: 'Marți',
  wednesday: 'Miercuri',
  thursday: 'Joi',
  friday: 'Vineri',
  saturday: 'Sâmbătă',
  sunday: 'Duminică',
};

export default function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    activeView,
    currentPlan,
    groceryItems,
    setActiveView,
    resetOnboarding,
    swapMeal,
    toggleGroceryItem,
  } = useAppStore();

  const theme = {
    background: isDark ? '#0f172a' : '#f8fafc',
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    primary: '#10b981',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
    border: isDark ? '#334155' : '#e2e8f0',
    accentBg: isDark ? '#1e293b' : '#f1f5f9',
  };

  // If in onboarding wizard
  if (activeView === 'onboarding') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <OnboardingWizard isDark={isDark} onPlanGenerated={() => setActiveView('meals')} />
      </SafeAreaView>
    );
  }

  // If in generating animation
  if (activeView === 'generating') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <GeneratingPlanModal isDark={isDark} onComplete={() => setActiveView('meals')} />
      </SafeAreaView>
    );
  }

  // Active Meal Plan & Grocery Dashboard
  const market = currentPlan ? SUPERMARKETS[currentPlan.supermarketId] : null;
  const purchasedCount = groceryItems.filter((i) => i.isPurchased).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Main Container */}
      <View style={styles.dashboardContainer}>
        {/* Top App Bar */}
        <View style={[styles.topBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View>
            <Text style={[styles.brandTitle, { color: theme.primary }]}>SmartMeal RO</Text>
            <Text style={[styles.brandSubtitle, { color: theme.textMuted }]}>
              {market ? `${market.name} • ${currentPlan?.peopleCount} persoane` : 'Meniu activ'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={resetOnboarding}
            style={[styles.resetBtn, { backgroundColor: theme.primaryLight }]}
          >
            <Text style={[styles.resetBtnText, { color: theme.primary }]}>+ Plan Nou</Text>
          </TouchableOpacity>
        </View>

        {/* View Switcher Tabs */}
        <View style={[styles.tabsRow, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => setActiveView('meals')}
            style={[
              styles.tabBtn,
              activeView === 'meals' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeView === 'meals' ? theme.primary : theme.textMuted },
              ]}
            >
              🍽️ Mesele Săptămânii ({currentPlan?.days.length ?? 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveView('grocery')}
            style={[
              styles.tabBtn,
              activeView === 'grocery' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeView === 'grocery' ? theme.primary : theme.textMuted },
              ]}
            >
              🛒 Cumpărături ({purchasedCount}/{groceryItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Body */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Summary Financial Banner */}
          {currentPlan && (
            <View style={[styles.budgetSummaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.budgetRow}>
                <View>
                  <Text style={[styles.budgetLbl, { color: theme.textMuted }]}>Cost estimat coș:</Text>
                  <Text style={[styles.budgetTotal, { color: theme.text }]}>
                    {currentPlan.totalCartCostRon} lei
                  </Text>
                </View>
                <View style={styles.budgetTargetBox}>
                  <Text style={[styles.budgetLbl, { color: theme.textMuted }]}>Buget setat:</Text>
                  <Text style={[styles.budgetCap, { color: theme.primary }]}>
                    {currentPlan.totalBudgetRon} lei
                  </Text>
                </View>
              </View>

              <View style={styles.budgetStatusBadge}>
                <Text style={styles.budgetStatusText}>
                  ✓ Economie de{' '}
                  {Math.max(0, Math.round((currentPlan.totalBudgetRon - currentPlan.totalCartCostRon) * 10) / 10)}{' '}
                  lei față de limita setată
                </Text>
              </View>
            </View>
          )}

          {/* MEALS VIEW */}
          {activeView === 'meals' && currentPlan && (
            <View style={styles.mealsFeed}>
              {currentPlan.days.map((day) => (
                <View
                  key={day.dayOfWeek}
                  style={[styles.mealCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  {/* Day Header */}
                  <View style={styles.dayCardHeader}>
                    <View style={styles.dayBadge}>
                      <Text style={styles.dayBadgeText}>{DAY_LABELS[day.dayOfWeek]}</Text>
                    </View>
                    <Text style={[styles.dayCost, { color: theme.primary }]}>
                      ~{day.estimatedCostRon} lei / porție
                    </Text>
                  </View>

                  <Text style={[styles.recipeCardTitle, { color: theme.text }]}>{day.recipe.title}</Text>
                  <Text style={[styles.recipeCardDesc, { color: theme.textMuted }]}>
                    {day.recipe.description}
                  </Text>

                  {/* Nutrition pills */}
                  <View style={styles.nutritionRow}>
                    <Text style={[styles.nutritionPill, { color: theme.textMuted }]}>
                      ⏱️ {day.recipe.cookTimeMinutes} min
                    </Text>
                    <Text style={[styles.nutritionPill, { color: theme.textMuted }]}>
                      🔥 {day.recipe.nutritionPerServing.calories} kcal
                    </Text>
                    <Text style={[styles.nutritionPill, { color: theme.textMuted }]}>
                      💪 {day.recipe.nutritionPerServing.proteinGrams}g proteine
                    </Text>
                  </View>

                  {/* Action row */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => swapMeal(day.dayOfWeek)}
                      style={[styles.swapButton, { borderColor: theme.border }]}
                    >
                      <Text style={[styles.swapButtonText, { color: theme.text }]}>🔄 Schimbă rețeta</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* GROCERY CHECKLIST VIEW */}
          {activeView === 'grocery' && (
            <View style={styles.groceryFeed}>
              <View style={styles.groceryHeaderRow}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Lista pe ambalaje</Text>
                <Text style={[styles.itemsProgressText, { color: theme.primary }]}>
                  {purchasedCount} din {groceryItems.length} bifate
                </Text>
              </View>

              {groceryItems.map((item) => (
                <TouchableOpacity
                  key={item.ingredientId}
                  onPress={() => toggleGroceryItem(item.ingredientId)}
                  activeOpacity={0.7}
                  style={[
                    styles.groceryRow,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                      opacity: item.isPurchased ? 0.6 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.groceryCheck,
                      {
                        backgroundColor: item.isPurchased ? theme.primary : 'transparent',
                        borderColor: item.isPurchased ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    {item.isPurchased && <Text style={styles.checkTick}>✓</Text>}
                  </View>

                  <View style={styles.itemDetails}>
                    <Text
                      style={[
                        styles.itemName,
                        {
                          color: theme.text,
                          textDecorationLine: item.isPurchased ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={[styles.itemSub, { color: theme.textMuted }]}>
                      Necesar: {item.neededAmount}
                      {item.unit} • Cumperi: {item.packsToBuy} × pachet {item.packSize}
                      {item.unit}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.itemPrice,
                      {
                        color: item.isPurchased ? theme.textMuted : theme.primary,
                        textDecorationLine: item.isPurchased ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {item.estimatedPriceRon} lei
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  dashboardContainer: {
    flex: 1,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabsRow: {
    width: '100%',
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    width: '100%',
  },
  budgetSummaryCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetLbl: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  budgetTotal: {
    fontSize: 28,
    fontWeight: '900',
  },
  budgetTargetBox: {
    alignItems: 'flex-end',
  },
  budgetCap: {
    fontSize: 20,
    fontWeight: '800',
  },
  budgetStatusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  budgetStatusText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  mealsFeed: {
    width: '100%',
    maxWidth: 480,
    gap: 14,
  },
  mealCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  dayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dayBadgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dayCost: {
    fontSize: 13,
    fontWeight: '700',
  },
  recipeCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  recipeCardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  nutritionPill: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  swapButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  swapButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  groceryFeed: {
    width: '100%',
    maxWidth: 480,
    gap: 10,
  },
  groceryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  itemsProgressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  groceryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  groceryCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkTick: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemSub: {
    fontSize: 11,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
});
