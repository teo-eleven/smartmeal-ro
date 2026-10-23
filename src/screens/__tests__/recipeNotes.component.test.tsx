import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RecipeDetailModal } from '../RecipeDetailModal';
import { useAppStore } from '../../store/useAppStore';
import { RECIPES } from '../../data/recipes';
import { Recipe } from '../../types';

const NOTES_LABEL = 'Notițele tale pentru această rețetă';
const [first, second] = RECIPES;

function modal(recipe: Recipe) {
  return (
    <RecipeDetailModal
      visible
      recipe={recipe}
      servings={2}
      onClose={jest.fn()}
      onSwap={jest.fn()}
      isDark={false}
    />
  );
}

beforeEach(() => useAppStore.setState({ recipeNotes: {}, currentPlan: null }));

describe('notițele din fișa rețetei', () => {
  test('ce scrii se păstrează pentru rețeta respectivă', () => {
    render(modal(first));

    fireEvent.changeText(screen.getByLabelText(NOTES_LABEL), 'la 200°C iese perfect');

    expect(useAppStore.getState().recipeNotes[first.id]).toBe('la 200°C iese perfect');
  });

  test('redeschisă, fișa arată notița scrisă data trecută', () => {
    useAppStore.setState({ recipeNotes: { [first.id]: 'mai mult usturoi' } });

    render(modal(first));

    expect(screen.getByLabelText(NOTES_LABEL).props.value).toBe('mai mult usturoi');
  });

  test('notița unei rețete nu apare la alta', () => {
    useAppStore.setState({ recipeNotes: { [first.id]: 'mai mult usturoi' } });
    const { rerender } = render(modal(first));

    rerender(modal(second));

    expect(screen.getByLabelText(NOTES_LABEL).props.value).toBe('');
  });
});

describe('butonul de preferat', () => {
  test('spune clar când rețeta e deja preferată', () => {
    useAppStore.setState((state) => ({
      preferences: { ...state.preferences, favouriteRecipeIds: [first.id] },
    }));

    render(modal(first));

    expect(screen.getByText(/Preferat ✓/)).toBeTruthy();
  });

  test('nepreferată, invită la „Îmi place”', () => {
    useAppStore.setState((state) => ({
      preferences: { ...state.preferences, favouriteRecipeIds: [] },
    }));

    render(modal(first));

    expect(screen.getByText(/Îmi place/)).toBeTruthy();
    expect(screen.queryByText(/Preferat ✓/)).toBeNull();
  });
});
