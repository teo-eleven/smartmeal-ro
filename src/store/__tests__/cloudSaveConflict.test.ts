import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../useAppStore';
import { cloudSyncService } from '../../services/supabase';
import { asSubscriber } from '../../__tests__/helpers/subscriber';

jest.mock('../../services/supabase', () => ({
  cloudSyncService: {
    isConfigured: jest.fn(() => true),
    getCurrentUser: jest.fn(async () => ({ id: 'u1' })),
    // Sync asks the server first (F1); in these tests it answers like getCurrentUser.
    verifyUser: jest.fn(async function (this: { getCurrentUser: () => Promise<unknown> }) {
      const user = await this.getCurrentUser();
      return { user, reason: user ? 'ok' : 'signed_out' };
    }),
    saveMealPlan: jest.fn(),
    loadMealPlan: jest.fn(),
    loadReminders: jest.fn(async () => null),
    currentEmail: jest.fn(async () => null),
    signOut: jest.fn(async () => undefined),
  },
}));

/**
 * The 2026-10-21 audit (F2): the phone that synced last overwrote the plan another device
 * had saved, silently. Saving now says which cloud version it replaces, and a newer one is
 * a question for the user.
 */
const store = () => useAppStore.getState();
const save = cloudSyncService.saveMealPlan as jest.Mock;
const flush = () => new Promise((resolve) => setImmediate(resolve));
const V1 = '2026-10-23T10:00:00Z';
const V2 = '2026-10-23T11:00:00Z';

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  asSubscriber();
  useAppStore.setState({
    confirmRequest: null,
    activeNotice: null,
    cloudPlanVersion: null,
    cloudConflictVersion: null,
    dataOwnerEmail: null,
  });
  store().setUserEmail('ana@b.ro');
  store().quickStart();
  useAppStore.setState({ activeNotice: null });
});

test('fără plan, sincronizarea spune de ce și nu trimite nimic', async () => {
  useAppStore.setState({ currentPlan: null });

  await store().syncWithCloud();

  expect(save).not.toHaveBeenCalled();
  expect(store().activeNotice?.title).toBe('Nu ai niciun plan de urcat');
});

test('trimite versiunea din cloud văzută ultima dată și o ține minte pe cea nouă', async () => {
  useAppStore.setState({ cloudPlanVersion: V1 });
  save.mockResolvedValue({ status: 'saved', updatedAt: V2, error: null });

  await store().syncWithCloud();

  expect(save.mock.calls[0][0].expectedUpdatedAt).toBe(V1);
  expect(store().cloudPlanVersion).toBe(V2);
  expect(store().hasUnsyncedPlan()).toBe(false);
});

test('o versiune mai nouă în cloud nu e suprascrisă: utilizatorul e întrebat', async () => {
  save.mockResolvedValue({ status: 'conflict', updatedAt: V2, error: null });

  await store().syncWithCloud();

  expect(store().confirmRequest).toBe('overwrite_cloud_plan');
  expect(store().cloudConflictVersion).toBe(V2);
  expect(store().hasUnsyncedPlan()).toBe(true);
});

test('„Înlocuiește” trimite planul peste versiunea pe care a văzut-o', async () => {
  save.mockResolvedValueOnce({ status: 'conflict', updatedAt: V2, error: null });
  await store().syncWithCloud();
  save.mockResolvedValueOnce({ status: 'saved', updatedAt: '2026-10-23T12:00:00Z', error: null });

  store().confirmPending();
  await flush();

  expect(save.mock.calls[1][0].expectedUpdatedAt).toBe(V2);
  expect(store().cloudPlanVersion).toBe('2026-10-23T12:00:00Z');
  expect(store().cloudConflictVersion).toBeNull();
});

test('„Renunță” nu trimite nimic', async () => {
  save.mockResolvedValueOnce({ status: 'conflict', updatedAt: V2, error: null });
  await store().syncWithCloud();

  store().cancelConfirm();

  expect(save).toHaveBeenCalledTimes(1);
  expect(store().cloudConflictVersion).toBeNull();
});

test('versiunea văzută rezistă la repornire', async () => {
  save.mockResolvedValue({ status: 'saved', updatedAt: V2, error: null });
  await store().syncWithCloud();
  await flush();
  useAppStore.setState({ cloudPlanVersion: null });

  await store().hydrateStorage();

  expect(store().cloudPlanVersion).toBe(V2);
});

/**
 * The 2026-10-21 audit (F1): with no connection the sync said the session had expired,
 * which sends people to sign in again for nothing.
 */
describe('fără internet', () => {
  test('sincronizarea spune că nu e conexiune, nu că sesiunea a expirat', async () => {
    (cloudSyncService.verifyUser as jest.Mock).mockResolvedValueOnce({
      user: null,
      reason: 'offline',
    });

    await store().syncWithCloud();

    expect(save).not.toHaveBeenCalled();
    expect(store().activeNotice?.title).toBe('Fără conexiune');
  });

  test('descărcarea spune la fel', async () => {
    (cloudSyncService.verifyUser as jest.Mock).mockResolvedValueOnce({
      user: null,
      reason: 'offline',
    });

    await store().syncFromCloud();

    expect(store().activeNotice?.title).toBe('Fără conexiune');
  });

  test('o sesiune respinsă de server cere reconectarea', async () => {
    (cloudSyncService.verifyUser as jest.Mock).mockResolvedValueOnce({
      user: null,
      reason: 'signed_out',
    });

    await store().syncWithCloud();

    expect(store().activeNotice?.title).toBe('Sesiune expirată');
  });
});
