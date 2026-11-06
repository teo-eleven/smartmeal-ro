import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { HealthGoalsAbout } from '../HealthGoalsAbout';
import { HEALTH_DISCLAIMER_LONG_RO } from '../../data/healthDisclaimer';

const LINK = 'Despre obiectivele de sănătate';

describe('HealthGoalsAbout (A.6)', () => {
  test('starts closed: only the link shows, not the long text', () => {
    render(<HealthGoalsAbout isDark={false} />);

    expect(screen.getByRole('button', { name: LINK })).toBeTruthy();
    expect(screen.queryByText(HEALTH_DISCLAIMER_LONG_RO)).toBeNull();
  });

  test('pressing the link opens the long text, pressing again closes it', () => {
    render(<HealthGoalsAbout isDark />);
    const link = screen.getByRole('button', { name: LINK });

    fireEvent.press(link);
    expect(screen.getByText(HEALTH_DISCLAIMER_LONG_RO)).toBeTruthy();
    expect(screen.getByRole('button', { name: LINK, expanded: true })).toBeTruthy();

    fireEvent.press(link);
    expect(screen.queryByText(HEALTH_DISCLAIMER_LONG_RO)).toBeNull();
  });
});
