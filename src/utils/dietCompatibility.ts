import { DietType, Recipe } from '../types';
import { getIngredientAllergens } from '../data/allergens';

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

export const BASE_DIETS: DietType[] = ['omnivore', 'vegetarian', 'vegan', 'pescatarian'];
export const MODIFIER_DIETS: DietType[] = ['gluten_free', 'keto'];

export function isBaseDiet(diet: DietType): boolean {
  return BASE_DIETS.includes(diet);
}

export function isModifierDiet(diet: DietType): boolean {
  return MODIFIER_DIETS.includes(diet);
}

/**
 * Compatibility matrix for combining up to 2 dietary preferences.
 *
 * Listed once per pair. Both lookups below compare in either direction, so adding the mirror
 * image adds nothing and risks a future entry being added in only one of the two places.
 */
const INCOMPATIBLE_PAIRS: [DietType, DietType][] = [
  ['omnivore', 'vegetarian'],
  ['omnivore', 'vegan'],
  ['omnivore', 'pescatarian'],
  ['vegan', 'vegetarian'],
  ['vegan', 'pescatarian'],
  ['vegan', 'keto'],
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


/** A keto serving stays at or under this many grams of carbohydrate. */
export const KETO_MAX_CARBS_PER_SERVING = 20;

/**
 * Ingredients a keto plan never contains, whatever the amount: grains, flour and bread,
 * sugar and honey, starchy vegetables, legumes and sweet fruit. Exact ids, never fragments,
 * because the fragment list ('cartofi', 'orez'...) let flour, bread, oats, beans and sugar
 * straight through.
 */
export const KETO_EXCLUDED_INGREDIENT_IDS: ReadonlySet<string> = new Set([
  // Grains, flour, bread
  'faina_alba',
  'faina_grau',
  'pesmet_auriu',
  'paine_toast',
  'chifle_burger',
  'lipii_tortilla',
  'tortilla_chips_nachos',
  'biscuiti_populari',
  'fulgi_ovaz',
  'lapte_vegetal_ovaz',
  'bors_proaspat',
  'malai_superior',
  'orez_basmati',
  'orez_bob_rotund',
  'orez_arborio',
  'paste_penne',
  'paste_spaghete',
  'quinoa_alba',
  'porumb_dulce',
  'porumb_popcorn',
  // Sugar and sweets
  'zahar_tos',
  'miere_poliflora',
  'gem_fructe',
  'ciocolata_menaj',
  'ciocolata_neagra_vegana',
  // Starchy vegetables and legumes
  'cartofi_albi',
  'fasole_rosie_conserva',
  'fasole_boabe_conserva',
  'naut_conserva',
  'linte_verde_uscata',
  'mazare_congelata',
  // Sweet fruit
  'banane',
  'mere_romanesti',
]);

/** Both rules must hold: a low-carb total can still hide a slice of bread. */
export function isKetoCompatible(recipe: Recipe): boolean {
  if (recipe.nutritionPerServing.carbsGrams > KETO_MAX_CARBS_PER_SERVING) return false;
  return !recipe.ingredients.some((ing) => KETO_EXCLUDED_INGREDIENT_IDS.has(ing.ingredientId));
}

/**
 * Checks whether a recipe matches the user's combined dietary preferences (1 or 2 selected).
 */
/**
 * Whether a recipe may be served to someone on these diets.
 *
 * The switch below has a `default: return false`, and that default is the point: the chain of
 * `if`s it replaced fell through to `return true` for any diet it did not recognise. Adding a
 * diet to `DietType` without adding a branch here silently served everything, and so did a
 * corrupted value that reached this far.
 */
export function isRecipeMatchingDiets(recipe: Recipe, selectedDiets: DietType[]): boolean {
  if (!selectedDiets || selectedDiets.length === 0) return true;

  for (const diet of selectedDiets) {
    switch (diet) {
      case 'omnivore':
        break; // Accepts everything.

      case 'vegan':
        if (recipe.dietType !== 'vegan') return false;
        break;

      case 'vegetarian':
        if (recipe.dietType !== 'vegetarian' && recipe.dietType !== 'vegan') return false;
        break;

      case 'pescatarian':
        if (
          recipe.dietType !== 'pescatarian' &&
          recipe.dietType !== 'vegetarian' &&
          recipe.dietType !== 'vegan'
        ) {
          return false;
        }
        break;

      case 'gluten_free': {
        // Single source of truth with the allergen filter. A second, hand-written ingredient
        // list drifted from this one and missed oats, soy sauce and borscht, so a user who
        // chose the diet without also ticking the allergen was served gluten.
        const hasGluten = recipe.ingredients.some((ing) =>
          getIngredientAllergens(ing.ingredientId).includes('gluten')
        );
        if (hasGluten) return false;
        break;
      }

      case 'keto':
        if (!isKetoCompatible(recipe)) return false;
        break;

      default:
        // A diet nobody wrote a rule for permits nothing, rather than everything.
        return false;
    }
  }

  return true;
}

