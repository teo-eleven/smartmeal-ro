import React from 'react';
import { render, screen, cleanup } from '@testing-library/react-native';
import App from '../../App';
import { useAppStore } from '../store/useAppStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { asSubscriber } from './helpers/subscriber';

/** Enforce permanent luxury Warm Forest & Amber Lantern theme without toggle */
describe('tematica permanentă a aplicației', () => {
  beforeEach(async () => {
    asSubscriber();
    await AsyncStorage.clear();
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

  test('pornește direct în tematica unică de lux Warm Forest fără buton de toggle', () => {
    render(<App />);

    expect(screen.queryByLabelText(/Temă: întunecată/i)).toBeNull();
    expect(screen.queryByLabelText(/Temă: luminoasă/i)).toBeNull();
    expect(screen.getByLabelText(/Contul meu/i)).toBeTruthy();
  });
});

