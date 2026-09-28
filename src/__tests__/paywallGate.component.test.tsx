import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../App';
import { useAppStore } from '../store/useAppStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { NOT_SUBSCRIBED } from '../services/subscriptionParse';
import { localAuthSimulation } from '../services/localAuthSimulation';

/**
 * The questionnaire is free; past it, the app needs the monthly subscription. Here without
 * RevenueCat keys, so the subscription is the local simulation, as on a laptop.
 */
describe('blocarea fără abonament', () => {
  // Signed in through the local simulation, so the session survives the app reading its
  // stored state on mount; a guest is, rightly, sent back to the start screen by that read.
  beforeEach(async () => {
    await AsyncStorage.clear();
    await localAuthSimulation.signUp('abonat@b.ro', 'Muntele7Verde');
    useSubscriptionStore.setState({ status: NOT_SUBSCRIBED, isChecked: true });
    useAppStore.setState({
      authStatus: 'signedIn',
      userEmail: 'abonat@b.ro',
      isHydrated: true,
      activeNotice: null,
    });
  });

  test('configuratorul e gratuit', () => {
    useAppStore.getState().resetOnboarding();
    render(<App />);

    expect(screen.getByText(/Pasul 1 din 9/)).toBeTruthy();
  });

  test('după configurator, fără abonament, apare ecranul de plată, nu planul', () => {
    useAppStore.getState().quickStart();
    render(<App />);

    expect(screen.getByText('Planul tău e gata')).toBeTruthy();
    expect(screen.queryByText(/COST TOTAL ESTIMAT/i)).toBeNull();
  });

  test('cât timp abonamentul nu e citit, nu arată nici planul, nici plata', () => {
    useSubscriptionStore.setState({ status: NOT_SUBSCRIBED, isChecked: false });
    useAppStore.getState().quickStart();
    render(<App />);

    expect(screen.getByLabelText('Se verifică abonamentul')).toBeTruthy();
    expect(screen.queryByText('Planul tău e gata')).toBeNull();
  });

  test('după abonare, planul se deschide', async () => {
    useAppStore.getState().quickStart();
    render(<App />);

    fireEvent.press(await screen.findByLabelText('Începe cele 7 zile gratuite'));

    await waitFor(() => expect(screen.getByText(/COST TOTAL ESTIMAT/i)).toBeTruthy());
  });

  test('„Înapoi la întrebări” duce în configurator', async () => {
    useAppStore.getState().quickStart();
    render(<App />);
    // Let the stored-state read that runs on mount finish first, as it does long before
    // anyone reaches this screen; otherwise it lands after the press and reopens the plan.
    await act(async () => {
      await useAppStore.getState().hydrateStorage();
    });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Înapoi la întrebări'));
    });

    expect(screen.getByText(/Pasul \d din 9/)).toBeTruthy();
  });
});
