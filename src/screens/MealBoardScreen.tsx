import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { PlanHeader } from '../components/PlanHeader';
import { MealCard } from '../components/MealCard';
import { RecipeDetailModal } from './RecipeDetailModal';
import { MealSwapModal } from './MealSwapModal';
import { DayOfWeek, FoodTier, MealSlot, Recipe, SupermarketId } from '../types';

interface MealBoardScreenProps {
  isDark: boolean;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Luni',
  tuesday: 'Marți',
  wednesday: 'Miercuri',
  thursday: 'Joi',
  friday: 'Vineri',
  saturday: 'Sâmbătă',
  sunday: 'Duminică',
};

export const MealBoardScreen: React.FC<MealBoardScreenProps> = ({ isDark }) => {
  const {
    currentPlan,
    preferences,
    generatePlan,
    resetOnboarding,
    replaceMealWithRecipe,
    setMealsPerDayCount,
    setFoodTier,
    setSupermarket,
    toggleExtraSlot,
    addExtraMealToDay,
    removeMealFromDay,
  } = useAppStore();

  const getTierColor = (tier?: FoodTier): string => {
    switch (tier) {
      case 'basic':
        return '#10b981';
      case 'medium':
        return '#3b82f6';
      case 'premium':
        return '#eab308';
      default:
        return '#3b82f6';
    }
  };

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [detailServings, setDetailServings] = useState<number>(currentPlan?.peopleCount ?? 2);
  const [swapDay, setSwapDay] = useState<DayOfWeek | null>(null);
  const [swapSlot, setSwapSlot] = useState<MealSlot | null>(null);

  if (!currentPlan) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Niciun meniu activ. Pornește onboarding-ul!</Text>
      </View>
    );
  }

  const baseMealsCount = preferences.mealSlots?.filter(
    (s) => s === 'breakfast' || s === 'lunch' || s === 'dinner'
  ).length || 1;

  const handleOpenDetail = (recipe: Recipe, servings: number) => {
    setSelectedRecipe(recipe);
    setDetailServings(servings);
  };

  const handleOpenSwap = (dayOfWeek: DayOfWeek, slot?: MealSlot) => {
    setSwapDay(dayOfWeek);
    setSwapSlot(slot || null);
  };

  const handleSelectReplacement = (recipe: Recipe) => {
    if (swapDay) {
      replaceMealWithRecipe(swapDay, recipe, swapSlot || undefined);
      setSwapDay(null);
      setSwapSlot(null);
    }
  };

  const theme = {
    card: isDark ? '#131d31' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    primary: '#10b981',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ecfdf5',
    btnBg: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
    dayHeaderBg: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Financial Overview Header */}
        <PlanHeader
          plan={currentPlan}
          onRebuildPlan={generatePlan}
          onResetOnboarding={resetOnboarding}
          isDark={isDark}
        />

        {/* 1, 2 sau 3 Mese pe zi Quick Switcher Bar */}
        <View style={styles.mealsPerDayCard}>
          <View style={styles.mealsPerDayHeader}>
            <Text style={[styles.mealsPerDayTitle, { color: theme.text }]}>
              Mese planificate pe zi:
            </Text>
            <Text style={[styles.mealsPerDaySubtitle, { color: theme.primary }]}>
              {baseMealsCount === 1 && '1 Masă (Cină)'}
              {baseMealsCount === 2 && '2 Mese (Prânz + Cină)'}
              {baseMealsCount === 3 && '3 Mese (Mic Dejun + Prânz + Cină)'}
            </Text>
          </View>

          <View style={[styles.segmentedControl, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity
              onPress={() => setMealsPerDayCount(1)}
              style={[
                styles.segmentBtn,
                baseMealsCount === 1 && [
                  styles.segmentBtnActive,
                  { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                ],
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: baseMealsCount === 1 ? theme.primary : theme.textMuted,
                    fontWeight: baseMealsCount === 1 ? '800' : '600',
                  },
                ]}
              >
                1 Masă
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMealsPerDayCount(2)}
              style={[
                styles.segmentBtn,
                baseMealsCount === 2 && [
                  styles.segmentBtnActive,
                  { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                ],
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: baseMealsCount === 2 ? theme.primary : theme.textMuted,
                    fontWeight: baseMealsCount === 2 ? '800' : '600',
                  },
                ]}
              >
                2 Mese
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMealsPerDayCount(3)}
              style={[
                styles.segmentBtn,
                baseMealsCount === 3 && [
                  styles.segmentBtnActive,
                  { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                ],
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  {
                    color: baseMealsCount === 3 ? theme.primary : theme.textMuted,
                    fontWeight: baseMealsCount === 3 ? '800' : '600',
                  },
                ]}
              >
                3 Mese
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Extras Toggle Pills */}
          <View style={styles.extrasPillsRow}>
            <TouchableOpacity
              onPress={() => toggleExtraSlot('snack')}
              style={[
                styles.extraPill,
                preferences.mealSlots?.includes('snack')
                  ? {
                      backgroundColor: isDark ? 'rgba(249, 115, 22, 0.2)' : '#ffedd5',
                      borderColor: '#f97316',
                    }
                  : { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.extraPillIcon}>🍿</Text>
              <Text
                style={[
                  styles.extraPillText,
                  {
                    color: preferences.mealSlots?.includes('snack') ? '#f97316' : theme.textMuted,
                    fontWeight: preferences.mealSlots?.includes('snack') ? '800' : '600',
                  },
                ]}
              >
                Ronțăială (Film/Meci) {preferences.mealSlots?.includes('snack') ? '✓' : '+'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleExtraSlot('dessert')}
              style={[
                styles.extraPill,
                preferences.mealSlots?.includes('dessert')
                  ? {
                      backgroundColor: isDark ? 'rgba(236, 72, 153, 0.2)' : '#fce7f3',
                      borderColor: '#ec4899',
                    }
                  : { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.extraPillIcon}>🍰</Text>
              <Text
                style={[
                  styles.extraPillText,
                  {
                    color: preferences.mealSlots?.includes('dessert') ? '#ec4899' : theme.textMuted,
                    fontWeight: preferences.mealSlots?.includes('dessert') ? '800' : '600',
                  },
                ]}
              >
                Desert de Casă {preferences.mealSlots?.includes('dessert') ? '✓' : '+'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nivel Meniu (Food Tier): Basic, Medium, Premium */}
          <View style={[styles.tierSectionContainer, { borderTopColor: theme.border }]}>
            <View style={styles.mealsPerDayHeader}>
              <Text style={[styles.mealsPerDayTitle, { color: theme.text }]}>
                Nivelul ingredientelor & rețetelor:
              </Text>
              <Text style={[styles.mealsPerDaySubtitle, { color: getTierColor(preferences.foodTier) }]}>
                {preferences.foodTier === 'basic' && '🥉 Basic (~8-12 lei / porție)'}
                {preferences.foodTier === 'medium' && '🥈 Medium (~13-18 lei / porție)'}
                {preferences.foodTier === 'premium' && '🥇 Premium (~20-35+ lei / porție)'}
              </Text>
            </View>

            <View style={[styles.segmentedControl, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {(['basic', 'medium', 'premium'] as FoodTier[]).map((tier) => {
                const isActive = (preferences.foodTier || 'medium') === tier;
                const label = tier === 'basic' ? '🥉 Basic' : tier === 'medium' ? '🥈 Medium' : '🥇 Premium';
                return (
                  <TouchableOpacity
                    key={tier}
                    onPress={() => setFoodTier(tier)}
                    style={[
                      styles.segmentBtn,
                      isActive && [
                        styles.segmentBtnActive,
                        {
                          backgroundColor:
                            tier === 'basic'
                              ? isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5'
                              : tier === 'medium'
                              ? isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff'
                              : isDark ? 'rgba(234, 179, 8, 0.2)' : '#fefce8',
                          borderColor:
                            tier === 'basic' ? '#10b981' : tier === 'medium' ? '#3b82f6' : '#eab308',
                        },
                      ],
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        {
                          color: isActive
                            ? tier === 'basic' ? '#10b981' : tier === 'medium' ? '#3b82f6' : '#eab308'
                            : theme.textMuted,
                          fontWeight: isActive ? '800' : '600',
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Supermarket Switcher with Official Catalog Prices */}
          <View style={[styles.tierSectionContainer, { borderTopColor: theme.border }]}>
            <View style={styles.mealsPerDayHeader}>
              <Text style={[styles.mealsPerDayTitle, { color: theme.text }]}>
                Prețuri reale magazine:
              </Text>
              <Text style={[styles.mealsPerDaySubtitle, { color: theme.primary }]}>
                {preferences.supermarketId.toUpperCase()} (Cataloage Oficiale)
              </Text>
            </View>

            <View style={styles.supermarketPillsRow}>
              {[
                { id: 'lidl', name: 'Lidl', color: '#0050aa' },
                { id: 'kaufland', name: 'Kaufland', color: '#e2001a' },
                { id: 'carrefour', name: 'Carrefour', color: '#004e9a' },
                { id: 'mega_image', name: 'Mega Image', color: '#d3122a' },
              ].map((market) => {
                const isActive = preferences.supermarketId === market.id;
                return (
                  <TouchableOpacity
                    key={market.id}
                    onPress={() => setSupermarket(market.id as SupermarketId)}
                    style={[
                      styles.marketPill,
                      isActive
                        ? { backgroundColor: market.color, borderColor: market.color }
                        : { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.marketPillText,
                        { color: isActive ? '#ffffff' : theme.text, fontWeight: isActive ? '800' : '600' },
                      ]}
                    >
                      {market.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Day-by-day Meal Cards Feed */}
        <View style={styles.feed}>
          {currentPlan.days.map((day) => {
            const hasMultipleMeals = day.meals && day.meals.length > 1;

            if (hasMultipleMeals) {
              return (
                <View key={day.dayOfWeek} style={styles.dayGroupContainer}>
                  <View
                    style={[
                      styles.dayGroupHeader,
                      { backgroundColor: theme.dayHeaderBg, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.dayGroupTitle, { color: theme.text }]}>
                      📅 {DAY_LABELS[day.dayOfWeek].toUpperCase()}
                    </Text>
                    <Text style={[styles.dayGroupCost, { color: theme.primary }]}>
                      Total zi: ~{day.estimatedCostRon} lei
                    </Text>
                  </View>

                  {day.meals.map((meal) => (
                    <MealCard
                      key={meal.id}
                      day={day}
                      meal={meal}
                      slotLabel={meal.slotLabelRo}
                      onPressRecipe={() => handleOpenDetail(meal.recipe, meal.servings)}
                      onSwapMeal={() => handleOpenSwap(day.dayOfWeek, meal.slot)}
                      onRemoveMeal={
                        day.meals.length > 1 && (meal.slot === 'snack' || meal.slot === 'dessert')
                          ? () => removeMealFromDay(day.dayOfWeek, meal.id)
                          : undefined
                      }
                      isDark={isDark}
                    />
                  ))}

                  {/* Add Extra Meal for this day */}
                  <View style={styles.addDayExtraRow}>
                    {!day.meals.some((m) => m.slot === 'snack') && (
                      <TouchableOpacity
                        onPress={() => addExtraMealToDay(day.dayOfWeek, 'snack')}
                        style={[
                          styles.addDayExtraBtn,
                          { backgroundColor: theme.btnBg, borderColor: theme.border },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.addDayExtraText, { color: '#f97316' }]}>
                          + 🍿 Ronțăială Film/Meci
                        </Text>
                      </TouchableOpacity>
                    )}

                    {!day.meals.some((m) => m.slot === 'dessert') && (
                      <TouchableOpacity
                        onPress={() => addExtraMealToDay(day.dayOfWeek, 'dessert')}
                        style={[
                          styles.addDayExtraBtn,
                          { backgroundColor: theme.btnBg, borderColor: theme.border },
                        ]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.addDayExtraText, { color: '#ec4899' }]}>
                          + 🍰 Desert
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }

            // 1 meal per day
            const singleMeal = day.meals?.[0];
            return (
              <View key={day.dayOfWeek} style={styles.dayGroupContainer}>
                <MealCard
                  day={day}
                  meal={singleMeal}
                  slotLabel={singleMeal?.slotLabelRo || 'Cină'}
                  onPressRecipe={() => handleOpenDetail(day.recipe, day.servings)}
                  onSwapMeal={() => handleOpenSwap(day.dayOfWeek, singleMeal?.slot)}
                  isDark={isDark}
                />

                {/* Add Extra Meal for this single-meal day */}
                <View style={[styles.addDayExtraRow, { marginTop: -6, marginBottom: 12 }]}>
                  <TouchableOpacity
                    onPress={() => addExtraMealToDay(day.dayOfWeek, 'snack')}
                    style={[
                      styles.addDayExtraBtn,
                      { backgroundColor: theme.btnBg, borderColor: theme.border },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.addDayExtraText, { color: '#f97316' }]}>
                      + 🍿 Ronțăială Film/Meci
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => addExtraMealToDay(day.dayOfWeek, 'dessert')}
                    style={[
                      styles.addDayExtraBtn,
                      { backgroundColor: theme.btnBg, borderColor: theme.border },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.addDayExtraText, { color: '#ec4899' }]}>
                      + 🍰 Desert
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Recipe Detail Full Modal */}
      <RecipeDetailModal
        visible={Boolean(selectedRecipe)}
        recipe={selectedRecipe}
        servings={detailServings}
        onClose={() => setSelectedRecipe(null)}
        onSwap={() => {
          let foundDay: DayOfWeek | null = null;
          let foundSlot: MealSlot | null = null;

          currentPlan.days.forEach((d) => {
            d.meals?.forEach((m) => {
              if (m.recipe.id === selectedRecipe?.id) {
                foundDay = d.dayOfWeek;
                foundSlot = m.slot;
              }
            });
            if (!foundDay && d.recipe.id === selectedRecipe?.id) {
              foundDay = d.dayOfWeek;
            }
          });

          setSelectedRecipe(null);
          if (foundDay) {
            handleOpenSwap(foundDay, foundSlot || undefined);
          }
        }}
        isDark={isDark}
      />

      {/* Interactive Meal Swap Alternative Selection Modal */}
      <MealSwapModal
        visible={Boolean(swapDay)}
        dayOfWeek={swapDay}
        slot={swapSlot}
        currentPlan={currentPlan}
        preferences={preferences}
        onClose={() => {
          setSwapDay(null);
          setSwapSlot(null);
        }}
        onSelectReplacement={handleSelectReplacement}
        isDark={isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  mealsPerDayCard: {
    width: '100%',
    maxWidth: 480,
    marginBottom: 16,
  },
  mealsPerDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  mealsPerDayTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  mealsPerDaySubtitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentBtnActive: {
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
  },
  extrasPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  extraPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 5,
  },
  extraPillIcon: {
    fontSize: 13,
  },
  extraPillText: {
    fontSize: 11,
  },
  addDayExtraRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 14,
  },
  addDayExtraBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDayExtraText: {
    fontSize: 11,
    fontWeight: '700',
  },
  feed: {
    width: '100%',
    maxWidth: 480,
  },
  dayGroupContainer: {
    marginBottom: 20,
  },
  dayGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  dayGroupTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dayGroupCost: {
    fontSize: 12,
    fontWeight: '800',
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
  tierSectionContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  supermarketPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  marketPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketPillText: {
    fontSize: 11,
  },
});
