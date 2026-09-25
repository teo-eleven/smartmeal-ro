import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageService } from '../../services/storage';
import { useAppStore } from '../useAppStore';
import { DayOfWeek, UserPreferences } from '../../types';

const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const STORED: UserPreferences = {
  supermarketId: 'penny',
  peopleCount: 4,
  cookingDays: WEEK,
  budgetRon: 700,
  moodTags: ['speedy'],
  dietType: 'vegan',
  dietTypes: ['vegan'],
  appliances: ['hob', 'oven'],
  excludePantryStaples: true,
  pantryInventory: [],
  pantryStock: {},
  avoidedAllergens: ['arahide', 'gluten'],
  mealSlots: ['dinner'],
  foodTier: 'basic',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

const BROKEN_PLANS: [string, unknown][] = [
  ['o masă nulă', { id: 'x', days: [{ dayOfWeek: 'monday', meals: [null] }] }],
  ['o masă fără rețetă', { id: 'x', days: [{ dayOfWeek: 'monday', meals: [{ slot: 'dinner' }] }] }],
  ['o rețetă fără id', { id: 'x', days: [{ dayOfWeek: 'monday', meals: [{ slot: 'dinner', recipe: {} }] }] }],
  ['un slot inventat', { id: 'x', days: [{ dayOfWeek: 'monday', meals: [{ slot: 'brunch', recipe: { id: 'a' } }] }] }],
  ['days lipsă', { id: 'x' }],
];

/**
 * A single unreadable meal used to throw from deep inside hydration, into a catch that
 * discarded the preferences and the plan library it had already read successfully. The app
 * then started as an unrestricted omnivore with no allergies and said nothing at all.
 */
describe('un plan nelizibil nu mai costă preferințele', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test.each(BROKEN_PLANS)('%s: dieta și alergiile supraviețuiesc', async (_label, broken) => {
    useAppStore.setState({ preferences: { ...STORED }, currentPlan: null, groceryItems: [], savedPlans: [] });
    useAppStore.getState().generatePlan();
    useAppStore.getState().saveCurrentPlan('arhiva');
    await storageService.saveSavedPlans(useAppStore.getState().savedPlans);
    await storageService.savePreferences(STORED);
    await AsyncStorage.setItem('@smartmeal_current_plan', JSON.stringify(broken));

    useAppStore.setState({
      preferences: { ...STORED, dietType: 'omnivore', dietTypes: ['omnivore'], avoidedAllergens: [] },
      currentPlan: null,
      groceryItems: [],
      savedPlans: [],
      isHydrated: false,
      activeNotice: null,
    });
    await useAppStore.getState().hydrateStorage();

    const state = useAppStore.getState();
    expect(state.preferences.dietType).toBe('vegan');
    expect(state.preferences.avoidedAllergens).toEqual(['arahide', 'gluten']);
    expect(state.savedPlans).toHaveLength(1);
    expect(state.isHydrated).toBe(true);
  });

  test('utilizatorul este anunțat, nu lăsat să creadă că totul e în regulă', async () => {
    await storageService.savePreferences(STORED);
    await AsyncStorage.setItem(
      '@smartmeal_current_plan',
      JSON.stringify({ id: 'x', days: [{ dayOfWeek: 'monday', meals: [null] }] })
    );

    useAppStore.setState({ currentPlan: null, groceryItems: [], savedPlans: [], isHydrated: false, activeNotice: null });
    await useAppStore.getState().hydrateStorage();

    expect(useAppStore.getState().currentPlan).toBeNull();
    expect(useAppStore.getState().preferences.avoidedAllergens).toEqual(['arahide', 'gluten']);
  });

  test('un plan întreg este în continuare încărcat', async () => {
    useAppStore.setState({ preferences: { ...STORED }, currentPlan: null, groceryItems: [], savedPlans: [] });
    useAppStore.getState().generatePlan();
    await storageService.savePlanAndGrocery(
      useAppStore.getState().currentPlan,
      useAppStore.getState().groceryItems
    );
    await storageService.savePreferences(STORED);

    useAppStore.setState({ currentPlan: null, groceryItems: [], isHydrated: false });
    await useAppStore.getState().hydrateStorage();

    expect(useAppStore.getState().currentPlan).not.toBeNull();
    expect(useAppStore.getState().groceryItems.length).toBeGreaterThan(0);
  });
});
