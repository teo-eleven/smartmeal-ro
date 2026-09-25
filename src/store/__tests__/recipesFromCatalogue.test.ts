import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../useAppStore';
import { RECIPES, RECIPES_MAP } from '../../data/recipes';
import { DayOfWeek, Recipe, UserPreferences } from '../../types';

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
  mealSlots: ['dinner'],
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

/**
 * The gates used to check a recipe's id and then trust the body attached to it. A plan out of
 * storage or the cloud could keep a legitimate id while its ingredients said something else,
 * and a caller could hand over a wholly fabricated dish.
 */
describe('rețeta servită vine din catalog, nu din date primite', () => {
  test('un plan din storage cu ingrediente modificate nu mai trece', async () => {
    await AsyncStorage.clear();
    boot();
    const plan = JSON.parse(JSON.stringify(useAppStore.getState().currentPlan));
    plan.days[0].meals[0].recipe.title = 'MODIFICAT';
    plan.days[0].meals[0].recipe.ingredients.push({
      ingredientId: 'unt_arahide',
      amountPerServing: 50,
      unit: 'g',
    });
    await AsyncStorage.setItem('@smartmeal_current_plan', JSON.stringify(plan));
    await AsyncStorage.setItem(
      '@smartmeal_preferences',
      JSON.stringify({ ...SAFE, avoidedAllergens: ['arahide'] })
    );

    useAppStore.setState({ currentPlan: null, groceryItems: [], isHydrated: false, activeNotice: null });
    await useAppStore.getState().hydrateStorage();

    const served = useAppStore.getState().currentPlan!.days[0].meals[0].recipe;
    expect(served.title).not.toContain('MODIFICAT');
    expect(served.ingredients.some((i) => i.ingredientId === 'unt_arahide')).toBe(false);
    expect(served).toEqual(RECIPES_MAP[served.id]);
  });

  test('fiecare masă servită după hidratare e identică cu cea din catalog', async () => {
    await AsyncStorage.clear();
    boot();
    const plan = JSON.parse(JSON.stringify(useAppStore.getState().currentPlan));
    plan.days.forEach((d: { meals: { recipe: Recipe }[] }) =>
      d.meals.forEach((m) => {
        m.recipe.prepTimeMinutes = 999;
      })
    );
    await AsyncStorage.setItem('@smartmeal_current_plan', JSON.stringify(plan));
    await AsyncStorage.setItem('@smartmeal_preferences', JSON.stringify(SAFE));

    useAppStore.setState({ currentPlan: null, groceryItems: [], isHydrated: false });
    await useAppStore.getState().hydrateStorage();

    const tampered = useAppStore
      .getState()
      .currentPlan!.days.flatMap((d) => d.meals)
      .filter((m) => m.recipe.prepTimeMinutes === 999);
    expect(tampered).toEqual([]);
  });

  test('o rețetă inventată nu mai ajunge pe tablă', () => {
    boot();
    const before = useAppStore.getState().currentPlan!.days[0].meals[0].recipe.id;
    const fabricated = {
      ...RECIPES[0],
      id: 'inventat_nu_e_in_catalog',
      title: 'Fel inventat',
      dietType: 'vegan' as const,
      appliances: [],
      ingredients: [],
      steps: [{ stepNumber: 1, instruction: 'instrucțiune arbitrară' }],
    };

    useAppStore.getState().replaceMealWithRecipe('monday', fabricated, 'dinner');

    expect(useAppStore.getState().currentPlan!.days[0].meals[0].recipe.id).toBe(before);
    expect(useAppStore.getState().activeNotice!.title).toMatch(/necunoscut/i);
  });

  test('o rețetă reală cu corpul falsificat este înlocuită cu cea din catalog', () => {
    boot();
    const real = RECIPES.find(
      (r) =>
        r.id !== useAppStore.getState().currentPlan!.days[0].meals[0].recipe.id &&
        (!r.suitableSlots || r.suitableSlots.includes('dinner')) &&
        r.appliances.every((a) => SAFE.appliances.includes(a)) &&
        r.dietType === 'omnivore'
    )!;
    const lying = { ...real, ingredients: [], steps: [{ stepNumber: 1, instruction: 'minciună' }] };

    useAppStore.getState().replaceMealWithRecipe('monday', lying, 'dinner');

    const served = useAppStore.getState().currentPlan!.days[0].meals[0].recipe;
    expect(served.id).toBe(real.id);
    expect(served.ingredients.length).toBeGreaterThan(0);
    expect(served).toEqual(RECIPES_MAP[real.id]);
  });

  test('o rețetă compatibilă din catalog este în continuare acceptată', () => {
    boot();
    const current = new Set(
      useAppStore.getState().currentPlan!.days.flatMap((d) => d.meals.map((m) => m.recipe.id))
    );
    const ok = RECIPES.find(
      (r) =>
        !current.has(r.id) &&
        r.dietType === 'omnivore' &&
        r.appliances.every((a) => SAFE.appliances.includes(a)) &&
        (!r.suitableSlots || r.suitableSlots.includes('dinner'))
    )!;

    useAppStore.getState().replaceMealWithRecipe('monday', ok, 'dinner');

    expect(useAppStore.getState().currentPlan!.days[0].meals[0].recipe.id).toBe(ok.id);
  });
});
