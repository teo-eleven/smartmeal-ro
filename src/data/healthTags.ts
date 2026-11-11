import { HealthGoalTag, Recipe } from '../types';
import { INGREDIENTS } from './ingredients';

export interface HealthGoalMeta {
  id: HealthGoalTag;
  /**
   * What is on the plate, never what it does to the body: no "prevents", "reduces" or disease
   * names here (EU Regulation 1924/2006; src/data/__tests__/healthClaims.test.ts). The keys
   * stay as they were, so goals already saved keep working.
   */
  labelRo: string;
  shortBadgeRo: string;
  icon: string;
  descriptionRo: string;
  /**
   * The condition the goal suits, as information only, and that it does not replace a doctor.
   * Absent for choices that are not about health (pork-free).
   */
  conditionInfoRo?: string;
}

export const HEALTH_GOALS_CATALOG: HealthGoalMeta[] = [
  {
    id: 'anti_inflammatory',
    labelRo: 'Stil mediteranean',
    shortBadgeRo: 'Mediteranean',
    icon: '🫒',
    descriptionRo: 'Pește, legume, leguminoase, nuci și ulei de măsline; fără zahăr rafinat.',
    conditionInfoRo:
      'Relevant dacă ai o afecțiune inflamatorie, de exemplu artrită. Nu înlocuiește medicul.',
  },
  {
    id: 'pcos_friendly',
    labelRo: 'Echilibrat',
    shortBadgeRo: 'Echilibrat',
    icon: '⚖️',
    descriptionRo:
      'Proteine la fiecare masă, carbohidrați din cereale integrale și grăsimi din pește, nuci, avocado.',
    conditionInfoRo:
      'Relevant dacă ai sindromul ovarelor polichistice (SOP). Nu înlocuiește medicul.',
  },
  {
    id: 'diabetic_friendly',
    labelRo: 'Atent la zaharuri',
    shortBadgeRo: 'Puține zaharuri',
    icon: '🥣',
    descriptionRo: 'Fără zahăr adăugat, carbohidrați din cereale integrale și leguminoase.',
    conditionInfoRo: 'Relevant dacă ai diabet sau prediabet. Nu înlocuiește medicul.',
  },
  {
    id: 'high_fiber',
    labelRo: 'Bogat în fibre',
    shortBadgeRo: 'Bogat în fibre',
    icon: '🌾',
    descriptionRo: 'Legume, leguminoase, cereale integrale și semințe la fiecare masă.',
    conditionInfoRo:
      'Relevant dacă medicul ți-a recomandat mai multe fibre. Nu înlocuiește medicul.',
  },
  {
    id: 'heart_healthy',
    labelRo: 'Grăsimi bune, puțină sare',
    shortBadgeRo: 'Puțină sare',
    icon: '🐟',
    descriptionRo: 'Pește, ulei de măsline și nuci în locul grăsimilor saturate; sare puțină.',
    conditionInfoRo:
      'Relevant dacă ai tensiunea mare sau colesterolul mărit. Nu înlocuiește medicul.',
  },
  {
    id: 'pork_free',
    labelRo: 'Fără carne de porc (Halal)',
    shortBadgeRo: 'Fără porc',
    icon: '🥩',
    descriptionRo: 'Exclude complet carnea de porc, mezelurile și untura din meniu.',
  },
];

const HEALTH_GOALS_MAP = new Map<HealthGoalTag, HealthGoalMeta>(
  HEALTH_GOALS_CATALOG.map((g) => [g.id, g])
);

/**
 * Pork-free is a religious or personal choice, not a health one: never asked about, never
 * blocked by the safety answer. The single place that says so.
 */
export const PORK_FREE_TAG: HealthGoalTag = 'pork_free';

/** True for every goal except pork-free. */
export function isHealthGoal(tag: HealthGoalTag): boolean {
  return tag !== PORK_FREE_TAG;
}

export function getHealthGoalMeta(id: HealthGoalTag): HealthGoalMeta | undefined {
  return HEALTH_GOALS_MAP.get(id);
}

/**
 * Whether a recipe contains pork, decided only by the `containsPork` flag on its ingredients.
 *
 * This used to match id fragments ('porc', 'carnat', 'sunca_taraneasca'...), which missed
 * `sunca_praga`, `carnaciori_oltenesti` ("carnat" is not a substring of "carnaciori") and
 * the pork-beef mince, so nine pork recipes reached users who chose "Fără porc".
 */
export function recipeContainsPork(recipe: Pick<Recipe, 'ingredients'>): boolean {
  return recipe.ingredients.some((ing) => INGREDIENTS[ing.ingredientId]?.containsPork === true);
}

/**
 * Derives appropriate health tags for a recipe based on its explicit tags and ingredients.
 */
export function getRecipeHealthTags(
  recipe: Pick<Recipe, 'healthTags' | 'ingredients'>
): HealthGoalTag[] {
  const tags = new Set<HealthGoalTag>(recipe.healthTags || []);

  // Derived, never trusted from the data: a hand-written 'pork_free' on a recipe with pork
  // must not survive, and a recipe without pork is pork-free whether or not anyone said so.
  if (recipeContainsPork(recipe)) {
    tags.delete(PORK_FREE_TAG);
  } else {
    tags.add(PORK_FREE_TAG);
  }

  return Array.from(tags);
}
