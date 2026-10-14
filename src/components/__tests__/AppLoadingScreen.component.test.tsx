import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { AppLoadingScreen } from '../AppLoadingScreen';

describe('AppLoadingScreen Component', () => {

  test('renders with default title, brand badge, and dark mode theme', () => {
    render(<AppLoadingScreen isDark={true} />);

    expect(screen.getByText('SmartMeal')).toBeTruthy();
    expect(screen.getByText('RO 🇷🇴')).toBeTruthy();
    expect(screen.getByText('Se pregătește SmartMeal...')).toBeTruthy();
  });

  test('renders with custom title and subtitle', () => {
    render(
      <AppLoadingScreen
        isDark={false}
        title="Se verifică abonamentul..."
        subtitle="Validăm starea contului tău."
      />
    );

    expect(screen.getByText('Se verifică abonamentul...')).toBeTruthy();
    expect(screen.getByText('Validăm starea contului tău.')).toBeTruthy();
  });

  test('cycles dynamic rotating tips when no subtitle is provided', () => {
    const customTips = ['Pasul 1: calcul preț', 'Pasul 2: optimizare ingrediente'];
    render(<AppLoadingScreen isDark={true} tips={customTips} />);

    expect(screen.getByText('Pasul 1: calcul preț')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(2600);
    });

    expect(screen.getByText('Pasul 2: optimizare ingrediente')).toBeTruthy();
  });

  test('shows fallback retry button after timeout and handles onRetry callback', () => {
    const onRetryMock = jest.fn();
    render(
      <AppLoadingScreen
        isDark={true}
        onRetry={onRetryMock}
        retryLabel="Reîncearcă acum"
        showRetryAfterMs={2000}
      />
    );

    // Initially retry button is not visible
    expect(screen.queryByText('Reîncearcă acum')).toBeNull();

    // Advance timers past timeout
    act(() => {
      jest.advanceTimersByTime(2500);
    });

    const retryButton = screen.getByText('Reîncearcă acum');
    expect(retryButton).toBeTruthy();

    fireEvent.press(retryButton);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  test('supports custom accessibilityLabel on container', () => {
    render(<AppLoadingScreen isDark={true} accessibilityLabel="Se încarcă datele" />);

    expect(screen.getByLabelText('Se încarcă datele')).toBeTruthy();
  });

  test('renders properly in overlay mode with custom icon and steps', () => {
    const steps = ['Verificare ingrediente', 'Optimizare preț', 'Completare coș'];
    render(
      <AppLoadingScreen
        isDark={true}
        overlay={true}
        icon="🔄"
        title="Se reîncarcă meniul..."
        steps={steps}
        accessibilityLabel="Overlay reîncărcare"
      />
    );

    expect(screen.getByLabelText('Overlay reîncărcare')).toBeTruthy();
    expect(screen.getByText('🔄')).toBeTruthy();
    expect(screen.getByText('Se reîncarcă meniul...')).toBeTruthy();
    expect(screen.getByText('Verificare ingrediente')).toBeTruthy();
    expect(screen.getByText('Optimizare preț')).toBeTruthy();
    expect(screen.getByText('Completare coș')).toBeTruthy();
  });
});
