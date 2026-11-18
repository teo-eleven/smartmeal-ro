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

  test('two loads at once share one read', async () => {
    const read = jest.spyOn(AsyncStorage, 'getItem');

    await Promise.all([
      useGoalsSyncConsentStore.getState().load(),
      useGoalsSyncConsentStore.getState().load(),
    ]);
    await useGoalsSyncConsentStore.getState().load();

    expect(read).toHaveBeenCalledTimes(1);
  });

  test('a read that started before an answer does not bring the old choice back', async () => {
    await AsyncStorage.setItem(
      GOALS_SYNC_CHOICE_STORAGE_KEY,
      JSON.stringify({ userId: 'u1', goals: ['high_fiber'] })
    );
    const loading = useGoalsSyncConsentStore.getState().load();
    useGoalsSyncConsentStore.getState().ask(request);
    await useGoalsSyncConsentStore.getState().answer('no');
    await loading;

    expect(useGoalsSyncConsentStore.getState().declinedGoalsFor('u1')).toEqual(['heart_healthy']);
    expect(useGoalsSyncConsentStore.getState().isLoaded).toBe(true);
  });

  test("a choice stored for another account is not this account's", async () => {
    await AsyncStorage.setItem(
      GOALS_SYNC_CHOICE_STORAGE_KEY,
      JSON.stringify({ userId: 'someone-else', goals: ['heart_healthy'] })
    );
    await useGoalsSyncConsentStore.getState().load();

    expect(useGoalsSyncConsentStore.getState().declinedGoalsFor('u1')).toEqual([]);
  });

  test.each([
    ['an empty marker', ''],
    ['null JSON', 'null'],
    ['a number', '7'],
    ['a missing user', JSON.stringify({ goals: ['heart_healthy'] })],
    ['goals that are not a list', JSON.stringify({ userId: 'u1', goals: 'heart_healthy' })],
  ])('%s reads back as no choice', async (_label, stored) => {
    await AsyncStorage.setItem(GOALS_SYNC_CHOICE_STORAGE_KEY, stored);

    await useGoalsSyncConsentStore.getState().load();

    expect(useGoalsSyncConsentStore.getState().declinedGoalsFor('u1')).toEqual([]);
  });

  describe('when storage fails', () => {
    let warn: jest.SpyInstance;
    beforeEach(() => {
      warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });
    afterEach(() => jest.restoreAllMocks());

    test('a failed read warns and counts as no choice', async () => {
      jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk'));

      await useGoalsSyncConsentStore.getState().load();

      expect(warn).toHaveBeenCalled();
      expect(useGoalsSyncConsentStore.getState().isLoaded).toBe(true);
      expect(useGoalsSyncConsentStore.getState().declinedGoalsFor('u1')).toEqual([]);
    });

    test('a failed save warns, keeps the choice in memory and still retries the upload', async () => {
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
      useGoalsSyncConsentStore.getState().ask(request);

      await useGoalsSyncConsentStore.getState().answer('no');

      expect(warn).toHaveBeenCalled();
      expect(useGoalsSyncConsentStore.getState().declinedGoalsFor('u1')).toEqual(['heart_healthy']);
      expect(onSettled).toHaveBeenCalledWith('retry');
    });

    test('a failed removal overwrites the choice with an empty marker', async () => {
      useGoalsSyncConsentStore.getState().ask(request);
      await useGoalsSyncConsentStore.getState().answer('no');
      jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('disk'));
      const write = jest.spyOn(AsyncStorage, 'setItem');

      await useGoalsSyncConsentStore.getState().reset();

      expect(warn).toHaveBeenCalled();
      expect(write).toHaveBeenCalledWith(GOALS_SYNC_CHOICE_STORAGE_KEY, '');
      expect(useGoalsSyncConsentStore.getState().declined).toBeNull();
    });

    test('when the marker cannot be written either, it warns twice and does not throw', async () => {
      jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('disk'));
      jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk'));

      await expect(useGoalsSyncConsentStore.getState().reset()).resolves.toBeUndefined();

      expect(warn).toHaveBeenCalledTimes(2);
      expect(useGoalsSyncConsentStore.getState().declined).toBeNull();
    });
  });
});
