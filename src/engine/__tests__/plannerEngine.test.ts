import {
  calculateRecipePortionCost,
  calculateMinimumViableBudget,
} from '../budgetCalculator';
import { aggregateGroceryList } from '../groceryAggregator';
import {
  generateMealPlan,
  swapMealInPlan,
  isDietCompatible,
  hasRequiredAppliances,
} from '../plannerEngine';
import { RECIPES } from '../../data/recipes';
import { UserPreferences } from '../../types';

describe('Planner Engine & Budget Solver Suite (Phase 3)', () => {
  const defaultPrefs: UserPreferences = {
    supermarketId: 'lidl',
    peopleCount: 2,
    cookingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    mealSlots: ['dinner'],
    budgetRon: 200,
    moodTags: ['speedy', 'family_fav', 'high_protein'],
    dietType: 'omnivore',
    appliances: ['hob', 'oven', 'air_fryer'],
    excludePantryStaples: true,
  };

  // HAPPY PATHS
  describe('Happy Path: Calculations, Aggregations & Plan Generation', () => {
    it('calculates realistic portion costs for recipes', () => {
      const recipe = RECIPES[0]; // Pui airfryer cartofi
      const cost2People = calculateRecipePortionCost(recipe, 2, 'lidl', true);
      const cost4People = calculateRecipePortionCost(recipe, 4, 'lidl', true);

      expect(cost2People).toBeGreaterThan(5);
      expect(cost2People).toBeLessThan(35);
      expect(cost4People).toBeCloseTo(cost2People * 2, 1);
    });

    it('calculates dynamic minimum viable budget floors', () => {
      const floor5Days2People = calculateMinimumViableBudget(2, 5, 'lidl', true);
      const floor7Days4People = calculateMinimumViableBudget(4, 7, 'lidl', true);

      expect(floor5Days2People).toBeGreaterThan(40);
      expect(floor7Days4People).toBeGreaterThan(floor5Days2People);
      expect(floor5Days2People % 5).toBe(0); // rounded to multiple of 5
    });

    it('aggregates grocery list into store packaging and categories', () => {
      const sampleMeals = [
        { recipe: RECIPES[0], servings: 2 },
        { recipe: RECIPES[1], servings: 2 },
      ];

      const result = aggregateGroceryList(sampleMeals, 'lidl', true);

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.totalCartCostRon).toBeGreaterThan(0);
      expect(result.totalCartCostRon).toBeGreaterThanOrEqual(result.totalRecipePortionCostRon);

      // Verify each item has positive packaging calculation
      result.items.forEach((item) => {
        expect(item.packsToBuy).toBeGreaterThanOrEqual(1);
        expect(item.estimatedPriceRon).toBeGreaterThan(0);
        expect(item.neededAmount).toBeGreaterThan(0);
      });
    });

    it('generates a full 5-day meal plan matching user preferences', () => {
      const plan = generateMealPlan(defaultPrefs);

      expect(plan.days.length).toBe(5);
      expect(plan.days.map((d) => d.dayOfWeek)).toEqual([
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
      ]);
      expect(plan.peopleCount).toBe(2);
      expect(plan.totalBudgetRon).toBe(200);
      expect(plan.totalCartCostRon).toBeGreaterThan(0);
      expect(plan.totalRecipeCostRon).toBeGreaterThan(0);

      // Check each day has a recipe and valid cost
      plan.days.forEach((day) => {
        expect(day.recipe).toBeDefined();
        expect(day.estimatedCostRon).toBeGreaterThan(0);
        expect(day.servings).toBe(2);
      });
    });

    it('successfully swaps a meal in the weekly plan with a different valid recipe', () => {
      const initialPlan = generateMealPlan(defaultPrefs);
      const originalWednesdayRecipeId = initialPlan.days[2].recipe.id;

      const updatedPlan = swapMealInPlan(initialPlan, 'wednesday', defaultPrefs);

      expect(updatedPlan.days.length).toBe(5);
      const newWednesdayRecipeId = updatedPlan.days[2].recipe.id;

      expect(newWednesdayRecipeId).not.toBe(originalWednesdayRecipeId);
      expect(updatedPlan.totalCartCostRon).toBeGreaterThan(0);
    });

    it('generates multi-meal plans with 2 meals per day (lunch + dinner)', () => {
      const twoMealsPrefs: UserPreferences = {
        ...defaultPrefs,
        mealSlots: ['lunch', 'dinner'],
        cookingDays: ['monday', 'tuesday'],
      };

      const plan = generateMealPlan(twoMealsPrefs);
      expect(plan.days.length).toBe(2);
      plan.days.forEach((day) => {
        expect(day.meals.length).toBe(2);
        expect(day.meals.map((m) => m.slot)).toEqual(['lunch', 'dinner']);
        expect(day.estimatedCostRon).toBeCloseTo(
          day.meals.reduce((sum, m) => sum + m.estimatedCostRon, 0),
          1
        );
      });
    });

    it('generates full 3 meals per day plans (breakfast + lunch + dinner)', () => {
      const threeMealsPrefs: UserPreferences = {
        ...defaultPrefs,
        mealSlots: ['breakfast', 'lunch', 'dinner'],
        cookingDays: ['monday', 'tuesday', 'wednesday'],
      };

      const plan = generateMealPlan(threeMealsPrefs);
      expect(plan.days.length).toBe(3);
      plan.days.forEach((day) => {
        expect(day.meals.length).toBe(3);
        expect(day.meals.map((m) => m.slot)).toEqual(['breakfast', 'lunch', 'dinner']);
        // Verify breakfast slot gets breakfast-appropriate recipe
        const breakfastMeal = day.meals.find((m) => m.slot === 'breakfast');
        expect(breakfastMeal).toBeDefined();
        expect(breakfastMeal?.recipe).toBeDefined();
      });
    });

    it('swaps a specific meal slot within a day', () => {
      const threeMealsPrefs: UserPreferences = {
        ...defaultPrefs,
        mealSlots: ['breakfast', 'lunch', 'dinner'],
        cookingDays: ['monday'],
      };

      const initialPlan = generateMealPlan(threeMealsPrefs);
      const originalBreakfastId = initialPlan.days[0].meals.find((m) => m.slot === 'breakfast')?.recipe.id;

      const swappedPlan = swapMealInPlan(initialPlan, 'monday', threeMealsPrefs, 'breakfast');
      const newBreakfastId = swappedPlan.days[0].meals.find((m) => m.slot === 'breakfast')?.recipe.id;

      expect(newBreakfastId).not.toBe(originalBreakfastId);
    });

    it('strictly enforces meal slot timing appropriateness (no burgers or heavy beans for breakfast)', () => {
      const allSlotsPrefs: UserPreferences = {
        ...defaultPrefs,
        mealSlots: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'],
        cookingDays: ['monday'],
      };

      const plan = generateMealPlan(allSlotsPrefs);
      const day = plan.days[0];

      const breakfast = day.meals.find((m) => m.slot === 'breakfast');
      const snack = day.meals.find((m) => m.slot === 'snack');
      const dessert = day.meals.find((m) => m.slot === 'dessert');

      expect(breakfast?.recipe.suitableSlots).toContain('breakfast');
      // Verify breakfast is not burger or heavy bean stew
      expect(breakfast?.recipe.id).not.toBe('burger_vita_airfryer');
      expect(breakfast?.recipe.id).not.toBe('iahnie_fasole_afumata');

      expect(snack?.recipe.suitableSlots).toContain('snack');
      expect(dessert?.recipe.suitableSlots).toContain('dessert');
    });

    it('adapts recipe selection strictly based on selected foodTier (basic vs premium)', () => {
      // Basic plan: economical recipes, zero expensive premium cuts
      const basicPrefs: UserPreferences = {
        ...defaultPrefs,
        foodTier: 'basic',
        budgetRon: 120,
        cookingDays: ['monday', 'tuesday', 'wednesday'],
        mealSlots: ['dinner'],
      };
      const basicPlan = generateMealPlan(basicPrefs);
      expect(basicPlan.days.length).toBe(3);
      basicPlan.days.forEach((day) => {
        expect(day.recipe.tier).toBe('basic');
        // Must not contain luxury ingredients / expensive meals
        expect(day.recipe.id).not.toBe('antricot_vita_airfryer_ierburi');
        expect(day.recipe.id).not.toBe('somon_legume_airfryer');
        expect(day.recipe.id).not.toBe('tagliatelle_creveti_usturoi');
      });

      // Premium plan: gourmet recipes prioritized
      const premiumPrefs: UserPreferences = {
        ...defaultPrefs,
        foodTier: 'premium',
        budgetRon: 350,
        cookingDays: ['monday', 'tuesday', 'wednesday'],
        mealSlots: ['dinner'],
      };
      const premiumPlan = generateMealPlan(premiumPrefs);
      expect(premiumPlan.days.length).toBe(3);
      const premiumTiers = premiumPlan.days.map((d) => d.recipe.tier);
      expect(premiumTiers).toContain('premium');
      // Total cost of premium recipes should exceed basic plan recipes
      expect(premiumPlan.totalRecipeCostRon).toBeGreaterThan(basicPlan.totalRecipeCostRon);
    });

    it('adjusts minimum viable budget floor based on food tier', () => {
      const basicFloor = calculateMinimumViableBudget(2, 5, 'lidl', true, 1, 'basic');
      const mediumFloor = calculateMinimumViableBudget(2, 5, 'lidl', true, 1, 'medium');
      const premiumFloor = calculateMinimumViableBudget(2, 5, 'lidl', true, 1, 'premium');

      expect(basicFloor).toBeLessThan(mediumFloor);
      expect(mediumFloor).toBeLessThan(premiumFloor);
    });
  });

  // EDGE CASES
  describe('Edge Cases: Appliance & Diet Strict Filtering', () => {
    it('strictly enforces appliance constraints (e.g. user only has air_fryer)', () => {
      const airFryerOnlyPrefs: UserPreferences = {
        ...defaultPrefs,
        appliances: ['air_fryer'],
        cookingDays: ['monday', 'tuesday'],
      };

      const plan = generateMealPlan(airFryerOnlyPrefs);

      plan.days.forEach((day) => {
        expect(hasRequiredAppliances(day.recipe.appliances, ['air_fryer'])).toBe(true);
        expect(day.recipe.appliances).toContain('air_fryer');
      });
    });

    it('strictly enforces vegan diet constraints (zero animal products)', () => {
      const veganPrefs: UserPreferences = {
        ...defaultPrefs,
        dietType: 'vegan',
        appliances: ['hob', 'oven'],
        cookingDays: ['monday', 'tuesday', 'wednesday'],
      };

      const plan = generateMealPlan(veganPrefs);

      plan.days.forEach((day) => {
        expect(isDietCompatible(day.recipe.dietType, 'vegan')).toBe(true);
        expect(day.recipe.dietType).toBe('vegan');
      });
    });

    it('strictly enforces vegetarian diet constraints (no meat or fish)', () => {
      const vegPrefs: UserPreferences = {
        ...defaultPrefs,
        dietType: 'vegetarian',
        appliances: ['hob', 'oven'],
        cookingDays: ['monday', 'tuesday', 'wednesday', 'thursday'],
      };

      const plan = generateMealPlan(vegPrefs);

      plan.days.forEach((day) => {
        expect(isDietCompatible(day.recipe.dietType, 'vegetarian')).toBe(true);
        expect(['vegetarian', 'vegan']).toContain(day.recipe.dietType);
      });
    });

    it('pantry staples toggle alters grocery list item count and total cost', () => {
      const sampleMeals = [{ recipe: RECIPES[0], servings: 2 }];

      const withStaplesExcluded = aggregateGroceryList(sampleMeals, 'lidl', true);
      const withStaplesIncluded = aggregateGroceryList(sampleMeals, 'lidl', false);

      expect(withStaplesIncluded.items.length).toBeGreaterThan(withStaplesExcluded.items.length);
      expect(withStaplesIncluded.totalCartCostRon).toBeGreaterThan(
        withStaplesExcluded.totalCartCostRon
      );
    });
  });

  // ERROR CASES
  describe('Error Cases: Input Validation', () => {
    it('throws when cookingDays is empty', () => {
      expect(() =>
        generateMealPlan({
          ...defaultPrefs,
          cookingDays: [],
        })
      ).toThrow('[PlannerEngine] At least one cooking day must be selected.');
    });

    it('throws when peopleCount is less than 1', () => {
      expect(() =>
        generateMealPlan({
          ...defaultPrefs,
          peopleCount: 0,
        })
      ).toThrow('[PlannerEngine] peopleCount must be at least 1.');
    });

    it('throws when budgetRon is zero or negative', () => {
      expect(() =>
        generateMealPlan({
          ...defaultPrefs,
          budgetRon: -50,
        })
      ).toThrow('[PlannerEngine] budgetRon must be greater than 0.');
    });

    it('throws when trying to swap a day that is not in the plan', () => {
      const plan = generateMealPlan({
        ...defaultPrefs,
        cookingDays: ['monday'],
      });

      expect(() => swapMealInPlan(plan, 'sunday', defaultPrefs)).toThrow(
        '[PlannerEngine] Ziua "sunday" nu se găsește în planul curent.'
      );
    });
  });
});
