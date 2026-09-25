import { useAppStore } from '../../store/useAppStore';
import { getEligibleRecipes } from '../../engine/plannerEngine';
import { DayOfWeek, UserPreferences } from '../../types';

const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const SAFE: UserPreferences = {
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
  pantryStock: {},
  avoidedAllergens: [],
  mealSlots: ['breakfast', 'lunch', 'dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

function boot(overrides: Partial<UserPreferences> = {}) {
  useAppStore.setState({
    preferences: { ...SAFE, ...overrides },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    activeNotice: null,
  });
  useAppStore.getState().generatePlan();
}

/** "Never propose this again" has to mean it on every path, not only in generation. */
describe('rețetele respinse rămân respinse', () => {
  test('nu pot fi repuse printr-o înlocuire directă', () => {
    boot();
    const victim = useAppStore.getState().currentPlan!.days[1].meals[0].recipe;
    useAppStore.getState().toggleDislikedRecipe(victim.id);
    const before = useAppStore.getState().currentPlan!.days[0].meals[0].recipe.id;

    useAppStore.getState().replaceMealWithRecipe('monday', victim, 'dinner');

    expect(useAppStore.getState().currentPlan!.days[0].meals[0].recipe.id).toBe(before);
    expect(useAppStore.getState().activeNotice).not.toBeNull();
  });

  test('nici când catalogul se îngustează și scara de relaxare intră în joc', () => {
    boot({ dietType: 'vegan', dietTypes: ['vegan'] });
    const served = useAppStore
      .getState()
      .currentPlan!.days.flatMap((d) => d.meals.map((m) => m.recipe.id));
    const refused = served.slice(0, 6);
    refused.forEach((id) => useAppStore.getState().toggleDislikedRecipe(id));

    for (let i = 0; i < 6; i++) {
      useAppStore.getState().reshufflePlan();
      const now = useAppStore
        .getState()
        .currentPlan!.days.flatMap((d) => d.meals.map((m) => m.recipe.id));
      expect(now.filter((id) => refused.includes(id))).toEqual([]);
    }
  });

  test('o rețetă nevândută la magazinul ales este refuzată', () => {
    boot();
    const elsewhere = getEligibleRecipes({ ...SAFE, supermarketId: 'kaufland' }).find(
      (r) => r.availableSupermarkets && !r.availableSupermarkets.includes('lidl')
    );
    if (!elsewhere) return;
    const before = useAppStore.getState().currentPlan!.days[0].meals[0].recipe.id;

    useAppStore.getState().replaceMealWithRecipe('monday', elsewhere, 'dinner');

    expect(useAppStore.getState().currentPlan!.days[0].meals[0].recipe.id).toBe(before);
  });
});

describe('rezumatul nutrițional', () => {
  test('numără toate mesele, nu doar felul principal al zilei', () => {
    boot();
    const plan = useAppStore.getState().currentPlan!;

    const headlineOnly = plan.days.reduce(
      (t, d) => t + d.recipe.nutritionPerServing.calories,
      0
    );
    const everyMeal = plan.days
      .flatMap((d) => d.meals)
      .reduce((t, m) => t + m.recipe.nutritionPerServing.calories, 0);

    // Three slots a day, so the whole week must be well above the headline dishes alone.
    expect(everyMeal).toBeGreaterThan(headlineOnly * 1.5);
  });
});
