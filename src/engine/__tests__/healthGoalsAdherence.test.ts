import { getEligibleRecipes, generateMealPlan } from '../plannerEngine';
import { UserPreferences } from '../../types';

describe('Health Goals Adherence & Recipe Filtering', () => {
  const basePrefs: UserPreferences = {
    dietType: 'omnivore',
    dietTypes: ['omnivore'],
    appliances: ['hob', 'oven', 'air_fryer', 'microwave'],
    supermarketId: 'lidl',
    peopleCount: 2,
    cookingDays: ['monday', 'tuesday', 'wednesday'],
    mealSlots: ['dinner'],
    budgetRon: 200,
    excludePantryStaples: false,
    dislikedRecipeIds: [],
    favouriteRecipeIds: [],
    avoidedAllergens: [],
    moodTags: [],
    healthGoalTags: [],
  };

  it('returns all unconstrained recipes when no health goals are active', () => {
    const unconstrained = getEligibleRecipes(basePrefs);
    expect(unconstrained.length).toBeGreaterThan(100);
  });

  it('filters recipes strictly when Antiinflamator is selected', () => {
    const antiInflammatoryPrefs: UserPreferences = {
      ...basePrefs,
      healthGoalTags: ['anti_inflammatory'],
    };
    const eligible = getEligibleRecipes(antiInflammatoryPrefs);
    expect(eligible.length).toBeGreaterThan(0);
    expect(eligible.length).toBeLessThan(getEligibleRecipes(basePrefs).length);
    eligible.forEach((r) => {
      expect(r.healthTags).toContain('anti_inflammatory');
    });
  });

  it('filters recipes strictly when Diabet & Glicemie Stabilă is selected', () => {
    const diabeticPrefs: UserPreferences = {
      ...basePrefs,
      healthGoalTags: ['diabetic_friendly'],
    };
    const eligible = getEligibleRecipes(diabeticPrefs);
    expect(eligible.length).toBeGreaterThan(0);
    expect(eligible.length).toBeLessThan(getEligibleRecipes(basePrefs).length);
    eligible.forEach((r) => {
      expect(r.healthTags).toContain('diabetic_friendly');
    });
  });

  it('filters recipes strictly when SOP / PCOS is selected', () => {
    const pcosPrefs: UserPreferences = {
      ...basePrefs,
      healthGoalTags: ['pcos_friendly'],
    };
    const eligible = getEligibleRecipes(pcosPrefs);
    expect(eligible.length).toBeGreaterThan(0);
    expect(eligible.length).toBeLessThan(getEligibleRecipes(basePrefs).length);
    eligible.forEach((r) => {
      expect(r.healthTags).toContain('pcos_friendly');
    });
  });

  it('generates a meal plan adhering to health goals', () => {
    const diabeticPrefs: UserPreferences = {
      ...basePrefs,
      healthGoalTags: ['diabetic_friendly'],
    };
    const plan = generateMealPlan(diabeticPrefs);
    expect(plan.days.length).toBe(3);
    plan.days.forEach((day) => {
      day.meals?.forEach((meal) => {
        expect(meal.recipe.healthTags).toContain('diabetic_friendly');
      });
    });
  });
});
