import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../App';
import { useAppStore } from '../store/useAppStore';
import { useAuthSessionStore } from '../store/authSessionStore';
import { cloudSyncService } from '../services/supabase';
import { forgetThisRunForTests, markVerified, setBiometricEnabled } from '../services/reauth';
import { authenticateWithBiometrics, isBiometricAvailable } from '../services/biometric';
import { asSubscriber } from './helpers/subscriber';

jest.mock('../services/biometric', () => ({
  isBiometricAvailable: jest.fn(async () => false),
  biometricLabel: jest.fn(async () => 'Face ID'),
  authenticateWithBiometrics: jest.fn(async () => ({
    success: true,
    cancelled: false,
    error: null,
  })),
}));

const available = isBiometricAvailable as jest.Mock;
const authenticate = authenticateWithBiometrics as jest.Mock;
const DAY = 24 * 60 * 60 * 1000;
const CONSENT = { isAtLeast16: true, healthDataConsent: true };
let counter = 0;
let email: string;

/**
 * An account last verified 31 days ago, and the app started as it really starts: rendered
 * before the stored session is read, which it then reads once, behind a spinner.
 */
async function openLocked({ biometric = false }: { biometric?: boolean } = {}) {
  counter += 1;
  email = `ana${counter}@b.ro`;
  await cloudSyncService.signUpWithEmail(email, 'Muntele7Verde', CONSENT, 'Ana');
  if (biometric) await setBiometricEnabled(email, true);
  await markVerified(email, Date.now() - 31 * DAY);
  forgetThisRunForTests();
  useAppStore.setState({ isHydrated: false, authStatus: 'checking', userEmail: null });
  render(<App />);
  await waitFor(() => expect(useAppStore.getState().isHydrated).toBe(true));
  expect(useAppStore.getState().authStatus).not.toBe('checking');
}

beforeEach(async () => {
  jest.clearAllMocks();
  // Back to the defaults: an answer set by one test must not reach the next.
  available.mockReset().mockResolvedValue(false);
  authenticate.mockReset().mockResolvedValue({ success: true, cancelled: false, error: null });
  asSubscriber();
  await AsyncStorage.clear();
  useAuthSessionStore.getState().clear();
  useAppStore.setState({ activeNotice: null });
});

/**
 * Every thirty days the app asks the person to confirm it is them: Face ID where it is on,
 * otherwise the password or an emailed code. Signing out is always offered; carrying on
 * without an account is not, since that would be a way round the lock.
 */
describe('reverificarea la 30 de zile', () => {
  test('salută pe nume și spune contul', async () => {
    await openLocked();

    await waitFor(() => expect(screen.getByText('Bine ai revenit, Ana')).toBeTruthy());
    expect(screen.getByText(email)).toBeTruthy();
  });

  test('parola corectă deschide aplicația', async () => {
    await openLocked();

    fireEvent.changeText(screen.getByLabelText('Parola contului'), 'Muntele7Verde');
    fireEvent.press(screen.getByLabelText('Deblochează cu parola'));

    await waitFor(() => expect(useAppStore.getState().authStatus).toBe('signedIn'));
  });

  test('o parolă greșită lasă aplicația blocată', async () => {
    await openLocked();

    fireEvent.changeText(screen.getByLabelText('Parola contului'), 'gresita123');
    fireEvent.press(screen.getByLabelText('Deblochează cu parola'));

    await waitFor(() => expect(screen.getByText(/nu sunt corecte/)).toBeTruthy());
    expect(useAppStore.getState().authStatus).toBe('locked');
  });

  test('codul pe email deschide aplicația', async () => {
    await openLocked();

    fireEvent.press(screen.getByLabelText('Primește un cod pe email'));
    fireEvent.press(screen.getByLabelText('Trimite codul de conectare'));
    await waitFor(() => expect(screen.getByLabelText('Codul de conectare')).toBeTruthy());
    fireEvent.changeText(screen.getByLabelText('Codul de conectare'), '123456');
    fireEvent.press(screen.getByLabelText('Intră în cont cu codul'));

    await waitFor(() => expect(useAppStore.getState().authStatus).toBe('signedIn'));
  });

  test('„Deconectează-te” duce la ecranul de login', async () => {
    await openLocked();

    fireEvent.press(screen.getByLabelText('Nu ești tu? Deconectează-te'));

    await waitFor(() => expect(screen.getByLabelText('Fila Conectare')).toBeTruthy());
    expect(useAppStore.getState()).toMatchObject({ authStatus: 'checking', userEmail: null });
    expect(await cloudSyncService.currentEmail()).toBeNull();
  });

  test('fără biometrie pornită, nu apare butonul de Face ID', async () => {
    await openLocked();

    await waitFor(() => expect(screen.getByText('Bine ai revenit, Ana')).toBeTruthy());
    expect(screen.queryByLabelText(/Deblochează cu Face ID/)).toBeNull();
    expect(authenticate).not.toHaveBeenCalled();
  });
});

describe('reverificarea cu Face ID', () => {
  test('pornit pentru cont: cere Face ID singur și deschide aplicația', async () => {
    available.mockResolvedValue(true);

    await openLocked({ biometric: true });

    await waitFor(() => expect(useAppStore.getState().authStatus).toBe('signedIn'));
    expect(authenticate).toHaveBeenCalledTimes(1);
  });

  test('anulat: rămâne blocată, cu butonul la îndemână pentru încă o încercare', async () => {
    available.mockResolvedValue(true);
    authenticate.mockResolvedValue({ success: false, cancelled: true, error: null });

    await openLocked({ biometric: true });

    await waitFor(() => expect(screen.getByLabelText('Deblochează cu Face ID')).toBeTruthy());
    expect(useAppStore.getState().authStatus).toBe('locked');

    authenticate.mockResolvedValue({ success: true, cancelled: false, error: null });
    fireEvent.press(screen.getByLabelText('Deblochează cu Face ID'));
    await waitFor(() => expect(useAppStore.getState().authStatus).toBe('signedIn'));
  });

  test('pe un telefon fără biometrie, chiar pornită în cont, nu se încearcă', async () => {
    available.mockResolvedValue(false);

    await openLocked({ biometric: true });

    await waitFor(() => expect(screen.getByText('Bine ai revenit, Ana')).toBeTruthy());
    expect(authenticate).not.toHaveBeenCalled();
  });

  /** One try at a time: Face ID must not race a password already being checked. */
  test('cât timp se verifică parola, Face ID nu pornește peste ea', async () => {
    available.mockResolvedValue(true);
    let finishFace: (value: unknown) => void = () => undefined;
    authenticate.mockReturnValue(new Promise((resolve) => (finishFace = resolve)));

    await openLocked({ biometric: true });
    await waitFor(() => expect(authenticate).toHaveBeenCalledTimes(1));

    // Face ID is still open; a press on the button below does nothing until it ends.
    fireEvent.press(screen.getByLabelText('Deblochează cu Face ID'));
    expect(authenticate).toHaveBeenCalledTimes(1);

    finishFace({ success: false, cancelled: true, error: null });
    await waitFor(() => expect(screen.getByLabelText('Deblochează cu Face ID')).toBeTruthy());
    expect(useAppStore.getState().authStatus).toBe('locked');
  });
});
