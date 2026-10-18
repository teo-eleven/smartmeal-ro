import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AccountIdentity } from '../AccountIdentity';
import { useAuthSessionStore } from '../../store/authSessionStore';
import { updateDisplayName } from '../../services/profile';

jest.mock('../../services/profile', () => ({
  getDisplayName: jest.fn(async () => null),
  updateDisplayName: jest.fn(),
}));

const update = updateDisplayName as jest.Mock;
const setBiometric = jest.fn(async () => ({ error: null as string | null }));

beforeEach(() => {
  jest.clearAllMocks();
  update
    .mockReset()
    .mockImplementation(async (name: string) => ({ name: name.trim(), error: null }));
  useAuthSessionStore.setState({
    displayName: 'Ana',
    biometricLabel: 'Face ID',
    isBiometricAvailable: true,
    biometricEnabled: false,
    setBiometricEnabled: setBiometric,
  });
});

afterEach(() => {
  useAuthSessionStore.getState().clear();
});

/** The name the account greets with, and Face ID for the monthly check, in Cont. */
describe('numele din cont', () => {
  test('se vede', () => {
    render(<AccountIdentity email="ana@b.ro" isDark={false} />);

    expect(screen.getByText('Ana')).toBeTruthy();
  });

  test('se poate schimba', async () => {
    render(<AccountIdentity email="ana@b.ro" isDark={false} />);

    fireEvent.press(screen.getByLabelText('Schimbă numele'));
    fireEvent.changeText(screen.getByLabelText('Numele tău'), 'Ana Maria');
    fireEvent.press(screen.getByLabelText('Salvează numele'));

    await waitFor(() => expect(useAuthSessionStore.getState().displayName).toBe('Ana Maria'));
    expect(update).toHaveBeenCalledWith('Ana Maria');
    expect(screen.queryByLabelText('Numele tău')).toBeNull();
  });

  test('o eroare la salvare rămâne pe ecran, cu numele vechi păstrat', async () => {
    update.mockResolvedValue({ name: null, error: 'Nu am putut salva numele. Încearcă din nou.' });
    render(<AccountIdentity email="ana@b.ro" isDark={false} />);

    fireEvent.press(screen.getByLabelText('Schimbă numele'));
    fireEvent.changeText(screen.getByLabelText('Numele tău'), 'Ion');
    fireEvent.press(screen.getByLabelText('Salvează numele'));

    await waitFor(() => expect(screen.getByText(/Nu am putut salva numele/)).toBeTruthy());
    expect(useAuthSessionStore.getState().displayName).toBe('Ana');
  });

  test('„Renunță” lasă numele cum era', () => {
    render(<AccountIdentity email="ana@b.ro" isDark={false} />);

    fireEvent.press(screen.getByLabelText('Schimbă numele'));
    fireEvent.changeText(screen.getByLabelText('Numele tău'), 'Ion');
    fireEvent.press(screen.getByLabelText('Renunță la schimbarea numelui'));

    expect(screen.getByText('Ana')).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
  });

  test('fără nume: se poate adăuga', () => {
    useAuthSessionStore.setState({ displayName: null });

    render(<AccountIdentity email="ana@b.ro" isDark={false} />);

    expect(screen.getByLabelText('Adaugă un nume')).toBeTruthy();
  });
});

describe('Face ID în cont', () => {
  test('comutatorul arată starea și o schimbă pentru acest cont', () => {
    render(<AccountIdentity email="ana@b.ro" isDark={false} />);
    const toggle = screen.getByLabelText('Deblochează cu Face ID');
    expect(toggle.props.accessibilityState.checked).toBe(false);

    fireEvent.press(toggle);

    expect(setBiometric).toHaveBeenCalledWith('ana@b.ro', true);
  });

  test('dacă Face ID nu confirmă, spune de ce', async () => {
    setBiometric.mockResolvedValueOnce({ error: 'Nu te-am recunoscut' });
    render(<AccountIdentity email="ana@b.ro" isDark={false} />);

    fireEvent.press(screen.getByLabelText('Deblochează cu Face ID'));

    await waitFor(() => expect(screen.getByText('Nu te-am recunoscut')).toBeTruthy());
  });

  test('o salvare care eșuează are mesaj, nu o eroare ascunsă', async () => {
    setBiometric.mockRejectedValueOnce(new Error('keychain'));
    render(<AccountIdentity email="ana@b.ro" isDark={false} />);

    fireEvent.press(screen.getByLabelText('Deblochează cu Face ID'));

    await waitFor(() => expect(screen.getByText(/nu a putut fi salvată/)).toBeTruthy());
  });

  /** On the web, or a phone with no sensor set up, there is nothing to switch on. */
  test('nu apare unde biometria nu e disponibilă', () => {
    useAuthSessionStore.setState({ isBiometricAvailable: false });

    render(<AccountIdentity email="ana@b.ro" isDark={false} />);

    expect(screen.queryByLabelText('Deblochează cu Face ID')).toBeNull();
  });
});
