import { useAppStore } from '../useAppStore';
import { getEligibleRecipes } from '../../engine/plannerEngine';
import { RECIPES } from '../../data/recipes';
import { DayOfWeek, UserPreferences } from '../../types';

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
    preferences: { ...BASE, ...overrides },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    activeNotice: null,
  });
  useAppStore.getState().generatePlan();
}

const servedIds = () =>
  useAppStore.getState().currentPlan!.days.flatMap((d) => d.meals.map((m) => m.recipe.id));

/**
 * Without memory the planner proposes the same dish forever, however the week went. A thumb
 * down has to mean "never again", which makes it a hard filter like diet and allergens --
 * and therefore capable of emptying the catalog, so it is refused when it would.
 */
describe('memoria planificatorului', () => {
  test('o rețetă respinsă dispare din cele eligibile', () => {
    const victim = RECIPES[0].id;
    const eligible = getEligibleRecipes({ ...BASE, dislikedRecipeIds: [victim] });

    expect(eligible.map((r) => r.id)).not.toContain(victim);
  });

  test('respingerea o scoate din planul curent', () => {
    boot();
    const victim = servedIds()[0];

    useAppStore.getState().toggleDislikedRecipe(victim);

    expect(servedIds()).not.toContain(victim);
    expect(useAppStore.getState().preferences.dislikedRecipeIds).toContain(victim);
  });

  test('nu mai reapare nici după reshuffle-uri repetate', () => {
    boot();
    const victim = servedIds()[0];
    useAppStore.getState().toggleDislikedRecipe(victim);

    for (let i = 0; i < 10; i++) {
      useAppStore.getState().reshufflePlan();
      expect(servedIds()).not.toContain(victim);
    }
  });

  test('apăsată a doua oară, o aduce înapoi', () => {
    boot();
    const victim = servedIds()[0];

    useAppStore.getState().toggleDislikedRecipe(victim);
    useAppStore.getState().toggleDislikedRecipe(victim);

    expect(useAppStore.getState().preferences.dislikedRecipeIds).not.toContain(victim);
  });

  test('refuză respingerea care ar goli catalogul', () => {
    const almostAll = RECIPES.map((r) => r.id);
    boot({ dislikedRecipeIds: almostAll.slice(1) });
    const lastOne = almostAll[0];

    useAppStore.getState().toggleDislikedRecipe(lastOne);

    expect(useAppStore.getState().preferences.dislikedRecipeIds).not.toContain(lastOne);
    expect(useAppStore.getState().activeNotice).not.toBeNull();
  });

  test('o rețetă favorită apare mai des decât înainte', () => {
    boot();
    const all = getEligibleRecipes(BASE);
    const rare = all.find((r) => !servedIds().includes(r.id))!;

    let withoutFavourite = 0;
    for (let i = 0; i < 12; i++) {
      useAppStore.getState().reshufflePlan();
      if (servedIds().includes(rare.id)) withoutFavourite += 1;
    }

    boot({ favouriteRecipeIds: [rare.id] });
    let withFavourite = 0;
    for (let i = 0; i < 12; i++) {
      useAppStore.getState().reshufflePlan();
      if (servedIds().includes(rare.id)) withFavourite += 1;
    }

    expect(withFavourite).toBeGreaterThan(withoutFavourite);
  });

  test('favoritele nu calcă peste alergii', () => {
    boot({ avoidedAllergens: ['lactate'] });
    const dairy = RECIPES.find((r) =>
      r.ingredients.some((i) => i.ingredientId.includes('lapte') || i.ingredientId.includes('branza'))
    )!;

    useAppStore.getState().toggleFavouriteRecipe(dairy.id);

    expect(servedIds()).not.toContain(dairy.id);
  });

  test('o rețetă nu poate fi și favorită, și respinsă', () => {
    boot();
    const id = servedIds()[0];

    useAppStore.getState().toggleFavouriteRecipe(id);
    useAppStore.getState().toggleDislikedRecipe(id);

    const prefs = useAppStore.getState().preferences;
    expect(prefs.favouriteRecipeIds ?? []).not.toContain(id);
    expect(prefs.dislikedRecipeIds ?? []).toContain(id);
  });
});
