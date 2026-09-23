import { useAppStore } from '../useAppStore';
import { RECIPES } from '../../data/recipes';
import { getRecipeAllergens } from '../../utils/allergenFilter';
import { isRecipeMatchingDiets } from '../../utils/dietCompatibility';
import { DayOfWeek, Recipe, UserPreferences } from '../../types';

const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const BASE: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: WEEK,
  budgetRon: 900,
  moodTags: ['family_fav'],
  dietType: 'omnivore',
  dietTypes: ['omnivore'],
  appliances: ['hob', 'oven', 'air_fryer'],
  excludePantryStaples: true,
  pantryInventory: [],
  avoidedAllergens: [],
  mealSlots: ['breakfast', 'lunch', 'dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

function boot(overrides: Partial<UserPreferences> = {}) {
  useAppStore.setState({
    preferences: { ...BASE, ...overrides },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    activeNotice: null,
  });
  useAppStore.getState().generatePlan();
}

const meals = () => useAppStore.getState().currentPlan!.days.flatMap((day) => day.meals);
const findRecipe = (predicate: (r: Recipe) => boolean) => RECIPES.find(predicate)!;

/**
 * Every other meal-mutating action re-derives safety itself. This one trusted its caller,
 * and its caller happens to filter correctly today -- which makes it a trap for the next
 * caller rather than a live bug.
 */
describe('replaceMealWithRecipe se apără singur', () => {
  test('refuză o rețetă care conține un alergen declarat', () => {
    boot({ avoidedAllergens: ['lactate'] });
    const unsafe = findRecipe((r) => getRecipeAllergens(r).includes('lactate'));
    const before = meals().map((m) => m.recipe.id);

    useAppStore.getState().replaceMealWithRecipe('monday', unsafe);

    expect(meals().map((m) => m.recipe.id)).toEqual(before);
    expect(useAppStore.getState().activeNotice).not.toBeNull();
  });

  test('refuză o rețetă care contrazice dieta declarată', () => {
    boot({ dietType: 'vegan', dietTypes: ['vegan'] });
    const unsafe = findRecipe((r) => !isRecipeMatchingDiets(r, ['vegan']));
    const before = meals().map((m) => m.recipe.id);

    useAppStore.getState().replaceMealWithRecipe('monday', unsafe);

    expect(meals().map((m) => m.recipe.id)).toEqual(before);
  });

  test('refuză o rețetă care cere un aparat lipsă', () => {
    boot({ appliances: ['hob'] });
    const unsafe = findRecipe((r) => r.appliances.includes('oven'));
    const before = meals().map((m) => m.recipe.id);

    useAppStore.getState().replaceMealWithRecipe('monday', unsafe);

    expect(meals().map((m) => m.recipe.id)).toEqual(before);
  });

  test('spune de ce a refuzat', () => {
    boot({ avoidedAllergens: ['lactate'] });
    const unsafe = findRecipe((r) => getRecipeAllergens(r).includes('lactate'));

    useAppStore.getState().replaceMealWithRecipe('monday', unsafe);

    expect(useAppStore.getState().activeNotice!.message.toLowerCase()).toContain('lactate');
  });

  test('acceptă în continuare o rețetă compatibilă', () => {
    boot();
    const current = new Set(meals().map((m) => m.recipe.id));
    const safe = findRecipe(
      (r) =>
        !current.has(r.id) &&
        isRecipeMatchingDiets(r, ['omnivore']) &&
        r.appliances.every((a) => BASE.appliances.includes(a)) &&
        (!r.suitableSlots || r.suitableSlots.includes('dinner'))
    );

    useAppStore.getState().replaceMealWithRecipe('monday', safe, 'dinner');

    const monday = useAppStore.getState().currentPlan!.days.find((d) => d.dayOfWeek === 'monday')!;
    expect(monday.meals.some((m) => m.recipe.id === safe.id)).toBe(true);
  });

  test('totalul coșului rămâne egal cu lista după o înlocuire acceptată', () => {
    boot();
    const current = new Set(meals().map((m) => m.recipe.id));
    const safe = findRecipe(
      (r) =>
        !current.has(r.id) &&
        isRecipeMatchingDiets(r, ['omnivore']) &&
        r.appliances.every((a) => BASE.appliances.includes(a)) &&
        (!r.suitableSlots || r.suitableSlots.includes('dinner'))
    );

    useAppStore.getState().replaceMealWithRecipe('monday', safe, 'dinner');

    const { currentPlan, groceryItems } = useAppStore.getState();
    const sum = groceryItems.reduce((total, item) => total + item.estimatedPriceRon, 0);
    expect(Math.abs(sum - currentPlan!.totalCartCostRon)).toBeLessThan(0.02);
  });
});
