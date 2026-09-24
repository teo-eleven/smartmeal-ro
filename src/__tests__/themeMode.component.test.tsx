import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import App from '../../App';
import { useAppStore } from '../store/useAppStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Following the phone is the right default; a kitchen at night is not a kitchen at noon. */
describe('alegerea temei', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useAppStore.setState({ themeMode: 'system', activeView: 'meals', activeNotice: null });
    useAppStore.getState().generatePlan();
  });

  test('pornește urmând telefonul', () => {
    render(<App />);

    expect(screen.getByLabelText(/Temă: ca telefonul/i)).toBeTruthy();
  });

  test('apăsările o rotesc prin cele trei stări și se întorc', () => {
    render(<App />);

    fireEvent.press(screen.getByLabelText(/Temă: ca telefonul/i));
    expect(useAppStore.getState().themeMode).toBe('light');

    fireEvent.press(screen.getByLabelText(/Temă: luminoasă/i));
    expect(useAppStore.getState().themeMode).toBe('dark');

    fireEvent.press(screen.getByLabelText(/Temă: întunecată/i));
    expect(useAppStore.getState().themeMode).toBe('system');
  });

  test('alegerea se ține minte între porniri', async () => {
    render(<App />);
    fireEvent.press(screen.getByLabelText(/Temă: ca telefonul/i));

    useAppStore.setState({ themeMode: 'system', isHydrated: false });
    await useAppStore.getState().hydrateStorage();

    expect(useAppStore.getState().themeMode).toBe('light');
  });
});
