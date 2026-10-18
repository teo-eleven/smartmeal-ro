import { useAppStore } from '../useAppStore';
import { asSubscriber } from '../../__tests__/helpers/subscriber';

describe('Eat Out Feature (Mâncat în oraș)', () => {
  beforeEach(() => {
    asSubscriber();
    useAppStore.getState().quickStart();
  });

  test('toggleEatOut removes meal ingredients from groceryItems and sets cost to 0', () => {
    const state = useAppStore.getState();
    expect(state.currentPlan).not.toBeNull();
    const plan = state.currentPlan!;

    const firstDay = plan.days[0];
    const firstMeal = firstDay.meals[0];
    const initialMealSlot = firstMeal.slot;
    const initialDayOfWeek = firstDay.dayOfWeek;
    const initialCost = firstMeal.estimatedCostRon;
    const initialGroceryCount = state.groceryItems.length;

    expect(firstMeal.isEatenOut).toBeFalsy();
    expect(initialCost).toBeGreaterThan(0);

    // Toggle Eat Out
    useAppStore.getState().toggleEatOut(initialDayOfWeek, initialMealSlot);

    const updatedPlan = useAppStore.getState().currentPlan!;
    const updatedMeal = updatedPlan.days[0].meals.find((m) => m.slot === initialMealSlot)!;

    expect(updatedMeal.isEatenOut).toBe(true);
    expect(updatedMeal.estimatedCostRon).toBe(0);

    // Cart should now have fewer or equal items and lower/equal cost
    const updatedGroceryItems = useAppStore.getState().groceryItems;
    expect(updatedGroceryItems.length).toBeLessThanOrEqual(initialGroceryCount);
    expect(updatedPlan.totalCartCostRon).toBeLessThanOrEqual(plan.totalCartCostRon);

    // Toggle Back to Cook at Home
    useAppStore.getState().toggleEatOut(initialDayOfWeek, initialMealSlot);

    const restoredPlan = useAppStore.getState().currentPlan!;
    const restoredMeal = restoredPlan.days[0].meals.find((m) => m.slot === initialMealSlot)!;

    expect(restoredMeal.isEatenOut).toBe(false);
    expect(restoredMeal.estimatedCostRon).toBe(initialCost);
    expect(restoredPlan.totalCartCostRon).toBe(plan.totalCartCostRon);
  });
});
