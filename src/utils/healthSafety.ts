import { HealthGoalTag } from '../types';

/**
 * The safety question asked before the first health goal (HEALTH_GUIDELINES.md §9.1–9.3).
 * One yes/no for all situations: a "yes" blocks every health goal, because which goal is safe
 * for which condition is a medical call no dietitian has reviewed yet (stage G).
 */
export type HealthSafetyAnswer = 'yes' | 'no' | null;

/** Pork-free is a religious or personal choice, not a health one: never asked, never blocked. */
const NOT_A_HEALTH_GOAL: HealthGoalTag = 'pork_free';

export const HEALTH_SAFETY_QUESTION_RO =
  'Înainte de obiectivele de sănătate: ești însărcinată sau alăptezi, ai boală de rinichi, iei ' +
  'insulină, sulfoniluree, anticoagulante sau antidepresive IMAO, ori ai sau ai avut o ' +
  'tulburare de alimentație?';

export const HEALTH_SAFETY_BLOCKED_RO =
  'Pentru situația ta, obiectivele de sănătate nu sunt potrivite fără sfatul medicului. ' +
  'Discută orice schimbare de alimentație cu medicul sau cu un dietetician autorizat. ' +
  'Restul aplicației funcționează normal.';

const isHealthGoal = (goal: HealthGoalTag): boolean => goal !== NOT_A_HEALTH_GOAL;

export function needsSafetyQuestion(goal: HealthGoalTag, answer: HealthSafetyAnswer): boolean {
  return isHealthGoal(goal) && answer === null;
}

export function isGoalBlocked(goal: HealthGoalTag, answer: HealthSafetyAnswer): boolean {
  return isHealthGoal(goal) && answer === 'yes';
}

/** The goals that may stay chosen after this answer; a new array, the input is not touched. */
export function withoutBlockedGoals(
  goals: readonly HealthGoalTag[],
  answer: HealthSafetyAnswer
): HealthGoalTag[] {
  return goals.filter((goal) => !isGoalBlocked(goal, answer));
}
