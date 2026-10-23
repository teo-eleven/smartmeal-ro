import { buildDataExport, collectDataExport, LocalData } from '../dataExport';
import { cloudSyncService } from '../supabase';
import { DEFAULT_REMINDERS, UserPreferences } from '../../types';
import { PRIVACY_POLICY_VERSION } from '../../../config/legal';

jest.mock('../profile', () => ({ getDisplayName: jest.fn(async () => 'Ana') }));
jest.mock('../recipeNotesCloud', () => ({
  recipeNotesCloud: {
    load: jest.fn(async () => ({ notes: { sarmale: 'din cont' }, error: null })),
  },
}));
jest.mock('../devices', () => ({
  listDevices: jest.fn(async () => ({
    devices: [{ id: 'd1', name: 'iPhone', platform: 'ios', lastSeenAt: '2026-09-27T10:00:00Z' }],
    error: null,
  })),
}));
jest.mock('../supabase', () => ({
  cloudSyncService: {
    getCurrentUser: jest.fn(),
    loadConsent: jest.fn(),
    loadMealPlan: jest.fn(),
    loadReminders: jest.fn(),
  },
}));

const mocked = cloudSyncService as jest.Mocked<typeof cloudSyncService>;

const LOCAL: LocalData = {
  preferences: {
    avoidedAllergens: ['arahide'],
    dietTypes: ['vegan'],
  } as unknown as UserPreferences,
  currentPlan: null,
  groceryItems: [],
  savedPlans: [],
  reminders: DEFAULT_REMINDERS,
  recipeNotes: { ciorba: 'mai mult leuștean' },
};

const NOW = new Date('2026-09-28T12:00:00Z');

beforeEach(() => {
  jest.clearAllMocks();
  mocked.loadConsent.mockResolvedValue(null);
});

/**
 * GDPR art. 15 and 20: a copy of what we hold, in a machine-readable form. What "we hold" is
 * the account; what sits only on the phone never reaches us. The export carries both, kept
 * apart and labelled, so nobody reads the phone's copy as a claim about our servers.
 */
describe('exportul de date', () => {
  test('ține separat ce e în cont de ce e doar pe telefon', () => {
    const data = buildDataExport({ local: LOCAL, account: null, now: NOW });

    expect(data.onThisPhone.preferences.avoidedAllergens).toEqual(['arahide']);
    expect(data.inYourAccount).toBeNull();
    expect(data.exportedAt).toBe('2026-09-28T12:00:00.000Z');
    expect(data.privacyPolicyVersion).toBe(PRIVACY_POLICY_VERSION);
  });

  test('e JSON valid, adică lizibil de o mașină', () => {
    const data = buildDataExport({ local: LOCAL, account: null, now: NOW });

    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
  });

  /**
   * user_metadata is editable by its owner at any time, so it proves nothing. The consent in
   * the export comes from user_consents, which only the sign-up trigger writes. Here the
   * metadata has been rewritten after the fact, and the export must not believe it.
   */
  test('cu cont, aduce rândurile din cloud și acordul din tabela protejată', async () => {
    mocked.getCurrentUser.mockResolvedValue({
      id: 'u1',
      email: 'a@b.ro',
      created_at: '2026-09-01T00:00:00Z',
      user_metadata: {
        age_confirmed_16: true,
        health_data_consent: true,
        privacy_policy_version: 'rescris-de-utilizator',
      },
    } as never);
    mocked.loadConsent.mockResolvedValue({
      age_confirmed_16: true,
      health_data_consent: true,
      privacy_policy_version: '2026-09-28',
      consented_at: '2026-09-01T00:00:00Z',
    });
    mocked.loadMealPlan.mockResolvedValue({
      plan: null,
      groceryItems: [],
      preferences: { avoidedAllergens: ['lactate'] } as never,
      updatedAt: '2026-09-27T10:00:00Z',
      error: null,
    });
    mocked.loadReminders.mockResolvedValue(DEFAULT_REMINDERS);

    const data = await collectDataExport(LOCAL, NOW);

    expect(data.inYourAccount?.email).toBe('a@b.ro');
    expect(data.inYourAccount?.consent).toEqual({
      age_confirmed_16: true,
      health_data_consent: true,
      privacy_policy_version: '2026-09-28',
      consented_at: '2026-09-01T00:00:00Z',
    });
    expect(mocked.loadConsent).toHaveBeenCalledWith('u1');
    expect(data.inYourAccount?.preferences).toEqual({ avoidedAllergens: ['lactate'] });
    expect(data.inYourAccount?.reminders).toEqual(DEFAULT_REMINDERS);
  });

  test('fără cont, partea din cloud lipsește, iar partea locală se exportă tot', async () => {
    mocked.getCurrentUser.mockResolvedValue(null);

    const data = await collectDataExport(LOCAL, NOW);

    expect(data.inYourAccount).toBeNull();
    expect(data.onThisPhone.preferences.avoidedAllergens).toEqual(['arahide']);
    expect(mocked.loadMealPlan).not.toHaveBeenCalled();
  });

  /**
   * An export that quietly leaves out the cloud part would look complete and be wrong. The
   * failure is written into the file, where the person reading it will see it.
   */
  test('dacă cloud-ul nu răspunde, exportul spune asta în loc să pară complet', async () => {
    mocked.getCurrentUser.mockResolvedValue({ id: 'u1', email: 'a@b.ro' } as never);
    mocked.loadMealPlan.mockResolvedValue({
      plan: null,
      groceryItems: [],
      preferences: null,
      updatedAt: null,
      error: 'offline',
    });
    mocked.loadReminders.mockResolvedValue(null);

    const data = await collectDataExport(LOCAL, NOW);

    expect(data.inYourAccount?.errors.join(' ')).toMatch(/nu am putut citi planul/i);
    expect(data.onThisPhone.preferences.avoidedAllergens).toEqual(['arahide']);
  });

  test('nu conține nimic din sesiune: nici token, nici parolă', async () => {
    mocked.getCurrentUser.mockResolvedValue({
      id: 'u1',
      email: 'a@b.ro',
      user_metadata: {},
      // Not something getUser returns, but proof the export copies fields by name, not by
      // spreading whatever the user object happens to contain.
      access_token: 'secret-jwt',
    } as never);
    mocked.loadMealPlan.mockResolvedValue({
      plan: null,
      groceryItems: [],
      preferences: null,
      updatedAt: null,
      error: null,
    });
    mocked.loadReminders.mockResolvedValue(null);

    const text = JSON.stringify(await collectDataExport(LOCAL, NOW));

    expect(text).not.toContain('secret-jwt');
    expect(text.toLowerCase()).not.toContain('password');
  });

  /** The 2026-10-21 audit (F10). */
  test('include numele, dispozitivele contului și notițele de pe telefon', async () => {
    mocked.getCurrentUser.mockResolvedValue({ id: 'u1', email: 'a@b.ro' } as never);
    mocked.loadMealPlan.mockResolvedValue({
      plan: null,
      groceryItems: [],
      preferences: null,
      updatedAt: null,
      error: null,
    });
    mocked.loadReminders.mockResolvedValue(null);

    const data = await collectDataExport(LOCAL, NOW);

    expect(data.inYourAccount?.displayName).toBe('Ana');
    expect(data.inYourAccount?.recipeNotes).toEqual({ sarmale: 'din cont' });
    expect(data.inYourAccount?.devices).toEqual([expect.objectContaining({ name: 'iPhone' })]);
    expect(data.inYourAccount?.errors).toEqual([]);
    expect(data.onThisPhone.recipeNotes).toEqual({ ciorba: 'mai mult leuștean' });
  });

  test('o secțiune care nu se poate citi e numită, iar restul se exportă', async () => {
    mocked.getCurrentUser.mockResolvedValue({ id: 'u1', email: 'a@b.ro' } as never);
    mocked.loadMealPlan.mockResolvedValue({
      plan: null,
      groceryItems: [],
      preferences: { avoidedAllergens: ['lactate'] } as never,
      updatedAt: null,
      error: null,
    });
    mocked.loadReminders.mockRejectedValue(new Error('timeout'));
    const { listDevices } = jest.requireMock('../devices');
    listDevices.mockResolvedValueOnce({ devices: [], error: 'offline' });

    const data = await collectDataExport(LOCAL, NOW);

    expect(data.inYourAccount?.preferences).toEqual({ avoidedAllergens: ['lactate'] });
    expect(data.inYourAccount?.errors).toEqual([
      expect.stringMatching(/mementourile/i),
      expect.stringMatching(/dispozitivele/i),
    ]);
    expect(data.inYourAccount?.devices).toBeNull();
  });
});
