import AsyncStorage from '@react-native-async-storage/async-storage';
import * as engine from '../../engine/plannerEngine';
import { useAppStore } from '../useAppStore';
import { useHealthSafetyStore } from '../healthSafetyStore';
import { applyCloudPlan } from '../storeTransforms';
import * as platformHealth from '../../utils/platformHealth';
import { DayOfWeek, HealthGoalTag, MealPlan, UserPreferences } from '../../types';

jest.mock('../../engine/plannerEngine', () => {
  const actual = jest.requireActual('../../engine/plannerEngine');
  return {
    ...actual,
    generateMealPlan: jest.fn(actual.generateMealPlan),
    checkPlanFeasibility: jest.fn(actual.checkPlanFeasibility),
    getEligibleRecipes: jest.fn(actual.getEligibleRecipes),
  };
});

const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const GOALS: HealthGoalTag[] = ['high_fiber', 'pork_free'];

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
  healthGoalTags: GOALS,
};

const generate = engine.generateMealPlan as jest.Mock;
const feasibility = engine.checkPlanFeasibility as jest.Mock;

const lastGoals = (mock: jest.Mock) => mock.mock.calls[mock.mock.calls.length - 1][0].healthGoalTags;
const setAnswer = (answer: 'yes' | 'no' | null) =>
  useHealthSafetyStore.setState({ answer, isLoaded: true });

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  setAnswer(null);
  useAppStore.setState({
    preferences: { ...BASE },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    activeNotice: null,
  });
});

describe('health goals reach the planner only after a "no" (A.7e-2)', () => {
  test.each([
    ['null', null, ['pork_free']],
    ['yes', 'yes', ['pork_free']],
    ['no', 'no', ['high_fiber', 'pork_free']],
  ] as const)('generatePlan with answer %s hands the engine %j', (_n, answer, expected) => {
    setAnswer(answer);

    useAppStore.getState().generatePlan();

    expect(lastGoals(generate)).toEqual(expected);
    expect(lastGoals(feasibility)).toEqual(expected);
  });

  test('stored preferences are not rewritten by generating under a missing answer', () => {
    useAppStore.getState().generatePlan();

    expect(useAppStore.getState().preferences.healthGoalTags).toEqual(GOALS);
  });

  test('reshuffling a plan under a missing answer does not apply goals', () => {
    setAnswer('no');
    useAppStore.getState().generatePlan();
    setAnswer(null);
    generate.mockClear();

    useAppStore.getState().reshufflePlan();

    expect(generate).toHaveBeenCalled();
    expect(lastGoals(generate)).toEqual(['pork_free']);
  });

  test('rebuilding after a preference change under "yes" does not apply goals', () => {
    setAnswer('no');
    useAppStore.getState().generatePlan();
    setAnswer('yes');
    generate.mockClear();

    useAppStore.getState().setMealsPerDayCount(2);

    expect(lastGoals(generate)).toEqual(['pork_free']);
  });
});

describe('under "yes" no write path keeps a health goal (A.7e-2)', () => {
  beforeEach(() => setAnswer('yes'));

  test('setHealthGoalTags drops the blocked goals and keeps pork-free', () => {
    useAppStore.getState().setHealthGoalTags(['heart_healthy', 'pork_free']);

    expect(useAppStore.getState().preferences.healthGoalTags).toEqual(['pork_free']);
  });

  test('toggleHealthGoalTag cannot add a blocked goal', () => {
    useAppStore.setState({ preferences: { ...BASE, healthGoalTags: [] } });

    useAppStore.getState().toggleHealthGoalTag('heart_healthy');

    expect(useAppStore.getState().preferences.healthGoalTags).toEqual([]);
  });

  test('toggleHealthGoalTag still adds pork-free', () => {
    useAppStore.setState({ preferences: { ...BASE, healthGoalTags: [] } });

    useAppStore.getState().toggleHealthGoalTag('pork_free');

    expect(useAppStore.getState().preferences.healthGoalTags).toEqual(['pork_free']);
  });

  test('under "no" goals are kept as chosen', () => {
    setAnswer('no');
    useAppStore.getState().setHealthGoalTags(['heart_healthy', 'pork_free']);

    expect(useAppStore.getState().preferences.healthGoalTags).toEqual([
      'heart_healthy',
      'pork_free',
    ]);
  });
});

describe('hydrate decides after the stored answer is read (A.7e-2)', () => {
  async function boot(answer: string | null) {
    await AsyncStorage.clear();
    await AsyncStorage.setItem('@smartmeal_preferences', JSON.stringify(BASE));
    if (answer) await AsyncStorage.setItem('@smartmeal_health_safety_answer', answer);
    useHealthSafetyStore.setState({ answer: null, isLoaded: false });
    useAppStore.setState({
      preferences: { ...BASE, healthGoalTags: [] },
      currentPlan: null,
      isHydrated: false,
    });
    await useAppStore.getState().hydrateStorage();
    return useAppStore.getState();
  }

  test('stored goals + stored "yes" are stripped, and the strip is saved', async () => {
    const state = await boot('yes');

    expect(state.preferences.healthGoalTags).toEqual(['pork_free']);
    const saved = JSON.parse((await AsyncStorage.getItem('@smartmeal_preferences'))!);
    expect(saved.healthGoalTags).toEqual(['pork_free']);
  });

  test('stored goals + stored "no" stay', async () => {
    const state = await boot('no');

    expect(state.preferences.healthGoalTags).toEqual(GOALS);
  });

  test('stored goals + no answer stay stored (asked later), but are loaded as unanswered', async () => {
    const state = await boot(null);

    expect(state.preferences.healthGoalTags).toEqual(GOALS);
    expect(useHealthSafetyStore.getState().isLoaded).toBe(true);
    expect(useHealthSafetyStore.getState().answer).toBeNull();
  });
});

describe('cloud restore under "yes" (A.7e-2)', () => {
  const plan = { days: [] } as unknown as MealPlan;

  test('applyCloudPlan strips goals arriving from the cloud when the local answer is "yes"', () => {
    setAnswer('yes');
    useAppStore.getState().generatePlan();
    const state = useAppStore.getState();
    const cloud = { plan: state.currentPlan ?? plan, preferences: BASE, updatedAt: 'x' };

    const result = applyCloudPlan(state, cloud);

    expect(result.preferences?.healthGoalTags).toEqual(['pork_free']);
  });

  test('applyCloudPlan keeps goals when the local answer is "no"', () => {
    setAnswer('no');
    useAppStore.getState().generatePlan();
    const state = useAppStore.getState();
    const cloud = { plan: state.currentPlan!, preferences: BASE, updatedAt: 'x' };

    const result = applyCloudPlan(state, cloud);

    expect(result.preferences?.healthGoalTags).toEqual(GOALS);
  });
});

describe('on iOS health goals are kept in the data but never applied (A.8)', () => {
  beforeEach(() => jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(false));
  afterEach(() => jest.restoreAllMocks());

  test('even after a "no", the planner sees pork-free only', () => {
    setAnswer('no');

    useAppStore.getState().generatePlan();

    expect(lastGoals(generate)).toEqual(['pork_free']);
    expect(lastGoals(feasibility)).toEqual(['pork_free']);
  });

  test('generating and rebuilding leave the stored goals as they were', () => {
    setAnswer('no');
    useAppStore.getState().generatePlan();
    useAppStore.getState().setMealsPerDayCount(2);

    expect(useAppStore.getState().preferences.healthGoalTags).toEqual(GOALS);
  });

  test('a cloud restore keeps the goals it brings, for the platforms that apply them', () => {
    setAnswer('no');
    useAppStore.getState().generatePlan();
    const state = useAppStore.getState();
    const cloud = { plan: state.currentPlan!, preferences: BASE, updatedAt: 'x' };

    const result = applyCloudPlan(state, cloud);

    expect(result.preferences?.healthGoalTags).toEqual(GOALS);
  });
});
