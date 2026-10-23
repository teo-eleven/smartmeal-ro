import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../useAppStore';
import { recipeNotesCloud } from '../../services/recipeNotesCloud';
import { NOTE_UPLOAD_DEBOUNCE_MS } from '../recipeNotesSync';

jest.mock('../../services/recipeNotesCloud', () => ({
  recipeNotesCloud: {
    load: jest.fn(async () => ({ notes: {}, error: null })),
    save: jest.fn(async () => ({ success: true, error: null })),
  },
}));
jest.mock('../../services/supabase', () => ({
  cloudSyncService: {
    isConfigured: jest.fn(() => true),
    getCurrentUser: jest.fn(async () => ({ id: 'u1' })),
    currentEmail: jest.fn(async () => null),
    loadReminders: jest.fn(async () => null),
    signOut: jest.fn(async () => undefined),
  },
}));

const store = () => useAppStore.getState();
const cloud = recipeNotesCloud as unknown as Record<'load' | 'save', jest.Mock>;

beforeEach(async () => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  await AsyncStorage.clear();
  useAppStore.setState({ recipeNotes: {}, userEmail: 'ana@b.ro', dataOwnerEmail: 'ana@b.ro' });
});

afterEach(() => jest.useRealTimers());

test('cât scrii, notița urcă o singură dată, cu textul final', async () => {
  store().setRecipeNote('ciorba', 'm');
  store().setRecipeNote('ciorba', 'mai');
  store().setRecipeNote('ciorba', 'mai mult leuștean');
  await jest.advanceTimersByTimeAsync(NOTE_UPLOAD_DEBOUNCE_MS);

  expect(cloud.save).toHaveBeenCalledTimes(1);
  expect(cloud.save).toHaveBeenCalledWith('ciorba', 'mai mult leuștean');
});

test('fără cont, notița rămâne doar pe telefon', async () => {
  useAppStore.setState({ userEmail: null });

  store().setRecipeNote('ciorba', 'leuștean');
  await jest.advanceTimersByTimeAsync(NOTE_UPLOAD_DEBOUNCE_MS);

  expect(cloud.save).not.toHaveBeenCalled();
});

test('la conectare, notițele din cont ajung pe telefon fără să le șteargă pe cele de aici', async () => {
  useAppStore.setState({ userEmail: null, recipeNotes: { sarmale: 'de aici' } });
  cloud.load.mockResolvedValueOnce({
    notes: { ciorba: 'din cont', sarmale: 'din cont' },
    error: null,
  });

  store().setUserEmail('ana@b.ro');
  await jest.advanceTimersByTimeAsync(0);

  expect(store().recipeNotes).toEqual({ ciorba: 'din cont', sarmale: 'de aici' });
});
