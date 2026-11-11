import AsyncStorage from '@react-native-async-storage/async-storage';
import { HEALTH_SAFETY_STORAGE_KEY, useHealthSafetyStore } from '../healthSafetyStore';
import { useAppStore } from '../useAppStore';

const store = () => useHealthSafetyStore.getState();

beforeEach(async () => {
  await AsyncStorage.clear();
  useHealthSafetyStore.setState({ answer: null, isLoaded: false });
  jest.restoreAllMocks();
});

describe('healthSafetyStore (A.7a)', () => {
  test('an answer is kept on this phone and read back after a restart', async () => {
    await store().setAnswer('no');
    useHealthSafetyStore.setState({ answer: null, isLoaded: false });

    await store().load();

    expect(store().answer).toBe('no');
    expect(store().isLoaded).toBe(true);
  });

  test('the answer has its own key, apart from the preferences that go to the cloud', async () => {
    await store().setAnswer('yes');

    expect(await AsyncStorage.getItem(HEALTH_SAFETY_STORAGE_KEY)).toBe('yes');
    expect(await AsyncStorage.getItem('@smartmeal_preferences')).toBeNull();
  });

  test('a stored value that is not yes/no counts as unanswered, so the question comes back', async () => {
    await AsyncStorage.setItem(HEALTH_SAFETY_STORAGE_KEY, '{"hacked":true}');

    await store().load();

    expect(store().answer).toBeNull();
    expect(store().isLoaded).toBe(true);
  });

  test('when saving fails, a "yes" still blocks the goals for this session (fail closed)', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await store().setAnswer('yes');

    expect(store().answer).toBe('yes');
  });

  test('when reading fails, the question is asked again rather than guessed', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('locked'));
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await store().load();

    expect(store().answer).toBeNull();
    expect(store().isLoaded).toBe(true);
  });

  test('reset forgets the answer on the phone too', async () => {
    await store().setAnswer('yes');

    await store().reset();

    expect(store().answer).toBeNull();
    expect(await AsyncStorage.getItem(HEALTH_SAFETY_STORAGE_KEY)).toBeNull();
  });
});

describe('healthSafetyStore: a slow read never overwrites a newer write (A.7e-5b)', () => {
  /** A disk read that stays pending until the test lets it finish. */
  function slowRead() {
    let finish: (value: string | null) => void = () => undefined;
    jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(
      () => new Promise<string | null>((resolve) => (finish = resolve))
    );
    return (value: string | null) => finish(value);
  }

  test('setAnswer between two concurrent loads wins', async () => {
    const finishRead = slowRead();
    const first = store().load();
    await store().setAnswer('yes');
    const second = store().load();
    finishRead(null);
    await Promise.all([first, second]);

    expect(store().answer).toBe('yes');
    expect(store().isLoaded).toBe(true);
  });

  test('concurrent loads share one read of the disk', async () => {
    const read = jest.spyOn(AsyncStorage, 'getItem');
    read.mockClear();

    await Promise.all([store().load(), store().load(), store().load()]);

    expect(read).toHaveBeenCalledTimes(1);
  });

  test('reset during a load stays reset, even if the read saw the old "yes"', async () => {
    await AsyncStorage.setItem(HEALTH_SAFETY_STORAGE_KEY, 'yes');
    const finishRead = slowRead();
    const loading = store().load();
    await store().reset();
    finishRead('yes');
    await loading;

    expect(store().answer).toBeNull();
    expect(store().isLoaded).toBe(true);
  });

  test('a load after the first one finished reads the disk again', async () => {
    await store().load();
    await AsyncStorage.setItem(HEALTH_SAFETY_STORAGE_KEY, 'no');

    await store().load();

    expect(store().answer).toBe('no');
  });
});

test('"Reia configuratorul" (resetOnboarding) forgets the safety answer too (A.7c)', async () => {
  await store().setAnswer('yes');

  useAppStore.getState().resetOnboarding();
  await Promise.resolve();

  expect(store().answer).toBeNull();
  expect(await AsyncStorage.getItem(HEALTH_SAFETY_STORAGE_KEY)).toBeNull();
});

describe('healthSafetyStore: a failed delete is not inherited by the next account (A.7f-4)', () => {
  test.each(['yes', 'no'] as const)(
    'removeItem rejects after "%s": after a restart the answer is null',
    async (given) => {
      await store().setAnswer(given);
      jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('disk'));

      await store().reset();
      useHealthSafetyStore.setState({ answer: null, isLoaded: false });
      await store().load();

      expect(store().answer).toBeNull();
      expect(store().isLoaded).toBe(true);
    }
  );

  test('when the delete and the marker both fail the session still starts unanswered', async () => {
    await store().setAnswer('no');
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('disk'));
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk'));

    await expect(store().reset()).resolves.toBeUndefined();

    expect(store().answer).toBeNull();
  });
});
