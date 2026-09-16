import { useAppStore } from '../../store/useAppStore';
import { RECIPES } from '../../data/recipes';

describe('Meal Board & Swap Operations (Phase 5)', () => {
  beforeEach(() => {
    useAppStore.getState().resetOnboarding();
  });

  it('replaces a meal on a specific day with a targeted replacement recipe', () => {
    const store = useAppStore.getState();
    store.generatePlan();

    const planBefore = useAppStore.getState().currentPlan!;
    const originalMondayRecipeId = planBefore.days[0].recipe.id;

    // Pick an alternative recipe that is not the Monday recipe
    const alternativeRecipe = RECIPES.find((r) => r.id !== originalMondayRecipeId)!;

    store.replaceMealWithRecipe('monday', alternativeRecipe);

    const planAfter = useAppStore.getState().currentPlan!;
    expect(planAfter.days[0].recipe.id).toBe(alternativeRecipe.id);
    expect(planAfter.days[0].recipe.title).toBe(alternativeRecipe.title);
    expect(planAfter.totalCartCostRon).toBeGreaterThan(0);
    expect(planAfter.totalRecipeCostRon).toBeGreaterThan(0);
  });

  it('gracefully handles replaceMealWithRecipe for an invalid day', () => {
    const store = useAppStore.getState();
    store.generatePlan();

    const planBefore = useAppStore.getState().currentPlan!;
    const alternativeRecipe = RECIPES[0];

    // Attempt to replace a day that is not in the plan (e.g. sunday)
    store.replaceMealWithRecipe('sunday', alternativeRecipe);

    // Plan should remain intact without throwing or modifying other days
    const planAfter = useAppStore.getState().currentPlan!;
    expect(planAfter.days.length).toBe(planBefore.days.length);
  });

  it('correctly aggregates ingredients and calculates packs after a meal swap', () => {
    const store = useAppStore.getState();
    store.generatePlan();

    const initialGroceryCount = useAppStore.getState().groceryItems.length;
    expect(initialGroceryCount).toBeGreaterThan(0);

    const targetRecipe = RECIPES[5]; // Tocăniță de ciuperci
    store.replaceMealWithRecipe('tuesday', targetRecipe);

    const updatedGroceryItems = useAppStore.getState().groceryItems;
    expect(updatedGroceryItems.length).toBeGreaterThan(0);

    // Ensure all items still have valid pack calculations
    updatedGroceryItems.forEach((item) => {
      expect(item.packsToBuy).toBeGreaterThanOrEqual(1);
      expect(item.estimatedPriceRon).toBeGreaterThan(0);
    });
  });
});
