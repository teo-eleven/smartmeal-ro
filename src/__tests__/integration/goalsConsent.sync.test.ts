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
  uniqueEmail,
} from './syncHarness';

/**
 * The 2026-11-17 review against the local database. M2: the consent records whether health
 * goals were included, and goals are not uploaded before the account has agreed. M3: an
 * iPhone neither loads the cloud's goals nor overwrites them.
 */
const createdUsers: string[] = [];
const HEART: HealthGoalTag = 'heart_healthy';
const FIBER: HealthGoalTag = 'high_fiber';
const PORK: HealthGoalTag = 'pork_free';

const withGoals = (goals: HealthGoalTag[], extra: Partial<UserPreferences> = {}) => ({
  ...DEFAULT_PREFERENCES,
  healthGoalTags: goals,
  ...extra,
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

const goalsUnavailable = (phone: AppDevice) =>
  jest.spyOn(phone.platformHealth, 'areHealthGoalsAvailable').mockReturnValue(false);

function openAccount(phone: AppDevice, email: string, preferences: UserPreferences) {
  phone.store.setState({
    userEmail: email,
    dataOwnerEmail: email,
    authStatus: 'signedIn',
    preferences,
    currentPlan: makePlan(preferences),
  });
}

/** A phone (Android/web: goals available) with an account whose sign-up text included goals. */
async function phoneWithGoalsConsent(label: string, preferences: UserPreferences) {
  const email = uniqueEmail(label);
  const phone = newAppDevice();
  const userId = await signUpOnDevice(phone.sync, email);
  createdUsers.push(userId);
  openAccount(phone, email, preferences);
  return { email, userId, phone };
}

/** An account opened on an iPhone (consent text without goals), now used on Android/web. */
async function phoneWithoutGoalsConsent(label: string, preferences: UserPreferences) {
  const email = uniqueEmail(label);
  const phone = newAppDevice();
  const spy = goalsUnavailable(phone);
  const userId = await signUpOnDevice(phone.sync, email);
  spy.mockRestore();
  createdUsers.push(userId);
  openAccount(phone, email, preferences);
  return { email, userId, phone };
}

async function cloudRow(userId: string) {
  const { data, error } = await adminClient()
    .from('user_meal_plans')
    .select('preferences, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  expect(error).toBeNull();
  return data as { preferences: UserPreferences; updated_at: string } | null;
}

async function consentRow(userId: string) {
  const { data, error } = await adminClient()
    .from('user_consents')
    .select('goals_included, goals_consented_at, goals_policy_version')
    .eq('user_id', userId)
    .single();
  expect(error).toBeNull();
  return data as {
    goals_included: boolean;
    goals_consented_at: string | null;
    goals_policy_version: string | null;
  };
}

describe('sign-up records which consent text was shown', () => {
  test('where goals are available the consent includes them', async () => {
    const phone = newAppDevice();
    const userId = await signUpOnDevice(phone.sync, uniqueEmail('signup-goals'));
    createdUsers.push(userId);

    const consent = await consentRow(userId);

    expect(consent.goals_included).toBe(true);
    expect(consent.goals_consented_at).toBeTruthy();
    expect(consent.goals_policy_version).toBe(PRIVACY_POLICY_VERSION);
    expect(await phone.sync.loadConsent(userId)).toMatchObject({ goals_included: true });
  });

  test('on iOS the consent says goals were not included', async () => {
    const phone = newAppDevice();
    goalsUnavailable(phone);
    const userId = await signUpOnDevice(phone.sync, uniqueEmail('signup-ios'));
    createdUsers.push(userId);

    const consent = await consentRow(userId);

    expect(consent).toEqual({
      goals_included: false,
      goals_consented_at: null,
      goals_policy_version: null,
    });
    expect(await phone.sync.loadConsent(userId)).toMatchObject({ goals_included: false });
  });
});

describe('the first upload of health goals', () => {
  test('an account whose consent included goals uploads them without asking', async () => {
    const { userId, phone } = await phoneWithGoalsConsent('has-consent', withGoals([HEART, PORK]));

    await phone.store.getState().syncWithCloud();

    expect(phone.goalsConsent.getState().request).toBeNull();
    expect((await cloudRow(userId))?.preferences.healthGoalTags).toEqual([HEART, PORK]);
  });

  test('without that consent nothing is uploaded and the question is asked', async () => {
    const { userId, phone } = await phoneWithoutGoalsConsent('asks', withGoals([HEART, PORK]));

    await phone.store.getState().syncWithCloud();

    expect(phone.goalsConsent.getState().request).toMatchObject({ userId, goals: [HEART] });
    expect(await cloudRow(userId)).toBeNull();
    expect(phone.store.getState().preferences.healthGoalTags).toEqual([HEART, PORK]);
    expect(phone.store.getState().isSyncing).toBe(false);
  });

  test('"yes" records the consent on the server, then uploads the goals', async () => {
    const { userId, phone } = await phoneWithoutGoalsConsent('yes', withGoals([HEART, PORK]));
    await phone.store.getState().syncWithCloud();

    await phone.goalsConsent.getState().answer('yes');

    const consent = await consentRow(userId);
    expect(consent.goals_included).toBe(true);
    expect(consent.goals_consented_at).toBeTruthy();
    expect(consent.goals_policy_version).toBe(PRIVACY_POLICY_VERSION);
    expect((await cloudRow(userId))?.preferences.healthGoalTags).toEqual([HEART, PORK]);
    expect(phone.goalsConsent.getState().request).toBeNull();

    await phone.store.getState().syncWithCloud();
    expect(phone.goalsConsent.getState().request).toBeNull();
  });

  test('"no" uploads the preferences without the goals and keeps them on the phone', async () => {
    const { userId, phone } = await phoneWithoutGoalsConsent('no', withGoals([HEART, PORK]));
    await phone.store.getState().syncWithCloud();

    await phone.goalsConsent.getState().answer('no');

    expect((await cloudRow(userId))?.preferences.healthGoalTags).toEqual([PORK]);
    expect((await consentRow(userId)).goals_included).toBe(false);
    expect(phone.store.getState().preferences.healthGoalTags).toEqual([HEART, PORK]);
    expect(JSON.parse((await phone.storage.getItem(phone.goalsChoiceKey)) ?? 'null')).toEqual({
      userId,
      goals: [HEART],
    });
  });

  test('after "no" it is never asked again, until a new goal is ticked', async () => {
    const { userId, phone } = await phoneWithoutGoalsConsent('no-again', withGoals([HEART, PORK]));
    await phone.store.getState().syncWithCloud();
    await phone.goalsConsent.getState().answer('no');

    await phone.store.getState().syncWithCloud();
    expect(phone.goalsConsent.getState().request).toBeNull();
    expect((await cloudRow(userId))?.preferences.healthGoalTags).toEqual([PORK]);

    phone.store.setState({ preferences: withGoals([HEART, FIBER, PORK]) });
    await phone.store.getState().syncWithCloud();
    expect(phone.goalsConsent.getState().request).toMatchObject({ goals: [HEART, FIBER] });
    expect((await cloudRow(userId))?.preferences.healthGoalTags).toEqual([PORK]);
  });

  test('pork-free alone is not health data: no question, it syncs', async () => {
    const { userId, phone } = await phoneWithoutGoalsConsent('pork-only', withGoals([PORK]));

    await phone.store.getState().syncWithCloud();

    expect(phone.goalsConsent.getState().request).toBeNull();
    expect((await cloudRow(userId))?.preferences.healthGoalTags).toEqual([PORK]);
  });

  test('another account signing in on the same phone is asked again', async () => {
    const { userId, phone } = await phoneWithoutGoalsConsent('first', withGoals([HEART]));
    await phone.store.getState().syncWithCloud();
    await phone.goalsConsent.getState().answer('no');
    expect(phone.goalsConsent.getState().declinedGoalsFor(userId)).toEqual([HEART]);

    const otherEmail = uniqueEmail('second');
    createdUsers.push(await signUpOnDevice(phone.sync, otherEmail));
    phone.store.getState().setUserEmail(otherEmail);
    const deadline = Date.now() + 3000;
    while ((await phone.storage.getItem(phone.goalsChoiceKey)) !== null && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    expect(phone.goalsConsent.getState().declined).toBeNull();
    expect(await phone.storage.getItem(phone.goalsChoiceKey)).toBeNull();
  });

  test('a failed grant uploads nothing and the question stays open for next time', async () => {
    const { userId, phone } = await phoneWithoutGoalsConsent('grant-fails', withGoals([HEART]));
    await phone.store.getState().syncWithCloud();
    jest.spyOn(phone.sync, 'grantGoalsConsent').mockResolvedValue(false);

    await phone.goalsConsent.getState().answer('yes');

    expect(await cloudRow(userId)).toBeNull();
    expect(phone.store.getState().activeNotice?.type).toBe('error');
    await phone.store.getState().syncWithCloud();
    expect(phone.goalsConsent.getState().request).not.toBeNull();
  });
});

describe('an iPhone never touches health goals (M3)', () => {
  async function androidWithSavedGoals(label: string) {
    const made = await phoneWithGoalsConsent(label, withGoals([HEART, FIBER, PORK]));
    await made.phone.store.getState().syncWithCloud();
    return made;
  }

  async function iPhoneOnAccount(email: string) {
    const iphone = newAppDevice();
    goalsUnavailable(iphone);
    await signInOnDevice(iphone.sync, email);
    iphone.store.setState({ userEmail: email, dataOwnerEmail: email, authStatus: 'signedIn' });
    return iphone;
  }

  test('downloading the account puts no health goal on the phone', async () => {
    const { email } = await androidWithSavedGoals('ios-down');
    const iphone = await iPhoneOnAccount(email);

    await iphone.store.getState().syncFromCloud();

    expect(iphone.store.getState().currentPlan).not.toBeNull();
    expect(iphone.store.getState().preferences.healthGoalTags).toEqual([PORK]);
    const stored = JSON.parse((await iphone.storage.getItem('@smartmeal_preferences')) ?? 'null');
    expect(stored.healthGoalTags).toEqual([PORK]);
  });

  test('uploading from the iPhone leaves the goals saved by Android intact', async () => {
    const { userId, email, phone: android } = await androidWithSavedGoals('ios-up');
    const iphone = await iPhoneOnAccount(email);
    await iphone.store.getState().syncFromCloud();
    iphone.store.setState({
      preferences: { ...iphone.store.getState().preferences, peopleCount: 3 },
    });

    await iphone.store.getState().syncWithCloud();

    expect(iphone.store.getState().cloudConflictVersion).toBeNull();
    const row = await cloudRow(userId);
    expect(row?.preferences.peopleCount).toBe(3);
    expect(row?.preferences.healthGoalTags).toEqual([HEART, FIBER, PORK]);

    // Android then sees its goals, and the iPhone's other change.
    await android.store.getState().syncFromCloud();
    android.store.getState().confirmPending();
    expect(android.store.getState().preferences.healthGoalTags).toEqual([HEART, FIBER, PORK]);
    expect(android.store.getState().preferences.peopleCount).toBe(3);
  });

  test('pork-free chosen on the iPhone syncs, goals stay as the cloud has them', async () => {
    const { userId, email } = await androidWithSavedGoals('ios-pork');
    const iphone = await iPhoneOnAccount(email);
    await iphone.store.getState().syncFromCloud();
    iphone.store.setState({
      preferences: { ...iphone.store.getState().preferences, healthGoalTags: [] },
    });

    await iphone.store.getState().syncWithCloud();

    expect((await cloudRow(userId))?.preferences.healthGoalTags).toEqual([HEART, FIBER]);
  });

  test('goals still on the phone from before are not uploaded, and no row is invented', async () => {
    const { userId, phone } = await phoneWithoutGoalsConsent('ios-local', withGoals([HEART, PORK]));
    goalsUnavailable(phone);

    await phone.store.getState().syncWithCloud();

    expect((await cloudRow(userId))?.preferences.healthGoalTags).toEqual([PORK]);
    expect(phone.goalsConsent.getState().request).toBeNull();
    expect(phone.store.getState().preferences.healthGoalTags).toEqual([HEART, PORK]);
  });
});
