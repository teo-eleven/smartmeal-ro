import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RecipeDetailModal } from '../RecipeDetailModal';
import { RECIPES } from '../../data/recipes';

const recipe = RECIPES[0];

describe('RecipeDetailModal servings stepper and cascade', () => {
  test('renders initial servings and scales ingredients', () => {
    const onChangeServings = jest.fn();
    render(
      <RecipeDetailModal
        visible={true}
        recipe={recipe}
        servings={2}
        onClose={jest.fn()}
        onSwap={jest.fn()}
        onChangeServings={onChangeServings}
        isDark={false}
      />
    );

    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getAllByText(/2 porții/i).length).toBeGreaterThanOrEqual(1);
  });

  test('clicking + in RecipeDetailModal calls onChangeServings and updates active count', () => {
    const onChangeServings = jest.fn();
    render(
      <RecipeDetailModal
        visible={true}
        recipe={recipe}
        servings={2}
        onClose={jest.fn()}
        onSwap={jest.fn()}
        onChangeServings={onChangeServings}
        isDark={false}
      />
    );

    fireEvent.press(screen.getByLabelText('Adaugă o porție'));

    expect(onChangeServings).toHaveBeenCalledWith(3);
    expect(screen.getByText('3')).toBeTruthy();
  });

  test('clicking - in RecipeDetailModal calls onChangeServings and decreases count', () => {
    const onChangeServings = jest.fn();
    render(
      <RecipeDetailModal
        visible={true}
        recipe={recipe}
        servings={3}
        onClose={jest.fn()}
        onSwap={jest.fn()}
        onChangeServings={onChangeServings}
        isDark={false}
      />
    );

    fireEvent.press(screen.getByLabelText('Scade o porție'));

    expect(onChangeServings).toHaveBeenCalledWith(2);
    expect(screen.getByText('2')).toBeTruthy();
  });
});
