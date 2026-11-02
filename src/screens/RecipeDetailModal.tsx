import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { DayOfWeek, MealSlot, Recipe } from '../types';
import { useResponsive } from '../hooks/useResponsive';
import { getAppTheme } from '../styles/theme';
import { getRecipeAllergens } from '../utils/allergenFilter';
import { ALLERGEN_CATALOG } from '../data/allergens';
import { AllergenNotice } from './recipeDetail/AllergenNotice';
import { AppliancesCard } from './recipeDetail/AppliancesCard';
import { DislikeSuggestion } from './recipeDetail/DislikeSuggestion';
import { IngredientsCard } from './recipeDetail/IngredientsCard';
import { MealActionsCard } from './recipeDetail/MealActionsCard';
import { NotesCard } from './recipeDetail/NotesCard';
import { NutritionCard } from './recipeDetail/NutritionCard';
import { RecipeHero } from './recipeDetail/RecipeHero';
import { RecipeSummaryCard } from './recipeDetail/RecipeSummaryCard';
import { RecipeTopBar } from './recipeDetail/RecipeTopBar';
import { ServingsStepper } from './recipeDetail/ServingsStepper';
import { StepsCard } from './recipeDetail/StepsCard';
import { ChefTipsCard, SubstitutionsCard } from './recipeDetail/TipsCards';
import { VerdictRow } from './recipeDetail/VerdictRow';
import {
  estimateRecipeCost,
  getChefTipsForRecipe,
  getSubstitutionsForRecipe,
} from './recipeDetail/recipeContent';
import { styles } from './recipeDetail/styles';
import { RecipeDetailTheme } from './recipeDetail/types';
import { useRecipeDetail } from './recipeDetail/useRecipeDetail';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  servings: number;
  visible: boolean;
  onClose: () => void;
  onSwap: () => void;
  onChangeServings?: (servings: number) => void;
  isDark: boolean;
  targetDay?: DayOfWeek | null;
  targetSlot?: MealSlot | null;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  servings: initialServings,
  visible,
  onClose,
  onSwap,
  onChangeServings,
  isDark,
  targetDay,
  targetSlot,
}) => {
  const {
    activeServings,
    completedSteps,
    checkedIngredients,
    handleServingsChange,
    preferences,
    replaceMealWithRecipe,
    toggleFavouriteRecipe,
    toggleDislikedRecipe,
    showNotice,
    recipeNotes,
    setRecipeNote,
    isEatenOut,
    suggestedReplacement,
    toggleStep,
    toggleIngredient,
    handleToggleEatOut,
  } = useRecipeDetail({
    recipe,
    initialServings,
    visible,
    onChangeServings,
    targetDay,
    targetSlot,
  });

  const { isDesktop, isTablet, contentMaxWidth } = useResponsive();
  const isWide = isDesktop || isTablet;

  if (!recipe) return null;

  const recipeAllergens = getRecipeAllergens(recipe);
  const recipeAllergenLabels = recipeAllergens
    .map((id) => ALLERGEN_CATALOG.find((a) => a.id === id)?.label ?? id)
    .join(', ');

  const appTheme = getAppTheme(isDark);
  const theme: RecipeDetailTheme = {
    ...appTheme,
    stepDoneBg: isDark ? appTheme.primaryLight : '#f0fdf4',
    badgeBg: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
    accentCard: isDark ? '#243027' : '#f8fafc',
  };

  const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  const isFavourite = (preferences.favouriteRecipeIds ?? []).includes(recipe.id);
  const isDisliked = (preferences.dislikedRecipeIds ?? []).includes(recipe.id);

  const chefTips = getChefTipsForRecipe(recipe);
  const substitutions = getSubstitutionsForRecipe(recipe);
  const { formattedCostPerServing, formattedTotalCost } = estimateRecipeCost(
    recipe,
    preferences.supermarketId,
    activeServings
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      {/* The notes box sits low in the sheet; without this the keyboard covered it. */}
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.modalCard,
            isWide && styles.modalCardWide,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <RecipeTopBar
            recipe={recipe}
            theme={theme}
            isDark={isDark}
            totalTime={totalTime}
            formattedCostPerServing={formattedCostPerServing}
            targetDay={targetDay}
            isEatenOut={isEatenOut}
            onClose={onClose}
            onSwap={onSwap}
            onToggleEatOut={handleToggleEatOut}
          />

          <ScrollView
            contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.mainLayoutWrapper,
                isWide && styles.mainLayoutWrapperWide,
                { maxWidth: Math.min(contentMaxWidth, 1440) },
              ]}
            >
              {/* Left column: hero image, stats, macros and ingredients */}
              <View style={[styles.leftColumn, isWide && styles.leftColumnWide]}>
                <RecipeHero
                  recipe={recipe}
                  theme={theme}
                  isDark={isDark}
                  totalTime={totalTime}
                  supermarketId={preferences.supermarketId}
                />
                <RecipeSummaryCard
                  recipe={recipe}
                  theme={theme}
                  isDark={isDark}
                  activeServings={activeServings}
                  supermarketId={preferences.supermarketId}
                  formattedTotalCost={formattedTotalCost}
                />
                <ServingsStepper
                  theme={theme}
                  activeServings={activeServings}
                  onChange={handleServingsChange}
                />
                <NutritionCard recipe={recipe} theme={theme} isDark={isDark} />
                {recipeAllergens.length > 0 && (
                  <AllergenNotice theme={theme} recipeAllergenLabels={recipeAllergenLabels} />
                )}
                <IngredientsCard
                  recipe={recipe}
                  theme={theme}
                  isWide={isWide}
                  activeServings={activeServings}
                  checkedIngredients={checkedIngredients}
                  onToggleIngredient={toggleIngredient}
                />
                <MealActionsCard
                  theme={theme}
                  isDark={isDark}
                  targetDay={targetDay}
                  isEatenOut={isEatenOut}
                  onSwap={onSwap}
                  onClose={onClose}
                  onToggleEatOut={handleToggleEatOut}
                />
              </View>

              {/* Right column: preparation steps, appliances, chef tips and notes */}
              <View style={[styles.rightColumn, isWide && styles.rightColumnWide]}>
                <StepsCard
                  recipe={recipe}
                  theme={theme}
                  completedSteps={completedSteps}
                  onToggleStep={toggleStep}
                />
                <AppliancesCard recipe={recipe} theme={theme} />
                <ChefTipsCard theme={theme} chefTips={chefTips} />
                <SubstitutionsCard theme={theme} substitutions={substitutions} />
                <NotesCard
                  recipe={recipe}
                  theme={theme}
                  recipeNotes={recipeNotes}
                  setRecipeNote={setRecipeNote}
                />
                <VerdictRow
                  recipeId={recipe.id}
                  theme={theme}
                  isFavourite={isFavourite}
                  isDisliked={isDisliked}
                  toggleFavouriteRecipe={toggleFavouriteRecipe}
                  toggleDislikedRecipe={toggleDislikedRecipe}
                />
                {isDisliked && suggestedReplacement && (
                  <DislikeSuggestion
                    recipe={recipe}
                    suggestedReplacement={suggestedReplacement}
                    theme={theme}
                    isDark={isDark}
                    activeServings={activeServings}
                    preferences={preferences}
                    targetDay={targetDay}
                    targetSlot={targetSlot}
                    replaceMealWithRecipe={replaceMealWithRecipe}
                    showNotice={showNotice}
                    onClose={onClose}
                    onSwap={onSwap}
                  />
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
