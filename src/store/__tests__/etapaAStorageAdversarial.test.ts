import AsyncStorage from '@react-native-async-storage/async-storage';
import * as plannerEngine from '../../engine/plannerEngine';
import { storageService } from '../../services/storage';
import { DEFAULT_PREFERENCES } from '../defaults';
import { HEALTH_SAFETY_STORAGE_KEY, useHealthSafetyStore } from '../healthSafetyStore';
import { IOS_GOALS_NOTICE_STORAGE_KEY, useIosGoalsNoticeStore } from '../iosGoalsNoticeStore';
import { useAppStore } from '../useAppStore';
import { HealthGoalTag } from '../../types';

/**
 * A.11e: what the phone's own storage can throw at the safety answer, the iPhone notice flag
 * and the stored preferences, which no screen test reaches.
 */
const safety = () => useHealthSafetyStore.getState();
const notice = () => useIosGoalsNoticeStore.getState();
const LONG = 'x'.repeat(2_000_000);

/** The storage mock's methods are jest.fn, which restoreAllMocks does not put back. */
const ORIGINALS = {
  getItem: (AsyncStorage.getItem as jest.Mock).getMockImplementation() ?? AsyncStorage.getItem,
  setItem: (AsyncStorage.setItem as jest.Mock).getMockImplementation() ?? AsyncStorage.setItem,
  removeItem: (AsyncStorage.removeItem as jest.Mock).getMockImplementation() ?? AsyncStorage.removeItem,
};
function healStorage() {
  for (const name of ['getItem', 'setItem', 'removeItem'] as const) {
    (AsyncStorage[name] as jest.Mock).mockImplementation(ORIGINALS[name] as never);
  }
}

beforeEach(async () => {
  jest.restoreAllMocks();
  healStorage();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  await AsyncStorage.clear();
  useHealthSafetyStore.setState({ answer: null, isLoaded: false, isReminderDismissed: false });
  useIosGoalsNoticeStore.setState({ status: 'unknown' });
});

describe('a garbage safety answer on the phone counts as unanswered', () => {
  test.each([
    ['uppercase YES', 'YES'],
    ['capitalised Yes', 'Yes'],
    ['empty string', ''],
    ['whitespace', ' '],
    ['padded yes', ' yes '],
    ['quoted JSON string', '"yes"'],
    ['JSON object', '{"answer":"yes"}'],
    ['boolean-looking', 'true'],
    ['the reset marker', 'unanswered'],
    ['a two-megabyte string', LONG],
  ])('%s', async (_label, raw) => {
    await AsyncStorage.setItem(HEALTH_SAFETY_STORAGE_KEY, raw);

    await safety().load();

    expect(safety().answer).toBeNull();
    expect(safety().isLoaded).toBe(true);
  });

  test('a stored "no" and "yes" are still read exactly', async () => {
    await AsyncStorage.setItem(HEALTH_SAFETY_STORAGE_KEY, 'no');
    await safety().load();
    expect(safety().answer).toBe('no');
  });
});

describe('a garbage iPhone-notice flag', () => {
  test.each([
    ['empty', ''],
    ['true', 'true'],
    ['zero', '0'],
    ['one with padding', ' 1'],
    ['JSON', '{"seen":1}'],
    ['two megabytes', LONG],
  ])('%s is not "seen": the message shows once more rather than never', async (_l, raw) => {
    await AsyncStorage.setItem(IOS_GOALS_NOTICE_STORAGE_KEY, raw);

    await notice().load();

    expect(notice().status).toBe('unseen');
  });

  test('only the exact value "1" is seen', async () => {
    await AsyncStorage.setItem(IOS_GOALS_NOTICE_STORAGE_KEY, '1');
    await notice().load();
    expect(notice().status).toBe('seen');
  });
});

describe('storage failing at every point of the safety flow', () => {
  test('reading fails: unanswered, loaded, no throw', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValue(new Error('locked'));

    await expect(safety().load()).resolves.toBeUndefined();

    expect(safety().answer).toBeNull();
    expect(safety().isLoaded).toBe(true);
  });

  test('saving "yes" fails: still blocked this session, and the next launch asks again', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValue(new Error('disk full'));

    await expect(safety().setAnswer('yes')).resolves.toBeUndefined();
    expect(safety().answer).toBe('yes');

    useHealthSafetyStore.setState({ answer: null, isLoaded: false });
    jest.restoreAllMocks();
    healStorage();
    await safety().load();
    expect(safety().answer).toBeNull();
  });

  test('removing fails: the marker overwrites the old answer, so the next account is asked', async () => {
    await safety().setAnswer('yes');
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValue(new Error('read-only'));

    await expect(safety().reset()).resolves.toBeUndefined();

    expect(safety().answer).toBeNull();
    useHealthSafetyStore.setState({ isLoaded: false });
    await safety().load();
    expect(safety().answer).toBeNull();
  });

  test('removing AND overwriting both fail: no throw, memory is cleared', async () => {
    await safety().setAnswer('yes');
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValue(new Error('read-only'));
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValue(new Error('read-only'));

    await expect(safety().reset()).resolves.toBeUndefined();

    expect(safety().answer).toBeNull();
  });

  test('a failing storage during the account change still clears the answer in memory', async () => {
    await safety().setAnswer('yes');
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValue(new Error('read-only'));
    useAppStore.setState({ userEmail: 'a@b.ro', dataOwnerEmail: 'a@b.ro' });

    useAppStore.getState().setUserEmail(null);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(safety().answer).toBeNull();
  });

  test('notice flag: reading fails -> silent; saving fails -> seen this launch; no throw', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValue(new Error('locked'));
    await expect(notice().load()).resolves.toBeUndefined();
    expect(notice().status).toBe('seen');

    jest.restoreAllMocks();
    healStorage();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    useIosGoalsNoticeStore.setState({ status: 'unknown' });
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValue(new Error('disk full'));
    await expect(notice().acknowledge()).resolves.toBeUndefined();
    expect(notice().status).toBe('seen');
  });
});

const GOALS_RAW = (healthGoalTags: unknown) => ({ ...DEFAULT_PREFERENCES, healthGoalTags });

async function bootWith(rawPreferences: unknown, answer?: 'yes' | 'no') {
  await AsyncStorage.clear();
  if (answer) await AsyncStorage.setItem(HEALTH_SAFETY_STORAGE_KEY, answer);
  await AsyncStorage.setItem('@smartmeal_preferences', JSON.stringify(rawPreferences));
  useHealthSafetyStore.setState({ answer: null, isLoaded: false });
  useAppStore.setState({ isHydrated: false });
  await useAppStore.getState().hydrateStorage();
  return useAppStore.getState();
}

describe('stored preferences with odd health goals', () => {
  test('unknown tags are dropped, known ones kept', async () => {
    const state = await bootWith(GOALS_RAW(['bogus', 'heart_healthy', 42, null]), 'no');
    expect(state.preferences.healthGoalTags).toEqual(['heart_healthy']);
  });

  test('duplicates are collapsed to one each', async () => {
    const state = await bootWith(
      GOALS_RAW(['heart_healthy', 'heart_healthy', 'pork_free', 'pork_free']),
      'no'
    );
    expect(state.preferences.healthGoalTags).toEqual(['heart_healthy', 'pork_free']);
  });

  test('unticking a goal that was stored twice leaves no copy behind', async () => {
    await bootWith(GOALS_RAW(['heart_healthy', 'heart_healthy', 'pork_free']), 'no');
    useAppStore.getState().toggleHealthGoalTag('heart_healthy');
    expect(useAppStore.getState().preferences.healthGoalTags).toEqual(['pork_free']);
  });

  test.each([
    ['dietTypes', ['vegan', 'vegan', 'vegetarian'], ['vegan', 'vegetarian']],
    ['avoidedAllergens', ['gluten', 'gluten', 'lactate'], ['gluten', 'lactate']],
    ['moodTags', ['speedy', 'speedy'], ['speedy']],
    ['appliances', ['oven', 'oven', 'hob'], ['oven', 'hob']],
  ])('%s duplicates are collapsed', async (key, list, expected) => {
    const state = await bootWith({ ...GOALS_RAW([]), [key]: list }, 'no');
    expect((state.preferences as unknown as Record<string, unknown>)[key]).toEqual(expected);
  });

  test.each([
    ['a string', 'heart_healthy'],
    ['an object', { heart_healthy: true }],
    ['a number', 7],
    ['null', null],
  ])('healthGoalTags as %s does not crash and yields no goals', async (_l, bad) => {
    const state = await bootWith(GOALS_RAW(bad), 'no');
    expect(state.preferences.healthGoalTags ?? []).toEqual([]);
    expect(state.isHydrated).toBe(true);
  });

  test('pork-free alone survives a "yes"', async () => {
    const state = await bootWith(GOALS_RAW(['pork_free']), 'yes');
    expect(state.preferences.healthGoalTags).toEqual(['pork_free']);
  });

  test('a "yes" strips health goals at boot and keeps pork-free, even with duplicates and junk', async () => {
    const state = await bootWith(
      GOALS_RAW(['heart_healthy', 'heart_healthy', 'bogus', 'pork_free']),
      'yes'
    );
    expect(state.preferences.healthGoalTags).toEqual(['pork_free']);
  });
});

describe('upgrade path: goals saved before the question existed', () => {
  const GOALS: HealthGoalTag[] = ['heart_healthy', 'pork_free'];

  function plannerSees() {
    const spy = jest.spyOn(plannerEngine, 'generateMealPlan');
    expect(useAppStore.getState().generatePlan()).toBe(true);
    return spy.mock.calls.map(([prefs]) => prefs.healthGoalTags);
  }

  test('no answer yet: goals are kept in the data but not applied', async () => {
    const state = await bootWith(GOALS_RAW(GOALS));

    expect(state.preferences.healthGoalTags).toEqual(GOALS);
    expect(safety().answer).toBeNull();
    for (const seen of plannerSees()) expect(seen).toEqual(['pork_free']);
  });

  test('applied only after an explicit "no"', async () => {
    await bootWith(GOALS_RAW(GOALS));
    await safety().setAnswer('no');

    for (const seen of plannerSees()) expect(seen).toEqual(GOALS);
  });

  test('an unreadable answer (storage rejects) behaves like no answer: not applied', async () => {
    await AsyncStorage.setItem('@smartmeal_preferences', JSON.stringify(GOALS_RAW(GOALS)));
    const realGet = AsyncStorage.getItem.bind(AsyncStorage);
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockImplementation((key) =>
        key === HEALTH_SAFETY_STORAGE_KEY ? Promise.reject(new Error('locked')) : realGet(key)
      );
    useHealthSafetyStore.setState({ answer: null, isLoaded: false });
    await storageService.loadPreferences();
    await useAppStore.getState().hydrateStorage();

    for (const seen of plannerSees()) expect(seen).toEqual(['pork_free']);
  });
});
