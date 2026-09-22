import { MealPlan } from '../types';

export type BudgetState =
  /** Budget was never binding — nothing had to be downgraded. */
  | 'comfortable'
  /** Budget was binding and the planner successfully cut the cart down to fit. */
  | 'trimmed_to_fit'
  /** Budget is unreachable; the cart sits on the cheapest plan the rules allow. */
  | 'at_cheapest_possible'
  /** Over budget because of later manual edits, so no minimum can be claimed. */
  | 'over_after_manual_edits';

export interface BudgetSummary {
  state: BudgetState;
  isOverBudget: boolean;
  overspendRon: number;
  swapsApplied: number;
  /** Only meaningful for 'at_cheapest_possible'; null whenever no honest floor is known. */
  minimumAchievableRon: number | null;
}

const ROUNDING_TOLERANCE_RON = 0.01;

function roundUpToFive(value: number): number {
  return Math.ceil(value / 5) * 5;
}

/**
 * Describes how a plan sits against its budget, without ever claiming a "minimum" the
 * planner cannot actually stand behind.
 *
 * budgetStatus records what the engine achieved at generation time. A later manual swap can
 * push the cart back over budget while that record still says the plan was at its floor, so
 * the floor is only trusted while the cart still matches it.
 */
export function summarizeBudget(plan: MealPlan): BudgetSummary {
  const isOverBudget = plan.totalCartCostRon > plan.totalBudgetRon;
  const overspendRon = Math.round((plan.totalCartCostRon - plan.totalBudgetRon) * 10) / 10;
  const status = plan.budgetStatus;
  const swapsApplied = status?.swapsApplied ?? 0;

  if (!isOverBudget) {
    return {
      state: swapsApplied > 0 ? 'trimmed_to_fit' : 'comfortable',
      isOverBudget: false,
      overspendRon: 0,
      swapsApplied,
      minimumAchievableRon: null,
    };
  }

  const isStillAtEngineFloor =
    status != null &&
    Math.abs(status.minimumAchievableRon - plan.totalCartCostRon) < ROUNDING_TOLERANCE_RON;

  if (isStillAtEngineFloor) {
    return {
      state: 'at_cheapest_possible',
      isOverBudget: true,
      overspendRon,
      swapsApplied,
      minimumAchievableRon: roundUpToFive(status.minimumAchievableRon),
    };
  }

  return {
    state: 'over_after_manual_edits',
    isOverBudget: true,
    overspendRon,
    swapsApplied,
    minimumAchievableRon: null,
  };
}

export function buildBudgetMessageRo(summary: BudgetSummary, budgetRon: number): string {
  switch (summary.state) {
    case 'comfortable':
      return `✓ Plan optimizat! Mese delicioase și variate în limita a ${budgetRon} lei.`;
    case 'trimmed_to_fit':
      return `✓ Plan încadrat în ${budgetRon} lei. Am înlocuit ${summary.swapsApplied} ${
        summary.swapsApplied === 1 ? 'masă' : 'mese'
      } cu variante mai accesibile ca să intre în buget.`;
    case 'at_cheapest_possible':
      return `⚠️ Buget prea mic pentru configurația ta. Am ales deja cele mai ieftine rețete compatibile cu dieta și aparatele tale, iar minimul realist este ${summary.minimumAchievableRon} lei.`;
    case 'over_after_manual_edits':
      return `⚠️ Coșul depășește bugetul cu ${summary.overspendRon} lei după modificările tale. Apasă „Amestecă" pentru un plan reîncadrat în buget.`;
  }
}
