import React from 'react';
import { act, render, renderHook } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHealthGoalToggle } from '../useHealthGoalToggle';
import { useHealthSafetyStore } from '../../store/healthSafetyStore';
import { useAppStore } from '../../store/useAppStore';
import { HealthGoalTag } from '../../types';

const setAnswer = (answer: 'yes' | 'no' | null, isLoaded = true) =>
  act(() => useHealthSafetyStore.setState({ answer, isLoaded }));

function setup(initial: HealthGoalTag[] = [], isOpen = true) {
  const toggleGoal = jest.fn();
  const replaceGoals = jest.fn();
  const hook = renderHook(
    (props: { goals: HealthGoalTag[]; isOpen: boolean }) =>
      useHealthGoalToggle({
        selectedGoals: props.goals,
        toggleGoal,
        replaceGoals,
        isOpen: props.isOpen,
      }),
    { initialProps: { goals: initial, isOpen } }
  );
  return { ...hook, toggleGoal, replaceGoals };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  useHealthSafetyStore.setState({ answer: null, isLoaded: true });
  useAppStore.getState().setHealthGoalTags([]);
});

describe('useHealthGoalToggle reads live values (A.7e-5)', () => {
  test('a press handler from an old render still sees an answer given since', () => {
    const { result, toggleGoal } = setup();
    const stalePress = result.current.pressGoal;

    setAnswer('yes');
    act(() => stalePress('high_fiber'));

    expect(toggleGoal).not.toHaveBeenCalled();
    expect(result.current.isAsking).toBe(false);
  });

  test('"Nu" ticks the goal that was asked about, using the goals as they are now', () => {
    const { result, toggleGoal } = setup();

    act(() => result.current.pressGoal('high_fiber'));
    expect(result.current.isAsking).toBe(true);
    act(() => result.current.answerQuestion('no'));

    expect(toggleGoal).toHaveBeenCalledWith('high_fiber');
    expect(result.current.isAsking).toBe(false);
  });

  test('"Da" clears the goals ticked at answer time, not the ones at the first render', () => {
    const { result, rerender, replaceGoals } = setup(['heart_healthy', 'pork_free']);
    const staleAnswer = result.current.answerQuestion;
    act(() => result.current.pressGoal('high_fiber'));

    rerender({ goals: ['heart_healthy', 'high_fiber', 'pork_free'], isOpen: true });
    act(() => staleAnswer('yes'));

    expect(replaceGoals).toHaveBeenCalledWith(['pork_free']);
  });

  test('until the answer is read, health goals are disabled (not silently ignored)', () => {
    setAnswer(null, false);
    const { result, toggleGoal } = setup();

    expect(result.current.isDisabled('high_fiber')).toBe(true);
    act(() => result.current.pressGoal('high_fiber'));

    expect(toggleGoal).not.toHaveBeenCalled();
    expect(result.current.isAsking).toBe(false);
  });

  test('pork-free is never disabled or asked about, loaded or not', () => {
    setAnswer(null, false);
    const { result, toggleGoal } = setup();

    expect(result.current.isDisabled('pork_free')).toBe(false);
    act(() => result.current.pressGoal('pork_free'));

    expect(toggleGoal).toHaveBeenCalledWith('pork_free');
  });

  test('a blocked goal that is still ticked can be unticked', () => {
    setAnswer('yes');
    const { result, toggleGoal } = setup(['heart_healthy']);

    expect(result.current.isDisabled('heart_healthy')).toBe(false);
    expect(result.current.isDisabled('high_fiber')).toBe(true);
    act(() => result.current.pressGoal('heart_healthy'));

    expect(toggleGoal).toHaveBeenCalledWith('heart_healthy');
  });

  test('closing the window that hosts the question dismisses it', () => {
    const { result, rerender } = setup();
    act(() => result.current.pressGoal('high_fiber'));
    expect(result.current.isAsking).toBe(true);

    rerender({ goals: [], isOpen: false });

    expect(result.current.isAsking).toBe(false);
  });
});

describe('useHealthGoalToggle keeps render pure (A.7f-5)', () => {
  class Boundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() {
      return { failed: true };
    }
    render() {
      return this.state.failed ? null : this.props.children;
    }
  }

  test('a render that never reaches the screen does not change what a press acts on', () => {
    const committedToggle = jest.fn();
    const abandonedToggle = jest.fn();
    let press: (goal: HealthGoalTag) => void = () => undefined;
    const Probe = ({ toggle, fails }: { toggle: () => void; fails: boolean }) => {
      const hook = useHealthGoalToggle({
        selectedGoals: [],
        toggleGoal: toggle,
        replaceGoals: jest.fn(),
      });
      if (fails) throw new Error('render abandoned');
      press = hook.pressGoal;
      return null;
    };
    setAnswer('no');
    const errors = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const view = render(
      <Boundary>
        <Probe toggle={committedToggle} fails={false} />
      </Boundary>
    );
    const committedPress = press;
    view.rerender(
      <Boundary>
        <Probe toggle={abandonedToggle} fails />
      </Boundary>
    );
    act(() => committedPress('pork_free'));
    errors.mockRestore();

    expect(committedToggle).toHaveBeenCalledWith('pork_free');
    expect(abandonedToggle).not.toHaveBeenCalled();
  });
});
