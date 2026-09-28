import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { subscriptionService } from '../../services/subscription';
import { NOT_SUBSCRIBED } from '../../services/subscriptionParse';
import { useSubscriptionStore } from '../../store/subscriptionStore';

jest.mock('../../../config/env', () => ({
  env: {
    termsUrl: 'https://smartmeal.ro/terms',
    privacyPolicyUrl: 'https://smartmeal.ro/privacy',
  },
}));
jest.mock('../../services/subscription', () => ({
  subscriptionService: {
    mode: jest.fn(() => 'store'),
    offer: jest.fn(),
    purchase: jest.fn(),
    restore: jest.fn(),
    status: jest.fn(),
    identify: jest.fn(),
  },
}));

import { PaywallScreen } from '../PaywallScreen';

const service = subscriptionService as unknown as Record<string, jest.Mock>;
const ACTIVE = { ...NOT_SUBSCRIBED, isActive: true, isTrial: true };
const WITH_TRIAL = { packageId: '$rc_monthly', priceString: '9,99 €', trialDays: 7 };

beforeEach(() => {
  jest.clearAllMocks();
  service.mode.mockReturnValue('store');
  service.offer.mockResolvedValue(WITH_TRIAL);
  useSubscriptionStore.setState({ status: NOT_SUBSCRIBED, isChecked: true });
});

async function show() {
  render(<PaywallScreen isDark={false} onBackToQuestions={jest.fn()} />);
  await waitFor(() => expect(service.offer).toHaveBeenCalled());
}

/**
 * The screen that asks for money. Apple 3.1.2 wants, before anyone subscribes: what they get,
 * the price and period, that it renews on its own and how to stop it, a way to restore a
 * past purchase, and links to the terms and the privacy policy.
 */
describe('ecranul de abonament', () => {
  test('spune ce primești', async () => {
    await show();

    expect(screen.getByText(/meniul săptămânii/i)).toBeTruthy();
    expect(screen.getByText(/lista de cumpărături/i)).toBeTruthy();
  });

  test('cu probă: 7 zile gratuit, apoi prețul din magazin', async () => {
    await show();

    expect(await screen.findByText('7 zile gratuit, apoi 9,99 € pe lună')).toBeTruthy();
    expect(screen.getByLabelText('Începe cele 7 zile gratuite')).toBeTruthy();
  });

  test('fără probă în magazin, nu promite probă', async () => {
    service.offer.mockResolvedValue({ ...WITH_TRIAL, trialDays: null });
    await show();

    expect(await screen.findByText('9,99 € pe lună')).toBeTruthy();
    expect(screen.queryByText(/gratuit/i)).toBeNull();
    expect(screen.getByLabelText('Abonează-te')).toBeTruthy();
  });

  test('explică reînnoirea automată și cum anulezi', async () => {
    await show();

    expect(await screen.findByText(/se reînnoiește automat/i)).toBeTruthy();
    expect(screen.getByText(/cu cel puțin 24 de ore/i)).toBeTruthy();
  });

  test('are linkurile spre termeni și politica de confidențialitate', async () => {
    await show();

    expect(screen.getByLabelText('Citește termenii și condițiile')).toBeTruthy();
    expect(screen.getByLabelText('Citește politica de confidențialitate')).toBeTruthy();
  });

  test('„Restaurează” recuperează un abonament cumpărat înainte', async () => {
    service.restore.mockResolvedValue({ status: ACTIVE, cancelled: false, error: null });
    await show();

    fireEvent.press(screen.getByLabelText('Restaurează cumpărăturile'));

    await waitFor(() => expect(useSubscriptionStore.getState().status.isActive).toBe(true));
  });

  test('plata reușită deschide aplicația', async () => {
    service.purchase.mockResolvedValue({ status: ACTIVE, cancelled: false, error: null });
    await show();

    fireEvent.press(await screen.findByLabelText('Începe cele 7 zile gratuite'));

    await waitFor(() => expect(service.purchase).toHaveBeenCalledWith('$rc_monthly'));
    expect(useSubscriptionStore.getState().status.isActive).toBe(true);
  });

  test('renunțarea la plată nu afișează nicio eroare', async () => {
    service.purchase.mockResolvedValue({ status: NOT_SUBSCRIBED, cancelled: true, error: null });
    await show();

    fireEvent.press(await screen.findByLabelText('Începe cele 7 zile gratuite'));

    await waitFor(() => expect(service.purchase).toHaveBeenCalled());
    expect(screen.queryByTestId('paywall-error')).toBeNull();
  });

  test('o eroare de plată e afișată', async () => {
    service.purchase.mockResolvedValue({
      status: NOT_SUBSCRIBED,
      cancelled: false,
      error: 'Plata nu s-a putut face.',
    });
    await show();

    fireEvent.press(await screen.findByLabelText('Începe cele 7 zile gratuite'));

    expect(await screen.findByText('Plata nu s-a putut face.')).toBeTruthy();
  });

  /** Nothing to buy here (a production web build): say so, and never show a dead button. */
  test('unde nu se poate cumpăra, spune unde se poate', async () => {
    service.mode.mockReturnValue('unavailable');
    service.offer.mockResolvedValue(null);
    await show();

    expect(await screen.findByText(/din aplicația de pe telefon/i)).toBeTruthy();
    expect(screen.queryByLabelText('Începe cele 7 zile gratuite')).toBeNull();
  });

  test('se poate întoarce la întrebări', async () => {
    const onBack = jest.fn();
    render(<PaywallScreen isDark={false} onBackToQuestions={onBack} />);

    fireEvent.press(screen.getByLabelText('Înapoi la întrebări'));

    expect(onBack).toHaveBeenCalled();
  });
});
