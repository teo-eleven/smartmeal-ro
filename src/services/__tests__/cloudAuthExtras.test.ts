import { AuthRetryableFetchError, createClient } from '@supabase/supabase-js';
import { cloudSyncService } from '../supabase';
import { LOGIN_CODE_INVALID, isCodeShaped, requestLoginCode, verifyLoginCode } from '../authCode';
import { getDisplayName, updateDisplayName } from '../profile';
import { getDeviceId, listDevices, registerThisDevice, revokeDevice } from '../devices';
import { SignUpConsent } from '../../types';

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
jest.mock('../platformOs', () => ({ currentOs: () => 'ios' }));

/**
 * The sign-in code, the name and the device list against a real project: what is sent to
 * Supabase, and what each of its answers turns into on screen. The same features through the
 * local simulation are in localAuthFlow.test.ts.
 */
const auth = {
  getUser: jest.fn(),
  signUp: jest.fn(),
  signInWithOtp: jest.fn(),
  verifyOtp: jest.fn(),
};
const maybeSingle = jest.fn();
const updateEq = jest.fn();
const is = jest.fn();
const update = jest.fn(() => ({ eq: updateEq }));
const select = jest.fn(() => ({ eq: () => ({ maybeSingle }), is }));
const from = jest.fn(() => ({ select, update }));
const rpc = jest.fn();

(createClient as jest.Mock).mockReturnValue({ auth, from, rpc });

const CONSENT: SignUpConsent = { isAtLeast16: true, healthDataConsent: true };
const USER = { id: 'u1', email: 'ana@b.ro' };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  auth.getUser.mockResolvedValue({ data: { user: USER } });
});

describe('numele trimis la înregistrare', () => {
  test('pleacă în metadate, curățat, ca display_name', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: 'u2' } }, error: null });

    await cloudSyncService.signUpWithEmail('c@d.ro', 'Muntele7Verde', CONSENT, '  Ana   Pop ');

    expect(auth.signUp.mock.calls[0][0].options.data.display_name).toBe('Ana Pop');
  });

  test('un nume gol oprește înregistrarea înainte de server', async () => {
    const result = await cloudSyncService.signUpWithEmail('c@d.ro', 'Muntele7Verde', CONSENT, ' ');

    expect(result.error).toBe('Scrie cum te numești.');
    expect(auth.signUp).not.toHaveBeenCalled();
  });
});

describe('cererea codului de conectare', () => {
  test('nu creează conturi noi', async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null });

    expect(await requestLoginCode(' ana@b.ro ')).toEqual({ success: true, error: null });
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'ana@b.ro',
      options: { shouldCreateUser: false },
    });
  });

  /** "Signups not allowed for otp" is Supabase saying the address has no account. */
  test('o adresă fără cont primește același răspuns ca una cu cont', async () => {
    auth.signInWithOtp.mockResolvedValue({
      error: { code: 'otp_disabled', message: 'Signups not allowed for otp' },
    });

    expect(await requestLoginCode('nimeni@b.ro')).toEqual({ success: true, error: null });
  });

  test('prea multe emailuri se spun pe față', async () => {
    auth.signInWithOtp.mockResolvedValue({
      error: { code: 'over_email_send_rate_limit', message: 'rate limit' },
    });

    const result = await requestLoginCode('ana@b.ro');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Prea multe emailuri/);
  });

  test('fără internet nu se pretinde că a plecat codul', async () => {
    auth.signInWithOtp.mockResolvedValue({
      error: new AuthRetryableFetchError('Failed to fetch', 0),
    });

    const result = await requestLoginCode('ana@b.ro');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/conexiunea/);
  });

  test('o excepție devine mesaj', async () => {
    auth.signInWithOtp.mockRejectedValue(new Error('boom'));

    expect((await requestLoginCode('ana@b.ro')).success).toBe(false);
  });
});

describe('verificarea codului', () => {
  test.each([
    ['123456', true],
    ['1234567890', true],
    ['12345', false],
    ['12345678901', false],
    ['12a456', false],
  ])('%s are forma unui cod: %s', (code, expected) => {
    expect(isCodeShaped(code)).toBe(expected);
  });

  test('un cod corect conectează, cu tipul „email”', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { user: USER }, error: null });

    expect(await verifyLoginCode('ana@b.ro', ' 123456 ')).toEqual({
      email: 'ana@b.ro',
      error: null,
    });
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: 'ana@b.ro',
      token: '123456',
      type: 'email',
    });
  });

  test('un cod greșit sau expirat', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { user: null }, error: { code: 'otp_expired' } });

    expect(await verifyLoginCode('ana@b.ro', '123456')).toEqual({
      email: null,
      error: LOGIN_CODE_INVALID,
    });
  });

  test('un cod care nu are forma potrivită nu ajunge la server', async () => {
    expect((await verifyLoginCode('ana@b.ro', 'abc')).error).toBe(LOGIN_CODE_INVALID);
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });

  test('fără internet, mesajul spune asta', async () => {
    auth.verifyOtp.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('Failed to fetch', 0),
    });

    expect((await verifyLoginCode('ana@b.ro', '123456')).error).toMatch(/conexiunea/);
  });

  test('o excepție devine mesaj', async () => {
    auth.verifyOtp.mockRejectedValue(new Error('boom'));

    expect((await verifyLoginCode('ana@b.ro', '123456')).email).toBeNull();
  });
});

describe('numele din profil', () => {
  test('se citește din profiles pentru utilizatorul conectat', async () => {
    maybeSingle.mockResolvedValue({ data: { display_name: 'Ana' }, error: null });

    expect(await getDisplayName()).toBe('Ana');
    expect(from).toHaveBeenCalledWith('profiles');
  });

  test('un rând fără nume, sau cu altceva decât text, înseamnă fără nume', async () => {
    maybeSingle.mockResolvedValue({ data: { display_name: 42 }, error: null });
    expect(await getDisplayName()).toBeNull();

    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await getDisplayName()).toBeNull();
  });

  test('o eroare la citire înseamnă fără nume, nu ecran căzut', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'x' } });
    expect(await getDisplayName()).toBeNull();

    maybeSingle.mockRejectedValue(new Error('boom'));
    expect(await getDisplayName()).toBeNull();
  });

  test('fără cont conectat nu se întreabă serverul', async () => {
    auth.getUser.mockResolvedValue({ data: { user: null } });

    expect(await getDisplayName()).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  test('schimbarea numelui scrie doar coloana display_name', async () => {
    updateEq.mockResolvedValue({ error: null });

    expect(await updateDisplayName(' Ana  Maria ')).toEqual({ name: 'Ana Maria', error: null });
    expect(update).toHaveBeenCalledWith({ display_name: 'Ana Maria' });
    expect(updateEq).toHaveBeenCalledWith('user_id', 'u1');
  });

  test('o eroare la salvare are mesaj în română', async () => {
    updateEq.mockResolvedValue({
      error: { message: 'new row violates row-level security policy' },
    });
    expect((await updateDisplayName('Ana')).error).toMatch(/Nu am putut salva/);

    updateEq.mockRejectedValue(new Error('boom'));
    expect((await updateDisplayName('Ana')).error).toMatch(/Nu am putut salva/);
  });

  test('fără cont conectat nu se poate schimba', async () => {
    auth.getUser.mockResolvedValue({ data: { user: null } });

    expect((await updateDisplayName('Ana')).error).toMatch(/Conectează-te/);
  });
});

describe('dispozitivele', () => {
  test('înregistrarea trimite id-ul, numele și platforma, nu și utilizatorul', async () => {
    rpc.mockResolvedValue({ error: null });

    expect(await registerThisDevice()).toBe('ok');
    expect(rpc).toHaveBeenCalledWith('register_device', {
      p_device_id: await getDeviceId(),
      p_name: 'iPhone',
      p_platform: 'ios',
    });
  });

  test('o sesiune încheiată de pe alt dispozitiv înseamnă „revocat”', async () => {
    rpc.mockResolvedValue({ error: { code: '42501', message: 'session ended' } });

    expect(await registerThisDevice()).toBe('revoked');
  });

  test('alte erori nu deconectează pe nimeni', async () => {
    rpc.mockResolvedValue({ error: { code: '500', message: 'oops' } });
    expect(await registerThisDevice()).toBe('skipped');

    rpc.mockRejectedValue(new Error('Failed to fetch'));
    expect(await registerThisDevice()).toBe('skipped');
  });

  test('fără cont conectat nu se înregistrează nimic', async () => {
    auth.getUser.mockResolvedValue({ data: { user: null } });

    expect(await registerThisDevice()).toBe('skipped');
    expect(rpc).not.toHaveBeenCalled();
  });

  test('lista: dispozitivul ăsta primul, apoi după ultima folosire', async () => {
    const current = await getDeviceId();
    is.mockResolvedValue({
      data: [
        {
          device_id: 'a',
          device_name: 'Chrome pe Mac',
          platform: 'web',
          last_seen_at: '2026-10-01T10:00:00Z',
          revoked_at: null,
        },
        {
          device_id: current,
          device_name: 'iPhone',
          platform: 'ios',
          last_seen_at: '2026-09-01T10:00:00Z',
          revoked_at: null,
        },
        {
          device_id: 'b',
          device_name: 'Telefon Android',
          platform: 'android',
          last_seen_at: '2026-10-02T10:00:00Z',
          revoked_at: null,
        },
      ],
      error: null,
    });

    const { devices, error } = await listDevices();

    expect(error).toBeNull();
    expect(
      devices.map((d) => [d.deviceId === current ? 'acesta' : d.deviceId, d.isCurrent])
    ).toEqual([
      ['acesta', true],
      ['b', false],
      ['a', false],
    ]);
    expect(is).toHaveBeenCalledWith('revoked_at', null);
  });

  test('rândurile stricate sau deconectate sunt lăsate deoparte', async () => {
    is.mockResolvedValue({
      data: [
        {
          device_id: 'a',
          device_name: 'Chrome pe Mac',
          platform: 'web',
          last_seen_at: '2026-10-01T10:00:00Z',
          revoked_at: null,
        },
        { device_id: 'b', device_name: 7, last_seen_at: '2026-10-01T10:00:00Z' },
        {
          device_id: 'c',
          device_name: 'Vechi',
          platform: 'ios',
          last_seen_at: '2026-10-01T10:00:00Z',
          revoked_at: '2026-10-02T00:00:00Z',
        },
        null,
        {
          device_id: 'd',
          device_name: 'Ciudat',
          platform: 'windows',
          last_seen_at: '2026-10-01T10:00:00Z',
        },
      ],
      error: null,
    });

    const { devices } = await listDevices();

    expect(devices.map((d) => d.deviceId)).toEqual(['a', 'd']);
    expect(devices[1].platform).toBe('web');
  });

  test('o eroare la citirea listei are mesaj', async () => {
    is.mockResolvedValue({ data: null, error: { message: 'x' } });
    expect((await listDevices()).error).toMatch(/Nu am putut încărca/);

    is.mockRejectedValue(new Error('boom'));
    expect((await listDevices()).error).toMatch(/Nu am putut încărca/);
  });

  test('deconectarea altui dispozitiv', async () => {
    rpc.mockResolvedValue({ error: null });

    expect(await revokeDevice('alt-id')).toEqual({ success: true, error: null });
    expect(rpc).toHaveBeenCalledWith('revoke_device', { p_device_id: 'alt-id' });
  });

  test('dispozitivul ăsta nu ajunge la server', async () => {
    const result = await revokeDevice(await getDeviceId());

    expect(result.error).toMatch(/Deconectare/);
    expect(rpc).not.toHaveBeenCalled();
  });

  test.each([
    ['no such device', /deja deconectat/],
    ['cannot revoke the current device', /Deconectare/],
    ['something else', /Nu am putut deconecta/],
  ])('răspunsul serverului „%s” are mesaj în română', async (message, expected) => {
    rpc.mockResolvedValue({ error: { message } });

    expect((await revokeDevice('alt-id')).error).toMatch(expected);
  });

  test('o excepție la deconectare are mesaj', async () => {
    rpc.mockRejectedValue(new Error('boom'));

    expect((await revokeDevice('alt-id')).error).toMatch(/Nu am putut deconecta/);
  });
});
