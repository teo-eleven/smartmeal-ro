import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { PlanHeader } from '../components/PlanHeader';
import { MealCard } from '../components/MealCard';
import { RecipeDetailModal } from './RecipeDetailModal';
import { MealSwapModal } from './MealSwapModal';
import { DayOfWeek, MealSlot, Recipe } from '../types';

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
  } = useAppStore();

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

  const currentMealsPerDayCount = preferences.mealSlots?.length || 1;

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
              {currentMealsPerDayCount === 1 && '1 Masă (Cină)'}
              {currentMealsPerDayCount === 2 && '2 Mese (Prânz + Cină)'}
              {currentMealsPerDayCount === 3 && '3 Mese (Mic Dejun + Prânz + Cină)'}
            </Text>
          </View>

          <View style={[styles.segmentedControl, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity
              onPress={() => setMealsPerDayCount(1)}
              style={[
                styles.segmentBtn,
                currentMealsPerDayCount === 1 && [
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
                    color: currentMealsPerDayCount === 1 ? theme.primary : theme.textMuted,
                    fontWeight: currentMealsPerDayCount === 1 ? '800' : '600',
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
                currentMealsPerDayCount === 2 && [
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
                    color: currentMealsPerDayCount === 2 ? theme.primary : theme.textMuted,
                    fontWeight: currentMealsPerDayCount === 2 ? '800' : '600',
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
                currentMealsPerDayCount === 3 && [
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
                    color: currentMealsPerDayCount === 3 ? theme.primary : theme.textMuted,
                    fontWeight: currentMealsPerDayCount === 3 ? '800' : '600',
                  },
                ]}
              >
                3 Mese
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Day-by-day Meal Cards Feed */}
        <View style={styles.feed}>
          {currentPlan.days.map((day) => {
            const hasMultipleMeals = day.meals && day.meals.length > 1;

            if (hasMultipleMeals) {
              return (
                <View key={day.dayOfWeek} style={styles.dayGroupContainer}>
                  <View style={[styles.dayGroupHeader, { backgroundColor: theme.dayHeaderBg, borderColor: theme.border }]}>
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
                      isDark={isDark}
                    />
                  ))}
                </View>
              );
            }

            // 1 meal per day
            const singleMeal = day.meals?.[0];
            return (
              <MealCard
                key={day.dayOfWeek}
                day={day}
                meal={singleMeal}
                slotLabel={singleMeal?.slotLabelRo || 'Cină'}
                onPressRecipe={() => handleOpenDetail(day.recipe, day.servings)}
                onSwapMeal={() => handleOpenSwap(day.dayOfWeek, singleMeal?.slot)}
                isDark={isDark}
              />
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
});
