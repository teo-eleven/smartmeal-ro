import { useAppStore } from '../useAppStore';
import { cloudSyncService } from '../../services/supabase';
import { asSubscriber } from '../../__tests__/helpers/subscriber';

jest.mock('../../services/supabase', () => ({
  cloudSyncService: {
    isConfigured: jest.fn(() => true),
    getCurrentUser: jest.fn(async () => ({ id: 'uuid-1', email: 'a@b.ro' })),
    saveMealPlan: jest.fn(async () => ({ error: null })),
    loadMealPlan: jest.fn(async () => ({
      plan: null,
      groceryItems: [],
      preferences: null,
      updatedAt: null,
      error: null,
    })),
    currentEmail: jest.fn(async () => null),
  },
}));

/**
 * Two quick taps on "Sincronizează" or a pull-to-refresh during a rebuild started two runs
 * that overwrote each other's flags and notices; a task that threw left an unhandled
 * rejection and no message.
 */

const store = () => useAppStore.getState();
const mockSave = cloudSyncService.saveMealPlan as jest.Mock;
const mockLoad = cloudSyncService.loadMealPlan as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  asSubscriber();
  store().quickStart();
  useAppStore.setState({
    userEmail: 'a@b.ro',
    authStatus: 'signedIn' as never,
    isSyncing: false,
    activeNotice: null,
    noticeQueue: [],
  });
});

describe('sincronizarea nu rulează de două ori în paralel', () => {
  test('două apăsări rapide pe „Sincronizează” trimit planul o singură dată', async () => {
    await Promise.all([store().syncWithCloud(), store().syncWithCloud()]);

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(store().isSyncing).toBe(false);
  });

  test('două descărcări simultane citesc din cloud o singură dată', async () => {
    await Promise.all([store().syncFromCloud(), store().syncFromCloud()]);

    expect(mockLoad).toHaveBeenCalledTimes(1);
  });
});

describe('reîncărcarea', () => {
  test('o a doua reîncărcare nu deschide alt overlay, dar sarcina ei tot rulează', async () => {
    const first = jest.fn(async () => undefined);
    const second = jest.fn(async () => undefined);

    await Promise.all([
      store().triggerReload({ durationMs: 0 }, first),
      store().triggerReload({ durationMs: 0 }, second),
    ]);

    // A budget change made during a pull-to-refresh must not be lost.
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(store().isReloading).toBe(false);
  });

  test('o sarcină care eșuează nu lasă o eroare neprinsă: se arată un mesaj', async () => {
    await expect(
      store().triggerReload({ durationMs: 0 }, async () => {
        throw new Error('boom');
      })
    ).resolves.toBeUndefined();

    expect(store().isReloading).toBe(false);
    expect(store().activeNotice?.type).toBe('error');
  });
});
