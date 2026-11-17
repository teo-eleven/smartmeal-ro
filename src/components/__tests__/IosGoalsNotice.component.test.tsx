import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IosGoalsNotice } from '../IosGoalsNotice';
import { useAppStore } from '../../store/useAppStore';
import {
  IOS_GOALS_NOTICE_STORAGE_KEY,
  useIosGoalsNoticeStore,
} from '../../store/iosGoalsNoticeStore';
import { useAuthSessionStore } from '../../store/authSessionStore';
import { useBlockingWindow } from '../../hooks/useBlockingWindow';
import { HealthGoalTag } from '../../types';
import * as platformHealth from '../../utils/platformHealth';

const TITLE = 'Obiectivele de sănătate';
const MESSAGE =
  'Pe iPhone, obiectivele de sănătate nu sunt disponibile deocamdată. Preferințele tale sunt păstrate în cont.';

const setGoals = (healthGoalTags: HealthGoalTag[]) =>
  useAppStore.setState((s) => ({ preferences: { ...s.preferences, healthGoalTags } }));
const goals = () => useAppStore.getState().preferences.healthGoalTags;
const setAvailable = (isAvailable: boolean) =>
  jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(isAvailable);
/** The app is closed and opened again: memory is fresh, the phone's storage is not. */
const simulateRestart = () => useIosGoalsNoticeStore.setState({ status: 'unknown' });
const flush = () => act(async () => {});

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
  simulateRestart();
  useAuthSessionStore.setState({ shouldOfferBiometric: false });
  useAppStore.setState({
    authStatus: 'guest',
    userEmail: null,
    isHydrated: true,
    activeNotice: null,
    confirmRequest: null,
  });
  setGoals(['heart_healthy', 'pork_free']);
  setAvailable(false);
});

describe('IosGoalsNotice (A.9)', () => {
  test('shows once on iOS when health goals are stored', async () => {
    render(<IosGoalsNotice isDark={false} />);
    await flush();

    expect(screen.getByText(TITLE)).toBeTruthy();
    expect(screen.getByText(MESSAGE)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Am înțeles' })).toBeTruthy();
  });

  test('is an accessible dialog', async () => {
    render(<IosGoalsNotice isDark={false} />);
    await flush();

    expect(screen.UNSAFE_getByProps({ role: 'alertdialog' })).toBeTruthy();
    expect(screen.UNSAFE_getByProps({ accessibilityViewIsModal: true })).toBeTruthy();
  });

  test.each([
    ['only pork-free', ['pork_free'] as HealthGoalTag[]],
    ['no goals', [] as HealthGoalTag[]],
  ])('does not show on iOS with %s', async (_n, tags) => {
    setGoals(tags);

    render(<IosGoalsNotice isDark={false} />);
    await flush();

    expect(screen.queryByText(TITLE)).toBeNull();
  });

  test('does not show on Android or web (goals available)', async () => {
    setAvailable(true);

    render(<IosGoalsNotice isDark={false} />);
    await flush();

    expect(screen.queryByText(TITLE)).toBeNull();
    expect(await AsyncStorage.getItem(IOS_GOALS_NOTICE_STORAGE_KEY)).toBeNull();
  });

  test('waits for the store to finish hydrating', async () => {
    useAppStore.setState({ isHydrated: false });
    render(<IosGoalsNotice isDark={false} />);
    await flush();
    expect(screen.queryByText(TITLE)).toBeNull();

    act(() => useAppStore.setState({ isHydrated: true }));
    await flush();

    expect(screen.getByText(TITLE)).toBeTruthy();
  });

  test('acknowledging closes it and it does not come back after a restart', async () => {
    const first = render(<IosGoalsNotice isDark={false} />);
    await flush();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Am înțeles' }));
    });
    expect(screen.queryByText(TITLE)).toBeNull();
    first.unmount();

    simulateRestart();
    render(<IosGoalsNotice isDark={false} />);
    await flush();

    expect(screen.queryByText(TITLE)).toBeNull();
    expect(await AsyncStorage.getItem(IOS_GOALS_NOTICE_STORAGE_KEY)).not.toBeNull();
  });

  test('the stored goals are untouched after acknowledging', async () => {
    render(<IosGoalsNotice isDark={false} />);
    await flush();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Am înțeles' }));
    });

    expect(goals()).toEqual(['heart_healthy', 'pork_free']);
    expect(JSON.stringify(useAppStore.getState().preferences)).not.toContain(
      'smartmeal_ios_goals_notice'
    );
  });

  test('does not come back when the app remounts it in the same launch', async () => {
    const first = render(<IosGoalsNotice isDark={false} />);
    await flush();
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Am înțeles' }));
    });
    first.unmount();

    render(<IosGoalsNotice isDark={false} />);
    await flush();

    expect(screen.queryByText(TITLE)).toBeNull();
  });

  test('stays silent when the flag cannot be read', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(<IosGoalsNotice isDark={false} />);
    await flush();

    expect(screen.queryByText(TITLE)).toBeNull();
  });

  test('closes this launch even if saving fails, and may show again next launch', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const first = render(<IosGoalsNotice isDark={false} />);
    await flush();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Am înțeles' }));
    });
    expect(screen.queryByText(TITLE)).toBeNull();
    first.unmount();

    simulateRestart();
    render(<IosGoalsNotice isDark={false} />);
    await flush();
    expect(screen.getByText(TITLE)).toBeTruthy();
  });

  test('waits while another window is open and shows after it closes', async () => {
    const Other: React.FC<{ open: boolean }> = ({ open }) => {
      useBlockingWindow(open, 'other');
      return null;
    };
    const other = render(<Other open />);
    render(<IosGoalsNotice isDark={false} />);
    await flush();
    expect(screen.queryByText(TITLE)).toBeNull();

    other.rerender(<Other open={false} />);
    await flush();

    expect(screen.getByText(TITLE)).toBeTruthy();
  });

  test('waits while a queued notice is on screen', async () => {
    useAppStore.setState({ activeNotice: { id: '1', title: 't', message: 'm', type: 'info' } });
    render(<IosGoalsNotice isDark={false} />);
    await flush();

    expect(screen.queryByText(TITLE)).toBeNull();
  });

  test('waits while suppressed by the account window', async () => {
    render(<IosGoalsNotice isDark={false} isSuppressed />);
    await flush();

    expect(screen.queryByText(TITLE)).toBeNull();
  });

  test('lets the Face ID offer go first', async () => {
    useAppStore.setState({ authStatus: 'signedIn', userEmail: 'a@b.ro' });
    useAuthSessionStore.setState({ shouldOfferBiometric: true });
    render(<IosGoalsNotice isDark={false} />);
    await flush();
    expect(screen.queryByText(TITLE)).toBeNull();

    act(() => useAuthSessionStore.setState({ shouldOfferBiometric: false }));
    await flush();

    expect(screen.getByText(TITLE)).toBeTruthy();
  });
});
