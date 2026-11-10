import React from 'react';
import { Modal } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExistingGoalsSafetyPrompt } from '../ExistingGoalsSafetyPrompt';
import { BiometricOptInPrompt } from '../BiometricOptInPrompt';
import { useAuthSessionStore } from '../../store/authSessionStore';
import { useBlockingWindow } from '../../hooks/useBlockingWindow';
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

describe('other windows and the question, in any order (A.7g-2)', () => {
  const OtherWindow: React.FC<{ open: boolean }> = ({ open }) => {
    useBlockingWindow(open);
    return null;
  };

  /** Visible state of the question's Modal after every commit, so a transient flash shows up. */
  const isRendered = () => {
    try {
      screen.toJSON();
      return true;
    } catch {
      return false;
    }
  };

  const recordVisibleCommits = () => {
    const seen: boolean[] = [];
    const onRender = () => {
      // The first commit happens inside render(), before `screen` exists; later ones are read.
      if (!isRendered()) return;
      seen.push(screen.UNSAFE_queryAllByType(Modal).some((m) => m.props.visible === true));
    };
    const wrap = (open: boolean) => (
      <React.Profiler id="q" onRender={onRender}>
        <OtherWindow open={open} />
        <ExistingGoalsSafetyPrompt isDark={false} />
      </React.Profiler>
    );
    return { seen, wrap };
  };

  test('another window opening hides the question, with no re-show in between', () => {
    const { seen, wrap } = recordVisibleCommits();
    const view = render(wrap(false));
    expect(screen.getByText(HEALTH_SAFETY_QUESTION_RO)).toBeTruthy();

    seen.length = 0;
    view.rerender(wrap(true));

    // The commit that opens the other window still shows it (the window registers after that
    // commit); what must never happen is hiding and then showing again.
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.at(-1)).toBe(false);
    expect(seen.some((isVisible, i) => i > 0 && isVisible && !seen[i - 1])).toBe(false);
    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
  });

  test('it stays hidden until that window closes, then returns', () => {
    const { seen, wrap } = recordVisibleCommits();
    const view = render(wrap(false));
    view.rerender(wrap(true));

    seen.length = 0;
    view.rerender(wrap(true));
    expect(seen.every((isVisible) => !isVisible)).toBe(true);

    view.rerender(wrap(false));
    expect(screen.getByText(HEALTH_SAFETY_QUESTION_RO)).toBeTruthy();
  });

  test('a window already open before the question is mounted keeps it hidden', () => {
    const view = render(<OtherWindow open />);
    view.rerender(
      <>
        <OtherWindow open />
        <ExistingGoalsSafetyPrompt isDark={false} />
      </>
    );

    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
  });

  test('two other windows: the question returns only after both close', () => {
    useAppStore.getState().windowOpened('a');
    useAppStore.getState().windowOpened('b');
    render(<ExistingGoalsSafetyPrompt isDark={false} />);
    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();

    act(() => useAppStore.getState().windowClosed('a'));
    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();

    act(() => useAppStore.getState().windowClosed('b'));
    expect(screen.getByText(HEALTH_SAFETY_QUESTION_RO)).toBeTruthy();
  });

  test('windows opened with no id still count as other windows', () => {
    render(<ExistingGoalsSafetyPrompt isDark={false} />);

    act(() => useAppStore.getState().windowOpened());

    expect(screen.queryByText(HEALTH_SAFETY_QUESTION_RO)).toBeNull();
  });

  test('closing a window id that is not registered leaves the others alone', () => {
    useAppStore.getState().windowOpened('a');

    useAppStore.getState().windowClosed('zzz');

    expect(useAppStore.getState().openWindowIds).toEqual(['a']);
  });
});
