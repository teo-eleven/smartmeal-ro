import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../useAppStore';
import { cloudSyncService } from '../../services/supabase';
import { DEFAULT_REMINDERS } from '../../types';

jest.mock('../../services/reminderScheduler', () => ({
  reminderScheduler: {
    reschedule: jest.fn(async () => 0),
    cancelAll: jest.fn(async () => undefined),
  },
}));
jest.mock('../../services/supabase', () => ({
  cloudSyncService: {
    isConfigured: jest.fn(() => true),
    getCurrentUser: jest.fn(async () => ({ id: 'u1' })),
    currentEmail: jest.fn(async () => 'ana@b.ro'),
    loadReminders: jest.fn(async () => null),
    saveReminders: jest.fn(async () => ({ success: true, error: null })),
  },
}));
jest.mock('../../services/reauth', () => ({ checkReauth: jest.fn(async () => 'ok') }));

/**
 * The 2026-10-21 audit (F3): every change sent the whole reminder row, so somebody who
 * unsubscribed from the emails by link was subscribed again the next time they touched any
 * reminder; and the app never re-read the row, so it kept showing emails as on.
 */
const store = () => useAppStore.getState();
const flush = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  useAppStore.setState({ userEmail: 'ana@b.ro', reminders: { ...DEFAULT_REMINDERS } });
});

test('o schimbare trimite doar câmpul schimbat, nu și abonarea la email', async () => {
  store().updateReminders({ cookingTime: '19:00' });
  await flush();

  expect(cloudSyncService.saveReminders).toHaveBeenCalledWith('u1', { cookingTime: '19:00' });
});

test('la pornire, cu cont, setările vin din cloud', async () => {
  (cloudSyncService.loadReminders as jest.Mock).mockResolvedValue({
    ...DEFAULT_REMINDERS,
    emailEnabled: false,
    cookingEnabled: true,
  });
  useAppStore.setState({ reminders: { ...DEFAULT_REMINDERS, emailEnabled: true } });

  await store().hydrateStorage();
  await flush();

  expect(store().reminders.emailEnabled).toBe(false);
  expect(store().reminders.cookingEnabled).toBe(true);
});
