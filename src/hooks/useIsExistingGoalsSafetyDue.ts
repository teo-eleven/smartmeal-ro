import { useAppStore } from '../store/useAppStore';
import { useHealthSafetyStore } from '../store/healthSafetyStore';
import { isHealthGoal } from '../data/healthTags';
import { areHealthGoalsAvailable } from '../utils/platformHealth';

/**
 * True while the safety question for old goals is still to be asked this launch. Never on iOS,
 * where health goals are hidden and not applied (A.8): nothing to ask, nothing for Face ID to
 * wait on.
 */
export function useIsExistingGoalsSafetyDue(): boolean {
  const isLoaded = useHealthSafetyStore((s) => s.isLoaded);
  const isUnanswered = useHealthSafetyStore((s) => s.answer === null);
  const isDismissed = useHealthSafetyStore((s) => s.isReminderDismissed);
  const hasHealthGoal = useAppStore((s) => (s.preferences.healthGoalTags ?? []).some(isHealthGoal));
  return areHealthGoalsAvailable() && isLoaded && isUnanswered && hasHealthGoal && !isDismissed;
}
