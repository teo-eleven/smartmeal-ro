import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../../App';
import { useAppStore } from '../store/useAppStore';
import { localAuthSimulation } from '../services/localAuthSimulation';
import { storageService } from '../services/storage';

/**
 * The first screen of a fresh install. An account is what carries the week to a second
 * phone, so it is offered first and loudly — but the planner works offline without one, and
 * Apple's guideline 5.1.1(i) forbids forcing registration on an app like that. Carrying on
 * without an account is therefore offered quietly, not hidden.
 */
describe('poarta de la prima pornire', () => {
  beforeEach(async () => {
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

  test('alegerea de a continua fără cont se ține minte', async () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText('Continuă fără cont'));

    await act(async () => {
      useAppStore.setState({ authStatus: 'checking', isHydrated: false });
      await useAppStore.getState().hydrateStorage();
    });

    expect(useAppStore.getState().authStatus).toBe('guest');
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

  test('alegerea de invitat e păstrată separat de sesiune', async () => {
    await storageService.saveGuestChoice(true);

    expect(await storageService.loadGuestChoice()).toBe(true);
    expect(await localAuthSimulation.currentEmail()).toBeNull();
  });
});
