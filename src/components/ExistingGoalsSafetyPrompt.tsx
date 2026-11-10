import React, { useEffect, useLayoutEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useHealthSafetyStore } from '../store/healthSafetyStore';
import { useIsExistingGoalsSafetyDue } from '../hooks/useIsExistingGoalsSafetyDue';
import { withoutBlockedGoals } from '../utils/healthSafety';
import { HealthSafetyPrompt } from './HealthSafetyPrompt';

const SAFETY_WINDOW_ID = 'existing-goals-safety-question';

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
  const isDue = useIsExistingGoalsSafetyDue();
  // The question registers its own window (by id) while it is up; only windows other than that
  // one count, or it would hide itself the moment it appeared. Count and ids change in one
  // store update, so the answer does not depend on which effect ran first.
  const isOtherWindowOpen = useAppStore((s) => {
    const ownWindows = s.openWindowIds.filter((id) => id === SAFETY_WINDOW_ID).length;
    return Boolean(s.activeNotice || s.confirmRequest || s.openWindowCount > ownWindows);
  });
  const isVisible = isDue && !isSuppressed && !isOtherWindowOpen;

  // Tells the Face ID offer the question is on this screen. A layout effect, so the offer
  // already knows before the first frame is drawn.
  useLayoutEffect(() => {
    const { setSafetyPromptMounted } = useHealthSafetyStore.getState();
    setSafetyPromptMounted(true);
    return () => setSafetyPromptMounted(false);
  }, []);

  // "Closed" lasts for this mount only, so the next launch asks again.
  useEffect(
    () => () => useHealthSafetyStore.getState().setReminderDismissed(false),
    []
  );

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
      onDismiss={() => useHealthSafetyStore.getState().setReminderDismissed(true)}
      isDark={isDark}
      windowId={SAFETY_WINDOW_ID}
    />
  );
};
