import { useAppStore } from '../useAppStore';
import { cloudSyncService } from '../../services/supabase';
import { getRecipeAllergens } from '../../utils/allergenFilter';
import { Allergen, DayOfWeek, UserPreferences } from '../../types';

jest.mock('../../services/supabase', () => ({
  cloudSyncService: {
    getCurrentUser: jest.fn(),
    loadMealPlan: jest.fn(),
    saveMealPlan: jest.fn(),
  },
}));

const mockUser = cloudSyncService.getCurrentUser as jest.Mock;
const mockLoad = cloudSyncService.loadMealPlan as jest.Mock;

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

const prefs = (o: Partial<UserPreferences> = {}): UserPreferences => ({ ...BASE, ...o });

/** Builds a real plan under `planPrefs` and hands it back the way the cloud would. */
function cloudRowFrom(planPrefs: UserPreferences, rowPrefs = planPrefs) {
  useAppStore.setState({ preferences: planPrefs, currentPlan: null, groceryItems: [], savedPlans: [] });
  useAppStore.getState().generatePlan();
  const plan = useAppStore.getState().currentPlan!;
  const groceryItems = useAppStore.getState().groceryItems;
  return { plan, groceryItems, preferences: rowPrefs, updatedAt: '2026-09-23T10:00:00Z', error: null };
}

function signedInWith(localPrefs: UserPreferences, withLocalPlan: boolean) {
  useAppStore.setState({
    preferences: localPrefs,
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    lastDiscardedPlan: null,
    confirmRequest: null,
    activeNotice: null,
    userEmail: 'a@b.ro',
  });
  if (withLocalPlan) useAppStore.getState().generatePlan();
}

const meals = () => useAppStore.getState().currentPlan!.days.flatMap((d) => d.meals);

beforeEach(() => {
  jest.clearAllMocks();
  mockUser.mockResolvedValue({ id: 'uuid-1', email: 'a@b.ro' });
});

/**
 * The cloud is the fifth door a meal can come through, after generation, restore, hydration
 * and manual replacement. It is also the only one whose data crossed a network, written by
 * a copy of the app that may be older than this one.
 */
describe('syncFromCloud', () => {
  test('nu face nimic dacă nu ești autentificat', async () => {
    signedInWith(prefs(), false);
    useAppStore.setState({ userEmail: null });

    await useAppStore.getState().syncFromCloud();

    expect(mockLoad).not.toHaveBeenCalled();
  });

  test('fără plan local, aplică direct planul din cloud', async () => {
    const row = cloudRowFrom(prefs({ peopleCount: 4, supermarketId: 'penny' }));
    mockLoad.mockResolvedValue(row);
    signedInWith(prefs(), false);

    await useAppStore.getState().syncFromCloud();

    expect(useAppStore.getState().currentPlan).not.toBeNull();
    expect(useAppStore.getState().preferences.peopleCount).toBe(4);
    expect(useAppStore.getState().confirmRequest).toBeNull();
  });

  test('cu plan local, nu suprascrie nimic până nu confirmi', async () => {
    const row = cloudRowFrom(prefs({ peopleCount: 6 }));
    mockLoad.mockResolvedValue(row);
    signedInWith(prefs(), true);
    const before = meals().map((m) => m.recipe.id);

    await useAppStore.getState().syncFromCloud();

    expect(useAppStore.getState().confirmRequest).toBe('apply_cloud_plan');
    expect(meals().map((m) => m.recipe.id)).toEqual(before);
    expect(useAppStore.getState().preferences.peopleCount).toBe(2);
  });

  test('confirmarea aplică planul din cloud', async () => {
    const row = cloudRowFrom(prefs({ peopleCount: 6 }));
    mockLoad.mockResolvedValue(row);
    signedInWith(prefs(), true);

    await useAppStore.getState().syncFromCloud();
    useAppStore.getState().confirmPending();

    expect(useAppStore.getState().preferences.peopleCount).toBe(6);
    expect(useAppStore.getState().confirmRequest).toBeNull();
  });

  test('anularea lasă planul local neatins', async () => {
    const row = cloudRowFrom(prefs({ peopleCount: 6 }));
    mockLoad.mockResolvedValue(row);
    signedInWith(prefs(), true);
    const before = meals().map((m) => m.recipe.id);

    await useAppStore.getState().syncFromCloud();
    useAppStore.getState().cancelConfirm();

    expect(meals().map((m) => m.recipe.id)).toEqual(before);
    expect(useAppStore.getState().preferences.peopleCount).toBe(2);
    expect(useAppStore.getState().confirmRequest).toBeNull();
  });

  test('planul local înlocuit poate fi recuperat cu Anulează', async () => {
    const row = cloudRowFrom(prefs({ peopleCount: 6 }));
    mockLoad.mockResolvedValue(row);
    signedInWith(prefs(), true);
    const before = meals().map((m) => m.recipe.id);

    await useAppStore.getState().syncFromCloud();
    useAppStore.getState().confirmPending();
    useAppStore.getState().undoReset();

    expect(meals().map((m) => m.recipe.id)).toEqual(before);
    expect(useAppStore.getState().preferences.peopleCount).toBe(2);
  });

  test('alergiile se unesc, nu se restrâng', async () => {
    const row = cloudRowFrom(prefs({ avoidedAllergens: ['gluten'] }));
    mockLoad.mockResolvedValue(row);
    signedInWith(prefs({ avoidedAllergens: ['lactate'] }), false);

    await useAppStore.getState().syncFromCloud();

    const active = useAppStore.getState().preferences.avoidedAllergens!;
    expect([...active].sort()).toEqual(['gluten', 'lactate'] as Allergen[]);
  });

  test('nu servește mese cu un alergen pe care doar dispozitivul ăsta îl declară', async () => {
    const row = cloudRowFrom(prefs()); // generat fără alergii
    mockLoad.mockResolvedValue(row);
    signedInWith(prefs({ avoidedAllergens: ['lactate'] }), false);

    await useAppStore.getState().syncFromCloud();

    expect(meals().filter((m) => getRecipeAllergens(m.recipe).includes('lactate'))).toEqual([]);
  });

  test('spune când a schimbat mese ca să respecte alergiile', async () => {
    const row = cloudRowFrom(prefs());
    mockLoad.mockResolvedValue(row);
    signedInWith(prefs({ avoidedAllergens: ['lactate'] }), false);

    await useAppStore.getState().syncFromCloud();

    expect(useAppStore.getState().activeNotice!.message).toContain('lactate');
  });

  test('recalculează lista de cumpărături în loc să creadă cloudul pe cuvânt', async () => {
    const row = cloudRowFrom(prefs());
    mockLoad.mockResolvedValue({
      ...row,
      groceryItems: [{ ingredientId: 'minciuna', name: 'X', quantity: 1, unit: 'buc', estimatedPriceRon: 9999, aisle: 'other', isChecked: false }],
    });
    signedInWith(prefs(), false);

    await useAppStore.getState().syncFromCloud();

    const { currentPlan, groceryItems } = useAppStore.getState();
    const sum = groceryItems.reduce((t, i) => t + i.estimatedPriceRon, 0);
    expect(groceryItems.some((i) => i.ingredientId === 'minciuna')).toBe(false);
    expect(Math.abs(sum - currentPlan!.totalCartCostRon)).toBeLessThan(0.02);
  });

  test('un rând gol în cloud nu distruge nimic local', async () => {
    mockLoad.mockResolvedValue({ plan: null, groceryItems: [], preferences: null, updatedAt: null, error: null });
    signedInWith(prefs(), true);
    const before = meals().map((m) => m.recipe.id);

    await useAppStore.getState().syncFromCloud();

    expect(meals().map((m) => m.recipe.id)).toEqual(before);
    expect(useAppStore.getState().activeNotice).not.toBeNull();
  });

  test('o eroare de la server este raportată, nu înghițită', async () => {
    mockLoad.mockResolvedValue({ plan: null, groceryItems: [], preferences: null, updatedAt: null, error: 'reteaua a picat' });
    signedInWith(prefs(), true);

    await useAppStore.getState().syncFromCloud();

    expect(useAppStore.getState().activeNotice!.message).toContain('reteaua a picat');
    expect(useAppStore.getState().currentPlan).not.toBeNull();
  });

  test('o sesiune expirată este spusă pe nume', async () => {
    mockUser.mockResolvedValue(null);
    signedInWith(prefs(), true);

    await useAppStore.getState().syncFromCloud();

    expect(useAppStore.getState().activeNotice!.title).toMatch(/Sesiune/i);
    expect(mockLoad).not.toHaveBeenCalled();
  });

  test('steagul de sincronizare se stinge și când apare o eroare', async () => {
    mockLoad.mockRejectedValue(new Error('boom'));
    signedInWith(prefs(), true);

    await useAppStore.getState().syncFromCloud();

    expect(useAppStore.getState().isSyncing).toBe(false);
  });
});

/** The upload half, for the one case it did not cover: the call throwing rather than failing. */
describe('syncWithCloud când apelul aruncă', () => {
  test('raportează eroarea în loc s-o lase să scape', async () => {
    (cloudSyncService.saveMealPlan as jest.Mock).mockRejectedValue(new Error('cablu scos'));
    signedInWith(prefs(), true);

    await expect(useAppStore.getState().syncWithCloud()).resolves.toBeUndefined();

    expect(useAppStore.getState().activeNotice!.message).toContain('cablu scos');
    expect(useAppStore.getState().isSyncing).toBe(false);
  });
});
