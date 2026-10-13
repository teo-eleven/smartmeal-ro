import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react-native';
import App from '../../App';
import { useAppStore } from '../store/useAppStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { asSubscriber } from './helpers/subscriber';

/** Binary theme toggle: dark (negru pur) si light (alb) */
describe('alegerea temei', () => {
  beforeEach(async () => {
    asSubscriber();
    await AsyncStorage.clear();
    // The app now opens on a sign-in gate; this test is about what is behind it.
    useAppStore.setState({
      themeMode: 'dark',
      activeView: 'meals',
      activeNotice: null,
      authStatus: 'guest',
      isHydrated: true,
    });
    useAppStore.getState().generatePlan();
  });

  afterEach(() => {
    cleanup();
  });

  test('pornește în modul întunecat (dark/negru)', () => {
    render(<App />);

    expect(screen.getByLabelText(/Temă: întunecată/i)).toBeTruthy();
  });

  test('apăsările comută binar și instant între alb și negru', () => {
    render(<App />);

    fireEvent.press(screen.getByLabelText(/Temă: întunecată/i));
    expect(useAppStore.getState().themeMode).toBe('light');

    fireEvent.press(screen.getByLabelText(/Temă: luminoasă/i));
    expect(useAppStore.getState().themeMode).toBe('dark');

    fireEvent.press(screen.getByLabelText(/Temă: întunecată/i));
    expect(useAppStore.getState().themeMode).toBe('light');
  });

  test('alegerea se ține minte între porniri', async () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText(/Temă: întunecată/i));
    cleanup();

    await act(async () => {
      useAppStore.setState({ themeMode: 'dark', isHydrated: false, authStatus: 'guest' });
      await useAppStore.getState().hydrateStorage();
    });

    expect(useAppStore.getState().themeMode).toBe('light');
  });
});

