import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MealCard } from '../MealCard';
import { RECIPES } from '../../data/recipes';
import { MealPlanDay, PlannedMeal } from '../../types';

const recipe = RECIPES[0];

function buildMeal(overrides: Partial<PlannedMeal> = {}): PlannedMeal {
  return {
    id: 'monday-dinner',
    slot: 'dinner',
    slotLabelRo: 'Cină',
    recipe,
    servings: 2,
    estimatedCostRon: 14.44,
    ...overrides,
  };
}

function buildDay(meal: PlannedMeal): MealPlanDay {
  return {
    dayOfWeek: 'monday',
    meals: [meal],
    recipe: meal.recipe,
    servings: meal.servings,
    estimatedCostRon: meal.estimatedCostRon,
  };
}

describe('MealCard servings stepper', () => {
  test('shows the current number of servings', () => {
    const meal = buildMeal({ servings: 4 });
    render(
      <MealCard
        day={buildDay(meal)}
        meal={meal}
        onPressRecipe={jest.fn()}
        onSwapMeal={jest.fn()}
        onChangeServings={jest.fn()}
        isDark={false}
      />
    );
    expect(screen.getByLabelText(/4 porții/i)).toBeTruthy();
  });

  test('increasing asks for one more serving', () => {
    const onChangeServings = jest.fn();
    const meal = buildMeal({ servings: 3 });
    render(
      <MealCard
        day={buildDay(meal)}
        meal={meal}
        onPressRecipe={jest.fn()}
        onSwapMeal={jest.fn()}
        onChangeServings={onChangeServings}
        isDark={false}
      />
    );
    fireEvent.press(screen.getByLabelText('Adaugă o porție'));
    expect(onChangeServings).toHaveBeenCalledWith(4);
  });

  test('decreasing asks for one less', () => {
    const onChangeServings = jest.fn();
    const meal = buildMeal({ servings: 3 });
    render(
      <MealCard
        day={buildDay(meal)}
        meal={meal}
        onPressRecipe={jest.fn()}
        onSwapMeal={jest.fn()}
        onChangeServings={onChangeServings}
        isDark={false}
      />
    );
    fireEvent.press(screen.getByLabelText('Scade o porție'));
    expect(onChangeServings).toHaveBeenCalledWith(2);
  });

  test('cannot go below a single serving', () => {
    const onChangeServings = jest.fn();
    const meal = buildMeal({ servings: 1 });
    render(
      <MealCard
        day={buildDay(meal)}
        meal={meal}
        onPressRecipe={jest.fn()}
        onSwapMeal={jest.fn()}
        onChangeServings={onChangeServings}
        isDark={false}
      />
    );
    fireEvent.press(screen.getByLabelText('Scade o porție'));
    expect(onChangeServings).not.toHaveBeenCalled();
  });

  test('falls back to a plain label when servings are not editable', () => {
    const meal = buildMeal({ servings: 2 });
    render(
      <MealCard
        day={buildDay(meal)}
        meal={meal}
        onPressRecipe={jest.fn()}
        onSwapMeal={jest.fn()}
        isDark={false}
      />
    );
    expect(screen.queryByLabelText('Adaugă o porție')).toBeNull();
  });
});

describe('MealCard variants', () => {
  const slots = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack'] as const;
  const tiers = ['basic', 'medium', 'premium'] as const;

  slots.forEach((slot) => {
    test(`renders a ${slot} card`, () => {
      const meal = buildMeal({ slot, slotLabelRo: slot });
      render(
        <MealCard
          day={buildDay(meal)}
          meal={meal}
          slotLabel={slot}
          onPressRecipe={jest.fn()}
          onSwapMeal={jest.fn()}
          isDark
        />
      );
      expect(screen.getByText(recipe.title)).toBeTruthy();
    });
  });

  tiers.forEach((tier) => {
    test(`renders a ${tier} tier card`, () => {
      const meal = buildMeal({ recipe: { ...recipe, tier } });
      render(
        <MealCard
          day={buildDay(meal)}
          meal={meal}
          onPressRecipe={jest.fn()}
          onSwapMeal={jest.fn()}
          isDark={false}
        />
      );
      expect(screen.getByText(recipe.title)).toBeTruthy();
    });
  });

  test('opens the recipe when the card is pressed', () => {
    const onPressRecipe = jest.fn();
    const meal = buildMeal();
    render(
      <MealCard
        day={buildDay(meal)}
        meal={meal}
        onPressRecipe={onPressRecipe}
        onSwapMeal={jest.fn()}
        isDark={false}
      />
    );
    fireEvent.press(screen.getByText(recipe.title));
    expect(onPressRecipe).toHaveBeenCalled();
  });

  test('offers removal only when the meal can be removed', () => {
    const onRemoveMeal = jest.fn();
    const meal = buildMeal({ slot: 'dessert' });
    render(
      <MealCard
        day={buildDay(meal)}
        meal={meal}
        onPressRecipe={jest.fn()}
        onSwapMeal={jest.fn()}
        onRemoveMeal={onRemoveMeal}
        isDark={false}
      />
    );
    expect(screen.getByText(recipe.title)).toBeTruthy();
  });

  test('falls back to the day when no explicit meal is given', () => {
    const meal = buildMeal();
    render(
      <MealCard
        day={buildDay(meal)}
        onPressRecipe={jest.fn()}
        onSwapMeal={jest.fn()}
        isDark={false}
      />
    );
    expect(screen.getByText(recipe.title)).toBeTruthy();
  });
});
