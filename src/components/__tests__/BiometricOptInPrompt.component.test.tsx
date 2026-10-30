import React from 'react';
import { Modal } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { BiometricOptInPrompt } from '../BiometricOptInPrompt';
import { useAppStore } from '../../store/useAppStore';
import { useAuthSessionStore } from '../../store/authSessionStore';

const answer = jest.fn(async () => undefined);

beforeEach(() => {
  jest.clearAllMocks();
  useAppStore.setState({ authStatus: 'signedIn', userEmail: 'ana@b.ro' });
  useAuthSessionStore.setState({
    shouldOfferBiometric: true,
    biometricLabel: 'Face ID',
    answerBiometricOffer: answer,
  });
});

afterEach(() => {
  useAuthSessionStore.getState().clear();
  useAppStore.setState({
    authStatus: 'checking',
    userEmail: null,
    activeNotice: null,
    confirmRequest: null,
  });
});

/** "Folosești Face ID data viitoare?" — once, after signing in, where it can work. */
describe('întrebarea despre Face ID', () => {
  test('apare după conectare, cu numele biometriei de pe telefon', () => {
    render(<BiometricOptInPrompt isDark={false} />);

    expect(screen.getByText('Folosești Face ID data viitoare?')).toBeTruthy();
  });

  test('„Da” o pornește pentru contul conectat', async () => {
    render(<BiometricOptInPrompt isDark={false} />);

    fireEvent.press(screen.getByLabelText('Da, folosește Face ID'));

    await waitFor(() => expect(answer).toHaveBeenCalledWith('ana@b.ro', true));
  });

  test('„Nu acum” o lasă oprită', async () => {
    render(<BiometricOptInPrompt isDark={false} />);

    fireEvent.press(screen.getByLabelText('Nu acum'));

    await waitFor(() => expect(answer).toHaveBeenCalledWith('ana@b.ro', false));
  });

  test('nu apare dacă nu e de pus', () => {
    useAuthSessionStore.setState({ shouldOfferBiometric: false });

    render(<BiometricOptInPrompt isDark={false} />);

    expect(screen.queryByText(/data viitoare/)).toBeNull();
  });

  /** Behind the lock the person has not been verified; the offer waits until they are. */
  test('nu apare în ecranul de blocare', () => {
    useAppStore.setState({ authStatus: 'locked' });

    render(<BiometricOptInPrompt isDark={false} />);

    expect(screen.queryByText(/data viitoare/)).toBeNull();
  });

  /** iOS shows one window at a time; a second one would be dropped, so this one waits. */
  test('așteaptă cât timp e deschisă altă fereastră', () => {
    const { rerender } = render(<BiometricOptInPrompt isDark={false} isSuppressed />);
    expect(screen.queryByText(/data viitoare/)).toBeNull();

    rerender(<BiometricOptInPrompt isDark={false} isSuppressed={false} />);

    expect(screen.getByText('Folosești Face ID data viitoare?')).toBeTruthy();
  });

  test('dacă alegerea nu se poate salva, întrebarea se închide fără să blocheze ecranul', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    answer.mockRejectedValueOnce(new Error('keychain'));
    render(<BiometricOptInPrompt isDark={false} />);

    fireEvent.press(screen.getByLabelText('Nu acum'));

    await waitFor(() => expect(screen.queryByText(/data viitoare/)).toBeNull());
  });

  test('butonul Înapoi de pe Android o închide ca „Nu acum”', async () => {
    render(<BiometricOptInPrompt isDark={false} />);

    screen.UNSAFE_getByType(Modal).props.onRequestClose();

    await waitFor(() => expect(answer).toHaveBeenCalledWith('ana@b.ro', false));
  });

  test('așteaptă cât timp e deschisă o notificare, fără să i se spună', () => {
    useAppStore.setState({
      activeNotice: { id: '1', title: 'Plan gata', message: 'x', type: 'info' },
    });

    render(<BiometricOptInPrompt isDark={false} />);

    expect(screen.queryByText(/data viitoare/)).toBeNull();
  });

  test('așteaptă cât timp e deschisă o confirmare', () => {
    useAppStore.setState({ confirmRequest: 'reset_onboarding' });

    render(<BiometricOptInPrompt isDark={false} />);

    expect(screen.queryByText(/data viitoare/)).toBeNull();
  });
});
