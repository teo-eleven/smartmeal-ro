import React, { useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { getAppTheme } from '../styles/theme';
import { glass } from '../styles/glass';
import { USE_NATIVE_DRIVER } from '../styles/motion';
import { CardChips } from './mealCard/CardChips';
import { CardFooter } from './mealCard/CardFooter';
import { CardHero } from './mealCard/CardHero';
import { EatenOutCard } from './mealCard/EatenOutCard';
import { MacroGrid } from './mealCard/MacroGrid';
import { styles } from './mealCard/styles';
import { MealCardProps } from './mealCard/types';

const MealCardView: React.FC<MealCardProps> = ({
  day,
  meal,
  slotLabel,
  onPressRecipe,
  onSwapMeal,
  onRemoveMeal,
  onCookDouble,
  onUndoCookDouble,
  onChangeServings,
  onToggleEatOut,
  isDark,
}) => {
  // A narrow selector: the card re-renders when the store changes, not on every store write.
  const supermarketId = useAppStore((state) => state.preferences.supermarketId);
  const recipe = meal ? meal.recipe : day.recipe;
  const costRon = meal ? meal.estimatedCostRon : day.estimatedCostRon;
  const servings = meal ? meal.servings : day.servings;
  const portionCost = servings > 0 ? Math.round((costRon / servings) * 100) / 100 : costRon;
  const effectiveSlotLabel = slotLabel || meal?.slotLabelRo;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: USE_NATIVE_DRIVER,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: USE_NATIVE_DRIVER,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const theme = getAppTheme(isDark);

  if (meal?.isEatenOut) {
    return (
      <EatenOutCard
        recipe={recipe}
        dayOfWeek={day.dayOfWeek}
        slotLabel={effectiveSlotLabel}
        theme={theme}
        isDark={isDark}
        onPressRecipe={onPressRecipe}
        onToggleEatOut={onToggleEatOut}
      />
    );
  }

  const isDessert = meal?.slot === 'dessert';

  return (
    <Animated.View
      style={{ transform: [{ scale: scaleAnim }], width: '100%', flex: 1, height: '100%' }}
    >
      {/* A container, not a button. The whole card used to be one button with five buttons
          inside it: VoiceOver read it as a single element, so the portion stepper, "cook
          double" and "Schimbă" were out of reach, and on the web it was invalid HTML. The
          picture now opens the recipe, as does "Vezi Rețeta" below. */}
      <View
        {...glass('card')}
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: isDessert
              ? isDark
                ? 'rgba(236, 72, 153, 0.45)'
                : '#fbcfe8'
              : theme.border,
            shadowColor: '#000000',
            flex: 1,
            height: '100%',
            marginBottom: 0,
          },
        ]}
      >
        <CardHero
          day={day}
          meal={meal}
          recipe={recipe}
          effectiveSlotLabel={effectiveSlotLabel}
          isDessert={isDessert}
          costRon={costRon}
          servings={servings}
          portionCost={portionCost}
          theme={theme}
          isDark={isDark}
          onPressRecipe={onPressRecipe}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onRemoveMeal={onRemoveMeal}
        />

        <View style={styles.contentBody}>
          <CardChips recipe={recipe} supermarketId={supermarketId} theme={theme} isDark={isDark} />

          {/* The dish name is set over the visual just above; repeating it here said the
              same thing twice in the space of two lines. */}
          <Text style={[styles.description, { color: theme.textMuted }]} numberOfLines={2}>
            {recipe.description}
          </Text>

          <MacroGrid recipe={recipe} theme={theme} />

          <CardFooter
            meal={meal}
            servings={servings}
            isDessert={isDessert}
            theme={theme}
            isDark={isDark}
            onPressRecipe={onPressRecipe}
            onSwapMeal={onSwapMeal}
            onToggleEatOut={onToggleEatOut}
            onCookDouble={onCookDouble}
            onUndoCookDouble={onUndoCookDouble}
            onChangeServings={onChangeServings}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const CALLBACK_PROPS = [
  'onPressRecipe',
  'onSwapMeal',
  'onRemoveMeal',
  'onToggleEatOut',
  'onCookDouble',
  'onUndoCookDouble',
  'onChangeServings',
] as const;

/**
 * The board rebuilds every card's callbacks on each render, so comparing them by identity
 * re-rendered all cards on any edit. They close over only `day`, `meal` and stable store
 * actions, which are compared here, so a callback's presence is all that can change.
 */
export function areMealCardPropsEqual(prev: MealCardProps, next: MealCardProps): boolean {
  return (
    prev.day === next.day &&
    prev.meal === next.meal &&
    prev.slotLabel === next.slotLabel &&
    prev.isDark === next.isDark &&
    CALLBACK_PROPS.every((key) => Boolean(prev[key]) === Boolean(next[key]))
  );
}

export const MealCard = React.memo(MealCardView, areMealCardPropsEqual);
