import { DEFAULT_PREFERENCES } from '../../store/defaults';
import type { HealthGoalTag, UserPreferences } from '../../types';
import {
  AppDevice,
  adminClient,
  assertLocalDatabaseIsUp,
  deleteUsers,
  makePlan,
  newAppDevice,
  signInOnDevice,
  signUpOnDevice,
  TEST_PASSWORD,
  uniqueEmail,
} from './syncHarness';

/**
 * A.11e against the real local database: two accounts on one phone, an account deleted from
 * elsewhere, a lock after thirty days, a server that cannot be reached, and odd payloads.
 */
const createdUsers: string[] = [];
const GOALS: HealthGoalTag[] = ['heart_healthy', 'pork_free'];
const SAFETY_TRACE = /health_?safety|safety_?answer|smartmeal_health|ios_goals_notice/i;
const POLL_STEP_MS = 20;
const POLL_LIMIT_MS = 3000;
const HUGE_LIST_SIZE = 4000;

/** Every Supabase client made after this line goes through it, so a test can cut the network. */
const realFetch = global.fetch;
let isOffline = false;
beforeAll(async () => {
  await assertLocalDatabaseIsUp();
  global.fetch = ((...args: Parameters<typeof fetch>) =>
    isOffline ? Promise.reject(new TypeError('Network request failed')) : realFetch(...args)) as typeof fetch;
});

afterEach(() => {
  isOffline = false;
  jest.restoreAllMocks();
});

afterAll(async () => {
  global.fetch = realFetch;
  const { data } = await adminClient().auth.admin.listUsers();
  const remaining = new Set((data?.users ?? []).map((user) => user.id));
  await deleteUsers(createdUsers.filter((id) => remaining.has(id)));
});

const withGoals = (goals: HealthGoalTag[]): UserPreferences => ({
  ...DEFAULT_PREFERENCES,
  healthGoalTags: goals,
});

async function waitUntil(isDone: () => Promise<boolean>): Promise<void> {
  const deadline = Date.now() + POLL_LIMIT_MS;
  while (Date.now() < deadline) {
    if (await isDone()) return;
    await new Promise((resolve) => setTimeout(resolve, POLL_STEP_MS));
  }
}

function showAccount(phone: AppDevice, email: string, preferences: UserPreferences) {
  phone.store.setState({
    userEmail: email,
    dataOwnerEmail: email,
    authStatus: 'signedIn',
    preferences,
    currentPlan: makePlan(preferences),
  });
}

async function newAccount(label: string, phone: AppDevice = newAppDevice()) {
  const email = uniqueEmail(label);
  const userId = await signUpOnDevice(phone.sync, email);
  createdUsers.push(userId);
  return { email, userId, phone };
}

async function cloudPreferences(userId: string): Promise<UserPreferences> {
  const { data, error } = await adminClient()
    .from('user_meal_plans')
    .select('preferences')
    .eq('user_id', userId)
    .single();
  expect(error).toBeNull();
  return data?.preferences as UserPreferences;
}

function plannerSees(phone: AppDevice) {
  jest.restoreAllMocks();
  const spy = jest.spyOn(phone.planner, 'generateMealPlan');
  expect(phone.store.getState().generatePlan()).toBe(true);
  return spy.mock.calls.map(([prefs]) => prefs.healthGoalTags);
}

describe('two accounts on one phone', () => {
  test("A's \"yes\" does not follow B: B's cloud goals apply only after B answers", async () => {
    const { phone } = await newAccount('boundary-a');
    const accountB = await newAccount('boundary-b');
    // B's goals were uploaded from B's own phone, with B's own "no".
    showAccount(accountB.phone, accountB.email, withGoals(GOALS));
    await accountB.phone.store.getState().syncWithCloud();
    expect((await cloudPreferences(accountB.userId)).healthGoalTags).toEqual(GOALS);

    // On the shared phone, A answers "yes" ...
    const emailA = phone.store.getState().userEmail ?? uniqueEmail('boundary-a2');
    showAccount(phone, emailA, DEFAULT_PREFERENCES);
    await phone.safety.getState().setAnswer('yes');
    // ... then A signs out and B signs in.
    await phone.store.getState().signOutToLogin();
    await signInOnDevice(phone.sync, accountB.email);
    phone.store.getState().setUserEmail(accountB.email);
    await waitUntil(async () => (await phone.storage.getItem(phone.safetyKey)) === null);
    expect(phone.safety.getState().answer).toBeNull();

    await phone.store.getState().syncFromCloud();

    // The goals arrive as data, but nothing applies them until B says "no".
    expect(phone.store.getState().preferences.healthGoalTags).toEqual(GOALS);
    for (const seen of plannerSees(phone)) expect(seen).toEqual(['pork_free']);
    await phone.safety.getState().setAnswer('no');
    for (const seen of plannerSees(phone)) expect(seen).toEqual(GOALS);
  });

  test('a phone switched to another account without signing out still starts the new one unanswered', async () => {
    const accountA = await newAccount('switch-a');
    showAccount(accountA.phone, accountA.email, withGoals(GOALS));
    await accountA.phone.safety.getState().setAnswer('yes');
    const accountB = await newAccount('switch-b', accountA.phone);

    accountA.phone.store.getState().setUserEmail(accountB.email);
    await waitUntil(async () => (await accountA.phone.storage.getItem(accountA.phone.safetyKey)) === null);

    expect(accountA.phone.safety.getState().answer).toBeNull();
    expect(accountA.phone.store.getState().preferences.healthGoalTags ?? []).toEqual([]);
  });

  test("deleting account A from another device leaves B's local data and answer untouched", async () => {
    const accountA = await newAccount('del-a');
    const phoneOfB = newAppDevice();
    const accountB = await newAccount('del-b', phoneOfB);
    showAccount(phoneOfB, accountB.email, withGoals(['pork_free']));
    await phoneOfB.safety.getState().setAnswer('yes');
    const otherPhone = newAppDevice();
    await signInOnDevice(otherPhone.sync, accountA.email);

    const result = await otherPhone.sync.deleteAccount(TEST_PASSWORD);
    expect(result).toEqual({ success: true, error: null });

    expect(phoneOfB.safety.getState().answer).toBe('yes');
    expect(await phoneOfB.storage.getItem(phoneOfB.safetyKey)).toBe('yes');
    expect(phoneOfB.store.getState().preferences.healthGoalTags).toEqual(['pork_free']);
    expect((await phoneOfB.sync.loadMealPlan(accountB.userId)).error).toBeNull();
  });
});

describe('a session that expires (documented: the answer stays with the phone)', () => {
  test('keeping local data on expiry keeps the answer; the same account back in keeps it; another account clears it', async () => {
    const accountA = await newAccount('expiry');
    const { phone } = accountA;
    showAccount(phone, accountA.email, withGoals(['pork_free']));
    await phone.safety.getState().setAnswer('yes');

    phone.store.getState().setUserEmail(null, { keepLocalData: true });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(phone.safety.getState().answer).toBe('yes');
    expect(await phone.storage.getItem(phone.safetyKey)).toBe('yes');

    phone.store.getState().setUserEmail(accountA.email);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(phone.safety.getState().answer).toBe('yes');

    const accountB = await newAccount('expiry-other', phone);
    phone.store.getState().setUserEmail(accountB.email);
    await waitUntil(async () => (await phone.storage.getItem(phone.safetyKey)) === null);
    expect(phone.safety.getState().answer).toBeNull();
  });
});

describe('the server cannot be reached', () => {
  test('a sync with a "yes" fails softly, leaks nothing, and works when the network is back', async () => {
    const { phone, userId, email } = await newAccount('offline');
    showAccount(phone, email, withGoals(['pork_free']));
    await phone.safety.getState().setAnswer('yes');
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    isOffline = true;
    await expect(phone.store.getState().syncWithCloud()).resolves.toBeUndefined();

    expect(phone.store.getState().isSyncing).toBe(false);
    expect(phone.store.getState().activeNotice).not.toBeNull();
    expect(phone.safety.getState().answer).toBe('yes');
    isOffline = false;
    const { data } = await adminClient().from('user_meal_plans').select('*').eq('user_id', userId);
    expect(data).toEqual([]);

    phone.store.setState({ activeNotice: null });
    await phone.store.getState().syncWithCloud();
    const { data: after } = await adminClient()
      .from('user_meal_plans')
      .select('*')
      .eq('user_id', userId);
    expect(after).toHaveLength(1);
    expect(SAFETY_TRACE.test(JSON.stringify(after))).toBe(false);
  });

  test('a download while offline leaves the local plan and answer alone', async () => {
    const { phone, email } = await newAccount('offline-down');
    showAccount(phone, email, withGoals(['pork_free']));
    await phone.safety.getState().setAnswer('yes');
    const before = phone.store.getState().currentPlan;
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    isOffline = true;
    await expect(phone.store.getState().syncFromCloud()).resolves.toBeUndefined();

    expect(phone.store.getState().currentPlan).toBe(before);
    expect(phone.safety.getState().answer).toBe('yes');
  });
});

describe('odd payloads', () => {
  test('a very large preferences object saves, loads on another phone and carries no answer', async () => {
    const { phone, userId, email } = await newAccount('huge');
    const huge: UserPreferences = {
      ...withGoals(GOALS),
      selectedSnackIds: Array.from({ length: HUGE_LIST_SIZE }, (_, i) => `snack-${i}`),
    };
    showAccount(phone, email, huge);
    await phone.safety.getState().setAnswer('yes');

    await phone.store.getState().syncWithCloud();

    expect(phone.store.getState().cloudConflictVersion).toBeNull();
    const stored = await cloudPreferences(userId);
    expect(stored.healthGoalTags).toEqual(GOALS);
    expect(SAFETY_TRACE.test(JSON.stringify(stored))).toBe(false);
    const other = newAppDevice();
    await signInOnDevice(other.sync, email);
    await expect(other.sync.loadMealPlan(userId)).resolves.toMatchObject({ error: null });
  });

  test.each(['Pacific/Kiritimati', 'America/Los_Angeles', 'UTC'])(
    'the same goals restore the same way in time zone %s',
    async (zone) => {
      const original = process.env.TZ;
      process.env.TZ = zone;
      try {
        const a = await newAccount(`tz-${zone.length}`);
        showAccount(a.phone, a.email, withGoals(GOALS));
        await a.phone.store.getState().syncWithCloud();
        const b = newAppDevice();
        await signInOnDevice(b.sync, a.email);
        await b.safety.getState().setAnswer('yes');
        b.store.setState({ userEmail: a.email, dataOwnerEmail: a.email, authStatus: 'signedIn' });

        await b.store.getState().syncFromCloud();

        expect(b.store.getState().preferences.healthGoalTags).toEqual(['pork_free']);
      } finally {
        if (original === undefined) delete process.env.TZ;
        else process.env.TZ = original;
      }
    }
  );
});
