import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageService } from '../storage';
import { useAppStore } from '../../store/useAppStore';
import { DayOfWeek, UserPreferences } from '../../types';

const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const STORED_PREFS: UserPreferences = {
  supermarketId: 'penny',
  peopleCount: 4,
  cookingDays: WEEK,
  budgetRon: 700,
  moodTags: ['speedy'],
  dietType: 'omnivore',
  dietTypes: ['omnivore'],
  appliances: ['hob', 'oven'],
  excludePantryStaples: true,
  pantryInventory: [],
  avoidedAllergens: ['nuci'],
  mealSlots: ['lunch', 'dinner'],
  foodTier: 'basic',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

const CORRUPT_PLANS: [string, unknown][] = [
  ['zi fără mese', { id: 'x', days: [{ dayOfWeek: 'monday' }] }],
  ['days lipsă', { id: 'x' }],
  ['days nu e listă', { id: 'x', days: 'luni' }],
  ['plan primitiv', 42],
  ['plan null în interior', { id: 'x', days: [null] }],
];

/**
 * A single unreadable current plan used to take the whole hydration down with it: the try
 * block spans the entire function, so the catch discarded the preferences and the plan
 * library that had already been read and validated successfully.
 */
describe('un plan curent corupt nu ia cu el restul datelor', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test.each(CORRUPT_PLANS)('%s: arhiva și preferințele supraviețuiesc', async (_label, corrupt) => {
    useAppStore.setState({ preferences: STORED_PREFS, currentPlan: null, groceryItems: [], savedPlans: [] });
    useAppStore.getState().generatePlan();
    useAppStore.getState().saveCurrentPlan('săptămâna reușită');
    await storageService.saveSavedPlans(useAppStore.getState().savedPlans);
    await storageService.savePreferences(STORED_PREFS);
    await AsyncStorage.setItem('@smartmeal_current_plan', JSON.stringify(corrupt));

    useAppStore.setState({
      preferences: { ...STORED_PREFS, peopleCount: 1, supermarketId: 'lidl' },
      currentPlan: null,
      groceryItems: [],
      savedPlans: [],
      isHydrated: false,
      activeNotice: null,
    });
    await useAppStore.getState().hydrateStorage();

    const state = useAppStore.getState();
    expect(state.savedPlans).toHaveLength(1);
    expect(state.savedPlans[0].name).toBe('săptămâna reușită');
    expect(state.preferences.peopleCount).toBe(4);
    expect(state.preferences.supermarketId).toBe('penny');
    expect(state.preferences.avoidedAllergens).toEqual(['nuci']);
    expect(state.isHydrated).toBe(true);
  });

  test('planul corupt este pur și simplu ignorat, nu afișat', async () => {
    await storageService.savePreferences(STORED_PREFS);
    await AsyncStorage.setItem('@smartmeal_current_plan', JSON.stringify({ id: 'x', days: 'luni' }));

    useAppStore.setState({ currentPlan: null, groceryItems: [], savedPlans: [], isHydrated: false });
    await useAppStore.getState().hydrateStorage();

    expect(useAppStore.getState().currentPlan).toBeNull();
  });

  test('un plan valid este în continuare încărcat', async () => {
    useAppStore.setState({ preferences: STORED_PREFS, currentPlan: null, groceryItems: [], savedPlans: [] });
    useAppStore.getState().generatePlan();
    await storageService.savePlanAndGrocery(
      useAppStore.getState().currentPlan,
      useAppStore.getState().groceryItems
    );
    await storageService.savePreferences(STORED_PREFS);

    useAppStore.setState({ currentPlan: null, groceryItems: [], savedPlans: [], isHydrated: false });
    await useAppStore.getState().hydrateStorage();

    expect(useAppStore.getState().currentPlan).not.toBeNull();
    expect(useAppStore.getState().currentPlan!.days.length).toBe(WEEK.length);
  });
});
