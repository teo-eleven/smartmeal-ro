import { useAppStore } from '../useAppStore';
import { getRecipeAllergens } from '../../utils/allergenFilter';
import { isRecipeMatchingDiets } from '../../utils/dietCompatibility';
import { hasRequiredAppliances } from '../../engine/plannerEngine';
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

function bootWithPlan() {
  useAppStore.setState({
    preferences: { ...BASE },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    activeNotice: null,
  });
  useAppStore.getState().generatePlan();
}

function bootWithoutPlan() {
  useAppStore.setState({
    preferences: { ...BASE },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    activeNotice: null,
  });
}

const meals = () => useAppStore.getState().currentPlan!.days.flatMap((day) => day.meals);

/**
 * These setters are the onboarding wizard's one-tap controls, and before a plan exists they
 * must stay free to pass through half-finished states. Once a plan exists they are reachable
 * again -- the wizard can be reopened over a live plan with ?onboarding=1 -- and then the
 * board has to follow the preferences instead of keeping meals they no longer allow.
 */
describe('setările pas-cu-pas reconstruiesc planul când există unul', () => {
  test('setDietType nu lasă mese în afara dietei', () => {
    bootWithPlan();
    useAppStore.getState().setDietType('vegan');

    expect(meals().filter((m) => !isRecipeMatchingDiets(m.recipe, ['vegan']))).toEqual([]);
  });

  test('setDietTypes nu lasă mese în afara dietei', () => {
    bootWithPlan();
    useAppStore.getState().setDietTypes(['vegetarian']);

    expect(meals().filter((m) => !isRecipeMatchingDiets(m.recipe, ['vegetarian']))).toEqual([]);
  });

  test('toggleDietType nu lasă mese în afara dietei adăugate', () => {
    // Omnivore and vegetarian cannot be combined, so the reachable pairing is a base diet
    // plus a restriction on top of it.
    bootWithPlan();
    useAppStore.getState().setDietTypes(['vegetarian']);
    useAppStore.getState().toggleDietType('gluten_free');

    const active = useAppStore.getState().preferences.dietTypes!;
    expect(active).toEqual(['vegetarian', 'gluten_free']);
    expect(meals().filter((m) => !isRecipeMatchingDiets(m.recipe, active))).toEqual([]);
  });

  test('toggleDietType reconstruiește și când scoate o dietă', () => {
    bootWithPlan();
    useAppStore.getState().setDietTypes(['vegetarian', 'gluten_free']);
    useAppStore.getState().toggleDietType('gluten_free');

    const active = useAppStore.getState().preferences.dietTypes!;
    expect(active).toEqual(['vegetarian']);
    expect(meals().filter((m) => !isRecipeMatchingDiets(m.recipe, active))).toEqual([]);
  });

  test('setPeopleCount aplică plafonul și reconstruiește planul', () => {
    bootWithPlan();
    useAppStore.getState().setPeopleCount(25);

    expect(useAppStore.getState().preferences.peopleCount).toBe(10);
    expect(useAppStore.getState().currentPlan!.peopleCount).toBe(10);
  });

  test('toggleAppliance nu lasă mese care cer aparatul scos', () => {
    bootWithPlan();
    useAppStore.getState().toggleAppliance('oven');

    const left = useAppStore.getState().preferences.appliances;
    expect(meals().filter((m) => !hasRequiredAppliances(m.recipe.appliances, left))).toEqual([]);
  });

  test('setCookingDays aduce planul la numărul de zile ales', () => {
    bootWithPlan();
    useAppStore.getState().setCookingDays(['monday', 'tuesday']);

    expect(useAppStore.getState().currentPlan!.days).toHaveLength(2);
  });

  test('toggleCookingDay aduce planul la numărul de zile ales', () => {
    bootWithPlan();
    useAppStore.getState().toggleCookingDay('friday');

    expect(useAppStore.getState().currentPlan!.days).toHaveLength(WEEK.length - 1);
  });

  test('setPeopleCount aduce planul la numărul de persoane ales', () => {
    bootWithPlan();
    useAppStore.getState().setPeopleCount(6);

    expect(useAppStore.getState().currentPlan!.peopleCount).toBe(6);
  });

  test('alergiile declarate rămân respectate după o schimbare de dietă', () => {
    bootWithPlan();
    useAppStore.getState().toggleAvoidedAllergen('lactate');
    useAppStore.getState().setDietTypes(['vegetarian']);

    expect(meals().filter((m) => getRecipeAllergens(m.recipe).includes('lactate'))).toEqual([]);
  });
});

describe('fluxul de onboarding rămâne neatins', () => {
  test('fără plan, setările se salvează fără să genereze nimic', () => {
    bootWithoutPlan();
    useAppStore.getState().setDietType('vegan');
    useAppStore.getState().setPeopleCount(4);
    useAppStore.getState().setCookingDays(['monday']);

    const state = useAppStore.getState();
    expect(state.currentPlan).toBeNull();
    expect(state.preferences.dietType).toBe('vegan');
    expect(state.preferences.peopleCount).toBe(4);
    expect(state.preferences.cookingDays).toEqual(['monday']);
  });

  test('fără plan, ultima zi de gătit este în continuare protejată', () => {
    bootWithoutPlan();
    WEEK.forEach((day) => useAppStore.getState().toggleCookingDay(day));

    // The store refuses to leave the week empty, with or without a plan.
    expect(useAppStore.getState().preferences.cookingDays).toHaveLength(1);
    expect(useAppStore.getState().currentPlan).toBeNull();
  });
});
