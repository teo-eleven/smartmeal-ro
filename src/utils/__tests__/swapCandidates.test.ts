import { formatCostDelta, rankSwapCandidates } from '../swapCandidates';
import { generateMealPlan } from '../../engine/plannerEngine';
import { UserPreferences } from '../../types';

const prefs: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 3,
  cookingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  budgetRon: 900,
  moodTags: ['family_fav'],
  dietType: 'omnivore',
  dietTypes: ['omnivore'],
  appliances: ['hob', 'oven', 'air_fryer'],
  excludePantryStaples: true,
  mealSlots: ['breakfast', 'lunch', 'dinner'],
  foodTier: 'medium',
};

describe('candidații de la „Schimbă”', () => {
  test('primii sunt cei care țin săptămâna în buget, apoi cei nefolosiți, apoi cei mai ieftini', () => {
    const generated = generateMealPlan(prefs);
    // A tight budget: only swaps that cost about the same or less still fit.
    const plan = { ...generated, totalBudgetRon: generated.totalCartCostRon + 5 };
    const { candidates } = rankSwapCandidates(plan, prefs, 'monday', 'dinner');

    expect(candidates.length).toBeGreaterThan(3);
    for (let i = 1; i < candidates.length; i++) {
      const [a, b] = [candidates[i - 1], candidates[i]];
      const key = (c: typeof a) => [
        Number(!c.fitsBudget),
        Number(!c.isUnusedThisWeek),
        c.costDeltaRon,
      ];
      const [ka, kb] = [key(a), key(b)];
      const ordered =
        ka[0] < kb[0] ||
        (ka[0] === kb[0] && (ka[1] < kb[1] || (ka[1] === kb[1] && ka[2] <= kb[2])));
      expect(ordered).toBe(true);
    }
    expect(candidates[0].fitsBudget).toBe(true);
  });

  test('rețeta curentă nu e propusă ca înlocuitor', () => {
    const plan = generateMealPlan(prefs);
    const { currentRecipe, candidates } = rankSwapCandidates(plan, prefs, 'monday', 'dinner');

    expect(candidates.map((c) => c.recipe.id)).not.toContain(currentRecipe!.id);
  });

  test('formatul diferenței de cost', () => {
    expect(formatCostDelta(3.2)).toBe('+3,20 lei');
    expect(formatCostDelta(-1.5)).toBe('−1,50 lei');
    expect(formatCostDelta(0.01)).toBe('același preț');
  });
});
