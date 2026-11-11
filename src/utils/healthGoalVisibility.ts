import { HEALTH_GOALS_CATALOG, HealthGoalMeta, isHealthGoal } from '../data/healthTags';
import { HealthGoalTag } from '../types';
import { areHealthGoalsAvailable } from './platformHealth';

/**
 * What the screens may show of the goals (A.8). Pork-free is always shown; the health goals
 * only where the platform allows them (platformHealth.ts). Nothing here changes stored data.
 */
export function isGoalShown(tag: HealthGoalTag): boolean {
  return !isHealthGoal(tag) || areHealthGoalsAvailable();
}

/** The shown subset, as a new array; the stored list is not touched. */
export function shownGoalTags(tags: readonly HealthGoalTag[] | undefined): HealthGoalTag[] {
  return (tags ?? []).filter(isGoalShown);
}

/** The goals a screen may offer for ticking. */
export function shownGoalCatalog(): HealthGoalMeta[] {
  return HEALTH_GOALS_CATALOG.filter((goal) => isGoalShown(goal.id));
}
