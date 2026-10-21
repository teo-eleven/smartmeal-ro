import {
  generateMealPlan,
  getEligibleDessertRecipes,
  swapMealInPlan,
  getAlternativeRecipes,
} from '../plannerEngine';
import { UserPreferences, DayOfWeek } from '../../types';
import { useAppStore } from '../../store/useAppStore';

const FULL_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

function buildPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    supermarketId: 'lidl',
    peopleCount: 2,
    cookingDays: FULL_WEEK,
    budgetRon: 2000,
    moodTags: ['sweet_treat'],
    dietType: 'omnivore',
    dietTypes: ['omnivore'],
    appliances: ['hob', 'oven', 'air_fryer', 'microwave'],
    excludePantryStaples: true,
    pantryInventory: [],
    avoidedAllergens: [],
    mealSlots: ['dinner', 'dessert'],
    foodTier: 'medium',
    selectedSnackIds: [],
    selectedDrinkIds: [],
    includeAlcohol: false,
    ...overrides,
  };
}

describe('Dessert System & Pipeline Integration', () => {
  describe('getEligibleDessertRecipes', () => {
    test('returns only recipes designated as desserts or sweet treats', () => {
      const prefs = buildPreferences();
      const desserts = getEligibleDessertRecipes(prefs);

      expect(desserts.length).toBeGreaterThan(0);
      desserts.forEach((recipe) => {
        const isDessert =
          recipe.suitableSlots?.includes('dessert') ||
          recipe.moodTags?.includes('sweet_treat');
        expect(isDessert).toBe(true);
      });
    });

    test('strictly preserves vegan diet for desserts', () => {
      const prefs = buildPreferences({
        dietType: 'vegan',
        dietTypes: ['vegan'],
      });
      const desserts = getEligibleDessertRecipes(prefs);

      expect(desserts.length).toBeGreaterThan(0);
      desserts.forEach((recipe) => {
        expect(recipe.dietType).toBe('vegan');
      });
    });

    test('strictly preserves vegetarian diet for desserts', () => {
      const prefs = buildPreferences({
        dietType: 'vegetarian',
        dietTypes: ['vegetarian'],
      });
      const desserts = getEligibleDessertRecipes(prefs);

      expect(desserts.length).toBeGreaterThan(0);
      desserts.forEach((recipe) => {
        expect(['vegan', 'vegetarian']).toContain(recipe.dietType);
      });
    });

    test('strictly enforces appliance availability', () => {
      // User with ONLY hob (no oven, no airfryer, no microwave)
      const prefs = buildPreferences({
        appliances: ['hob'],
      });
      const desserts = getEligibleDessertRecipes(prefs);

      expect(desserts.length).toBeGreaterThan(0);
      desserts.forEach((recipe) => {
        recipe.appliances.forEach((app) => {
          expect(app).toBe('hob');
        });
      });
    });

    test('strictly respects avoided allergens in desserts', () => {
      const prefs = buildPreferences({
        avoidedAllergens: ['lactate', 'nuci'],
      });
      const desserts = getEligibleDessertRecipes(prefs);

      expect(desserts.length).toBeGreaterThan(0);
      desserts.forEach((recipe) => {
        // Must not contain dairy or nuts
        const ingIds = recipe.ingredients.map((i) => i.ingredientId.toLowerCase());
        expect(ingIds.some((id) => id.includes('lapte_dulce') || id.includes('unt_82') || id.includes('miez_nuca'))).toBe(false);
      });
    });

    test('desserts are NOT eliminated by strict main-meal health goals like heart_healthy or anti_inflammatory', () => {
      const prefs = buildPreferences({
        healthGoalTags: ['heart_healthy', 'anti_inflammatory'],
      });
      const desserts = getEligibleDessertRecipes(prefs);

      // Should still find desserts!
      expect(desserts.length).toBeGreaterThan(5);
    });
  });

  describe('generateMealPlan with dessert slot', () => {
    test('schedules a genuine dessert for each cooking day in the dessert slot', () => {
      const prefs = buildPreferences({
        mealSlots: ['dinner', 'dessert'],
        healthGoalTags: ['heart_healthy'],
      });
      const plan = generateMealPlan(prefs);

      expect(plan.days.length).toBe(7);
      plan.days.forEach((day) => {
        const dessertMeal = day.meals.find((m) => m.slot === 'dessert');
        expect(dessertMeal).toBeDefined();
        expect(dessertMeal!.recipe.suitableSlots).toContain('dessert');

        // Verify that savory dishes are NEVER scheduled in the dessert slot
        const titleLower = dessertMeal!.recipe.title.toLowerCase();
        expect(titleLower).not.toMatch(/ciorbă|supă|friptură|tocăniță|piept de pui|mușchiuleț/i);
      });
    });
  });

  describe('swapMealInPlan for desserts', () => {
    test('swapping a dessert meal replaces it with another valid dessert, never a savory meal', () => {
      const prefs = buildPreferences({
        mealSlots: ['dinner', 'dessert'],
        healthGoalTags: ['heart_healthy'],
      });
      const plan = generateMealPlan(prefs);
      const originalDessert = plan.days[0].meals.find((m) => m.slot === 'dessert')!;

      const swappedPlan = swapMealInPlan(plan, 'monday', prefs, 'dessert');
      const newDessertMeal = swappedPlan.days[0].meals.find((m) => m.slot === 'dessert')!;

      expect(newDessertMeal).toBeDefined();
      expect(newDessertMeal.recipe.id).not.toBe(originalDessert.recipe.id);
      expect(newDessertMeal.recipe.suitableSlots).toContain('dessert');
    });
  });

  describe('getAlternativeRecipes for desserts', () => {
    test('returns alternate desserts when slot is dessert', () => {
      const prefs = buildPreferences({
        healthGoalTags: ['heart_healthy'],
      });
      const desserts = getEligibleDessertRecipes(prefs);
      const firstDessert = desserts[0];

      const alternatives = getAlternativeRecipes(firstDessert, prefs, 'dessert');
      expect(alternatives.length).toBeGreaterThan(0);
      alternatives.forEach((alt) => {
        expect(alt.id).not.toBe(firstDessert.id);
        expect(alt.suitableSlots).toContain('dessert');
      });
    });
  });

  describe('Store Step 2 Cravings to Step 4 Meal Slots linkage', () => {
    test('selecting sweet_treat in mood tags automatically activates dessert slot', () => {
      const { setMoodTags, toggleMoodTag } = useAppStore.getState();

      // Clear mood tags and ensure dessert is not in mealSlots
      setMoodTags(['healthy_comfort']);
      expect(useAppStore.getState().preferences.mealSlots).not.toContain('dessert');

      // Toggling sweet_treat on
      toggleMoodTag('sweet_treat');
      expect(useAppStore.getState().preferences.moodTags).toContain('sweet_treat');
      expect(useAppStore.getState().preferences.mealSlots).toContain('dessert');

      // Toggling sweet_treat off
      toggleMoodTag('sweet_treat');
      expect(useAppStore.getState().preferences.moodTags).not.toContain('sweet_treat');
      expect(useAppStore.getState().preferences.mealSlots).not.toContain('dessert');
    });
  });
});
