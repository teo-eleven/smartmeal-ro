import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../App';
import { useAppStore } from '../store/useAppStore';
import { localAuthSimulation } from '../services/localAuthSimulation';
import { asSubscriber } from './helpers/subscriber';

/**
 * The first screen of a fresh install. An account is what carries the week to a second
 * phone, so it is offered first and loudly — but the planner works offline without one, and
 * Apple's guideline 5.1.1(i) forbids forcing registration on an app like that. Carrying on
 * without an account is therefore offered quietly, not hidden.
 */
describe('poarta de la prima pornire', () => {
  beforeEach(async () => {
    asSubscriber();
    await AsyncStorage.clear();
    useAppStore.setState({
      authStatus: 'checking',
      isHydrated: true,
      userEmail: null,
      currentPlan: null,
      groceryItems: [],
      activeNotice: null,
    });
  });

  test('o instalare nouă cere întâi cont', () => {
    render(<App />);

    expect(screen.getByLabelText('Conectează-te sau creează cont')).toBeTruthy();
    expect(screen.queryByText(/Pasul 1 din 9/i)).toBeNull();
  });

  /** Past the thirty days the session is still valid, and the plan must still not show. */
  test('un cont blocat la 30 de zile nu ajunge la plan', () => {
    useAppStore.setState({ authStatus: 'locked', userEmail: 'ana@b.ro' });

    render(<App />);

    expect(screen.getByLabelText('Conectează-te sau creează cont')).toBeTruthy();
    expect(screen.queryByText(/Pasul 1 din 9/i)).toBeNull();
  });

  test('oferă și calea fără cont', () => {
    render(<App />);

    expect(screen.getByLabelText('Continuă fără cont')).toBeTruthy();
  });

  test('aleasă, duce direct în aplicație', () => {
    render(<App />);

    fireEvent.press(screen.getByLabelText('Continuă fără cont'));

    expect(useAppStore.getState().authStatus).toBe('guest');
    expect(screen.queryByLabelText('Continuă fără cont')).toBeNull();
  });

  /**
   * "Without an account" lasts until the app is closed or the page is refreshed, not forever.
   * Remembering it meant that one tap during testing hid the sign-in screen for good, and a
   * refresh went straight into the planner with no way back to creating an account.
   */
  test('după refresh, cine nu e conectat vede din nou ecranul de cont', async () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText('Continuă fără cont'));

    await act(async () => {
      useAppStore.setState({ authStatus: 'checking', isHydrated: false });
      await useAppStore.getState().hydrateStorage();
    });

    expect(useAppStore.getState().authStatus).toBe('checking');
  });

  test('un telefon care ținea minte alegerea veche vede și el ecranul de cont', async () => {
    // What an earlier build left behind when someone tapped "Continuă fără cont".
    await AsyncStorage.setItem('@smartmeal_guest_choice', 'yes');

    await act(async () => {
      useAppStore.setState({ authStatus: 'checking', isHydrated: false });
      await useAppStore.getState().hydrateStorage();
    });
    render(<App />);

    expect(screen.getByLabelText('Conectează-te sau creează cont')).toBeTruthy();
    expect(screen.getByLabelText('Continuă fără cont')).toBeTruthy();
  });

  test('cine e deja conectat nu mai vede poarta', async () => {
    await localAuthSimulation.signUp('a@b.ro', 'Muntele7Verde');

    await act(async () => {
      useAppStore.setState({ authStatus: 'checking', isHydrated: false, userEmail: null });
      await useAppStore.getState().hydrateStorage();
    });

    expect(useAppStore.getState().authStatus).toBe('signedIn');
    expect(useAppStore.getState().userEmail).toBe('a@b.ro');
  });

  test('deschide ecranul de autentificare când i se cere', () => {
    render(<App />);

    fireEvent.press(screen.getByLabelText('Conectează-te sau creează cont'));

    expect(screen.getByText(/Sincronizare Cloud/i)).toBeTruthy();
  });
});

/**
 * Thirty days is the promise on the gate, so it has to be the behaviour underneath it.
 */
describe('sesiunea de 30 de zile', () => {
  beforeEach(async () => {
    asSubscriber();
    await AsyncStorage.clear();
  });

  test('imediat după conectare, sesiunea e validă', async () => {
    await localAuthSimulation.signUp('a@b.ro', 'Muntele7Verde');

    expect(await localAuthSimulation.currentEmail()).toBe('a@b.ro');
  });

  test('rezistă după 29 de zile', async () => {
    await localAuthSimulation.signUp('a@b.ro', 'Muntele7Verde');
    const almost = Date.now() + 29 * 24 * 60 * 60 * 1000;
    jest.spyOn(Date, 'now').mockReturnValue(almost);

    expect(await localAuthSimulation.currentEmail()).toBe('a@b.ro');

    jest.restoreAllMocks();
  });

  test('expiră după 31 de zile și poarta reapare', async () => {
    await localAuthSimulation.signUp('a@b.ro', 'Muntele7Verde');
    const past = Date.now() + 31 * 24 * 60 * 60 * 1000;
    jest.spyOn(Date, 'now').mockReturnValue(past);

    expect(await localAuthSimulation.currentEmail()).toBeNull();

    jest.restoreAllMocks();
  });

  test('deconectarea închide sesiunea imediat', async () => {
    await localAuthSimulation.signUp('a@b.ro', 'Muntele7Verde');

    await localAuthSimulation.signOut();

    expect(await localAuthSimulation.currentEmail()).toBeNull();
  });

  test('ștergerea contului îl scoate și din lista de conturi', async () => {
    await localAuthSimulation.signUp('a@b.ro', 'Muntele7Verde');

    await localAuthSimulation.deleteAccount();

    const back = await localAuthSimulation.signIn('a@b.ro', 'Muntele7Verde');
    expect(back.email).toBeNull();
  });

  test('simularea nu are voie să pornească într-un build de producție', () => {
    // Both conditions must hold, so a missing environment variable in a release build can
    // never silently open a local account store.
    expect(localAuthSimulation.isActive()).toBe(true);
    jest.isolateModules(() => {
      jest.doMock('../../config/env', () => ({
        env: { appEnv: 'production', isCloudSyncConfigured: false },
      }));
      /* eslint-disable @typescript-eslint/no-require-imports */
      const { localAuthSimulation: prod } = require('../services/localAuthSimulation');
      expect(prod.isActive()).toBe(false);
    });
  });

  test('parola nu se salvează în clar', async () => {
    await localAuthSimulation.signUp('a@b.ro', 'Muntele7Verde');

    const raw = (await AsyncStorage.getItem('@smartmeal_sim_accounts')) ?? '';
    expect(raw).not.toContain('Muntele7Verde');
  });
});

/**
 * The tab counted days and called them meals. With a dessert added, a five-day week showed
 * "Mese (5)" over six dishes. The wide layout already said "zile"; the phone now does too.
 */
describe('fila de mese', () => {
  test('numără zilele și spune că sunt zile', async () => {
    asSubscriber();
    await AsyncStorage.clear();
    useAppStore.setState({ authStatus: 'guest', isHydrated: true, activeNotice: null });
    useAppStore.getState().quickStart();
    render(<App />);

    const days = useAppStore.getState().currentPlan!.days.length;
    expect(screen.getByText(`🍽️ Mese (${days} zile)`)).toBeTruthy();
  });
});

/**
 * The questionnaire is nine steps long, and had no way to the account: someone who signed
 * in by mistake, or wanted to sign out, had to finish it first.
 */
describe('contul din configurator', () => {
  test('se poate deschide de la primul pas', async () => {
    await AsyncStorage.clear();
    useAppStore.getState().resetOnboarding();
    useAppStore.setState({ authStatus: 'guest', isHydrated: true, activeNotice: null });
    render(<App />);
    expect(screen.getByText(/Pasul 1 din 9/)).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Contul meu'));

    expect(screen.getByText('Sincronizare Cloud & Cont')).toBeTruthy();
  });
});
