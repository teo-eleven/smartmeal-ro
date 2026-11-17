import AsyncStorage from '@react-native-async-storage/async-storage';
import { cloudSyncService } from '../../services/supabase';
import { GOALS_SYNC_CHOICE_STORAGE_KEY, useGoalsSyncConsentStore } from '../goalsSyncConsentStore';

jest.mock('../../services/supabase', () => ({
  cloudSyncService: { grantGoalsConsent: jest.fn() },
}));

const grant = cloudSyncService.grantGoalsConsent as jest.Mock;
const onSettled = jest.fn(async () => undefined);
const request = { userId: 'u1', goals: ['heart_healthy' as const], onSettled };

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  await useGoalsSyncConsentStore.getState().reset();
  useGoalsSyncConsentStore.setState({ isLoaded: false });
});

describe('the goals sync question', () => {
  test('"yes" records the consent on the server, then lets the upload retry', async () => {
    grant.mockResolvedValue(true);
    useGoalsSyncConsentStore.getState().ask(request);

    await useGoalsSyncConsentStore.getState().answer('yes');

    expect(grant).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenCalledWith('retry');
    expect(useGoalsSyncConsentStore.getState().request).toBeNull();
    expect(await AsyncStorage.getItem(GOALS_SYNC_CHOICE_STORAGE_KEY)).toBeNull();
  });

  test('a refused grant reports a failure and remembers nothing', async () => {
    grant.mockResolvedValue(false);
    useGoalsSyncConsentStore.getState().ask(request);

    await useGoalsSyncConsentStore.getState().answer('yes');

    expect(onSettled).toHaveBeenCalledWith('failed');
    expect(useGoalsSyncConsentStore.getState().declinedGoalsFor('u1')).toEqual([]);
  });

  test('"no" is remembered for this account, on disk, and never calls the server', async () => {
    useGoalsSyncConsentStore.getState().ask(request);

    await useGoalsSyncConsentStore.getState().answer('no');

    expect(grant).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledWith('retry');
    expect(useGoalsSyncConsentStore.getState().declinedGoalsFor('u1')).toEqual(['heart_healthy']);
    expect(useGoalsSyncConsentStore.getState().declinedGoalsFor('u2')).toEqual([]);
    expect(JSON.parse((await AsyncStorage.getItem(GOALS_SYNC_CHOICE_STORAGE_KEY)) ?? '')).toEqual({
      userId: 'u1',
      goals: ['heart_healthy'],
    });
  });

  test('a second "no" adds the new goals to the declined ones', async () => {
    useGoalsSyncConsentStore.getState().ask(request);
    await useGoalsSyncConsentStore.getState().answer('no');
    useGoalsSyncConsentStore.getState().ask({ ...request, goals: ['high_fiber'] });
    await useGoalsSyncConsentStore.getState().answer('no');

    expect(useGoalsSyncConsentStore.getState().declinedGoalsFor('u1')).toEqual([
      'heart_healthy',
      'high_fiber',
    ]);
  });

  test('answering twice settles once', async () => {
    useGoalsSyncConsentStore.getState().ask(request);
    await Promise.all([
      useGoalsSyncConsentStore.getState().answer('no'),
      useGoalsSyncConsentStore.getState().answer('no'),
    ]);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  test('the choice is read back after a restart, and a damaged value counts as no choice', async () => {
    await AsyncStorage.setItem(
      GOALS_SYNC_CHOICE_STORAGE_KEY,
      JSON.stringify({ userId: 'u1', goals: ['heart_healthy', 7] })
    );
    await useGoalsSyncConsentStore.getState().load();
    expect(useGoalsSyncConsentStore.getState().declinedGoalsFor('u1')).toEqual(['heart_healthy']);

    useGoalsSyncConsentStore.setState({ declined: null, isLoaded: false });
    await AsyncStorage.setItem(GOALS_SYNC_CHOICE_STORAGE_KEY, '{nope');
    await useGoalsSyncConsentStore.getState().load();
    expect(useGoalsSyncConsentStore.getState().declinedGoalsFor('u1')).toEqual([]);
  });

  test('reset drops the choice and an open question', async () => {
    useGoalsSyncConsentStore.getState().ask(request);
    await useGoalsSyncConsentStore.getState().answer('no');
    useGoalsSyncConsentStore.getState().ask(request);

    await useGoalsSyncConsentStore.getState().reset();

    expect(useGoalsSyncConsentStore.getState().request).toBeNull();
    expect(useGoalsSyncConsentStore.getState().declined).toBeNull();
    expect(await AsyncStorage.getItem(GOALS_SYNC_CHOICE_STORAGE_KEY)).toBeNull();
  });
});
