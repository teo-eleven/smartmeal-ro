import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { PlanHeader } from '../components/PlanHeader';
import { MealCard } from '../components/MealCard';
import { RecipeDetailModal } from './RecipeDetailModal';
import { MealSwapModal } from './MealSwapModal';
import { DayOfWeek, Recipe } from '../types';

interface MealBoardScreenProps {
  isDark: boolean;
}

export const MealBoardScreen: React.FC<MealBoardScreenProps> = ({ isDark }) => {
  const {
    currentPlan,
    preferences,
    generatePlan,
    resetOnboarding,
    replaceMealWithRecipe,
  } = useAppStore();

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [detailServings, setDetailServings] = useState<number>(currentPlan?.peopleCount ?? 2);
  const [swapDay, setSwapDay] = useState<DayOfWeek | null>(null);

  if (!currentPlan) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Niciun meniu activ. Pornește onboarding-ul!</Text>
      </View>
    );
  }

  const handleOpenDetail = (recipe: Recipe, servings: number) => {
    setSelectedRecipe(recipe);
    setDetailServings(servings);
  };

  const handleOpenSwapForDay = (dayOfWeek: DayOfWeek) => {
    setSwapDay(dayOfWeek);
  };

  const handleSelectReplacement = (recipe: Recipe) => {
    if (swapDay) {
      replaceMealWithRecipe(swapDay, recipe);
      setSwapDay(null);
    }
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

        {/* Day-by-day Meal Cards Feed */}
        <View style={styles.feed}>
          {currentPlan.days.map((day) => (
            <MealCard
              key={day.dayOfWeek}
              day={day}
              onPressRecipe={() => handleOpenDetail(day.recipe, day.servings)}
              onSwapMeal={() => handleOpenSwapForDay(day.dayOfWeek)}
              isDark={isDark}
            />
          ))}
        </View>
      </ScrollView>

      {/* Recipe Detail Full Modal */}
      <RecipeDetailModal
        visible={Boolean(selectedRecipe)}
        recipe={selectedRecipe}
        servings={detailServings}
        onClose={() => setSelectedRecipe(null)}
        onSwap={() => {
          // Find which day this recipe is on, if any
          const dayMatch = currentPlan.days.find((d) => d.recipe.id === selectedRecipe?.id);
          setSelectedRecipe(null);
          if (dayMatch) {
            setSwapDay(dayMatch.dayOfWeek);
          }
        }}
        isDark={isDark}
      />

      {/* Interactive Meal Swap Alternative Selection Modal */}
      <MealSwapModal
        visible={Boolean(swapDay)}
        dayOfWeek={swapDay}
        currentPlan={currentPlan}
        preferences={preferences}
        onClose={() => setSwapDay(null)}
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
  feed: {
    width: '100%',
    maxWidth: 480,
    gap: 14,
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
