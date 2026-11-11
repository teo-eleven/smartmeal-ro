import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';
import { useAppStore } from '../useAppStore';
import { useAuthForm } from '../../screens/auth/useAuthForm';
import { HEALTH_SAFETY_STORAGE_KEY, useHealthSafetyStore } from '../healthSafetyStore';
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
 * The safety answer is health data about one person (A.7e-4): it leaves the phone, in memory and
 * on disk, whenever that person's account does, or the next one would inherit a "no".
 */
const store = () => useAppStore.getState();
/** Lets the pending storage writes settle; timers may be faked here, promises are not. */
const flush = () =>
  act(async () => {
    for (let tick = 0; tick < 10; tick++) await Promise.resolve();
  });
const storedAnswer = () => AsyncStorage.getItem(HEALTH_SAFETY_STORAGE_KEY);

async function signedInWithAnswer(email = 'ana@b.ro') {
  await AsyncStorage.clear();
  asSubscriber();
  store().setUserEmail(email);
  await useHealthSafetyStore.getState().setAnswer('no');
  await flush();
  expect(await storedAnswer()).toBe('no');
}

const expectAnswerGone = async () => {
  await flush();
  expect(useHealthSafetyStore.getState().answer).toBeNull();
  expect(await storedAnswer()).toBeNull();
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('the safety answer is cleared with the account (A.7e-4)', () => {
  test('signing out (setUserEmail null) clears it in memory and on disk', async () => {
    await signedInWithAnswer();

    store().setUserEmail(null);

    await expectAnswerGone();
  });

  test('signOutToLogin clears it', async () => {
    await signedInWithAnswer();

    await store().signOutToLogin();

    await expectAnswerGone();
  });

  test("a different email signing in clears the previous person's answer", async () => {
    await signedInWithAnswer('ana@b.ro');
    store().setUserEmail(null, { keepLocalData: true });
    expect(useHealthSafetyStore.getState().answer).toBe('no');

    store().setUserEmail('mihai@b.ro');

    await expectAnswerGone();
  });

  test('the same email coming back keeps its answer', async () => {
    await signedInWithAnswer('ana@b.ro');
    store().setUserEmail(null, { keepLocalData: true });

    store().setUserEmail('ana@b.ro');
    await flush();

    expect(useHealthSafetyStore.getState().answer).toBe('no');
  });

  test('deleting the account (the real form handler, wired like App) clears it', async () => {
    await signedInWithAnswer();
    (cloudSyncService.deleteAccount as jest.Mock).mockResolvedValue({ success: true, error: null });
    const { result } = renderHook(() =>
      useAuthForm({ onUserChanged: (email) => store().setUserEmail(email), onSignedIn: jest.fn() })
    );

    await act(async () => {
      await result.current.handleDeleteAccount('parola');
    });

    await expectAnswerGone();
  });

  test('a failed deletion keeps the answer: the account is still there', async () => {
    await signedInWithAnswer();
    (cloudSyncService.deleteAccount as jest.Mock).mockResolvedValue({ success: false, error: 'x' });
    const { result } = renderHook(() =>
      useAuthForm({ onUserChanged: (email) => store().setUserEmail(email), onSignedIn: jest.fn() })
    );

    await act(async () => {
      await result.current.handleDeleteAccount('parola');
    });

    expect(useHealthSafetyStore.getState().answer).toBe('no');
  });
});
