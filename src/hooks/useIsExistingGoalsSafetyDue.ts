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
