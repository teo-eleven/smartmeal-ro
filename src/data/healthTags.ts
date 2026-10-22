import { HealthGoalTag, Recipe } from '../types';
import { INGREDIENTS } from './ingredients';

export interface HealthGoalMeta {
  id: HealthGoalTag;
  labelRo: string;
  shortBadgeRo: string;
  icon: string;
  descriptionRo: string;
  benefitRo: string;
}

export const HEALTH_GOALS_CATALOG: HealthGoalMeta[] = [
  {
    id: 'anti_inflammatory',
    labelRo: 'Antiinflamator',
    shortBadgeRo: 'Antiinflamator',
    icon: '🩺',
    descriptionRo: 'Fără zahăr rafinat, bogat în omega-3, antioxidanți și ulei de măsline.',
    benefitRo: 'Reduce inflamația cronică, susține imunitatea și articulațiile.',
  },
  {
    id: 'pcos_friendly',
    labelRo: 'SOP (Ovare Polichistice)',
    shortBadgeRo: 'SOP / Hormonal',
    icon: '🌸',
    descriptionRo: 'Indice glicemic scăzut, proteine de calitate și echilibru hormonal.',
    benefitRo: 'Stabilizează insulina și previne fluctuațiile glicemice.',
  },
  {
    id: 'diabetic_friendly',
    labelRo: 'Diabet & Glicemie Stabilă',
    shortBadgeRo: 'IG Mic / Diabet',
    icon: '🩸',
    descriptionRo: 'Carbohidrați complecși, indice glicemic mic, eliberare treptată.',
    benefitRo: 'Previne vârfurile de zahăr în sânge și oferă energie constantă.',
  },
  {
    id: 'high_fiber',
    labelRo: 'Bogat în Fibre',
    shortBadgeRo: 'Bogat în fibre',
    icon: '🌾',
    descriptionRo: 'Legume proaspete, leguminoase, cereale integrale și semințe.',
    benefitRo: 'Digestie sănătoasă, microbiom echilibrat și sațietate crescută.',
  },
  {
    id: 'heart_healthy',
    labelRo: 'Sănătos pentru Inimă',
    shortBadgeRo: 'Cardio-Protector',
    icon: '🫀',
    descriptionRo: 'Sărac în grăsimi saturate și sodiu, bogat în grăsimi monosaturate.',
    benefitRo: 'Protecție cardiovasculară și susținerea tensiunii arteriale optime.',
  },
  {
    id: 'pork_free',
    labelRo: 'Fără carne de porc (Halal)',
    shortBadgeRo: 'Fără porc',
    icon: '🥩',
    descriptionRo: 'Exclude complet carnea de porc, mezelurile și untura din meniu.',
    benefitRo: 'Rețete exclusive cu pui, curcan, vită, pește sau 100% vegetale.',
  },
];

const HEALTH_GOALS_MAP = new Map<HealthGoalTag, HealthGoalMeta>(
  HEALTH_GOALS_CATALOG.map((g) => [g.id, g])
);

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
    tags.delete('pork_free');
  } else {
    tags.add('pork_free');
  }

  return Array.from(tags);
}
