import AsyncStorage from '@react-native-async-storage/async-storage';
import { HEALTH_SAFETY_STORAGE_KEY, useHealthSafetyStore } from '../healthSafetyStore';

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
