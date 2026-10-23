import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AccountPanel } from '../AccountPanel';
import { DEFAULT_REMINDERS } from '../../types';
import { Linking } from 'react-native';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { NOT_SUBSCRIBED } from '../../services/subscriptionParse';
import { useAppStore } from '../../store/useAppStore';

jest.mock('../../services/dataExport', () => ({ collectDataExport: jest.fn() }));
// The two sections that fetch their own data are tested on their own.
jest.mock('../../services/devices', () => ({
  listDevices: jest.fn(async () => ({ devices: [], error: null })),
  revokeDevice: jest.fn(),
}));

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
 * The signed-in account screen, in five sections. It used to be one column of big buttons of
 * equal weight: syncing, signing out, reminders and deleting the account all looked alike.
 */
describe('panoul de cont', () => {
  test('e împărțit în cele cinci secțiuni, în ordine', () => {
    show();

    const headings = ['CONTUL TĂU', 'DISPOZITIVE', 'SINCRONIZARE', 'MEMENTOURI', 'DATELE TALE'];
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

  test('parola scrisă la confirmare pleacă odată cu ștergerea', async () => {
    const props = show();

    fireEvent.press(screen.getByLabelText('Șterge contul'));
    fireEvent.changeText(
      screen.getByLabelText('Parola contului, pentru confirmarea ștergerii'),
      'Muntele7Verde'
    );
    fireEvent.press(screen.getByLabelText('Confirmă ștergerea definitivă a contului'));

    await waitFor(() => expect(props.onDeleteAccount).toHaveBeenCalledWith('Muntele7Verde'));
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

/**
 * On a wide screen the panel was one 440 px column as tall as the window, cut off on any
 * shorter one. Wide, it now puts the reminders in a second column beside the rest.
 */
describe('panoul de cont pe ecran lat', () => {
  function columnOf(text: string): string | undefined {
    let node = screen.getByText(text) as unknown as {
      props?: { testID?: string };
      parent: unknown;
    };
    while (node) {
      if (node.props?.testID?.startsWith('account-column')) return node.props.testID;
      node = node.parent as typeof node;
    }
    return undefined;
  }

  test('mementourile stau în coloana din dreapta, restul în stânga', () => {
    show({ wide: true });

    expect(columnOf('MEMENTOURI')).toBe('account-column-right');
    expect(columnOf('CONTUL TĂU')).toBe('account-column-left');
    expect(columnOf('DISPOZITIVE')).toBe('account-column-left');
    expect(columnOf('SINCRONIZARE')).toBe('account-column-left');
    expect(columnOf('DATELE TALE')).toBe('account-column-left');
  });

  test('pe telefon rămâne o singură coloană, în aceeași ordine', () => {
    show({ wide: false });

    expect(screen.queryByTestId('account-column-right')).toBeNull();
    expect(screen.getByText('MEMENTOURI')).toBeTruthy();
  });
});

/**
 * Apple wants a subscriber to be able to reach the store's own page to manage or cancel, and
 * deleting the account does not cancel the subscription: it lives in the store, and has to
 * be stopped there.
 */
describe('panoul de cont, abonamentul', () => {
  afterEach(() => jest.restoreAllMocks());

  test('arată că ești în perioada gratuită', () => {
    useSubscriptionStore.setState({
      status: { ...NOT_SUBSCRIBED, isActive: true, isTrial: true },
      isChecked: true,
    });
    show();

    expect(screen.getByText(/perioada gratuită/i)).toBeTruthy();
  });

  test('„Gestionează abonamentul” deschide pagina magazinului', () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    useSubscriptionStore.setState({
      status: {
        ...NOT_SUBSCRIBED,
        isActive: true,
        managementUrl: 'https://apps.apple.com/account/subscriptions',
      },
      isChecked: true,
    });
    show();

    fireEvent.press(screen.getByLabelText('Gestionează abonamentul'));

    expect(open).toHaveBeenCalledWith('https://apps.apple.com/account/subscriptions');
  });

  test('la ștergerea contului spune că abonamentul se anulează separat', () => {
    useSubscriptionStore.setState({
      status: { ...NOT_SUBSCRIBED, isActive: true },
      isChecked: true,
    });
    show();

    fireEvent.press(screen.getByLabelText('Șterge contul'));

    expect(screen.getByText(/nu anulează abonamentul/i)).toBeTruthy();
  });
});

/**
 * The 2026-10-21 audit (F4): signing out now wipes the phone, so a plan never sent to the
 * cloud would be lost. The panel says so first and offers to upload it.
 */
describe('deconectarea cu un plan neurcat', () => {
  const plan = { id: 'p1', days: [] } as never;

  afterEach(() => useAppStore.setState({ currentPlan: null, lastSyncedPlan: null }));

  test('cere confirmare și nu deconectează încă', () => {
    useAppStore.setState({ currentPlan: plan, lastSyncedPlan: null });
    const props = show();

    fireEvent.press(screen.getByLabelText('Deconectare cont'));

    expect(props.onSignOut).not.toHaveBeenCalled();
    expect(screen.getByText(/nu e urcat în cloud/)).toBeTruthy();
  });

  test('„Deconectează oricum” deconectează', () => {
    useAppStore.setState({ currentPlan: plan, lastSyncedPlan: null });
    const props = show();

    fireEvent.press(screen.getByLabelText('Deconectare cont'));
    fireEvent.press(screen.getByLabelText('Deconectează oricum și șterge planul de pe telefon'));

    expect(props.onSignOut).toHaveBeenCalledTimes(1);
  });

  test('„Urcă planul” pornește sincronizarea în loc de deconectare', () => {
    useAppStore.setState({ currentPlan: plan, lastSyncedPlan: null });
    const props = show();

    fireEvent.press(screen.getByLabelText('Deconectare cont'));
    fireEvent.press(screen.getByLabelText('Urcă planul în cloud înainte de deconectare'));

    expect(props.onSync).toHaveBeenCalledTimes(1);
    expect(props.onSignOut).not.toHaveBeenCalled();
  });

  test('cu planul deja urcat, deconectează direct', () => {
    useAppStore.setState({ currentPlan: plan, lastSyncedPlan: plan });
    const props = show();

    fireEvent.press(screen.getByLabelText('Deconectare cont'));

    expect(props.onSignOut).toHaveBeenCalledTimes(1);
  });
});
