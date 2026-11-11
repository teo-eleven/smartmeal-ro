import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExistingGoalsSafetyPrompt } from '../ExistingGoalsSafetyPrompt';
import { BiometricOptInPrompt as Biometric } from '../BiometricOptInPrompt';
import { useAuthSessionStore } from '../../store/authSessionStore';
import { useBlockingWindow } from '../../hooks/useBlockingWindow';
import { useAppStore } from '../../store/useAppStore';
import { useHealthSafetyStore } from '../../store/healthSafetyStore';
import { HEALTH_SAFETY_QUESTION_RO } from '../../utils/healthSafety';
import { HealthGoalTag } from '../../types';

const setGoals = (healthGoalTags: HealthGoalTag[]) =>
  useAppStore.setState((s) => ({ preferences: { ...s.preferences, healthGoalTags } }));
const setAnswer = (answer: 'yes' | 'no' | null, isLoaded = true) =>
  useHealthSafetyStore.setState({ answer, isLoaded });
const goals = () => useAppStore.getState().preferences.healthGoalTags;

beforeEach(async () => {
  await AsyncStorage.clear();
  setAnswer(null);
  useHealthSafetyStore.setState({ isReminderDismissed: false });
  useAppStore.setState({ currentPlan: null, activeNotice: null, confirmRequest: null });
  setGoals(['heart_healthy', 'pork_free']);
});

describe('ExistingGoalsSafetyPrompt (A.7e-3)', () => {
  test('asks once when goals are stored but the question was never answered', () => {
    render(<ExistingGoalsSafetyPrompt isDark={false} />);

    expect(screen.getByText(HEALTH_SAFETY_QUESTION_RO)).toBeTruthy();
  });

  test.each([
    ['no goals at all', [] as HealthGoalTag[], null],
    ['only pork-free', ['pork_free'] as HealthGoalTag[], null],
    ['already answered yes', ['heart_healthy'] as HealthGoalTag[], 'yes' as const],
    ['already answered no', ['heart_healthy'] as HealthGoalTag[], 'no' as const],
  ])('does not ask with %s', (_name, tags, answer) => {
    setGoals(tags);
    setAnswer(answer);

    render(<ExistingGoalsSafetyPrompt isDark={false} />);

    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
  });

  test('does not ask before the stored answer has been read', () => {
    setAnswer(null, false);

    render(<ExistingGoalsSafetyPrompt isDark={false} />);

    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
  });

  test('waits while another window is open', () => {
    useAppStore.setState({ activeNotice: { id: '1', title: 't', message: 'm', type: 'info' } });

    render(<ExistingGoalsSafetyPrompt isDark={false} />);

    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
  });

  test('"Da" saves yes, strips the goals and keeps pork-free', async () => {
    render(<ExistingGoalsSafetyPrompt isDark={false} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Da, mi se aplică' }));
    });

    expect(useHealthSafetyStore.getState().answer).toBe('yes');
    expect(goals()).toEqual(['pork_free']);
    expect(await AsyncStorage.getItem('@smartmeal_health_safety_answer')).toBe('yes');
    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
  });

  test('"Nu" saves no, keeps the goals and does not touch the plan on screen', async () => {
    const plan = { days: [] } as never;
    useAppStore.setState({ currentPlan: plan });
    render(<ExistingGoalsSafetyPrompt isDark={false} />);

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Nu, niciuna' }));
    });

    expect(useHealthSafetyStore.getState().answer).toBe('no');
    expect(goals()).toEqual(['heart_healthy', 'pork_free']);
    expect(useAppStore.getState().currentPlan).toBe(plan);
    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
  });

  test('closing saves nothing, keeps the goals stored, and the next launch asks again', async () => {
    const first = render(<ExistingGoalsSafetyPrompt isDark={false} />);

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Închide întrebarea', { includeHiddenElements: true }));
    });

    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
    expect(useHealthSafetyStore.getState().answer).toBeNull();
    expect(await AsyncStorage.getItem('@smartmeal_health_safety_answer')).toBeNull();
    expect(goals()).toEqual(['heart_healthy', 'pork_free']);

    first.unmount();
    // A new launch starts from the store's initial state (nothing was persisted).
    useHealthSafetyStore.setState({ isReminderDismissed: false });
    render(<ExistingGoalsSafetyPrompt isDark={false} />);
    expect(screen.getByText(HEALTH_SAFETY_QUESTION_RO)).toBeTruthy();
  });
});


const FACE_ID_TEXT = 'Folosești Face ID data viitoare?';

const OtherWindow: React.FC<{ open: boolean }> = ({ open }) => {
  useBlockingWindow(open);
  return null;
};

describe('no stacked windows (A.7f-1)', () => {
  beforeEach(() => {
    useAppStore.setState({ openWindowCount: 0, authStatus: 'signedIn', userEmail: 'ana@b.ro' });
    useAuthSessionStore.setState({
      shouldOfferBiometric: true,
      biometricLabel: 'Face ID',
      answerBiometricOffer: jest.fn(async () => undefined),
    });
  });
  afterEach(() => {
    useAuthSessionStore.getState().clear();
    useAppStore.setState({ openWindowCount: 0, authStatus: 'checking', userEmail: null });
  });

  test('does not show while a registered window is open, and shows once it closes', () => {
    const view = render(
      <>
        <OtherWindow open />
        <ExistingGoalsSafetyPrompt isDark={false} />
      </>
    );
    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();

    view.rerender(
      <>
        <OtherWindow open={false} />
        <ExistingGoalsSafetyPrompt isDark={false} />
      </>
    );
    expect(screen.getByText(HEALTH_SAFETY_QUESTION_RO)).toBeTruthy();
  });

  test('its own window registration does not hide it again', () => {
    render(<ExistingGoalsSafetyPrompt isDark={false} />);

    expect(useAppStore.getState().openWindowCount).toBe(1);
    expect(screen.getByText(HEALTH_SAFETY_QUESTION_RO)).toBeTruthy();
  });

  test('a window opening on top hides it, and it returns when that window closes', () => {
    const view = render(
      <>
        <OtherWindow open={false} />
        <ExistingGoalsSafetyPrompt isDark={false} />
      </>
    );
    expect(screen.getByText(HEALTH_SAFETY_QUESTION_RO)).toBeTruthy();

    view.rerender(
      <>
        <OtherWindow open />
        <ExistingGoalsSafetyPrompt isDark={false} />
      </>
    );
    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();

    view.rerender(
      <>
        <OtherWindow open={false} />
        <ExistingGoalsSafetyPrompt isDark={false} />
      </>
    );
    expect(screen.getByText(HEALTH_SAFETY_QUESTION_RO)).toBeTruthy();
  });

  test('resetting the answer while the filters are open does not pop the question on top', () => {
    setAnswer('no');
    render(
      <>
        <OtherWindow open />
        <ExistingGoalsSafetyPrompt isDark={false} />
      </>
    );

    act(() => setAnswer(null));

    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
  });

  test('the safety question goes first: the Face ID offer waits, then appears after the answer', async () => {
    render(
      <>
        <Biometric isDark={false} waitsForSafetyQuestion />
        <ExistingGoalsSafetyPrompt isDark={false} />
      </>
    );

    expect(screen.getByText(HEALTH_SAFETY_QUESTION_RO)).toBeTruthy();
    expect(screen.queryByText(FACE_ID_TEXT)).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Nu, niciuna' }));
    });

    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
    expect(screen.getByText(FACE_ID_TEXT)).toBeTruthy();
  });

  test('closing the safety question without an answer lets the Face ID offer through', async () => {
    render(
      <>
        <Biometric isDark={false} waitsForSafetyQuestion />
        <ExistingGoalsSafetyPrompt isDark={false} />
      </>
    );

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Închide întrebarea', { includeHiddenElements: true }));
    });

    expect(screen.getByText(FACE_ID_TEXT)).toBeTruthy();
  });
});
