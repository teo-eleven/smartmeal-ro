import React from 'react';
import { render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExistingGoalsSafetyPrompt } from '../ExistingGoalsSafetyPrompt';
import { BiometricOptInPrompt } from '../BiometricOptInPrompt';
import { useAuthSessionStore } from '../../store/authSessionStore';
import { useAppStore } from '../../store/useAppStore';
import { useHealthSafetyStore } from '../../store/healthSafetyStore';
import { HEALTH_SAFETY_QUESTION_RO } from '../../utils/healthSafety';

const FACE_ID_TEXT = 'Folosești Face ID data viitoare?';

beforeEach(async () => {
  await AsyncStorage.clear();
  useHealthSafetyStore.setState({
    answer: null,
    isLoaded: true,
    isReminderDismissed: false,
    isSafetyPromptMounted: false,
  });
  useAppStore.setState((s) => ({
    activeNotice: null,
    confirmRequest: null,
    openWindowCount: 0,
    openWindowIds: [],
    authStatus: 'signedIn',
    userEmail: 'ana@b.ro',
    preferences: { ...s.preferences, healthGoalTags: ['heart_healthy'] },
  }));
  useAuthSessionStore.setState({
    shouldOfferBiometric: true,
    biometricLabel: 'Face ID',
    answerBiometricOffer: jest.fn(async () => undefined),
  });
});

afterEach(() => {
  useAuthSessionStore.getState().clear();
  useAppStore.setState({ authStatus: 'checking', userEmail: null });
});

describe('Face ID offer waits only for a question that is on this screen (A.7g-1)', () => {
  test('shows on a branch without the safety prompt even though the question is due', () => {
    render(<BiometricOptInPrompt isDark={false} />);

    expect(screen.getByText(FACE_ID_TEXT)).toBeTruthy();
  });

  test('on the main shell the question still goes first', () => {
    render(
      <>
        <BiometricOptInPrompt isDark={false} />
        <ExistingGoalsSafetyPrompt isDark={false} />
      </>
    );

    expect(screen.getByText(HEALTH_SAFETY_QUESTION_RO)).toBeTruthy();
    expect(screen.queryByText(FACE_ID_TEXT)).toBeNull();
  });

  test('the offer comes through once the safety prompt leaves the screen', () => {
    const tree = (hasSafety: boolean) => (
      <>
        <BiometricOptInPrompt isDark={false} />
        {hasSafety ? <ExistingGoalsSafetyPrompt isDark={false} /> : null}
      </>
    );
    const view = render(tree(true));
    expect(screen.queryByText(FACE_ID_TEXT)).toBeNull();

    view.rerender(tree(false));

    expect(useHealthSafetyStore.getState().isSafetyPromptMounted).toBe(false);
    expect(screen.getByText(FACE_ID_TEXT)).toBeTruthy();
  });

  test('the safety prompt shows on its first render of the shell', () => {
    render(<ExistingGoalsSafetyPrompt isDark={false} />);

    expect(useHealthSafetyStore.getState().isSafetyPromptMounted).toBe(true);
    expect(screen.getByText(HEALTH_SAFETY_QUESTION_RO)).toBeTruthy();
  });
});
