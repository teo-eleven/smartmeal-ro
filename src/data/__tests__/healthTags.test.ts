import {
  HEALTH_GOALS_CATALOG,
  getHealthGoalMeta,
  getRecipeHealthTags,
  recipeContainsPork,
} from '../healthTags';
import { RECIPES } from '../recipes';

describe('Health Goals Catalog & Tags', () => {
  it('defines 6 health & wellness goals with Romanian localization', () => {
    expect(HEALTH_GOALS_CATALOG.length).toBe(6);
    const ids = HEALTH_GOALS_CATALOG.map((g) => g.id);
    expect(ids).toContain('anti_inflammatory');
    expect(ids).toContain('pcos_friendly');
    expect(ids).toContain('diabetic_friendly');
    expect(ids).toContain('high_fiber');
    expect(ids).toContain('heart_healthy');
    expect(ids).toContain('pork_free');

    HEALTH_GOALS_CATALOG.forEach((goal) => {
      expect(goal.labelRo).toBeTruthy();
      expect(goal.shortBadgeRo).toBeTruthy();
      expect(goal.icon).toBeTruthy();
      expect(goal.descriptionRo).toBeTruthy();
      expect(goal.benefitRo).toBeTruthy();
    });
  });

  it('retrieves health goal metadata by ID', () => {
    const meta = getHealthGoalMeta('anti_inflammatory');
    expect(meta).toBeDefined();
    expect(meta?.labelRo).toBe('Antiinflamator');
    expect(meta?.icon).toBe('🩺');
  });

  it('identifies recipes containing pork and differentiates pork-free recipes', () => {
    const porkRecipe = RECIPES.find((r) => r.id === 'muschiulet_porc_cuptor');
    expect(porkRecipe).toBeDefined();
    if (porkRecipe) {
      expect(recipeContainsPork(porkRecipe)).toBe(true);
      const tags = getRecipeHealthTags(porkRecipe);
      expect(tags).not.toContain('pork_free');
    }

    const salmonRecipe = RECIPES.find((r) => r.id === 'somon_la_tigaie_orez');
    expect(salmonRecipe).toBeDefined();
    if (salmonRecipe) {
      expect(recipeContainsPork(salmonRecipe)).toBe(false);
      const tags = getRecipeHealthTags(salmonRecipe);
      expect(tags).toContain('pork_free');
      expect(tags).toContain('anti_inflammatory');
      expect(tags).toContain('heart_healthy');
    }
  });

  it('attaches health tags to RECIPES catalog correctly', () => {
    const hummus = RECIPES.find((r) => r.id === 'hummus_cremos_legume_crocante');
    expect(hummus).toBeDefined();
    expect(hummus?.healthTags).toContain('high_fiber');
    expect(hummus?.healthTags).toContain('anti_inflammatory');
    expect(hummus?.healthTags).toContain('pork_free');
  });
});
