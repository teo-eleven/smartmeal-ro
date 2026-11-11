import { readFileSync } from 'fs';
import { join } from 'path';
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { HealthDisclaimer } from '../HealthDisclaimer';
import { HEALTH_DISCLAIMER_LONG_RO, HEALTH_DISCLAIMER_SHORT_RO } from '../../data/healthDisclaimer';

describe('HealthDisclaimer (A.4)', () => {
  test('the short variant is the default and says it is not medical advice', () => {
    render(<HealthDisclaimer isDark={false} />);

    expect(screen.getByText(HEALTH_DISCLAIMER_SHORT_RO)).toBeTruthy();
    expect(screen.queryByText(HEALTH_DISCLAIMER_LONG_RO)).toBeNull();
  });

  test('the long variant shows the full text, in dark mode too', () => {
    render(<HealthDisclaimer isDark variant="long" />);

    expect(screen.getByText(HEALTH_DISCLAIMER_LONG_RO)).toBeTruthy();
    expect(screen.queryByText(HEALTH_DISCLAIMER_SHORT_RO)).toBeNull();
  });

  test('a screen reader hears the text without the decorative icon', () => {
    render(<HealthDisclaimer isDark={false} />);

    expect(screen.getByLabelText(HEALTH_DISCLAIMER_SHORT_RO)).toBeTruthy();
  });
});

describe('disclaimer texts', () => {
  test('the short text: not medical advice, not a medical device, talk to a doctor', () => {
    expect(HEALTH_DISCLAIMER_SHORT_RO).toMatch(/nu sfat medical/);
    expect(HEALTH_DISCLAIMER_SHORT_RO).toMatch(/nu este un dispozitiv medical/);
    expect(HEALTH_DISCLAIMER_SHORT_RO).toMatch(/medicul sau cu un dietetician autorizat/);
  });

  test('the long text does not claim a dietitian review that has not happened yet (stage G)', () => {
    expect(HEALTH_DISCLAIMER_LONG_RO).not.toMatch(/revizuit/i);
    expect(HEALTH_DISCLAIMER_LONG_RO).not.toMatch(/\[/);
  });

  test('the long text: estimates, no change of medication, emergency number', () => {
    expect(HEALTH_DISCLAIMER_LONG_RO).toMatch(/estimate/);
    expect(HEALTH_DISCLAIMER_LONG_RO).toMatch(/Nu modifica medicația/);
    expect(HEALTH_DISCLAIMER_LONG_RO).toMatch(/112/);
  });
});

test('docs/PRIVACY.md carries the same long text as the app, word for word (A.6)', () => {
  const privacy = readFileSync(join(__dirname, '../../../docs/PRIVACY.md'), 'utf8');

  expect(privacy).toContain(`> ${HEALTH_DISCLAIMER_LONG_RO}`);
});
