import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExistingGoalsSafetyPrompt } from '../ExistingGoalsSafetyPrompt';
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
    render(<ExistingGoalsSafetyPrompt isDark={false} />);
    expect(screen.getByText(HEALTH_SAFETY_QUESTION_RO)).toBeTruthy();
  });
});
