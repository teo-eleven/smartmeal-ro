import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';
import { useAppStore } from '../useAppStore';
import { useAuthForm } from '../../screens/auth/useAuthForm';
import { IOS_GOALS_NOTICE_STORAGE_KEY, useIosGoalsNoticeStore } from '../iosGoalsNoticeStore';
import { cloudSyncService } from '../../services/supabase';
import { asSubscriber } from '../../__tests__/helpers/subscriber';

jest.mock('../../services/supabase', () => ({
  cloudSyncService: {
    isConfigured: jest.fn(() => true),
    getCurrentUser: jest.fn(),
    verifyUser: jest.fn(async () => ({ user: null, reason: 'signed_out' })),
    saveMealPlan: jest.fn(),
    loadMealPlan: jest.fn(),
    loadReminders: jest.fn(async () => null),
    currentEmail: jest.fn(async () => null),
    signOut: jest.fn(async () => undefined),
    deleteAccount: jest.fn(),
  },
}));

/**
 * The "seen" flag of the iPhone goals message belongs to one person (A.11c-2): it leaves the
 * phone with their account, so the next account with saved goals gets the message too.
 */
const store = () => useAppStore.getState();
const notice = () => useIosGoalsNoticeStore.getState();
const flush = () =>
  act(async () => {
    for (let tick = 0; tick < 10; tick++) await Promise.resolve();
  });
const storedFlag = () => AsyncStorage.getItem(IOS_GOALS_NOTICE_STORAGE_KEY);
/** The app is closed and opened again: memory is fresh, storage is not. */
const simulateRestart = () => useIosGoalsNoticeStore.setState({ status: 'unknown' });

async function signedInAfterAcknowledging(email = 'ana@b.ro') {
  await AsyncStorage.clear();
  asSubscriber();
  store().setUserEmail(email);
  await notice().acknowledge();
  await flush();
  expect(await storedFlag()).not.toBeNull();
  expect(notice().status).toBe('seen');
}

async function expectNoticeDueAgain() {
  await flush();
  expect(notice().status).toBe('unknown');
  expect(await storedFlag()).toBeNull();
  simulateRestart();
  await notice().load();
  expect(notice().status).toBe('unseen');
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe('the iPhone notice flag is cleared with the account (A.11c-2)', () => {
  test('signing out clears it in memory and on disk', async () => {
    await signedInAfterAcknowledging();
    store().setUserEmail(null);
    await expectNoticeDueAgain();
  });

  test('signOutToLogin clears it', async () => {
    await signedInAfterAcknowledging();
    await store().signOutToLogin();
    await expectNoticeDueAgain();
  });

  test('a different email signing in clears the previous flag', async () => {
    await signedInAfterAcknowledging('ana@b.ro');
    store().setUserEmail(null, { keepLocalData: true });
    expect(notice().status).toBe('seen');

    store().setUserEmail('mihai@b.ro');

    await expectNoticeDueAgain();
  });

  test('the same email coming back keeps the flag', async () => {
    await signedInAfterAcknowledging('ana@b.ro');
    store().setUserEmail(null, { keepLocalData: true });

    store().setUserEmail('ana@b.ro');
    await flush();

    expect(notice().status).toBe('seen');
    expect(await storedFlag()).not.toBeNull();
  });

  test('deleting the account clears it', async () => {
    await signedInAfterAcknowledging();
    (cloudSyncService.deleteAccount as jest.Mock).mockResolvedValue({ success: true, error: null });
    const { result } = renderHook(() =>
      useAuthForm({ onUserChanged: (email) => store().setUserEmail(email), onSignedIn: jest.fn() })
    );

    await act(async () => {
      await result.current.handleDeleteAccount('parola');
    });

    await expectNoticeDueAgain();
  });

  test('resetOnboarding clears it', async () => {
    await signedInAfterAcknowledging();
    store().resetOnboarding();
    await expectNoticeDueAgain();
  });

  test('a failed removal does not leave "seen" after a restart', async () => {
    await signedInAfterAcknowledging();
    jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValue(new Error('disk'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    store().setUserEmail(null);
    await flush();
    simulateRestart();
    await notice().load();

    expect(notice().status).toBe('unseen');
  });
});
