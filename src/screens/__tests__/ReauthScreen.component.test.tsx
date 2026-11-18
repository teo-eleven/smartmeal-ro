import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ReauthScreen } from '../ReauthScreen';
import { useAppStore } from '../../store/useAppStore';
import { useAuthSessionStore } from '../../store/authSessionStore';
import { cloudSyncService } from '../../services/supabase';

jest.mock('../../services/supabase', () => ({
  cloudSyncService: { signInWithEmail: jest.fn(), signOut: jest.fn() },
}));

const signIn = cloudSyncService.signInWithEmail as jest.Mock;
const unlockWithBiometrics = jest.fn();

/** Lets the pending promises and state updates settle. */
const settle = () => act(async () => undefined);

beforeEach(() => {
  jest.clearAllMocks();
  unlockWithBiometrics.mockResolvedValue({ success: false, cancelled: true, error: null });
  useAppStore.setState({ authStatus: 'locked', userEmail: 'ana@b.ro' });
  useAuthSessionStore.setState({
    biometricEnabled: false,
    biometricLabel: 'Face ID',
    unlockWithBiometrics,
  });
});

afterEach(() => {
  useAppStore.setState({ authStatus: 'checking', userEmail: null });
});

/** The monthly lock asks for Face ID once, on its own, as soon as it is known to be on. */
describe('ecranul de blocare: Face ID cerut o singură dată', () => {
  test('cerut singur când Face ID e pornit de la început', async () => {
    useAuthSessionStore.setState({ biometricEnabled: true });

    render(<ReauthScreen isDark={false} />);
    await settle();

    expect(unlockWithBiometrics).toHaveBeenCalledTimes(1);
    expect(unlockWithBiometrics).toHaveBeenCalledWith('ana@b.ro');
  });

  test('aflat pornit cât timp ecranul lucrează: cerut după ce termină, o singură dată', async () => {
    let finishSignIn: (value: unknown) => void = () => undefined;
    signIn.mockReturnValue(new Promise((resolve) => (finishSignIn = resolve)));
    render(<ReauthScreen isDark={false} />);
    fireEvent.changeText(screen.getByLabelText('Parola contului'), 'parola');
    fireEvent.press(screen.getByLabelText('Deblochează cu parola'));
    await settle();

    act(() => useAuthSessionStore.setState({ biometricEnabled: true }));
    await settle();
    expect(unlockWithBiometrics).not.toHaveBeenCalled();

    await act(async () => finishSignIn({ user: null, error: 'Parola greșită.' }));
    await settle();

    expect(unlockWithBiometrics).toHaveBeenCalledTimes(1);

    act(() => useAuthSessionStore.setState({ biometricLabel: 'Amprentă' }));
    await settle();
    expect(unlockWithBiometrics).toHaveBeenCalledTimes(1);
  });

  /** Choosing the emailed code is a decision not to use Face ID; it is not asked behind it. */
  test('aflat pornit după ce ai ales codul pe email: nu se cere singur', async () => {
    render(<ReauthScreen isDark={false} />);
    fireEvent.press(screen.getByLabelText('Primește un cod pe email'));

    act(() => useAuthSessionStore.setState({ biometricEnabled: true }));
    await settle();

    expect(unlockWithBiometrics).not.toHaveBeenCalled();
  });
});
