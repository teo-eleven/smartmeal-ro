import { createClient } from '@supabase/supabase-js';
import { PRIVACY_POLICY_VERSION } from '../../../config/legal';
import { cloudSyncService } from '../supabase';
import { SignUpConsent, UserPreferences } from '../../types';
import { DEFAULT_PREFERENCES } from '../../store/defaults';
import { areHealthGoalsAvailable } from '../../utils/platformHealth';

jest.mock('@supabase/supabase-js', () => ({
  ...jest.requireActual('@supabase/supabase-js'),
  createClient: jest.fn(),
}));
jest.mock('../../../config/env', () => ({
  env: {
    supabaseUrl: 'https://proiect.supabase.co',
    supabaseAnonKey: 'anon-public-key',
    isCloudSyncConfigured: true,
    isAiProxyConfigured: false,
    appEnv: 'production',
  },
}));
jest.mock('../../utils/platformHealth', () => ({ areHealthGoalsAvailable: jest.fn() }));

/** The goals half of the Supabase service (migration 0011): consent grant, sign-up, saving. */
const rpc = jest.fn();
const signUp = jest.fn();
const maybeSingle = jest.fn();
const eq = jest.fn(() => ({ maybeSingle }));
const select = jest.fn(() => ({ eq }));
const from = jest.fn(() => ({ select }));
(createClient as jest.Mock).mockReturnValue({ auth: { signUp }, from, rpc });

const CONSENT: SignUpConsent = { isAtLeast16: true, healthDataConsent: true };
const SAVED = { data: [{ status: 'saved', updated_at: '2026-11-17T10:00:00Z' }], error: null };
const prefs = (tags: UserPreferences['healthGoalTags']): UserPreferences => ({
  ...DEFAULT_PREFERENCES,
  healthGoalTags: tags,
});
const plan = { days: [] } as never;
const savedTags = () => (rpc.mock.calls[0][1].p_preferences as UserPreferences).healthGoalTags;

beforeEach(() => {
  jest.clearAllMocks();
  (areHealthGoalsAvailable as jest.Mock).mockReturnValue(true);
  rpc.mockResolvedValue(SAVED);
});

describe('sign-up metadata', () => {
  test('says goals were included where the consent text names them', async () => {
    signUp.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde', CONSENT);
    expect(signUp.mock.calls[0][0].options.data.goals_included).toBe(true);
  });

  test('says they were not on iOS, where the text names allergies and diet only', async () => {
    (areHealthGoalsAvailable as jest.Mock).mockReturnValue(false);
    signUp.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde', CONSENT);
    expect(signUp.mock.calls[0][0].options.data.goals_included).toBe(false);
  });
});

describe('grantGoalsConsent', () => {
  test('calls the dedicated function with the policy version and nothing else', async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    expect(await cloudSyncService.grantGoalsConsent()).toBe(true);
    expect(rpc).toHaveBeenCalledWith('grant_goals_consent', {
      p_policy_version: PRIVACY_POLICY_VERSION,
    });
  });

  test.each([
    ['the server refuses', { data: false, error: null }],
    ['the call fails', { data: null, error: { message: 'boom' } }],
    ['the answer is not a boolean', { data: 'yes', error: null }],
  ])('is false when %s', async (_label, answer) => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    rpc.mockResolvedValue(answer);
    expect(await cloudSyncService.grantGoalsConsent()).toBe(false);
  });
});

describe('saveMealPlan and the health goals', () => {
  const base = { plan, groceryItems: [], expectedUpdatedAt: null };

  test("'send' (the default) leaves the goals as they are", async () => {
    await cloudSyncService.saveMealPlan({
      ...base,
      preferences: prefs(['heart_healthy', 'pork_free']),
    });
    expect(savedTags()).toEqual(['heart_healthy', 'pork_free']);
  });

  test("'strip' sends only the non-health choices", async () => {
    await cloudSyncService.saveMealPlan({
      ...base,
      preferences: prefs(['heart_healthy', 'pork_free']),
      healthGoals: 'strip',
    });
    expect(savedTags()).toEqual(['pork_free']);
  });

  test("'keep-cloud' sends the account's goals and the phone's own pork-free choice", async () => {
    maybeSingle.mockResolvedValue({
      data: { preferences: { healthGoalTags: ['heart_healthy', 'future_goal', 'pork_free'] } },
      error: null,
    });
    await cloudSyncService.saveMealPlan({
      ...base,
      preferences: prefs(['diabetic_friendly']),
      healthGoals: 'keep-cloud',
      userId: 'u1',
    });
    expect(eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(savedTags()).toEqual(['heart_healthy', 'future_goal']);
  });

  test("'keep-cloud' with no row yet sends no health goal", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await cloudSyncService.saveMealPlan({
      ...base,
      preferences: prefs(['diabetic_friendly', 'pork_free']),
      healthGoals: 'keep-cloud',
      userId: 'u1',
    });
    expect(savedTags()).toEqual(['pork_free']);
  });

  test.each([
    ['the goals cannot be read', { data: null, error: { message: 'down' } }, 'u1'],
    ['there is no user to read them for', { data: null, error: null }, undefined],
  ])("'keep-cloud' writes nothing when %s", async (_label, answer, userId) => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    maybeSingle.mockResolvedValue(answer);
    const result = await cloudSyncService.saveMealPlan({
      ...base,
      preferences: prefs(['pork_free']),
      healthGoals: 'keep-cloud',
      userId,
    });
    expect(result.status).toBe('error');
    expect(rpc).not.toHaveBeenCalled();
  });
});
