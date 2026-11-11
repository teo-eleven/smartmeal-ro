import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { isHealthGoal } from '../data/healthTags';
import { useHealthSafetyStore } from '../store/healthSafetyStore';
import { useAppStore } from '../store/useAppStore';
import { HealthGoalTag } from '../types';
import { areHealthGoalsAvailable } from '../utils/platformHealth';
import {
  HealthSafetyAnswer,
  isGoalBlocked,
  needsSafetyQuestion,
  withoutBlockedGoals,
} from '../utils/healthSafety';

interface HealthGoalToggleOptions {
  selectedGoals: readonly HealthGoalTag[];
  toggleGoal: (goal: HealthGoalTag) => void;
  replaceGoals: (goals: HealthGoalTag[]) => void;
  /**
   * Whether the window hosting the goals is on screen. The filters stay mounted while hidden;
   * closing them dismisses a question that was still open.
   */
  isOpen?: boolean;
}

export interface HealthGoalToggle {
  answer: HealthSafetyAnswer;
  /** The answer rules this goal out (for styling, even when it is still ticked). */
  isBlocked: (goal: HealthGoalTag) => boolean;
  /** The goal cannot be ticked now: blocked by the answer, or the answer is not read yet. */
  isDisabled: (goal: HealthGoalTag) => boolean;
  pressGoal: (goal: HealthGoalTag) => void;
  /** The "not suitable without a doctor" notice: only after a "yes", never on iOS (A.8). */
  isBlockedNoticeShown: boolean;
  isAsking: boolean;
  answerQuestion: (answer: 'yes' | 'no') => void;
  dismissQuestion: () => void;
  changeAnswer: () => void;
}

/**
 * The filters keep their own copy until "Aplică"; the saved preferences must lose the health
 * goals at once, or closing the filters would leave them active after a "yes".
 */
function dropBlockedFromSavedPreferences(): void {
  const { preferences, setHealthGoalTags } = useAppStore.getState();
  const saved = preferences.healthGoalTags || [];
  const kept = withoutBlockedGoals(saved, 'yes');
  if (kept.length !== saved.length) setHealthGoalTags(kept);
}

/** Hidden goals cannot be pressed at all, everywhere they are hidden (iOS, A.8). */
const isHiddenGoal = (goal: HealthGoalTag) => isHealthGoal(goal) && !areHealthGoalsAvailable();

/** What a press on a goal does, from the live answer in the store. */
function pressOutcome(goal: HealthGoalTag, isSelected: boolean): 'toggle' | 'ask' | 'ignore' {
  if (isHiddenGoal(goal)) return 'ignore';
  // Unticking never asks: taking a goal away is always safe.
  if (isSelected) return 'toggle';
  const live = useHealthSafetyStore.getState();
  // Until the stored answer is read, nothing is decided either way (the control is disabled).
  if (isHealthGoal(goal) && !live.isLoaded) return 'ignore';
  if (isGoalBlocked(goal, live.answer)) return 'ignore';
  return needsSafetyQuestion(goal, live.answer) ? 'ask' : 'toggle';
}

/** Saves the answer; "yes" clears the blocked goals, "no" ticks the goal that was asked about. */
function applyAnswer(
  given: 'yes' | 'no',
  current: HealthGoalToggleOptions & { pendingGoal: HealthGoalTag | null }
): void {
  const { selectedGoals, toggleGoal, replaceGoals, pendingGoal: goal } = current;
  void useHealthSafetyStore.getState().setAnswer(given);
  if (given === 'yes') {
    replaceGoals(withoutBlockedGoals(selectedGoals, 'yes'));
    dropBlockedFromSavedPreferences();
    return;
  }
  if (goal && !selectedGoals.includes(goal)) toggleGoal(goal);
}

/**
 * Ticking a health goal through the safety question (A.7). Shared by onboarding and the
 * filters, which keep the chosen goals in different places, hence the callbacks.
 *
 * Handlers read the answer from the store and the goals from a ref when they run, not from the
 * render that created them: a press handed on from an older render must not act on old facts.
 */
export function useHealthGoalToggle(options: HealthGoalToggleOptions): HealthGoalToggle {
  const { isOpen = true } = options;
  const answer = useHealthSafetyStore((s) => s.answer);
  const isLoaded = useHealthSafetyStore((s) => s.isLoaded);
  const [pendingGoal, setPendingGoal] = useState<HealthGoalTag | null>(null);
  const latest = useRef({ ...options, pendingGoal });
  // Written once the render is committed, not during it: a render React throws away must not
  // change what a press acts on. A layout effect runs before the screen can be touched.
  useLayoutEffect(() => {
    latest.current = { ...options, pendingGoal };
  });

  useEffect(() => {
    if (!isLoaded) void useHealthSafetyStore.getState().load();
  }, [isLoaded]);

  useEffect(() => {
    if (!isOpen) setPendingGoal(null);
  }, [isOpen]);

  const pressGoal = (goal: HealthGoalTag) => {
    const { selectedGoals, toggleGoal } = latest.current;
    const outcome = pressOutcome(goal, selectedGoals.includes(goal));
    if (outcome === 'ask') setPendingGoal(goal);
    if (outcome === 'toggle') toggleGoal(goal);
  };

  const answerQuestion = (given: 'yes' | 'no') => {
    setPendingGoal(null);
    applyAnswer(given, latest.current);
  };

  const isSelected = (goal: HealthGoalTag) => options.selectedGoals.includes(goal);

  return {
    answer,
    isBlocked: (goal) => isGoalBlocked(goal, answer),
    // A ticked goal can always be unticked, whatever the answer says.
    isDisabled: (goal) =>
      isHiddenGoal(goal) ||
      (!isSelected(goal) && isHealthGoal(goal) && (!isLoaded || isGoalBlocked(goal, answer))),
    pressGoal,
    isBlockedNoticeShown: answer === 'yes' && areHealthGoalsAvailable(),
    isAsking: pendingGoal !== null,
    answerQuestion,
    dismissQuestion: () => setPendingGoal(null),
    changeAnswer: () => useHealthSafetyStore.getState().reset(),
  };
}
