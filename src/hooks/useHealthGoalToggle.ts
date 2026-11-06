import { useEffect, useState } from 'react';
import { useHealthSafetyStore } from '../store/healthSafetyStore';
import { useAppStore } from '../store/useAppStore';
import { HealthGoalTag } from '../types';
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
}

export interface HealthGoalToggle {
  answer: HealthSafetyAnswer;
  isBlocked: (goal: HealthGoalTag) => boolean;
  pressGoal: (goal: HealthGoalTag) => void;
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

/**
 * Ticking a health goal through the safety question (A.7). Shared by onboarding and the
 * filters, which keep the chosen goals in different places, hence the callbacks.
 */
export function useHealthGoalToggle({
  selectedGoals,
  toggleGoal,
  replaceGoals,
}: HealthGoalToggleOptions): HealthGoalToggle {
  const answer = useHealthSafetyStore((s) => s.answer);
  const isLoaded = useHealthSafetyStore((s) => s.isLoaded);
  const [pendingGoal, setPendingGoal] = useState<HealthGoalTag | null>(null);

  useEffect(() => {
    if (!isLoaded) void useHealthSafetyStore.getState().load();
  }, [isLoaded]);

  const pressGoal = (goal: HealthGoalTag) => {
    // Unticking never asks: taking a goal away is always safe.
    if (selectedGoals.includes(goal)) {
      toggleGoal(goal);
      return;
    }
    // Until the stored answer is read, nothing is decided either way.
    if (!isLoaded || isGoalBlocked(goal, answer)) return;
    if (needsSafetyQuestion(goal, answer)) {
      setPendingGoal(goal);
      return;
    }
    toggleGoal(goal);
  };

  const answerQuestion = (given: 'yes' | 'no') => {
    const goal = pendingGoal;
    setPendingGoal(null);
    void useHealthSafetyStore.getState().setAnswer(given);
    if (given === 'yes') {
      replaceGoals(withoutBlockedGoals(selectedGoals, 'yes'));
      dropBlockedFromSavedPreferences();
      return;
    }
    if (goal) toggleGoal(goal);
  };

  return {
    answer,
    isBlocked: (goal) => isGoalBlocked(goal, answer),
    pressGoal,
    isAsking: pendingGoal !== null,
    answerQuestion,
    dismissQuestion: () => setPendingGoal(null),
    changeAnswer: () => void useHealthSafetyStore.getState().reset(),
  };
}
