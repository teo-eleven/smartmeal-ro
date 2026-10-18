import { HealthGoalTag, Recipe } from '../types';

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

const PORK_INGREDIENT_INDICATORS = [
  'porc',
  'bacon',
  'carnati',
  'carnat',
  'costita',
  'slana',
  'sunca_taraneasca',
];

/**
 * Checks if a recipe contains any pork products.
 */
export function recipeContainsPork(recipe: Recipe): boolean {
  if (recipe.id.toLowerCase().includes('porc') || recipe.title.toLowerCase().includes('porc')) {
    return true;
  }
  return recipe.ingredients.some((ing) => {
    const id = ing.ingredientId.toLowerCase();
    return PORK_INGREDIENT_INDICATORS.some((indicator) => id.includes(indicator));
  });
}

/**
 * Derives appropriate health tags for a recipe based on its explicit tags and ingredients.
 */
export function getRecipeHealthTags(recipe: Recipe): HealthGoalTag[] {
  const tags = new Set<HealthGoalTag>(recipe.healthTags || []);

  // If the recipe contains no pork, it is inherently pork_free
  if (!recipeContainsPork(recipe)) {
    tags.add('pork_free');
  }

  return Array.from(tags);
}
