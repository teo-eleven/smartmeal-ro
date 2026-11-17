import { isHealthGoal } from '../data/healthTags';
import { HealthGoalTag } from '../types';

/**
 * What an upload does with the health goals in the preferences (2026-11-17 review, M2 + M3).
 *
 * - send: the goals travel with the preferences.
 * - strip: the goals stay on the phone; the cloud receives only the non-health choices.
 * - keep-cloud: this phone never touches the cloud's goals (iOS): they are read back and sent
 *   unchanged, so saving a plan from an iPhone cannot erase what another device saved.
 * - ask: the account has not agreed to hold goals yet; ask once before anything is sent.
 */
export type GoalsUpload = 'send' | 'strip' | 'keep-cloud' | 'ask';

/** What the account's consent record says about goals, as far as this phone could read it. */
export type GoalsConsentState = 'granted' | 'not-granted' | 'unreadable';

interface DecisionInput {
  /** False on iOS, where goals are neither shown nor synced. */
  areGoalsAvailable: boolean;
  goals: readonly HealthGoalTag[] | undefined;
  consent: GoalsConsentState;
  /** The goals this person already said "only on this device" to, for this account. */
  declinedGoals: readonly HealthGoalTag[];
}

export function healthGoalsOf(tags: readonly HealthGoalTag[] | undefined): HealthGoalTag[] {
  return (tags ?? []).filter(isHealthGoal);
}

export function decideGoalsUpload(input: DecisionInput): GoalsUpload {
  if (!input.areGoalsAvailable) return 'keep-cloud';
  const goals = healthGoalsOf(input.goals);
  // Nothing sensitive to send, so there is nothing to ask about.
  if (goals.length === 0) return 'send';
  if (input.consent === 'granted') return 'send';
  // No record to extend (or it cannot be read now): asking could not lead anywhere.
  if (input.consent === 'unreadable') return 'strip';
  const isEveryGoalDeclined = goals.every((goal) => input.declinedGoals.includes(goal));
  return isEveryGoalDeclined ? 'strip' : 'ask';
}

/** The same tags without any health goal: pork-free is a personal choice, not health data. */
export function withoutHealthGoals(tags: readonly HealthGoalTag[] | undefined): HealthGoalTag[] {
  return (tags ?? []).filter((tag) => !isHealthGoal(tag));
}

/**
 * The tags an iPhone uploads: its own non-health choices, and the cloud's health goals exactly
 * as the cloud holds them. The cloud's order is kept, so an untouched list is sent back
 * identical.
 */
export function keepCloudHealthGoals(
  local: readonly HealthGoalTag[] | undefined,
  cloud: readonly HealthGoalTag[]
): HealthGoalTag[] {
  const localOther = withoutHealthGoals(local);
  const fromCloud = cloud.filter((tag) => isHealthGoal(tag) || localOther.includes(tag));
  const added = localOther.filter((tag) => !fromCloud.includes(tag));
  return [...fromCloud, ...added];
}
