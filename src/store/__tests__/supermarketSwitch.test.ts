import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore, pickStoreCompatibleReplacement } from '../useAppStore';
import { isSupermarketCompatible } from '../../engine/plannerEngine';
import { RECIPES } from '../../data/recipes';
import { SupermarketId, UserPreferences } from '../../types';

const BASE: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: ['monday', 'tuesday', 'wednesday'],
  budgetRon: 900,
  moodTags: ['family_fav'],
  dietType: 'omnivore',
  dietTypes: ['omnivore'],
  appliances: ['hob', 'oven', 'air_fryer'],
  excludePantryStaples: true,
  pantryInventory: [],
  avoidedAllergens: [],
  mealSlots: ['dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

const ALL_MARKETS: SupermarketId[] = [
  'lidl',
  'kaufland',
  'carrefour',
  'mega_image',
  'auchan',
  'penny',
  'profi',
  'sezamo',
];

function planMeals() {
  return useAppStore.getState().currentPlan!.days.flatMap((day) => day.meals);
}

describe('switching supermarket', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAppStore.setState({
      preferences: { ...BASE },
      currentPlan: null,
      groceryItems: [],
      activeNotice: null,
    });
    useAppStore.getState().generatePlan();
  });

  test('the plan only ever contains dishes the chosen store carries', () => {
    ALL_MARKETS.forEach((market) => {
      useAppStore.getState().setSupermarket(market);
      planMeals().forEach((meal) => {
        expect(isSupermarketCompatible(meal.recipe, market)).toBe(true);
      });
    });
  });

  test('prices follow the chosen store', () => {
    const before = useAppStore.getState().currentPlan!.totalCartCostRon;
    useAppStore.getState().setSupermarket('mega_image');
    const after = useAppStore.getState().currentPlan!.totalCartCostRon;
    expect(after).not.toBe(before);
    expect(useAppStore.getState().currentPlan!.supermarketId).toBe('mega_image');
  });

  test('a dish that cannot be matched is never left silently in the plan', () => {
    // Arrange: a plan made only of dishes exclusive to one store, then move away from it
    const exclusive = RECIPES.filter(
      (r) => r.availableSupermarkets?.length === 1 && r.availableSupermarkets[0] === 'lidl'
    );
    if (exclusive.length === 0) return;

    const plan = useAppStore.getState().currentPlan!;
    useAppStore.setState({
      currentPlan: {
        ...plan,
        days: plan.days.map((day) => ({
          ...day,
          recipe: exclusive[0],
          meals: day.meals.map((meal) => ({ ...meal, recipe: exclusive[0] })),
        })),
      },
    });

    // Act
    useAppStore.getState().setSupermarket('sezamo');

    // Assert: either every meal was replaced, or the user was told which were not
    const stranded = planMeals().filter((meal) => !isSupermarketCompatible(meal.recipe, 'sezamo'));
    if (stranded.length > 0) {
      expect(useAppStore.getState().activeNotice).not.toBeNull();
      expect(useAppStore.getState().activeNotice?.message).toMatch(/sezamo|magazin/i);
    }
  });

  test('a clean switch does not nag the user', () => {
    useAppStore.setState({ activeNotice: null });
    useAppStore.getState().setSupermarket('kaufland');

    const stranded = planMeals().filter(
      (meal) => !isSupermarketCompatible(meal.recipe, 'kaufland')
    );
    if (stranded.length === 0) {
      expect(useAppStore.getState().activeNotice).toBeNull();
    }
  });

  test('the grocery list is rebuilt for the new store', () => {
    useAppStore.getState().setSupermarket('penny');
    const sum = useAppStore
      .getState()
      .groceryItems.reduce((total, item) => total + item.estimatedPriceRon, 0);
    expect(useAppStore.getState().currentPlan!.totalCartCostRon).toBeCloseTo(
      Math.round(sum * 100) / 100,
      2
    );
  });
});

describe('pickStoreCompatibleReplacement', () => {
  const a = RECIPES[0];
  const b = RECIPES[1];
  const c = RECIPES[2];

  test('prefers a dish not used anywhere this week', () => {
    const chosen = pickStoreCompatibleReplacement([a, b, c], new Set([a.id]), new Set([a.id, b.id]));
    expect(chosen?.id).toBe(c.id);
  });

  test('falls back to one unused today when the week is full', () => {
    const chosen = pickStoreCompatibleReplacement([a, b], new Set([a.id]), new Set([a.id, b.id]));
    expect(chosen?.id).toBe(b.id);
  });

  test('falls back to anything legal when everything is used', () => {
    const chosen = pickStoreCompatibleReplacement([a], new Set([a.id]), new Set([a.id]));
    expect(chosen?.id).toBe(a.id);
  });

  test('returns null when the catalog offers nothing, rather than a silent nothing', () => {
    expect(pickStoreCompatibleReplacement([], new Set(), new Set())).toBeNull();
  });
});
