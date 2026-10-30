import * as LocalAuthentication from 'expo-local-authentication';
import { authenticateWithBiometrics, biometricLabel, isBiometricAvailable } from '../biometric';
import { currentOs } from '../platformOs';

jest.spyOn(console, 'warn').mockImplementation(() => undefined);

jest.mock('../platformOs', () => ({ currentOs: jest.fn(() => 'ios') }));

const mocked = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;
const osMock = currentOs as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  osMock.mockReturnValue('ios');
  mocked.hasHardwareAsync.mockResolvedValue(true);
  mocked.isEnrolledAsync.mockResolvedValue(true);
  mocked.supportedAuthenticationTypesAsync.mockResolvedValue([
    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
  ]);
  mocked.authenticateAsync.mockResolvedValue({ success: true });
});

describe('dacă telefonul poate folosi biometria', () => {
  test('cu senzor și o față sau amprentă înregistrată, da', async () => {
    expect(await isBiometricAvailable()).toBe(true);
  });

  test('fără senzor, nu', async () => {
    mocked.hasHardwareAsync.mockResolvedValue(false);

    expect(await isBiometricAvailable()).toBe(false);
  });

  test('cu senzor, dar nimic înregistrat, nu', async () => {
    mocked.isEnrolledAsync.mockResolvedValue(false);

    expect(await isBiometricAvailable()).toBe(false);
  });

  test('pe web, niciodată, și modulul nativ nici nu e atins', async () => {
    osMock.mockReturnValue('web');

    expect(await isBiometricAvailable()).toBe(false);
    expect(mocked.hasHardwareAsync).not.toHaveBeenCalled();
  });

  test('o eroare a modulului nativ înseamnă „nu”, nu un ecran căzut', async () => {
    mocked.hasHardwareAsync.mockRejectedValue(new Error('native module missing'));

    expect(await isBiometricAvailable()).toBe(false);
  });
});

describe('cum se numește în textele aplicației', () => {
  test.each([
    ['ios', [2], 'Face ID'],
    ['ios', [1], 'Touch ID'],
    ['android', [1], 'amprenta'],
    ['android', [2], 'recunoașterea feței'],
    ['android', [1, 2], 'amprenta'],
    ['android', [], 'biometria'],
  ])('%s cu tipurile %j → %s', async (os, types, expected) => {
    osMock.mockReturnValue(os);
    mocked.supportedAuthenticationTypesAsync.mockResolvedValue(types);

    expect(await biometricLabel()).toBe(expected);
  });

  test('dacă tipurile nu pot fi citite, rămâne „biometria”', async () => {
    mocked.supportedAuthenticationTypesAsync.mockRejectedValue(new Error('x'));

    expect(await biometricLabel()).toBe('biometria');
  });
});

describe('confirmarea cu Face ID sau amprenta', () => {
  test('reușită', async () => {
    expect(await authenticateWithBiometrics()).toEqual({
      success: true,
      cancelled: false,
      error: null,
    });
  });

  /** Cancelling leads to the password or the emailed code, so it is not an error. */
  test('anularea nu e o eroare', async () => {
    mocked.authenticateAsync.mockResolvedValue({ success: false, error: 'user_cancel' });

    expect(await authenticateWithBiometrics()).toEqual({
      success: false,
      cancelled: true,
      error: null,
    });
  });

  test('prea multe încercări trimit la parolă sau cod', async () => {
    mocked.authenticateAsync.mockResolvedValue({ success: false, error: 'lockout' });

    const result = await authenticateWithBiometrics();

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/parol/);
  });

  test.each(['not_enrolled', 'passcode_not_set', 'not_available'])(
    'biometria scoasă din setări (%s) trimite la parolă',
    async (code) => {
      mocked.authenticateAsync.mockResolvedValue({ success: false, error: code as never });

      expect((await authenticateWithBiometrics()).error).toMatch(/nu mai e configurată/);
    }
  );

  test('alt eșec are un mesaj în română', async () => {
    mocked.authenticateAsync.mockResolvedValue({ success: false, error: 'authentication_failed' });

    expect((await authenticateWithBiometrics()).error).toMatch(/Nu te-am putut recunoaște/);
  });

  test('o excepție nu scapă din serviciu', async () => {
    mocked.authenticateAsync.mockRejectedValue(new Error('boom'));

    const result = await authenticateWithBiometrics();

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('promptul e în română, iar codul telefonului nu înlocuiește biometria', async () => {
    await authenticateWithBiometrics();

    expect(mocked.authenticateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        promptMessage: expect.stringMatching(/ești tu/),
        cancelLabel: 'Folosește parola',
        disableDeviceFallback: true,
        biometricsSecurityLevel: 'strong',
      })
    );
  });

  test('pe web nu se încearcă deloc', async () => {
    osMock.mockReturnValue('web');

    const result = await authenticateWithBiometrics();

    expect(result.success).toBe(false);
    expect(mocked.authenticateAsync).not.toHaveBeenCalled();
  });
});
