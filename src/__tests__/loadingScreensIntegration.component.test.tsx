import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import App from '../../App';
import { useAppStore } from '../store/useAppStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { asSubscriber } from './helpers/subscriber';

describe('Loading Screens & Toasts Integration Flows', () => {
  beforeEach(() => {
    asSubscriber();
    useAppStore.setState({
      authStatus: 'signedIn',
      isHydrated: true,
      currentPlan: null,
      activeView: 'meals',
      isSyncing: false,
      globalLoadingMessage: null,
    });
  });

  test('Scenario 1: Shows branded AppLoadingScreen during app storage hydration', () => {
    useAppStore.setState({ isHydrated: false });

    render(<App />);

    expect(screen.getByLabelText('Se încarcă')).toBeTruthy();
    expect(screen.getByText('SmartMeal')).toBeTruthy();
    expect(screen.getByText('RO 🇷🇴')).toBeTruthy();
  });

  test('Scenario 2: Shows branded AppLoadingScreen during subscription validation', () => {
    useSubscriptionStore.setState({ isChecked: false });

    render(<App />);

    expect(screen.getByLabelText('Se verifică abonamentul')).toBeTruthy();
    expect(screen.getByText('Se verifică abonamentul...')).toBeTruthy();
  });

  test('Scenario 3: Shows branded loading state on MealBoard when currentPlan is null with retry button', () => {
    useSubscriptionStore.setState({ isChecked: true });
    const generateSpy = jest.fn();
    useAppStore.setState({
      currentPlan: null,
      activeView: 'meals',
      generatePlan: generateSpy,
    });

    render(<App />);

    expect(screen.getByText('Se încarcă meniul săptămânal...')).toBeTruthy();

    // Fast-forward to trigger the retry button
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    const retryBtn = screen.getByText('Generează Rețetele Acum');
    expect(retryBtn).toBeTruthy();
    fireEvent.press(retryBtn);

    expect(generateSpy).toHaveBeenCalled();
  });

  test('Scenario 4: Shows floating Dynamic Island LoadingToast when background sync or reload occurs', () => {
    useSubscriptionStore.setState({ isChecked: true });
    useAppStore.getState().quickStart();
    useAppStore.setState({ isSyncing: true, globalLoadingMessage: 'Se reîncarcă datele...' });

    render(<App />);

    expect(screen.getByText('Se reîncarcă datele...')).toBeTruthy();
    expect(screen.getByLabelText('Se reîncarcă datele...')).toBeTruthy();
  });
});
