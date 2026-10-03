import { useAuthSessionStore } from '../authSessionStore';
import { useAppStore } from '../useAppStore';
import {
  authenticateWithBiometrics,
  biometricLabel,
  isBiometricAvailable,
} from '../../services/biometric';
import { getDisplayName } from '../../services/profile';
import {
  markBiometricAsked,
  readAccountSecurity,
  setBiometricEnabled,
} from '../../services/reauth';

jest.mock('../../services/biometric', () => ({
  isBiometricAvailable: jest.fn(),
  biometricLabel: jest.fn(),
  authenticateWithBiometrics: jest.fn(),
}));
jest.mock('../../services/profile', () => ({ getDisplayName: jest.fn() }));

const available = isBiometricAvailable as jest.Mock;
const label = biometricLabel as jest.Mock;
const authenticate = authenticateWithBiometrics as jest.Mock;
const displayName = getDisplayName as jest.Mock;

let email: string;
let counter = 0;

beforeEach(() => {
  jest.clearAllMocks();
  // A fresh address per test: the keychain mock in jest.setup.js keeps its contents.
  counter += 1;
  email = `ana${counter}@b.ro`;
  available.mockResolvedValue(true);
  label.mockResolvedValue('Face ID');
  displayName.mockResolvedValue('Ana');
  authenticate.mockResolvedValue({ success: true, cancelled: false, error: null });
  useAuthSessionStore.getState().clear();
  useAppStore.setState({ userEmail: email, authStatus: 'locked' });
});

describe('ce știe aplicația despre contul conectat', () => {
  test('numele, cum se numește biometria și dacă e pornită', async () => {
    await setBiometricEnabled(email, true);

    await useAuthSessionStore.getState().refresh(email);

    expect(useAuthSessionStore.getState()).toMatchObject({
      displayName: 'Ana',
      biometricLabel: 'Face ID',
      biometricEnabled: true,
      isBiometricAvailable: true,
      shouldOfferBiometric: false,
    });
  });

  /** "Folosești Face ID data viitoare?" — once, after the first sign-in, where it can work. */
  test('întrebarea despre Face ID apare o singură dată', async () => {
    await useAuthSessionStore.getState().refresh(email);
    expect(useAuthSessionStore.getState().shouldOfferBiometric).toBe(true);

    await markBiometricAsked(email);
    await useAuthSessionStore.getState().refresh(email);
    expect(useAuthSessionStore.getState().shouldOfferBiometric).toBe(false);
  });

  test('pe un telefon fără biometrie (sau pe web) întrebarea nu apare', async () => {
    available.mockResolvedValue(false);

    await useAuthSessionStore.getState().refresh(email);

    expect(useAuthSessionStore.getState().shouldOfferBiometric).toBe(false);
  });

  test('„Da” pornește biometria și închide întrebarea', async () => {
    await useAuthSessionStore.getState().refresh(email);

    await useAuthSessionStore.getState().answerBiometricOffer(email, true);

    expect(useAuthSessionStore.getState()).toMatchObject({
      biometricEnabled: true,
      shouldOfferBiometric: false,
    });
    expect((await readAccountSecurity(email)).biometricEnabled).toBe(true);
  });

  test('„Nu acum” închide întrebarea și lasă biometria oprită', async () => {
    await useAuthSessionStore.getState().refresh(email);

    await useAuthSessionStore.getState().answerBiometricOffer(email, false);

    expect(useAuthSessionStore.getState().shouldOfferBiometric).toBe(false);
    expect(await readAccountSecurity(email)).toMatchObject({
      biometricEnabled: false,
      biometricAsked: true,
    });
  });

  test('comutatorul din Cont oprește biometria', async () => {
    await setBiometricEnabled(email, true);

    await useAuthSessionStore.getState().setBiometricEnabled(email, false);

    expect(useAuthSessionStore.getState().biometricEnabled).toBe(false);
    expect((await readAccountSecurity(email)).biometricEnabled).toBe(false);
  });

  test('numele schimbat în Cont se vede imediat', () => {
    useAuthSessionStore.getState().setDisplayName('Ana Maria');

    expect(useAuthSessionStore.getState().displayName).toBe('Ana Maria');
  });

  test('la deconectare se uită totul', async () => {
    await useAuthSessionStore.getState().refresh(email);

    useAuthSessionStore.getState().clear();

    expect(useAuthSessionStore.getState()).toMatchObject({
      displayName: null,
      biometricEnabled: false,
      shouldOfferBiometric: false,
    });
  });
});

describe('deblocarea cu Face ID', () => {
  test('reușită: aplicația se deschide și luna reîncepe', async () => {
    await setBiometricEnabled(email, true);
    const before = Date.now();

    const result = await useAuthSessionStore.getState().unlockWithBiometrics(email);

    expect(result).toEqual({ success: true, cancelled: false, error: null });
    expect(useAppStore.getState().authStatus).toBe('signedIn');
    expect((await readAccountSecurity(email)).lastFullAuthAt).toBeGreaterThanOrEqual(before);
  });

  test('anulată: rămâne blocată, fără mesaj de eroare', async () => {
    await setBiometricEnabled(email, true);
    authenticate.mockResolvedValue({ success: false, cancelled: true, error: null });

    const result = await useAuthSessionStore.getState().unlockWithBiometrics(email);

    expect(result.cancelled).toBe(true);
    expect(useAppStore.getState().authStatus).toBe('locked');
  });

  test('nereușită: rămâne blocată, cu mesajul serviciului', async () => {
    await setBiometricEnabled(email, true);
    authenticate.mockResolvedValue({
      success: false,
      cancelled: false,
      error: 'Nu te-am recunoscut',
    });

    const result = await useAuthSessionStore.getState().unlockWithBiometrics(email);

    expect(result.error).toBe('Nu te-am recunoscut');
    expect(useAppStore.getState().authStatus).toBe('locked');
  });

  /** Turned off in Cont, or on another account: the sensor alone must not open the app. */
  test('cu biometria oprită pentru cont, nici nu se încearcă', async () => {
    const result = await useAuthSessionStore.getState().unlockWithBiometrics(email);

    expect(authenticate).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(useAppStore.getState().authStatus).toBe('locked');
  });
});
