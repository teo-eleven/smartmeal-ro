import { useAppStore } from '../useAppStore';
import { cloudSyncService } from '../../services/supabase';

jest.mock('../../services/supabase', () => ({
  cloudSyncService: {
    isConfigured: jest.fn(() => false),
    getCurrentUser: jest.fn(async () => null),
    // Sync asks the server first (F1); in these tests it answers like getCurrentUser.
    verifyUser: jest.fn(async function (this: { getCurrentUser: () => Promise<unknown> }) {
      const user = await this.getCurrentUser();
      return { user, reason: user ? 'ok' : 'signed_out' };
    }),
    saveMealPlan: jest.fn(),
    loadMealPlan: jest.fn(),
  },
}));

/**
 * Without a Supabase project (a laptop, the local account simulation) there is no cloud to
 * sync with. The buttons used to answer "Sesiune expirată, autentifică-te din nou" to
 * someone who was signed in, which sends them round in a loop that cannot end.
 */
describe('sincronizarea fără server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppStore.setState({ userEmail: 'a@b.ro', activeNotice: null, isSyncing: false });
  });

  test('„Urcă” spune că sincronizarea nu e disponibilă, nu că sesiunea a expirat', async () => {
    await useAppStore.getState().syncWithCloud();

    const notice = useAppStore.getState().activeNotice;
    expect(notice?.title).not.toMatch(/Sesiune expirată/);
    expect(notice?.message).toMatch(/nu e disponibilă/);
    expect(cloudSyncService.getCurrentUser).not.toHaveBeenCalled();
    expect(useAppStore.getState().isSyncing).toBe(false);
  });

  test('„Adu planul” la fel', async () => {
    await useAppStore.getState().syncFromCloud();

    const notice = useAppStore.getState().activeNotice;
    expect(notice?.title).not.toMatch(/Sesiune expirată/);
    expect(notice?.message).toMatch(/nu e disponibilă/);
    expect(cloudSyncService.loadMealPlan).not.toHaveBeenCalled();
  });
});
