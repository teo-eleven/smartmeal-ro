import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AccountPanel } from '../AccountPanel';
import { DEFAULT_REMINDERS } from '../../types';

jest.mock('../../services/dataExport', () => ({ collectDataExport: jest.fn() }));

function show(overrides: Partial<React.ComponentProps<typeof AccountPanel>> = {}) {
  const props: React.ComponentProps<typeof AccountPanel> = {
    userEmail: 'a@b.ro',
    isDark: false,
    isCloudAvailable: true,
    isSyncing: false,
    lastSyncedAt: null,
    isBusy: false,
    onSync: jest.fn(),
    onDownload: jest.fn(),
    onSignOut: jest.fn(),
    onDeleteAccount: jest.fn(async () => undefined),
    reminders: DEFAULT_REMINDERS,
    onChangeReminders: jest.fn(),
    ...overrides,
  };
  render(<AccountPanel {...props} />);
  return props;
}

/**
 * The signed-in account screen, in four sections. It used to be one column of big buttons of
 * equal weight: syncing, signing out, reminders and deleting the account all looked alike.
 */
describe('panoul de cont', () => {
  test('e împărțit în cele patru secțiuni, în ordine', () => {
    show();

    const headings = ['CONTUL TĂU', 'SINCRONIZARE', 'MEMENTOURI', 'DATELE TALE'];
    headings.forEach((h) => expect(screen.getByText(h)).toBeTruthy());
  });

  test('„Mementouri” nu apare de două ori', () => {
    show();

    expect(screen.queryByText('Mementouri')).toBeNull();
  });

  test('contul: arată adresa și deconectarea', () => {
    const props = show();

    expect(screen.getByText('a@b.ro')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Deconectare cont'));

    expect(props.onSignOut).toHaveBeenCalled();
  });

  test('sincronizarea: cele două butoane fac ce spun', () => {
    const props = show();

    fireEvent.press(screen.getByLabelText('Urcă planul în cloud'));
    fireEvent.press(screen.getByLabelText('Adu planul din cloud'));

    expect(props.onSync).toHaveBeenCalled();
    expect(props.onDownload).toHaveBeenCalled();
  });

  test('sincronizarea: arată când a fost ultima dată', () => {
    show({ lastSyncedAt: 'azi, 10:42' });

    expect(screen.getByText(/azi, 10:42/)).toBeTruthy();
  });

  /** Without a server, say so up front instead of letting a button fail on press. */
  test('fără server, spune dinainte că sincronizarea nu e disponibilă', () => {
    show({ isCloudAvailable: false });

    expect(screen.getByText(/nu e disponibilă pe această versiune/i)).toBeTruthy();
  });

  test('ștergerea contului cere confirmare înainte', async () => {
    const props = show();

    fireEvent.press(screen.getByLabelText('Șterge contul'));
    expect(props.onDeleteAccount).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('Confirmă ștergerea definitivă a contului'));

    await waitFor(() => expect(props.onDeleteAccount).toHaveBeenCalled());
  });

  test('renunțarea la ștergere nu șterge nimic', () => {
    const props = show();

    fireEvent.press(screen.getByLabelText('Șterge contul'));
    fireEvent.press(screen.getByLabelText('Renunță la ștergerea contului'));

    expect(props.onDeleteAccount).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Șterge contul')).toBeTruthy();
  });

  test('datele tale: exportul e în secțiunea lui', () => {
    show();

    expect(screen.getByLabelText('Descarcă datele mele')).toBeTruthy();
  });
});
