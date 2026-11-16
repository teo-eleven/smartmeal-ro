import { readFileSync } from 'fs';
import { join } from 'path';
import React from 'react';
import { Linking } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockEnv = { privacyPolicyUrl: 'https://smartmeal.ro/privacy' as string | null };
jest.mock('../../../config/env', () => ({
  get env() {
    return mockEnv;
  },
}));

jest.mock('../../services/platformOs', () => ({ currentOs: jest.fn() }));

// Imported after the mocks, so the component reads them.
import { SignUpConsent } from '../SignUpConsent';
import { currentOs } from '../../services/platformOs';

const NONE = { isAtLeast16: false, healthDataConsent: false };

/**
 * Consent under GDPR has to be informed: the person agreeing must be able to read what they
 * agree to, right where they agree to it.
 */
describe('bifele de la cont nou', () => {
  afterEach(() => jest.restoreAllMocks());

  test('au un link spre politica de confidențialitate care o deschide', () => {
    mockEnv.privacyPolicyUrl = 'https://smartmeal.ro/privacy';
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
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

describe('the consent names health goals (A.7e-6), except on iOS (A.12)', () => {
  const WITH_GOALS = 'alergiile, dieta și obiectivele mele de sănătate';
  const WITHOUT_GOALS = 'alergiile și dieta mea';
  const label = (data: string) => `Sunt de acord ca ${data} să fie păstrate în cont`;

  test.each(['android', 'web', undefined])('on %s the checkbox names health goals', (os) => {
    jest.mocked(currentOs).mockReturnValue(os);
    render(<SignUpConsent consent={NONE} onChange={jest.fn()} isDark={false} />);

    expect(screen.getByLabelText(label(WITH_GOALS))).toBeTruthy();
  });

  test('on iOS, where health goals are hidden, it names only allergies and diet', () => {
    jest.mocked(currentOs).mockReturnValue('ios');
    render(<SignUpConsent consent={NONE} onChange={jest.fn()} isDark={false} />);

    expect(screen.getByLabelText(label(WITHOUT_GOALS))).toBeTruthy();
    expect(screen.queryByText(/obiectiv/)).toBeNull();
  });

  test('docs/PRIVACY.md quotes both wordings', () => {
    const privacy = readFileSync(join(__dirname, '../../../docs/PRIVACY.md'), 'utf8');

    expect(privacy).toContain(`„${WITH_GOALS}”`);
    expect(privacy).toContain(`„${WITHOUT_GOALS}”`);
  });
});
