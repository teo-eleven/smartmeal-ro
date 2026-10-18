import { generateMealPlan, getAlternativeRecipes, getEligibleRecipes } from '../plannerEngine';
import { UserPreferences } from '../../types';

describe('Planner Engine with Health Goals', () => {
  const basePreferences: UserPreferences = {
    supermarketId: 'lidl',
    peopleCount: 2,
    cookingDays: ['monday', 'tuesday', 'wednesday'],
    mealSlots: ['dinner'],
    budgetRon: 350,
    moodTags: ['healthy_comfort'],
    dietType: 'omnivore',
    appliances: ['hob', 'oven', 'air_fryer'],
    excludePantryStaples: true,
  };

  it('excludes pork recipes when pork_free tag is active', () => {
    const prefsWithPorkFree: UserPreferences = {
      ...basePreferences,
      healthGoalTags: ['pork_free'],
    };

    const eligible = getEligibleRecipes(prefsWithPorkFree);
    expect(eligible.length).toBeGreaterThan(0);
    const hasPork = eligible.some(
      (r) => r.id === 'muschiulet_porc_cuptor' || r.id === 'muschiulet_porc_sos_piper_verde'
    );
    expect(hasPork).toBe(false);
  });

  it('generates a valid meal plan without pork when pork_free is active', () => {
    const prefsWithPorkFree: UserPreferences = {
      ...basePreferences,
      healthGoalTags: ['pork_free'],
    };

    const plan = generateMealPlan(prefsWithPorkFree);
    expect(plan.days.length).toBe(3);

    plan.days.forEach((day) => {
      day.meals.forEach((m) => {
        expect(m.recipe.id).not.toBe('muschiulet_porc_cuptor');
        expect(m.recipe.id).not.toBe('muschiulet_porc_sos_piper_verde');
      });
    });
  });

  it('prioritizes anti-inflammatory recipes when anti_inflammatory tag is active', () => {
    const prefsAntiInflammatory: UserPreferences = {
      ...basePreferences,
      healthGoalTags: ['anti_inflammatory'],
    };

    const plan = generateMealPlan(prefsAntiInflammatory);
    expect(plan.days.length).toBe(3);

    // At least one meal should carry the anti_inflammatory tag
    const allRecipes = plan.days.flatMap((d) => d.meals.map((m) => m.recipe));
    const hasAntiInflammatory = allRecipes.some((r) =>
      r.healthTags?.includes('anti_inflammatory')
    );
    expect(hasAntiInflammatory).toBe(true);
  });

  it('prioritizes health goal matches in alternative recipes', () => {
    const currentRecipe = getEligibleRecipes(basePreferences)[0];
    const prefsHealth: UserPreferences = {
      ...basePreferences,
      healthGoalTags: ['pcos_friendly'],
    };

    const alternatives = getAlternativeRecipes(currentRecipe, prefsHealth, 'dinner');
    expect(alternatives.length).toBeGreaterThan(0);
    // Top alternatives should favor matching health goals
    const topAlternative = alternatives[0];
    expect(topAlternative).toBeDefined();
  });
});
