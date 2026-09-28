import { AuthRetryableFetchError, createClient } from '@supabase/supabase-js';
import { cloudSyncService } from '../supabase';
import { DEFAULT_REMINDERS, SignUpConsent } from '../../types';
import { PRIVACY_POLICY_VERSION } from '../../../config/legal';

jest.mock('@supabase/supabase-js', () => ({
  ...jest.requireActual('@supabase/supabase-js'),
  createClient: jest.fn(),
}));
jest.mock('../../../config/env', () => ({
  env: {
    supabaseUrl: 'https://proiect.supabase.co',
    supabaseAnonKey: 'anon-public-key',
    isCloudSyncConfigured: true,
    isAiProxyConfigured: false,
    appEnv: 'production',
  },
}));

/**
 * The account half of the Supabase service: sign-in, sign-up, password reset, deletion and
 * the reminder row. The plan half is in cloudPlanValidation.test.ts.
 *
 * One client for the file, because getSupabaseClient caches the instance after the first
 * call. Each test sets only the answers it cares about.
 */
const auth = {
  getUser: jest.fn(),
  getSession: jest.fn(),
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPasswordForEmail: jest.fn(),
  verifyOtp: jest.fn(),
  updateUser: jest.fn(),
};
const maybeSingle = jest.fn();
const upsert = jest.fn();
const eq = jest.fn(() => ({ maybeSingle }));
const select = jest.fn(() => ({ eq }));
const from = jest.fn(() => ({ select, upsert }));

(createClient as jest.Mock).mockReturnValue({ auth, from });

const CONSENT: SignUpConsent = { isAtLeast16: true, healthDataConsent: true };

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

beforeEach(() => {
  jest.clearAllMocks();
  auth.signOut.mockResolvedValue({ error: null });
});

describe('conectare și cont nou', () => {
  test('conectarea reușită întoarce utilizatorul', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    const result = await cloudSyncService.signInWithEmail('a@b.ro', 'Muntele7Verde');

    expect(result).toEqual({ user: { id: 'u1' }, error: null });
  });

  test('o parolă greșită ajunge la ecran ca mesaj, nu ca excepție', async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });

    const result = await cloudSyncService.signInWithEmail('a@b.ro', 'gresita');

    expect(result).toEqual({ user: null, error: 'Invalid login credentials' });
  });

  test('o excepție din client nu scapă din serviciu', async () => {
    auth.signInWithPassword.mockRejectedValue(new Error('socket hang up'));

    const result = await cloudSyncService.signInWithEmail('a@b.ro', 'Muntele7Verde');

    expect(result).toEqual({ user: null, error: 'socket hang up' });
  });

  test('contul nou reușit întoarce utilizatorul', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: 'u2' } }, error: null });

    expect(await cloudSyncService.signUpWithEmail('c@d.ro', 'Muntele7Verde', CONSENT)).toEqual({
      user: { id: 'u2' },
      error: null,
    });
  });

  test('refuzul serverului la cont nou se transmite', async () => {
    auth.signUp.mockResolvedValue({ data: { user: null }, error: { message: 'Weak password' } });

    expect(await cloudSyncService.signUpWithEmail('c@d.ro', 'x', CONSENT)).toEqual({
      user: null,
      error: 'Weak password',
    });
  });

  test('o excepție la cont nou nu scapă din serviciu', async () => {
    auth.signUp.mockRejectedValue(new Error('timeout'));

    expect((await cloudSyncService.signUpWithEmail('c@d.ro', 'x', CONSENT)).error).toBe('timeout');
  });

  /**
   * The screen already refuses without both boxes ticked. This is the second line: anything
   * that reaches the service some other way still cannot open an account holding health data
   * for someone who has not said they are 16 and agreed to it.
   */
  test('fără declarația de vârstă nu creează contul și nu apelează serverul', async () => {
    const result = await cloudSyncService.signUpWithEmail('c@d.ro', 'Muntele7Verde', {
      isAtLeast16: false,
      healthDataConsent: true,
    });

    expect(result.user).toBeNull();
    expect(result.error).toMatch(/16 ani/);
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  test('fără acordul pentru datele de sănătate nu creează contul', async () => {
    const result = await cloudSyncService.signUpWithEmail('c@d.ro', 'Muntele7Verde', {
      isAtLeast16: true,
      healthDataConsent: false,
    });

    expect(result.error).toMatch(/sănătate/);
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  /** Consent has to be provable later: what was agreed, and to which version of the policy. */
  /**
   * The statements travel in the sign-up metadata, where migration 0005's trigger freezes
   * them into user_consents. The time is not sent: a phone's clock is whatever the phone
   * says, and the trigger stamps the row with the server's.
   */
  test('declarațiile pleacă la server, dar ora o pune serverul', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: 'u2' } }, error: null });

    await cloudSyncService.signUpWithEmail('c@d.ro', 'Muntele7Verde', CONSENT);

    expect(auth.signUp.mock.calls[0][0].options.data).toEqual({
      age_confirmed_16: true,
      health_data_consent: true,
      privacy_policy_version: PRIVACY_POLICY_VERSION,
    });
  });

  test('acordul se citește din tabela pe care utilizatorul n-o poate modifica', async () => {
    maybeSingle.mockResolvedValue({
      data: {
        age_confirmed_16: true,
        health_data_consent: true,
        privacy_policy_version: '2026-09-28',
        consented_at: '2026-09-28T10:00:00Z',
      },
      error: null,
    });

    const consent = await cloudSyncService.loadConsent('u1');

    expect(from).toHaveBeenCalledWith('user_consents');
    expect(eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(consent).toEqual({
      age_confirmed_16: true,
      health_data_consent: true,
      privacy_policy_version: '2026-09-28',
      consented_at: '2026-09-28T10:00:00Z',
    });
  });

  test('fără rând de acord întoarce null, nu un acord inventat', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    expect(await cloudSyncService.loadConsent('u1')).toBeNull();
  });

  test('adresa curentă vine din sesiunea Supabase', async () => {
    auth.getUser.mockResolvedValue({ data: { user: { email: 'a@b.ro' } } });

    expect(await cloudSyncService.currentEmail()).toBe('a@b.ro');
  });

  test('un client care aruncă la citirea utilizatorului înseamnă „deconectat"', async () => {
    auth.getUser.mockRejectedValue(new Error('offline'));

    expect(await cloudSyncService.currentEmail()).toBeNull();
  });

  test('deconectarea nu aruncă nici când clientul aruncă', async () => {
    auth.signOut.mockRejectedValue(new Error('offline'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(cloudSyncService.signOut()).resolves.toBeUndefined();
    warn.mockRestore();
  });
});

/**
 * Deletion is the one call that cannot be undone, so each way it can fail has to leave the
 * user signed in and told, never quietly signed out with the account still there.
 */
describe('ștergerea contului', () => {
  test('fără sesiune nu apelează nimic și cere reconectarea', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });

    const result = await cloudSyncService.deleteAccount();

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Autentifică-te din nou/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('trimite tokenul utilizatorului, nu cheia publică', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'jwt-al-lui' } } });
    fetchMock.mockResolvedValue({ ok: true });

    await cloudSyncService.deleteAccount();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://proiect.supabase.co/functions/v1/delete-account');
    expect(init.headers.Authorization).toBe('Bearer jwt-al-lui');
  });

  test('după ștergere, sesiunea locală se închide', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 't' } } });
    fetchMock.mockResolvedValue({ ok: true });

    const result = await cloudSyncService.deleteAccount();

    expect(result).toEqual({ success: true, error: null });
    expect(auth.signOut).toHaveBeenCalled();
  });

  test('un refuz al serverului lasă omul conectat și îi spune', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 't' } } });
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    const result = await cloudSyncService.deleteAccount();

    expect(result.success).toBe(false);
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  test('o cădere de rețea lasă omul conectat și îi spune', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 't' } } });
    fetchMock.mockRejectedValue(new Error('Network request failed'));

    const result = await cloudSyncService.deleteAccount();

    expect(result).toEqual({ success: false, error: 'Network request failed' });
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});

describe('resetarea parolei', () => {
  test('cererea de cod curăță spațiile din adresă', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    const result = await cloudSyncService.requestPasswordReset('  a@b.ro ');

    expect(result).toEqual({ success: true, error: null });
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.ro');
  });

  /**
   * The answer is the same whether or not the address has an account; otherwise this screen
   * becomes a way to find out who is registered.
   */
  test('un refuz al serverului pentru adresă nu se arată', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({
      data: null,
      error: { name: 'AuthApiError', message: 'User not found', status: 400 },
    });

    expect(await cloudSyncService.requestPasswordReset('nimeni@b.ro')).toEqual({
      success: true,
      error: null,
    });
  });

  /**
   * supabase-js returns a network failure in `error` rather than throwing it. Treating every
   * returned error as "don't reveal" told someone with no signal that a code was on its way,
   * and they waited for an email that was never sent.
   */
  test('fără rețea nu pretinde că a trimis codul', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({
      data: null,
      error: new AuthRetryableFetchError('Failed to fetch', 0),
    });

    const result = await cloudSyncService.requestPasswordReset('a@b.ro');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/conexiune/i);
  });

  test('codul bun deschide pasul următor; spațiile nu contează', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: null });

    const result = await cloudSyncService.verifyPasswordResetCode(' a@b.ro', ' 123456 ');

    expect(result).toEqual({ success: true, error: null });
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: 'a@b.ro',
      token: '123456',
      type: 'recovery',
    });
  });

  test('un cod greșit primește un mesaj în română, nu textul serverului', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: { message: 'Token has expired' } });

    const result = await cloudSyncService.verifyPasswordResetCode('a@b.ro', '000000');

    expect(result).toEqual({
      success: false,
      error: 'Codul nu este valid sau a expirat. Cere altul.',
    });
  });

  test('parola nouă se salvează pe sesiunea deschisă de cod', async () => {
    auth.updateUser.mockResolvedValue({ data: {}, error: null });

    expect(await cloudSyncService.updatePassword('Muntele7Verde')).toEqual({
      success: true,
      error: null,
    });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'Muntele7Verde' });
  });

  test('refuzul parolei noi se transmite', async () => {
    auth.updateUser.mockResolvedValue({ data: {}, error: { message: 'Password too short' } });

    expect(await cloudSyncService.updatePassword('scurta')).toEqual({
      success: false,
      error: 'Password too short',
    });
  });
});

describe('mementourile din cont', () => {
  test('rândul din tabel se traduce în forma aplicației', async () => {
    maybeSingle.mockResolvedValue({
      data: {
        cooking_enabled: true,
        cooking_time: '18:30',
        shopping_enabled: true,
        shopping_weekday: 2,
        shopping_time: '09:00',
        email_enabled: true,
        email_frequency_days: 2,
      },
      error: null,
    });

    expect(await cloudSyncService.loadReminders('u1')).toEqual({
      cookingEnabled: true,
      cookingTime: '18:30',
      shoppingEnabled: true,
      shoppingWeekday: 2,
      shoppingTime: '09:00',
      emailEnabled: true,
      emailFrequencyDays: 2,
    });
    expect(eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  test('un rând lipsă înseamnă „nimic salvat", nu setările implicite', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    expect(await cloudSyncService.loadReminders('u1')).toBeNull();
  });

  test('o eroare la citire nu ajunge ca excepție', async () => {
    maybeSingle.mockRejectedValue(new Error('offline'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(await cloudSyncService.loadReminders('u1')).toBeNull();
    warn.mockRestore();
  });

  test('salvarea scrie coloanele tabelului, pe utilizator', async () => {
    upsert.mockResolvedValue({ error: null });

    const result = await cloudSyncService.saveReminders('u1', {
      ...DEFAULT_REMINDERS,
      emailEnabled: true,
    });

    expect(result).toEqual({ success: true, error: null });
    expect(from).toHaveBeenCalledWith('user_reminders');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', email_enabled: true, email_frequency_days: 3 }),
      { onConflict: 'user_id' }
    );
  });

  test('refuzul la salvare se transmite', async () => {
    upsert.mockResolvedValue({ error: { message: 'RLS' } });

    expect(await cloudSyncService.saveReminders('u1', DEFAULT_REMINDERS)).toEqual({
      success: false,
      error: 'RLS',
    });
  });
});

describe('salvarea planului', () => {
  test('preferințele pleacă odată cu planul, ca alergiile să ajungă pe alt telefon', async () => {
    upsert.mockResolvedValue({ error: null });

    await cloudSyncService.saveMealPlan('u1', null, [], {
      avoidedAllergens: ['arahide'],
    } as never);

    expect(upsert.mock.calls[0][0]).toEqual(
      expect.objectContaining({ user_id: 'u1', preferences: { avoidedAllergens: ['arahide'] } })
    );
  });

  test('fără preferințe nu suprascrie coloana cu nimic', async () => {
    upsert.mockResolvedValue({ error: null });

    await cloudSyncService.saveMealPlan('u1', null, []);

    expect(upsert.mock.calls[0][0]).not.toHaveProperty('preferences');
  });

  test('refuzul la salvare se transmite', async () => {
    upsert.mockResolvedValue({ error: { message: 'too large' } });

    expect(await cloudSyncService.saveMealPlan('u1', null, [])).toEqual({
      success: false,
      error: 'too large',
    });
  });
});
