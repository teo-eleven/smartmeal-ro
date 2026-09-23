import { Recipe } from '../types';
import { INGREDIENTS } from '../data/ingredients';
import { BACKGROUND_INGREDIENT_IDS, getIngredientIcon } from '../data/ingredientIcons';

/**
 * The kind of dish a recipe is, inferred from what it contains and when it is eaten.
 * Only used to pick a colour, so a near miss costs nothing.
 */
export type DishArchetype =
  | 'soup'
  | 'stew'
  | 'pasta'
  | 'grill'
  | 'roast'
  | 'salad'
  | 'breakfast'
  | 'dessert'
  | 'snack'
  | 'seafood'
  | 'wrap'
  | 'rice';

export interface ArchetypePalette {
  /** Two stops of a gradient, dark theme first. */
  darkColors: [string, string];
  lightColors: [string, string];
  labelRo: string;
}

const PALETTES: Record<DishArchetype, ArchetypePalette> = {
  soup: {
    darkColors: ['#7c2d12', '#431407'],
    lightColors: ['#fb923c', '#c2410c'],
    labelRo: 'Ciorbă & Supă',
  },
  stew: {
    darkColors: ['#7f1d1d', '#450a0a'],
    lightColors: ['#ef7c5c', '#b91c1c'],
    labelRo: 'Mâncare gătită',
  },
  pasta: {
    darkColors: ['#78350f', '#451a03'],
    lightColors: ['#fbbf24', '#b45309'],
    labelRo: 'Paste',
  },
  grill: {
    darkColors: ['#3f2416', '#1c1917'],
    lightColors: ['#a16207', '#57534e'],
    labelRo: 'Grătar',
  },
  roast: {
    darkColors: ['#713f12', '#3f2d0a'],
    lightColors: ['#eab308', '#a16207'],
    labelRo: 'La cuptor',
  },
  salad: {
    darkColors: ['#14532d', '#052e16'],
    lightColors: ['#4ade80', '#15803d'],
    labelRo: 'Salată',
  },
  breakfast: {
    darkColors: ['#854d0e', '#422006'],
    lightColors: ['#fcd34d', '#d97706'],
    labelRo: 'Mic dejun',
  },
  dessert: {
    darkColors: ['#701a45', '#4a044e'],
    lightColors: ['#f472b6', '#a21caf'],
    labelRo: 'Desert',
  },
  snack: {
    darkColors: ['#3730a3', '#1e1b4b'],
    lightColors: ['#818cf8', '#4338ca'],
    labelRo: 'Gustare',
  },
  seafood: {
    darkColors: ['#164e63', '#083344'],
    lightColors: ['#38bdf8', '#0369a1'],
    labelRo: 'Pește & Fructe de mare',
  },
  wrap: {
    darkColors: ['#7c2d12', '#292524'],
    lightColors: ['#fb923c', '#78350f'],
    labelRo: 'Wrap & Sandwich',
  },
  rice: {
    darkColors: ['#1e3a5f', '#0f172a'],
    lightColors: ['#60a5fa', '#1d4ed8'],
    labelRo: 'Orez & Bowl',
  },
};

function hasAny(ids: string[], fragments: string[]): boolean {
  return ids.some((id) => fragments.some((fragment) => id.includes(fragment)));
}

/** Romanian dish names are unambiguous where tags are sometimes incomplete. */
function titleSays(recipe: Recipe, words: string[]): boolean {
  const title = recipe.title.toLowerCase();
  return words.some((word) => title.includes(word));
}

/**
 * Picks the archetype from the recipe's own content. Order matters: the earliest match
 * wins, so the most telling signals are checked first.
 */
export function getRecipeArchetype(recipe: Recipe): DishArchetype {
  const ids = recipe.ingredients.map((item) => item.ingredientId);
  const slots = recipe.suitableSlots ?? [];
  const tags = recipe.moodTags;

  // A sweet dish eaten at breakfast is breakfast. Only treat sweetness as dessert when the
  // recipe is not also offered as a proper meal.
  const isMainMealSlot =
    slots.includes('breakfast') || slots.includes('lunch') || slots.includes('dinner');
  if (slots.includes('dessert') || (tags.includes('sweet_treat') && !isMainMealSlot)) {
    return 'dessert';
  }
  if (
    tags.includes('soups_stews') ||
    hasAny(ids, ['bors_proaspat']) ||
    titleSays(recipe, ['ciorbă', 'ciorba', 'supă', 'supa'])
  ) {
    return 'soup';
  }
  if (tags.includes('pasta_italian') || hasAny(ids, ['paste_', 'spaghete'])) return 'pasta';
  if (hasAny(ids, ['somon', 'ton_conserva', 'dorada', 'creveti'])) return 'seafood';
  if (slots.includes('breakfast')) return 'breakfast';
  if (slots.includes('snack') && !slots.includes('lunch') && !slots.includes('dinner')) {
    return 'snack';
  }
  if (tags.includes('fresh_salad') || titleSays(recipe, ['salată', 'salata'])) return 'salad';
  if (hasAny(ids, ['lipii_tortilla', 'chifle_burger', 'paine_toast'])) return 'wrap';
  if (tags.includes('grill_meat') || titleSays(recipe, ['grătar', 'gratar'])) return 'grill';
  if (hasAny(ids, ['orez_'])) return 'rice';
  if (recipe.appliances.includes('oven') || recipe.appliances.includes('air_fryer')) {
    return 'roast';
  }
  return 'stew';
}

export function getArchetypePalette(archetype: DishArchetype): ArchetypePalette {
  return PALETTES[archetype];
}

/**
 * The pictograms shown on a recipe card: the ingredients that actually characterise the
 * dish, with salt, oil and flour left out because they describe nothing.
 */
function getCharacterfulIngredientIds(recipe: Recipe): string[] {
  const meaningful = recipe.ingredients
    .map((item) => item.ingredientId)
    .filter((id) => !BACKGROUND_INGREDIENT_IDS.has(id));
  return meaningful.length > 0 ? meaningful : recipe.ingredients.map((i) => i.ingredientId);
}

export function getRecipeIcons(recipe: Recipe, max: number = 3): string[] {
  const source = getCharacterfulIngredientIds(recipe);

  const icons: string[] = [];
  for (const id of source) {
    const icon = getIngredientIcon(id);
    if (!icons.includes(icon)) icons.push(icon);
    if (icons.length === max) break;
  }
  return icons;
}

/**
 * Words that describe how a product sits on the shelf rather than what it is.
 * Only ever stripped from the end of a name, whole words at a time: matching inside a word
 * mangles Romanian diacritics, because JavaScript word boundaries are ASCII-only.
 */
const SHELF_DETAIL_WORDS = new Set([
  'la',
  'cu',
  'conservă',
  'cutie',
  'congelat',
  'congelată',
  'congelate',
  'proaspăt',
  'proaspătă',
  'proaspete',
  'uscat',
  'uscată',
  'uscate',
  'măcinat',
  'măcinată',
  'ras',
  'rasă',
  'rase',
  'fin',
  'fini',
  'fine',
  'superior',
  'superioară',
  'clasic',
  'clasică',
  'natural',
  'naturală',
  'grăsime',
  'feliat',
  'feliată',
  'feliate',
  'parfumat',
  'parfumată',
  'grisat',
  'grisată',
  'extravirgin',
  'fermentată',
  'verde',
  'mărimea',
  'dur',
  'rotund',
]);

/**
 * These introduce shelf detail ("Orez CU bob rotund", "Ciocolată amăruie PENTRU desert"), so
 * the name is cut before them. "de" is kept: "Piept de pui" needs it to mean anything.
 */
const DETAIL_INTRODUCERS = new Set(['cu', 'din', 'pentru', 'la']);

const MAX_LABEL_WORDS = 3;

/**
 * Catalog names carry shelf detail ("Pastă de tomate concentrată 28%") that does not fit a
 * chip and adds nothing at a glance. This keeps the part a cook would say out loud.
 */
export function shortenIngredientName(fullName: string): string {
  const allWords = fullName
    .split(',')[0]
    .split('/')[0]
    .split('(')[0]
    .split(/\s+/)
    .filter((word) => word.length > 0)
    // Percentages and weights say nothing about the dish.
    .filter((word) => !/^\d+([.,]\d+)?%?$/.test(word) && !/%$/.test(word));

  const introducerAt = allWords.findIndex((word) => DETAIL_INTRODUCERS.has(word.toLowerCase()));
  const words = introducerAt > 0 ? allWords.slice(0, introducerAt) : [...allWords];

  // Size codes such as the "M" in "Ouă proaspete mărimea M" trail the real name.
  while (
    words.length > 1 &&
    (SHELF_DETAIL_WORDS.has(words[words.length - 1].toLowerCase()) ||
      words[words.length - 1].length <= 1)
  ) {
    words.pop();
  }

  const kept = words.slice(0, MAX_LABEL_WORDS);

  // Never end on a connector such as "de".
  while (
    kept.length > 1 &&
    ['de', 'la', 'cu', 'din', 'pentru'].includes(kept[kept.length - 1].toLowerCase())
  ) {
    kept.pop();
  }

  return kept.join(' ');
}

/**
 * The ingredient names printed under the pictograms, matching them one for one.
 */
export function getRecipeHighlights(recipe: Recipe, max: number = 3): string[] {
  const source = getCharacterfulIngredientIds(recipe);

  const seenIcons: string[] = [];
  const names: string[] = [];
  for (const id of source) {
    const icon = getIngredientIcon(id);
    if (seenIcons.includes(icon)) continue;
    seenIcons.push(icon);
    names.push(shortenIngredientName(INGREDIENTS[id]?.name ?? id));
    if (names.length === max) break;
  }
  return names;
}

export function getTotalMinutes(recipe: Recipe): number {
  return recipe.prepTimeMinutes + recipe.cookTimeMinutes;
}
