import * as Notifications from 'expo-notifications';
import { reminderScheduler } from '../reminderScheduler';
import { useAppStore } from '../../store/useAppStore';
import { DayOfWeek, ReminderSettings, UserPreferences } from '../../types';

jest.mock('expo-notifications', () => {
  const scheduled: { identifier: string; content: { data?: Record<string, unknown> } }[] = [];
  // Mutated by the tests rather than replaced, because the module namespace is read-only.
  const permission = { granted: true, canAskAgain: true };
  let n = 0;

  return {
    __scheduled: scheduled,
    __permission: permission,
    SchedulableTriggerInputTypes: { WEEKLY: 'weekly' },
    getPermissionsAsync: jest.fn(async () => ({ ...permission })),
    requestPermissionsAsync: jest.fn(async () => ({ granted: permission.granted })),
    getAllScheduledNotificationsAsync: jest.fn(async () => scheduled),
    scheduleNotificationAsync: jest.fn(async (req: { content: unknown; trigger: unknown }) => {
      n += 1;
      scheduled.push({ identifier: `id-${n}`, ...(req as object) } as never);
      return `id-${n}`;
    }),
    cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
      const i = scheduled.findIndex((s) => s.identifier === id);
      if (i >= 0) scheduled.splice(i, 1);
    }),
  };
});

const mock = Notifications as unknown as {
  __scheduled: { identifier: string; content: { data?: Record<string, unknown> } }[];
  __permission: { granted: boolean; canAskAgain: boolean };
};

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

const ON: ReminderSettings = {
  cookingEnabled: true,
  cookingTime: '17:30',
  shoppingEnabled: true,
  shoppingWeekday: 5,
  shoppingTime: '10:00',
};

function planOf(days: DayOfWeek[]) {
  useAppStore.setState({
    preferences: { ...PREFS, cookingDays: days },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
  });
  useAppStore.getState().generatePlan();
  return useAppStore.getState().currentPlan!;
}

beforeEach(() => {
  mock.__scheduled.length = 0;
  mock.__permission.granted = true;
  mock.__permission.canAskAgain = true;
  jest.clearAllMocks();
});

/**
 * Reminders are scheduled on the device, so a phone with no signal still nudges at dinner
 * time. Rescheduling has to be idempotent: notifications survive app restarts, so adding
 * without cancelling is how someone ends up with four copies of the same nudge.
 */
describe('programarea mementourilor', () => {
  test('oprite complet, nu se programează nimic', async () => {
    const count = await reminderScheduler.reschedule(
      { ...ON, cookingEnabled: false, shoppingEnabled: false },
      planOf(WEEK)
    );

    expect(count).toBe(0);
    expect(mock.__scheduled).toHaveLength(0);
  });

  test('un memento pentru fiecare zi de gătit, plus unul de cumpărături', async () => {
    const count = await reminderScheduler.reschedule(ON, planOf(WEEK));

    expect(count).toBe(WEEK.length + 1);
  });

  test('mementoul de gătit spune ce gătești', async () => {
    const plan = planOf(WEEK);
    await reminderScheduler.reschedule({ ...ON, shoppingEnabled: false }, plan);

    const bodies = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.map(
      (c) => c[0].content.body
    );
    expect(bodies[0]).toContain(plan.days[0].meals[0].recipe.title);
  });

  test('reprogramarea nu adună duplicate', async () => {
    await reminderScheduler.reschedule(ON, planOf(WEEK));
    const first = mock.__scheduled.length;

    await reminderScheduler.reschedule(ON, planOf(WEEK));

    expect(mock.__scheduled).toHaveLength(first);
  });

  test('nu șterge notificările altor aplicații', async () => {
    mock.__scheduled.push({ identifier: 'altcineva', content: { data: { source: 'alta-app' } } });

    await reminderScheduler.reschedule(ON, planOf(WEEK));
    await reminderScheduler.cancelAll();

    expect(mock.__scheduled.map((s) => s.identifier)).toEqual(['altcineva']);
  });

  test('fără permisiune nu se programează nimic', async () => {
    mock.__permission.granted = false;
    mock.__permission.canAskAgain = false;

    const count = await reminderScheduler.reschedule(ON, planOf(WEEK));

    expect(count).toBe(0);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('o oră scrisă greșit nu programează nimic în loc să programeze aiurea', async () => {
    const count = await reminderScheduler.reschedule(
      { ...ON, cookingTime: '25:99', shoppingEnabled: false },
      planOf(WEEK)
    );

    expect(count).toBe(0);
  });

  test('fără plan, mementoul de gătit nu are ce anunța, dar cel de cumpărături rămâne', async () => {
    const count = await reminderScheduler.reschedule(ON, null);

    expect(count).toBe(1);
  });
});
