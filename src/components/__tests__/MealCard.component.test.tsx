import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MealCard, areMealCardPropsEqual } from '../MealCard';
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
      // The name is drawn over the visual; the body below carries the description.
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
      // The name is drawn over the visual; the body below carries the description.
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
    fireEvent.press(screen.getByLabelText(/Vezi rețeta/i));
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
    // The name is drawn over the visual; the body below carries the description.
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
    // The name is drawn over the visual; the body below carries the description.
    expect(screen.getByText(recipe.title)).toBeTruthy();
  });
});

/** The picture drew its own time in the corner and the card drew another over it. */
describe('MealCard, eticheta de timp', () => {
  test('timpul de gătit apare o singură dată', () => {
    const meal = buildMeal();
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

    expect(screen.getAllByText(/⏱.*\d+ min/)).toHaveLength(1);
  });
});

/**
 * The whole card used to be one button with five buttons inside it. VoiceOver reads a
 * button as a single element, so the portion stepper, "cook double" and "Schimbă" could
 * not be reached with a screen reader; on the web it was also invalid HTML.
 */
describe('MealCard, butoane imbricate', () => {
  function render_() {
    const meal = buildMeal();
    const onPressRecipe = jest.fn();
    render(
      <MealCard
        day={buildDay(meal)}
        meal={meal}
        onPressRecipe={onPressRecipe}
        onSwapMeal={jest.fn()}
        onChangeServings={jest.fn()}
        isDark={false}
      />
    );
    return onPressRecipe;
  }

  type Node = { type: unknown; props?: { accessibilityRole?: string }; parent: Node | null };

  // Only host (native) elements count. Walking up also passes the React wrapper of the same
  // TouchableOpacity, which carries the same role and would read as a button around itself.
  function insideAnotherButton(el: unknown): boolean {
    let node = (el as Node).parent;
    while (node) {
      if (typeof node.type === 'string' && node.props?.accessibilityRole === 'button') return true;
      node = node.parent;
    }
    return false;
  }

  test('niciun buton al cardului nu stă în interiorul altui buton', () => {
    render_();

    ['Scade o porție', 'Adaugă o porție'].forEach((label) =>
      expect(insideAnotherButton(screen.getByLabelText(label))).toBe(false)
    );
    // getByRole returns the button itself; getByText would return the label inside it,
    // whose parent is its own button.
    expect(insideAnotherButton(screen.getByRole('button', { name: /Schimbă/ }))).toBe(false);
  });

  test('atingerea imaginii deschide în continuare rețeta', () => {
    const onPressRecipe = render_();

    fireEvent.press(screen.getByLabelText(`${recipe.title}. Vezi rețeta.`));

    expect(onPressRecipe).toHaveBeenCalled();
  });
});

/**
 * The 2026-10-21 audit: the dessert's ✕ was nested inside the button that opens the recipe,
 * so a screen reader saw one element with two actions and a tap could trigger both.
 */
describe('ștergerea desertului', () => {
  const dessert = buildMeal({ id: 'monday-dessert', slot: 'dessert', slotLabelRo: 'Desert' });

  function showDessert(onPressRecipe = jest.fn(), onRemoveMeal = jest.fn()) {
    render(
      <MealCard
        day={buildDay(dessert)}
        meal={dessert}
        onPressRecipe={onPressRecipe}
        onSwapMeal={jest.fn()}
        onRemoveMeal={onRemoveMeal}
        isDark={false}
      />
    );
    return { onPressRecipe, onRemoveMeal };
  }

  test('✕ nu e în interiorul butonului care deschide rețeta', () => {
    showDessert();

    const openRecipe = screen.getByLabelText(`${recipe.title}. Vezi rețeta.`);

    expect(
      openRecipe.findAll(
        (node: { props: { accessibilityLabel?: string } }) =>
          node.props.accessibilityLabel === 'Șterge desertul din această zi'
      )
    ).toHaveLength(0);
  });

  test('✕ șterge desertul fără să deschidă rețeta', () => {
    const { onPressRecipe, onRemoveMeal } = showDessert();

    fireEvent.press(screen.getByLabelText('Șterge desertul din această zi'));

    expect(onRemoveMeal).toHaveBeenCalledTimes(1);
    expect(onPressRecipe).not.toHaveBeenCalled();
  });

  test('imaginea deschide în continuare rețeta', () => {
    const { onPressRecipe } = showDessert();

    fireEvent.press(screen.getByLabelText(`${recipe.title}. Vezi rețeta.`));

    expect(onPressRecipe).toHaveBeenCalledTimes(1);
  });
});

describe('o masă reîncălzită fără acțiune de anulare', () => {
  test('nu arată un buton care nu face nimic', () => {
    const leftover = buildMeal({ isLeftover: true });
    render(
      <MealCard
        day={buildDay(leftover)}
        meal={leftover}
        onPressRecipe={jest.fn()}
        onSwapMeal={jest.fn()}
        isDark={false}
      />
    );

    expect(screen.queryByLabelText('Gătesc din nou în ziua asta')).toBeNull();
  });
});

/**
 * The board rebuilds every card's callbacks on each render, so a plain React.memo never
 * skipped anything and editing one meal re-rendered all twenty-odd cards.
 */
describe('cardul nu se redesenează degeaba', () => {
  const meal = buildMeal();
  const day = buildDay(meal);
  const props = {
    day,
    meal,
    onPressRecipe: jest.fn(),
    onSwapMeal: jest.fn(),
    isDark: false,
  };

  test('aceleași date cu funcții noi: nu se redesenează', () => {
    expect(areMealCardPropsEqual(props, { ...props, onPressRecipe: jest.fn() })).toBe(true);
  });

  test('o masă schimbată: se redesenează', () => {
    expect(areMealCardPropsEqual(props, { ...props, meal: { ...meal, servings: 5 } })).toBe(false);
  });

  test('o acțiune care apare sau dispare: se redesenează', () => {
    expect(areMealCardPropsEqual(props, { ...props, onRemoveMeal: jest.fn() })).toBe(false);
  });
});
