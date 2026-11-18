import AsyncStorage from '@react-native-async-storage/async-storage';
import { cloudSyncService } from '../../services/supabase';
import { RecordedConsent } from '../../services/supabase/types';
import { DEFAULT_PREFERENCES } from '../defaults';
import { HealthGoalTag, UserPreferences } from '../../types';
import * as platformHealth from '../../utils/platformHealth';
import { resolveGoalsUpload } from '../goalsUploadDecision';
import { useGoalsSyncConsentStore } from '../goalsSyncConsentStore';

jest.mock('../../services/supabase', () => ({
  cloudSyncService: { loadConsent: jest.fn(), grantGoalsConsent: jest.fn() },
}));

/** The consent gate: what an upload may do with health goals, and when it must ask first. */
const loadConsent = cloudSyncService.loadConsent as jest.Mock;
const onSettled = jest.fn(async () => undefined);

const consent = (overrides: Partial<RecordedConsent> = {}): RecordedConsent => ({
  age_confirmed_16: true,
  health_data_consent: true,
  goals_included: false,
  privacy_policy_version: '2026-11-17',
  consented_at: '2026-11-17T10:00:00Z',
  ...overrides,
});
const prefs = (tags: HealthGoalTag[]): UserPreferences => ({
  ...DEFAULT_PREFERENCES,
  healthGoalTags: tags,
});
const decide = (tags: HealthGoalTag[], userId = 'u1') =>
  resolveGoalsUpload(userId, prefs(tags), onSettled);
const stateOf = () => useGoalsSyncConsentStore.getState();
const setAvailable = (isAvailable: boolean) =>
  jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(isAvailable);

beforeEach(async () => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  await AsyncStorage.clear();
  await stateOf().reset();
  useGoalsSyncConsentStore.setState({ isLoaded: false });
  setAvailable(true);
  loadConsent.mockResolvedValue(consent());
});

describe('resolveGoalsUpload', () => {
  test('on iOS the cloud goals are kept and the consent is never even read', async () => {
    setAvailable(false);

    expect(await decide(['heart_healthy', 'pork_free'])).toBe('keep-cloud');
    expect(loadConsent).not.toHaveBeenCalled();
    expect(stateOf().request).toBeNull();
  });

  test.each([
    ['no goals at all', [] as HealthGoalTag[]],
    ['only pork-free', ['pork_free'] as HealthGoalTag[]],
  ])('sends without reading the consent when there are %s', async (_label, tags) => {
    expect(await decide(tags)).toBe('send');
    expect(loadConsent).not.toHaveBeenCalled();
    expect(stateOf().request).toBeNull();
  });

  test('missing goals list counts as no goals', async () => {
    const preferences = { ...DEFAULT_PREFERENCES, healthGoalTags: undefined };

    expect(await resolveGoalsUpload('u1', preferences, onSettled)).toBe('send');
  });

  test('sends when the account agreed to goals', async () => {
    loadConsent.mockResolvedValue(consent({ goals_included: true }));

    expect(await decide(['heart_healthy'])).toBe('send');
    expect(stateOf().request).toBeNull();
  });

  test.each([
    ['there is no consent record', null],
    ['the health data consent is missing', consent({ health_data_consent: false })],
  ])('strips without asking when %s', async (_label, answer) => {
    loadConsent.mockResolvedValue(answer);

    expect(await decide(['heart_healthy'])).toBe('strip');
    expect(stateOf().request).toBeNull();
  });

  test('strips without asking when the consent cannot be read', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    loadConsent.mockRejectedValue(new Error('offline'));

    expect(await decide(['heart_healthy'])).toBe('strip');
    expect(stateOf().request).toBeNull();
  });

  test('asks when the account has not agreed: the request is put on the store', async () => {
    const decision = await decide(['heart_healthy', 'pork_free']);

    expect(decision).toBe('ask');
    expect(stateOf().request).toEqual({
      userId: 'u1',
      goals: ['heart_healthy'],
      onSettled,
    });
  });

  test('the answer carries on through the callback it was given', async () => {
    await decide(['heart_healthy']);

    await stateOf().answer('no');

    expect(onSettled).toHaveBeenCalledWith('retry');
  });

  test('strips when every ticked goal was declined before', async () => {
    await decide(['heart_healthy']);
    await stateOf().answer('no');

    expect(await decide(['heart_healthy', 'pork_free'])).toBe('strip');
    expect(stateOf().request).toBeNull();
  });

  test('asks again for a goal ticked after the decline', async () => {
    await decide(['heart_healthy']);
    await stateOf().answer('no');

    expect(await decide(['heart_healthy', 'high_fiber'])).toBe('ask');
    expect(stateOf().request?.goals).toEqual(['heart_healthy', 'high_fiber']);
  });

  test('another account is asked again', async () => {
    await decide(['heart_healthy']);
    await stateOf().answer('no');

    expect(await decide(['heart_healthy'], 'u2')).toBe('ask');
    expect(stateOf().request?.userId).toBe('u2');
  });

  test('reads the remembered choice from storage before deciding', async () => {
    await AsyncStorage.setItem(
      '@smartmeal_goals_sync_choice',
      JSON.stringify({ userId: 'u1', goals: ['heart_healthy'] })
    );

    expect(await decide(['heart_healthy'])).toBe('strip');
  });
});
