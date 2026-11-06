import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useHealthSafetyStore } from '../store/healthSafetyStore';
import { isHealthGoal } from '../data/healthTags';
import { withoutBlockedGoals } from '../utils/healthSafety';
import { HealthSafetyPrompt } from './HealthSafetyPrompt';

interface ExistingGoalsSafetyPromptProps {
  isDark: boolean;
  /** A window the store does not know about is open (the account window): wait for it. */
  isSuppressed?: boolean;
}

/**
 * The safety question for people who chose health goals before it existed (A.7e-3). Goals
 * stay inactive until it is answered (A.7e-2), so this asks once the app has started:
 * "Da" blocks and clears the goals, "Nu" lets them apply from the next plan on. Closing saves
 * nothing and only silences it until the next launch, which is why the flag is local state.
 */
export const ExistingGoalsSafetyPrompt: React.FC<ExistingGoalsSafetyPromptProps> = ({
  isDark,
  isSuppressed = false,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const answer = useHealthSafetyStore((s) => s.answer);
  const isLoaded = useHealthSafetyStore((s) => s.isLoaded);
  const hasHealthGoal = useAppStore((s) => (s.preferences.healthGoalTags ?? []).some(isHealthGoal));
  const isOtherWindowOpen = useAppStore((s) => Boolean(s.activeNotice || s.confirmRequest));

  const mustAsk = isLoaded && answer === null && hasHealthGoal;
  const isVisible = mustAsk && !isDismissed && !isSuppressed && !isOtherWindowOpen;

  const handleAnswer = (given: 'yes' | 'no') => {
    // The answer first, in memory: the goal strip below reads it.
    const saving = useHealthSafetyStore.getState().setAnswer(given);
    if (given === 'yes') {
      const { preferences, setHealthGoalTags } = useAppStore.getState();
      setHealthGoalTags(withoutBlockedGoals(preferences.healthGoalTags ?? [], 'yes'));
    }
    return saving;
  };

  return (
    <HealthSafetyPrompt
      visible={isVisible}
      onAnswer={(given) => void handleAnswer(given)}
      onDismiss={() => setIsDismissed(true)}
      isDark={isDark}
    />
  );
};
