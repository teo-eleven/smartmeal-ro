import { DietType, Recipe } from '../types';

export interface DietOptionInfo {
  id: DietType;
  label: string;
  icon: string;
  desc: string;
  badge: string;
}

export const DIET_OPTIONS_CATALOG: DietOptionInfo[] = [
  {
    id: 'omnivore',
    label: 'Fără restricții (Omnivor)',
    icon: '🍖',
    desc: 'Carne, pește, legume, lactate și ouă fără limitări.',
    badge: 'Flexibil',
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    icon: '🥕',
    desc: 'Fără carne sau pește. Include lactate și ouă proaspete.',
    badge: 'Fără carne',
  },
  {
    id: 'vegan',
    label: 'Vegan / De post',
    icon: '🌱',
    desc: '100% ingrediente pe bază de plante. Fără lactate, ouă sau carne.',
    badge: '100% Plante',
  },
  {
    id: 'pescatarian',
    label: 'Pescatarian',
    icon: '🐟',
    desc: 'Pește proaspăt, fructe de mare, lactate, ouă și legume.',
    badge: 'Pește & Fructe de mare',
  },
  {
    id: 'gluten_free',
    label: 'Fără Gluten',
    icon: '🌾🚫',
    desc: 'Exclude făina de grâu, orz sau secară. Ideal pentru sensibilitate.',
    badge: 'Gluten-Free',
  },
  {
    id: 'keto',
    label: 'Low-Carb / Keto',
    icon: '🥑',
    desc: 'Sărac în carbohidrați, bogat în proteine calitative și grăsimi sănătoase.',
    badge: 'Low-Carb',
  },
];

/**
 * Compatibility matrix for combining up to 2 dietary preferences.
 */
const INCOMPATIBLE_PAIRS: [DietType, DietType][] = [
  ['omnivore', 'vegetarian'],
  ['omnivore', 'vegan'],
  ['omnivore', 'pescatarian'],
  ['vegan', 'omnivore'],
  ['vegan', 'vegetarian'],
  ['vegan', 'pescatarian'],
  ['vegan', 'keto'],
  ['vegetarian', 'omnivore'],
  ['vegetarian', 'vegan'],
  ['pescatarian', 'omnivore'],
  ['pescatarian', 'vegan'],
  ['keto', 'vegan'],
];

export function areDietsCompatible(dietA: DietType, dietB: DietType): boolean {
  if (dietA === dietB) return true;
  return !INCOMPATIBLE_PAIRS.some(
    ([a, b]) => (a === dietA && b === dietB) || (a === dietB && b === dietA)
  );
}

export function getIncompatibleDietsFor(selectedDiets: DietType[]): Set<DietType> {
  const incompatible = new Set<DietType>();
  if (selectedDiets.length === 0) return incompatible;

  for (const selected of selectedDiets) {
    for (const [a, b] of INCOMPATIBLE_PAIRS) {
      if (a === selected) incompatible.add(b);
      if (b === selected) incompatible.add(a);
    }
  }

  return incompatible;
}

/**
 * Ingredient id fragments that mean wheat, barley or rye.
 *
 * This list is a safety filter, not a convenience: a gluten-intolerant user served a dish
 * with breadcrumbs gets ill. Any new wheat-based ingredient must be added here.
 */
const GLUTEN_INGREDIENT_MARKERS = [
  'faina_alba',
  'faina_grau',
  'pesmet',
  'paste',
  'spaghete',
  'paine',
  'chifle',
  'biscuiti',
  'lipii_tortilla',
];

/**
 * Checks whether a recipe matches the user's combined dietary preferences (1 or 2 selected).
 */
export function isRecipeMatchingDiets(recipe: Recipe, selectedDiets: DietType[]): boolean {
  if (!selectedDiets || selectedDiets.length === 0) return true;

  for (const diet of selectedDiets) {
    if (diet === 'omnivore') {
      continue; // Omnivore accepts all recipes
    }

    if (diet === 'vegan') {
      if (recipe.dietType !== 'vegan') return false;
    }

    if (diet === 'vegetarian') {
      if (recipe.dietType !== 'vegetarian' && recipe.dietType !== 'vegan') return false;
    }

    if (diet === 'pescatarian') {
      if (
        recipe.dietType !== 'pescatarian' &&
        recipe.dietType !== 'vegetarian' &&
        recipe.dietType !== 'vegan'
      ) {
        return false;
      }
    }

    if (diet === 'gluten_free') {
      const hasGluten = recipe.ingredients.some((ing) =>
        GLUTEN_INGREDIENT_MARKERS.some((marker) => ing.ingredientId.includes(marker))
      );
      if (hasGluten) return false;
    }

    if (diet === 'keto') {
      // Exclude high-carb recipes (potatoes, rice, cornmeal/mălai, pasta)
      const hasHighCarbs = recipe.ingredients.some(
        (ing) =>
          ing.ingredientId.includes('cartofi') ||
          ing.ingredientId.includes('orez') ||
          ing.ingredientId.includes('malai') ||
          ing.ingredientId.includes('paste') ||
          ing.ingredientId.includes('spaghete')
      );
      if (hasHighCarbs) return false;
    }
  }

  return true;
}
