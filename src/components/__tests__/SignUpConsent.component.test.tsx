import React from 'react';
import { Linking } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockEnv = { privacyPolicyUrl: 'https://smartmeal.ro/privacy' as string | null };
jest.mock('../../../config/env', () => ({
  get env() {
    return mockEnv;
  },
}));

// Imported after the mock, so the component reads it.
import { SignUpConsent } from '../SignUpConsent';

const NONE = { isAtLeast16: false, healthDataConsent: false };

/**
 * Consent under GDPR has to be informed: the person agreeing must be able to read what they
 * agree to, right where they agree to it.
 */
describe('bifele de la cont nou', () => {
  afterEach(() => jest.restoreAllMocks());

  test('au un link spre politica de confidențialitate care o deschide', () => {
    mockEnv.privacyPolicyUrl = 'https://smartmeal.ro/privacy';
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    render(<SignUpConsent consent={NONE} onChange={jest.fn()} isDark={false} />);

    fireEvent.press(screen.getByLabelText('Citește politica de confidențialitate'));

    expect(open).toHaveBeenCalledWith('https://smartmeal.ro/privacy');
  });

  test('fără adresă configurată nu arată un link mort', () => {
    mockEnv.privacyPolicyUrl = null;
    render(<SignUpConsent consent={NONE} onChange={jest.fn()} isDark={false} />);

    expect(screen.queryByLabelText('Citește politica de confidențialitate')).toBeNull();
  });
});
