import { useAppStore } from '../useAppStore';
import { storageService } from '../../services/storage';
import { reminderScheduler } from '../../services/reminderScheduler';
import { RESCHEDULE_DEBOUNCE_MS, startReminderSync } from '../reminderSync';
import { DEFAULT_REMINDERS, DayOfWeek, UserPreferences } from '../../types';

jest.mock('../../services/reminderScheduler', () => ({
  reminderScheduler: {
    reschedule: jest.fn(async () => 3),
    cancelAll: jest.fn(async () => undefined),
    ensurePermission: jest.fn(async () => true),
  },
}));

const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday'];

const PREFS: UserPreferences = {
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
  mealSlots: ['dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

function boot() {
  useAppStore.setState({
    preferences: { ...PREFS },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    reminders: { ...DEFAULT_REMINDERS },
    userEmail: null,
    activeNotice: null,
  });
  useAppStore.getState().generatePlan();
}

beforeEach(() => {
  jest.clearAllMocks();
  boot();
});

/**
 * The reminders work without an account, because they are scheduled on the phone. The
 * account only carries the choice to a second device.
 */
describe('setările de memento', () => {
  test('pornesc oprite', () => {
    expect(useAppStore.getState().reminders).toEqual(DEFAULT_REMINDERS);
  });

  // Rescheduling itself goes through reminderSync, debounced (F7); see reminderSync.test.ts.
  test('o schimbare reprogramează, prin reminderSync, cu planul curent', async () => {
    const stop = startReminderSync();
    await new Promise((resolve) => setTimeout(resolve, RESCHEDULE_DEBOUNCE_MS + 50));
    (reminderScheduler.reschedule as jest.Mock).mockClear();

    useAppStore.getState().updateReminders({ cookingEnabled: true });
    await new Promise((resolve) => setTimeout(resolve, RESCHEDULE_DEBOUNCE_MS + 50));
    stop();

    const [settings, plan] = (reminderScheduler.reschedule as jest.Mock).mock.calls[0];
    expect(settings.cookingEnabled).toBe(true);
    expect(plan).toBe(useAppStore.getState().currentPlan);
  });

  test('funcționează și fără cont', () => {
    expect(useAppStore.getState().userEmail).toBeNull();

    useAppStore.getState().updateReminders({ shoppingEnabled: true, shoppingWeekday: 2 });

    expect(useAppStore.getState().reminders.shoppingWeekday).toBe(2);
  });

  test('alegerile se scriu local, ca să supraviețuiască repornirii', async () => {
    useAppStore.getState().updateReminders({ cookingEnabled: true, cookingTime: '18:30' });

    const stored = await storageService.loadReminders();
    expect(stored).toMatchObject({ cookingEnabled: true, cookingTime: '18:30' });
  });

  test('se încarcă înapoi la pornire', async () => {
    useAppStore.getState().updateReminders({ cookingEnabled: true, cookingTime: '19:00' });

    useAppStore.setState({ reminders: { ...DEFAULT_REMINDERS }, isHydrated: false });
    await useAppStore.getState().hydrateStorage();

    expect(useAppStore.getState().reminders.cookingTime).toBe('19:00');
  });

  test('deconectarea oprește mementourile contului anterior', () => {
    useAppStore.getState().setUserEmail('a@b.ro');
    jest.clearAllMocks();

    useAppStore.getState().setUserEmail(null);

    expect(reminderScheduler.cancelAll).toHaveBeenCalled();
  });
});
