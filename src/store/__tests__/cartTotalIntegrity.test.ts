import { useAppStore } from '../useAppStore';
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
  avoidedAllergens: [],
  mealSlots: ['breakfast', 'lunch', 'dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

/** The number in the header and the sum of the lines on the shopping screen are the same number. */
function cartDrift(): number {
  const { currentPlan, groceryItems } = useAppStore.getState();
  const sum = groceryItems.reduce((total, item) => total + item.estimatedPriceRon, 0);
  return Math.abs(sum - currentPlan!.totalCartCostRon);
}

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

/**
 * swapMealInPlan aggregated the cart without the pantry and without the chosen snacks, and
 * swapMeal kept those totals while replacing the item list with a correctly aggregated one.
 * The two disagreed by the price of everything the user already owned or had added.
 */
describe('totalul coșului rămâne egal cu lista după un swap', () => {
  test('cu cămara goală și fără extra', () => {
    boot();
    useAppStore.getState().swapMeal('monday');

    expect(cartDrift()).toBeLessThan(0.02);
  });

  test('cu ingrediente marcate ca deja avute acasă', () => {
    boot();
    const owned = useAppStore.getState().groceryItems.find((item) => item.estimatedPriceRon > 0)!;
    useAppStore.getState().togglePantryItem(owned.ingredientId);
    useAppStore.getState().swapMeal('tuesday');

    expect(cartDrift()).toBeLessThan(0.02);
  });

  test('cu snacks și băuturi adăugate', () => {
    boot();
    useAppStore.getState().toggleSnackProduct('chipsuri_cartofi_sare');
    useAppStore.getState().swapMeal('wednesday');

    expect(cartDrift()).toBeLessThan(0.02);
  });

  test('cu cămară și extra în același timp, după mai multe swap-uri', () => {
    boot();
    const owned = useAppStore.getState().groceryItems.find((item) => item.estimatedPriceRon > 0)!;
    useAppStore.getState().togglePantryItem(owned.ingredientId);
    useAppStore.getState().toggleSnackProduct('chipsuri_cartofi_sare');

    WEEK.forEach((day) => useAppStore.getState().swapMeal(day));

    expect(cartDrift()).toBeLessThan(0.02);
  });

  test('snacks-urile alese rămân în plan după un swap', () => {
    boot();
    useAppStore.getState().toggleSnackProduct('chipsuri_cartofi_sare');
    useAppStore.getState().swapMeal('thursday');

    expect(useAppStore.getState().currentPlan!.extraProducts!.map((p) => p.id)).toContain(
      'chipsuri_cartofi_sare'
    );
  });
});
