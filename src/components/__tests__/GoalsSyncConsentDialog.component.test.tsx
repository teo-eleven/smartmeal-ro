import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GOALS_SYNC_NO_RO,
  GOALS_SYNC_TITLE_RO,
  GOALS_SYNC_YES_RO,
  GoalsSyncConsentDialog,
} from '../GoalsSyncConsentDialog';
import { useAppStore } from '../../store/useAppStore';
import { useAuthSessionStore } from '../../store/authSessionStore';
import { useGoalsSyncConsentStore } from '../../store/goalsSyncConsentStore';
import { cloudSyncService } from '../../services/supabase';
import * as platformHealth from '../../utils/platformHealth';

jest.mock('../../services/supabase', () => ({
  cloudSyncService: { grantGoalsConsent: jest.fn() },
}));

const grant = cloudSyncService.grantGoalsConsent as jest.Mock;
const onSettled = jest.fn(async () => undefined);
const flush = () => act(async () => {});
const ask = () =>
  act(() =>
    useGoalsSyncConsentStore.getState().ask({ userId: 'u1', goals: ['heart_healthy'], onSettled })
  );

beforeEach(async () => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  await AsyncStorage.clear();
  await useGoalsSyncConsentStore.getState().reset();
  useAuthSessionStore.setState({ shouldOfferBiometric: false });
  useAppStore.setState({
    authStatus: 'signedIn',
    userEmail: 'a@b.ro',
    activeNotice: null,
    confirmRequest: null,
    openWindowCount: 0,
    openWindowIds: [],
  });
  jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(true);
});

describe('GoalsSyncConsentDialog', () => {
  test('stays hidden until a sync raises the question', async () => {
    render(<GoalsSyncConsentDialog isDark={false} />);
    await flush();
    expect(screen.queryByText(GOALS_SYNC_TITLE_RO)).toBeNull();

    await ask();

    expect(screen.getByText(GOALS_SYNC_TITLE_RO)).toBeTruthy();
    expect(screen.getByText(/date privind sănătatea/)).toBeTruthy();
    expect(screen.getByText(/odată cu contul/)).toBeTruthy();
    expect(screen.UNSAFE_getByProps({ role: 'alertdialog' })).toBeTruthy();
  });

  test('"Da, sincronizează" records the consent and lets the upload continue', async () => {
    grant.mockResolvedValue(true);
    render(<GoalsSyncConsentDialog isDark={false} />);
    await ask();

    fireEvent.press(screen.getByRole('button', { name: GOALS_SYNC_YES_RO }));
    await flush();

    expect(grant).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenCalledWith('retry');
    expect(screen.queryByText(GOALS_SYNC_TITLE_RO)).toBeNull();
  });

  test('"Nu, doar pe acest dispozitiv" remembers the choice and never calls the server', async () => {
    render(<GoalsSyncConsentDialog isDark={false} />);
    await ask();

    fireEvent.press(screen.getByRole('button', { name: GOALS_SYNC_NO_RO }));
    await flush();

    expect(grant).not.toHaveBeenCalled();
    expect(useGoalsSyncConsentStore.getState().declinedGoalsFor('u1')).toEqual(['heart_healthy']);
    expect(screen.queryByText(GOALS_SYNC_TITLE_RO)).toBeNull();
  });

  test('never shows where goals are unavailable (iOS), and drops the question', async () => {
    jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(false);
    render(<GoalsSyncConsentDialog isDark={false} />);

    await ask();
    await flush();

    expect(screen.queryByText(GOALS_SYNC_TITLE_RO)).toBeNull();
    expect(useGoalsSyncConsentStore.getState().request).toBeNull();
  });

  test.each([
    ['a notice is open', { activeNotice: { id: '1', title: 't', message: 'm', type: 'info' } }],
    ['a confirmation is open', { confirmRequest: 'reset_onboarding' }],
    ['another window is open', { openWindowCount: 1 }],
  ])('waits while %s', async (_label, state) => {
    useAppStore.setState(state as never);
    render(<GoalsSyncConsentDialog isDark={false} />);

    await ask();

    expect(screen.queryByText(GOALS_SYNC_TITLE_RO)).toBeNull();
    expect(useGoalsSyncConsentStore.getState().request).not.toBeNull();
  });

  test('waits for the account window, then appears', async () => {
    const view = render(<GoalsSyncConsentDialog isDark={false} isSuppressed />);
    await ask();
    expect(screen.queryByText(GOALS_SYNC_TITLE_RO)).toBeNull();

    view.rerender(<GoalsSyncConsentDialog isDark={false} isSuppressed={false} />);

    expect(screen.getByText(GOALS_SYNC_TITLE_RO)).toBeTruthy();
  });

  test('registers as a window, so the notices wait for it', async () => {
    render(<GoalsSyncConsentDialog isDark={false} />);
    await ask();

    expect(useAppStore.getState().openWindowCount).toBe(1);
  });

  test('closing it without an answer decides nothing', async () => {
    render(<GoalsSyncConsentDialog isDark={false} />);
    await ask();

    act(() => useGoalsSyncConsentStore.getState().dismiss());

    expect(useGoalsSyncConsentStore.getState().declinedGoalsFor('u1')).toEqual([]);
    expect(grant).not.toHaveBeenCalled();
    expect(screen.queryByText(GOALS_SYNC_TITLE_RO)).toBeNull();
  });
});
