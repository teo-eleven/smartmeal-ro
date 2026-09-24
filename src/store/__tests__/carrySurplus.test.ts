import { useAppStore } from '../useAppStore';
import { INGREDIENTS } from '../../data/ingredients';
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

/**
 * A supermarket sells whole packs, so a week that needs 270 g of rice buys a kilo and leaves
 * 730 g behind. That surplus used to vanish from the app's memory and be bought again seven
 * days later; carrying it into the cupboard is what makes the second week cheaper.
 */
describe('reportarea surplusului în cămară', () => {
  test('surplusul măsurabil ajunge în cămară', () => {
    boot();
    const leftovers = useAppStore
      .getState()
      .groceryItems.filter((item) => (item.leftoverAmount ?? 0) > 0);
    expect(leftovers.length).toBeGreaterThan(0);

    useAppStore.getState().carryOverSurplus();
    const stock = useAppStore.getState().preferences.pantryStock!;

    leftovers.forEach((item) => {
      expect(stock[item.ingredientId]).toBeCloseTo(item.leftoverAmount!, 1);
    });
  });

  test('a doua săptămână costă mai puțin decât prima', () => {
    boot();
    const firstWeek = useAppStore.getState().currentPlan!.totalCartCostRon;

    useAppStore.getState().carryOverSurplus();
    useAppStore.getState().generatePlan();
    const secondWeek = useAppStore.getState().currentPlan!.totalCartCostRon;

    expect(secondWeek).toBeLessThan(firstWeek);
  });

  test('nu raportează nimic dacă nu există plan', () => {
    useAppStore.setState({ preferences: { ...BASE }, currentPlan: null, groceryItems: [] });

    useAppStore.getState().carryOverSurplus();

    expect(useAppStore.getState().preferences.pantryStock).toEqual({});
  });

  test('stocul existent se adună cu surplusul nou, nu îl înlocuiește', () => {
    const rice = 'orez_basmati';
    boot({ pantryStock: { [rice]: 100 } });
    const before = useAppStore.getState().preferences.pantryStock![rice];

    useAppStore.getState().carryOverSurplus();
    const after = useAppStore.getState().preferences.pantryStock![rice] ?? 0;

    expect(after).toBeGreaterThanOrEqual(before);
  });

  test('spune utilizatorului câte lei valorează ce a pus deoparte', () => {
    boot();
    useAppStore.getState().carryOverSurplus();

    const notice = useAppStore.getState().activeNotice!;
    expect(notice.message).toMatch(/lei/i);
  });

  test('consumarea stocului nu produce cantități negative', () => {
    const rice = 'orez_basmati';
    boot({ pantryStock: { [rice]: INGREDIENTS[rice].standardPackSize * 3 } });

    useAppStore.getState().carryOverSurplus();
    const stock = useAppStore.getState().preferences.pantryStock!;

    Object.values(stock).forEach((amount) => expect(amount).toBeGreaterThanOrEqual(0));
  });

  test('golirea cămării șterge stocul', () => {
    boot();
    useAppStore.getState().carryOverSurplus();
    expect(Object.keys(useAppStore.getState().preferences.pantryStock!).length).toBeGreaterThan(0);

    useAppStore.getState().clearPantryStock();

    expect(useAppStore.getState().preferences.pantryStock).toEqual({});
  });
});
