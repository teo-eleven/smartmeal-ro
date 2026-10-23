import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../useAppStore';
import { RECIPES } from '../../data/recipes';
import { cloudSyncService } from '../../services/supabase';
import { recipeContainsPork } from '../../data/healthTags';
import { isRecipeMatchingDiets } from '../../utils/dietCompatibility';
import { DayOfWeek, SavedPlan, UserPreferences } from '../../types';

jest.mock('../../services/supabase', () => ({
  cloudSyncService: {
    isConfigured: jest.fn(() => true),
    getCurrentUser: jest.fn(),
    loadMealPlan: jest.fn(),
    saveMealPlan: jest.fn(),
    currentEmail: jest.fn(async () => null),
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

const plannedRecipes = () =>
  useAppStore.getState().currentPlan!.days.flatMap((d) => d.meals.map((m) => m.recipe));

/** A real plan generated under `planPrefs`, so it contains whatever those prefs allowed. */
function generatedUnder(planPrefs: UserPreferences) {
  useAppStore.setState({
    preferences: planPrefs,
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    activeNotice: null,
  });
  useAppStore.getState().generatePlan();
  return useAppStore.getState().currentPlan!;
}

/** An omnivore week that is guaranteed to contain pork, as the saved or cloud plan. */
function porkHeavyPlan() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const plan = generatedUnder(prefs({ moodTags: ['romanian_classic', 'grill_meat'] }));
    if (plan.days.some((d) => d.meals.some((m) => recipeContainsPork(m.recipe)))) return plan;
  }
  throw new Error('Nu am putut genera un plan de test care să conțină porc');
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUser.mockResolvedValue({ id: 'uuid-1', email: 'a@b.ro' });
});

describe('restaurarea unui plan salvat păstrează protecțiile de azi', () => {
  function restore(saved: SavedPlan, current: UserPreferences) {
    useAppStore.setState({
      preferences: current,
      currentPlan: null,
      groceryItems: [],
      savedPlans: [saved],
      activeNotice: null,
    });
    useAppStore.getState().restoreSavedPlan(saved.id);
    return useAppStore.getState();
  }

  test('un plan salvat înainte de „Fără porc” nu readuce porcul', () => {
    const plan = porkHeavyPlan();
    const saved: SavedPlan = {
      id: 's1',
      name: 'vechi',
      savedAt: '2026-09-01',
      plan,
      preferences: prefs(),
    };

    const state = restore(saved, prefs({ healthGoalTags: ['pork_free'] }));

    expect(state.preferences.healthGoalTags).toContain('pork_free');
    expect(
      plannedRecipes()
        .filter(recipeContainsPork)
        .map((r) => r.id)
    ).toEqual([]);
  });

  test('rețetele respinse azi și cele respinse atunci rămân amândouă respinse', () => {
    const plan = generatedUnder(prefs());
    const dislikedNow = plan.days[0].meals[0].recipe.id;
    const saved: SavedPlan = {
      id: 's2',
      name: 'vechi',
      savedAt: '2026-09-01',
      plan,
      preferences: prefs({ dislikedRecipeIds: ['ciorba_legume_lamaie'] }),
    };

    const state = restore(saved, prefs({ dislikedRecipeIds: [dislikedNow] }));

    expect(state.preferences.dislikedRecipeIds).toEqual(
      expect.arrayContaining([dislikedNow, 'ciorba_legume_lamaie'])
    );
    expect(plannedRecipes().map((r) => r.id)).not.toContain(dislikedNow);
  });

  test('bugetul și magazinul de azi nu sunt înlocuite de cele vechi', () => {
    const plan = generatedUnder(prefs());
    const saved: SavedPlan = {
      id: 's3',
      name: 'vechi',
      savedAt: '2026-09-01',
      plan,
      preferences: prefs({ budgetRon: 150, supermarketId: 'penny' }),
    };

    const state = restore(saved, prefs({ budgetRon: 700, supermarketId: 'kaufland' }));

    expect(state.preferences.budgetRon).toBe(700);
    expect(state.preferences.supermarketId).toBe('kaufland');
  });

  test('preferințele corupte din planul salvat nu ajung în starea aplicației', () => {
    const plan = generatedUnder(prefs());
    const saved = {
      id: 's4',
      name: 'vechi',
      savedAt: '2026-09-01',
      plan,
      preferences: { ...prefs(), peopleCount: -3, mealSlots: 'dinner' },
    } as unknown as SavedPlan;

    const state = restore(saved, prefs());

    expect(state.preferences.peopleCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(state.preferences.mealSlots)).toBe(true);
  });
});

describe('preluarea din cloud nu relaxează protecțiile acestui dispozitiv', () => {
  async function pullCloud(cloudPrefs: UserPreferences, local: UserPreferences) {
    const plan = porkHeavyPlan();
    mockLoad.mockResolvedValue({
      plan,
      groceryItems: [],
      preferences: cloudPrefs,
      updatedAt: '2026-09-23T10:00:00Z',
      error: null,
    });
    useAppStore.setState({
      preferences: local,
      currentPlan: null,
      groceryItems: [],
      savedPlans: [],
      confirmRequest: null,
      activeNotice: null,
      userEmail: 'a@b.ro',
    });
    await useAppStore.getState().syncFromCloud();
    return useAppStore.getState();
  }

  test('un vegan care preia un rând vechi „omnivor” rămâne vegan', async () => {
    const state = await pullCloud(prefs(), prefs({ dietType: 'vegan', dietTypes: ['vegan'] }));

    expect(state.preferences.dietTypes).toEqual(['vegan']);
    const nonVegan = plannedRecipes().filter((r) => !isRecipeMatchingDiets(r, ['vegan']));
    expect(nonVegan.map((r) => r.id)).toEqual([]);
  });

  test('„Fără porc” de pe acest dispozitiv rămâne activ', async () => {
    const state = await pullCloud(prefs(), prefs({ healthGoalTags: ['pork_free'] }));

    expect(state.preferences.healthGoalTags).toContain('pork_free');
    expect(
      plannedRecipes()
        .filter(recipeContainsPork)
        .map((r) => r.id)
    ).toEqual([]);
  });

  test('restul setărilor din cloud sunt preluate, cum a cerut utilizatorul', async () => {
    const state = await pullCloud(prefs({ peopleCount: 4 }), prefs());

    expect(state.preferences.peopleCount).toBe(4);
  });
});

describe('verificarea de siguranță la restaurare tratează deserturile ca deserturi', () => {
  test('un desert sigur nu e înlocuit doar pentru că nu are eticheta de sănătate a zilei', () => {
    const plan = generatedUnder(prefs({ mealSlots: ['breakfast', 'lunch', 'dinner', 'dessert'] }));
    const dessertsBefore = plan.days.flatMap((d) =>
      d.meals.filter((m) => m.slot === 'dessert').map((m) => m.recipe.id)
    );
    expect(dessertsBefore.length).toBeGreaterThan(0);

    useAppStore.setState({
      preferences: prefs({ healthGoalTags: ['high_fiber'] }),
      currentPlan: null,
      savedPlans: [
        { id: 'd1', name: 'cu desert', savedAt: '2026-09-01', plan, preferences: prefs() },
      ],
      activeNotice: null,
    });
    useAppStore.getState().restoreSavedPlan('d1');

    const dessertMeals = useAppStore
      .getState()
      .currentPlan!.days.flatMap((d) => d.meals.filter((m) => m.slot === 'dessert'));
    dessertMeals.forEach((meal) => {
      expect(meal.recipe.suitableSlots).toContain('dessert');
    });
    expect(dessertMeals.map((m) => m.recipe.id)).toEqual(dessertsBefore);
  });
});

describe('înlocuirea manuală respectă „Fără porc”', () => {
  test('o rețetă cu porc e refuzată, iar planul rămâne neschimbat', () => {
    generatedUnder(prefs({ healthGoalTags: ['pork_free'] }));
    const before = plannedRecipes().map((r) => r.id);
    const pork = RECIPES.find((r) => r.id === 'sandvis_cald_cascaval_sunca')!;

    useAppStore.getState().replaceMealWithRecipe('monday', pork, 'dinner');

    expect(plannedRecipes().map((r) => r.id)).toEqual(before);
    expect(useAppStore.getState().activeNotice?.message).toContain('porc');
  });
});

describe('un plan care rămâne fără nicio zi sigură nu e salvat gol', () => {
  test('restaurarea e refuzată cu un mesaj, iar planul curent rămâne', () => {
    const dessertOnly = generatedUnder(prefs({ mealSlots: ['dessert'] }));
    expect(dessertOnly.days.length).toBeGreaterThan(0);
    const current = generatedUnder(prefs({ dietType: 'keto', dietTypes: ['keto'] }));

    useAppStore.setState({
      savedPlans: [
        {
          id: 'k1',
          name: 'doar deserturi',
          savedAt: '2026-09-01',
          plan: dessertOnly,
          preferences: prefs(),
        },
      ],
      activeNotice: null,
    });
    useAppStore.getState().restoreSavedPlan('k1');

    expect(useAppStore.getState().currentPlan!.id).toBe(current.id);
    expect(useAppStore.getState().activeNotice?.type).toBe('warning');
  });
});

describe('o protecție ilizibilă la pornire nu lasă planul vechi pe ecran', () => {
  async function bootWith(storedPrefs: unknown) {
    const plan = porkHeavyPlan();
    await AsyncStorage.clear();
    await AsyncStorage.setItem('@smartmeal_preferences', JSON.stringify(storedPrefs));
    await AsyncStorage.setItem('@smartmeal_current_plan', JSON.stringify(plan));
    useAppStore.setState({ currentPlan: null, isHydrated: false, activeNotice: null });
    await useAppStore.getState().hydrateStorage();
    return useAppStore.getState();
  }

  test('dieta coruptă: planul vechi e scos și utilizatorul e avertizat', async () => {
    const state = await bootWith({ ...prefs(), dietType: 'vegann', dietTypes: ['vegann'] });

    expect(state.currentPlan).toBeNull();
    expect(state.activeNotice?.type).toBe('warning');
  });

  test('obiectivele de sănătate corupte („Fără porc” poate fi pierdut): același tratament', async () => {
    const state = await bootWith({ ...prefs(), healthGoalTags: 'pork_free' });

    expect(state.currentPlan).toBeNull();
    expect(state.activeNotice?.type).toBe('warning');
    expect(state.activeNotice?.message).toContain('porc');
  });
});
