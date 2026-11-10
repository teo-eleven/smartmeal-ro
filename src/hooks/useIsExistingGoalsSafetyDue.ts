import { useAppStore } from '../store/useAppStore';
import { useHealthSafetyStore } from '../store/healthSafetyStore';
import { isHealthGoal } from '../data/healthTags';

/** True while the safety question for old goals is still to be asked this launch. */
export function useIsExistingGoalsSafetyDue(): boolean {
  const isLoaded = useHealthSafetyStore((s) => s.isLoaded);
  const isUnanswered = useHealthSafetyStore((s) => s.answer === null);
  const isDismissed = useHealthSafetyStore((s) => s.isReminderDismissed);
  const hasHealthGoal = useAppStore((s) => (s.preferences.healthGoalTags ?? []).some(isHealthGoal));
  return isLoaded && isUnanswered && hasHealthGoal && !isDismissed;
}

/**
 * True while the Face ID offer must wait (safety goes first): the question is due AND mounted
 * on this screen. Without the mount check, an App branch that renders the offer but not the
 * question would wait for an answer nobody can give.
 */
export function useIsSafetyQuestionBlockingOffer(): boolean {
  const isDue = useIsExistingGoalsSafetyDue();
  const isMounted = useHealthSafetyStore((s) => s.isSafetyPromptMounted);
  return isDue && isMounted;
}
