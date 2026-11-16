import { PRIVACY_POLICY_VERSION } from '../../../config/legal';
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
 * Etapa A guarantees against the local database: the health safety answer never leaves the
 * phone, a "yes" strips health goals from what a phone adopts, iOS keeps goals in the data,
 * and the answer follows the person, not the phone.
 */
const createdUsers: string[] = [];
const GOALS: HealthGoalTag[] = ['heart_healthy', 'pork_free'];
const SAFETY_TRACE = /health_?safety|safety_?answer|smartmeal_health|ios_goals_notice/i;
const POLL_STEP_MS = 20;
const POLL_LIMIT_MS = 3000;

const withGoals = (goals: HealthGoalTag[]): UserPreferences => ({
  ...DEFAULT_PREFERENCES,
  healthGoalTags: goals,
});

beforeAll(async () => {
  await assertLocalDatabaseIsUp();
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  const { data } = await adminClient().auth.admin.listUsers();
  const remaining = new Set((data?.users ?? []).map((user) => user.id));
  await deleteUsers(createdUsers.filter((id) => remaining.has(id)));
});

/** Account resets are fire-and-forget in the app; wait until storage shows the result. */
async function waitUntil(isDone: () => Promise<boolean>): Promise<void> {
  const deadline = Date.now() + POLL_LIMIT_MS;
  while (Date.now() < deadline) {
    if (await isDone()) return;
    await new Promise((resolve) => setTimeout(resolve, POLL_STEP_MS));
  }
}

/** A phone signed in to a fresh account, with the store showing that account and a plan. */
async function signedInPhone(label: string, preferences: UserPreferences = DEFAULT_PREFERENCES) {
  const email = uniqueEmail(label);
  const phone = newAppDevice();
  const userId = await signUpOnDevice(phone.sync, email);
  createdUsers.push(userId);
  openAccountInStore(phone, email, preferences);
  return { email, userId, phone };
}

function openAccountInStore(phone: AppDevice, email: string, preferences: UserPreferences) {
  phone.store.setState({
    userEmail: email,
    dataOwnerEmail: email,
    authStatus: 'signedIn',
    preferences,
    currentPlan: makePlan(preferences),
  });
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

describe('the health safety answer stays on the phone', () => {
  test('no user-owned row in the cloud contains the answer or its key', async () => {
    const { email, userId, phone } = await signedInPhone('safety-local', withGoals(['pork_free']));
    await phone.safety.getState().setAnswer('yes');
    await phone.store.getState().syncWithCloud();
    await phone.sync.saveReminders(userId, { cookingEnabled: true });
    await phone.sync.signInWithEmail(email, TEST_PASSWORD); // registers the device row too
    expect(await phone.storage.getItem(phone.safetyKey)).toBe('yes');

    const admin = adminClient();
    const tables = [
      'user_meal_plans',
      'profiles',
      'user_reminders',
      'user_recipe_notes',
      'user_devices',
      'user_consents',
    ];
    const seen: Record<string, number> = {};
    for (const table of tables) {
      const { data, error } = await admin.from(table).select('*').eq('user_id', userId);
      // A failed query has no rows either; it must not pass for "nothing found".
      expect({ table, error }).toEqual({ table, error: null });
      seen[table] = data?.length ?? 0;
      expect({ table, trace: SAFETY_TRACE.test(JSON.stringify(data)) }).toEqual({
        table,
        trace: false,
      });
    }
    // The plan row exists, so the check above had something real to look at.
    expect(seen.user_meal_plans).toBe(1);
  });
});

describe('restoring a cloud plan after a "yes"', () => {
  test('keeps only pork-free on the phone and the plan generation applies no health goal', async () => {
    const { email, userId, phone: deviceA } = await signedInPhone('restore-a', withGoals(GOALS));
    await deviceA.store.getState().syncWithCloud();
    expect((await cloudPreferences(userId)).healthGoalTags).toEqual(GOALS);

    const deviceB = newAppDevice();
    await signInOnDevice(deviceB.sync, email);
    await deviceB.safety.getState().setAnswer('yes');
    deviceB.store.setState({ userEmail: email, dataOwnerEmail: email, authStatus: 'signedIn' });

    // Nothing local to lose, so the cloud plan is applied without a confirmation.
    await deviceB.store.getState().syncFromCloud();

    const adopted = deviceB.store.getState().preferences;
    expect(adopted.healthGoalTags).toEqual(['pork_free']);
    expect(JSON.parse((await deviceB.storage.getItem('@smartmeal_preferences')) ?? 'null')).toEqual(
      expect.objectContaining({ healthGoalTags: ['pork_free'] })
    );

    // Even with the goals put back in memory, generation does not see them.
    const generate = jest.spyOn(deviceB.planner, 'generateMealPlan');
    deviceB.store.setState({ preferences: withGoals(GOALS) });
    expect(deviceB.store.getState().generatePlan()).toBe(true);
    expect(generate).toHaveBeenCalled();
    for (const [passed] of generate.mock.calls) {
      expect(passed.healthGoalTags).toEqual(['pork_free']);
    }
  });

  test('accepted consequence: the next upload from that phone strips the goals from the account', async () => {
    const { email, userId, phone: deviceA } = await signedInPhone('restore-strip', withGoals(GOALS));
    await deviceA.store.getState().syncWithCloud();
    const deviceB = newAppDevice();
    await signInOnDevice(deviceB.sync, email);
    await deviceB.safety.getState().setAnswer('yes');
    deviceB.store.setState({ userEmail: email, dataOwnerEmail: email, authStatus: 'signedIn' });
    await deviceB.store.getState().syncFromCloud();
    expect((await cloudPreferences(userId)).healthGoalTags).toEqual(GOALS);

    await deviceB.store.getState().syncWithCloud();

    expect(deviceB.store.getState().cloudConflictVersion).toBeNull();
    expect((await cloudPreferences(userId)).healthGoalTags).toEqual(['pork_free']);
  });
});

describe('a phone that hides health goals (iOS)', () => {
  test('uploads preferences with their health goals unchanged', async () => {
    const { userId, phone } = await signedInPhone('ios-goals', withGoals(GOALS));
    jest.spyOn(phone.platformHealth, 'areHealthGoalsAvailable').mockReturnValue(false);
    await phone.safety.getState().setAnswer('no');

    await phone.store.getState().syncWithCloud();

    expect((await cloudPreferences(userId)).healthGoalTags).toEqual(GOALS);
    // On this phone the goals are kept in the data and left out of what the planner sees.
    expect(phone.store.getState().preferences.healthGoalTags).toEqual(GOALS);
  });
});

describe('the answer follows the person, not the phone', () => {
  test('signing out clears it from memory and storage, and the next account is unanswered', async () => {
    const { phone } = await signedInPhone('signout-safety');
    await phone.safety.getState().setAnswer('yes');
    expect(await phone.storage.getItem(phone.safetyKey)).toBe('yes');

    await phone.store.getState().signOutToLogin();
    await waitUntil(async () => (await phone.storage.getItem(phone.safetyKey)) === null);

    expect(phone.safety.getState().answer).toBeNull();
    expect(await phone.storage.getItem(phone.safetyKey)).toBeNull();

    const nextEmail = uniqueEmail('signout-next');
    createdUsers.push(await signUpOnDevice(phone.sync, nextEmail));
    phone.store.getState().setUserEmail(nextEmail);
    phone.safety.setState({ isLoaded: false });
    await phone.safety.getState().load();
    expect(phone.safety.getState().answer).toBeNull();
  });

  test('another account signing in on the same phone starts unanswered', async () => {
    const { phone } = await signedInPhone('switch-safety');
    await phone.safety.getState().setAnswer('yes');

    const otherEmail = uniqueEmail('switch-other');
    createdUsers.push(await signUpOnDevice(phone.sync, otherEmail));
    phone.store.getState().setUserEmail(otherEmail);
    await waitUntil(async () => (await phone.storage.getItem(phone.safetyKey)) === null);

    expect(phone.safety.getState().answer).toBeNull();
    expect(await phone.storage.getItem(phone.safetyKey)).toBeNull();
  });
});

describe('the consent record of a new account', () => {
  test('carries the current privacy policy version and the health data consent', async () => {
    const { userId, phone } = await signedInPhone('consent');

    const { data, error } = await adminClient()
      .from('user_consents')
      .select('privacy_policy_version, health_data_consent')
      .eq('user_id', userId)
      .single();

    expect(error).toBeNull();
    expect(PRIVACY_POLICY_VERSION).toBe('2026-11-06');
    expect(data).toEqual({
      privacy_policy_version: PRIVACY_POLICY_VERSION,
      health_data_consent: true,
    });
    expect(await phone.sync.loadConsent(userId)).toMatchObject({
      privacy_policy_version: PRIVACY_POLICY_VERSION,
    });
  });
});

describe('deleting the account (edge function delete-account)', () => {
  test('also resets the safety answer kept on the phone', async () => {
    const { userId, phone } = await signedInPhone('delete-safety');
    await phone.safety.getState().setAnswer('yes');
    await phone.iosNotice.getState().acknowledge();

    const result = await phone.sync.deleteAccount(TEST_PASSWORD);
    expect(result).toEqual({ success: true, error: null });
    // What the delete button does next: the screen reports the user gone.
    phone.store.getState().setUserEmail(null);
    await waitUntil(async () => (await phone.storage.getItem(phone.safetyKey)) === null);

    expect(phone.safety.getState().answer).toBeNull();
    expect(await phone.storage.getItem(phone.safetyKey)).toBeNull();
    const { data } = await adminClient().auth.admin.getUserById(userId);
    expect(data.user).toBeNull();
  });
});
