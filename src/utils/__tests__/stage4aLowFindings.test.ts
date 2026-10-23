import { summarizeBudget } from '../budgetMessaging';
import { getHouseholdEquivalent } from '../householdUnits';
import { calculateMinimumViableBudget } from '../../engine/budgetCalculator';
import { MealPlan } from '../../types';

const plan = (cart: number, budget: number) =>
  ({ totalCartCostRon: cart, totalBudgetRon: budget, days: [] }) as unknown as MealPlan;

describe('mesajul de buget nu spune „depășește cu 0 lei”', () => {
  test('o depășire sub 0,05 lei nu contează ca depășire', () => {
    const summary = summarizeBudget(plan(300.04, 300));

    expect(summary.isOverBudget).toBe(false);
  });

  test('o depășire reală are o sumă pozitivă', () => {
    const summary = summarizeBudget(plan(312.5, 300));

    expect(summary.isOverBudget).toBe(true);
    expect(summary.overspendRon).toBeGreaterThan(0);
  });
});

describe('bugetul minim e mereu un număr', () => {
  test.each(['basic', 'medium', 'premium'] as const)('nivelul %s dă un număr finit', (tier) => {
    const value = calculateMinimumViableBudget(1, 1, 'lidl', true, 1, tier);

    expect(Number.isFinite(value)).toBe(true);
  });
});

describe('echivalentele casnice folosesc greutatea reală a bucății', () => {
  test('140 g de avocado înseamnă un avocado (nu 1,1 bucăți de 130 g)', () => {
    expect(getHouseholdEquivalent('avocado', 140, 'g')).toBe('1 buc. medie');
  });

  test('100 g de lămâie înseamnă o lămâie', () => {
    expect(getHouseholdEquivalent('lamaie', 100, 'g')).toBe('1 buc. medie');
  });
});
