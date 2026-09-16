import { useAppStore } from '../store/useAppStore';
import { SUPERMARKETS } from '../data/supermarkets';
import { isDietCompatible, hasRequiredAppliances } from '../engine/plannerEngine';

describe('End-to-End User Flow & Inter-Phase Synchronization', () => {
  beforeEach(() => {
    useAppStore.getState().resetOnboarding();
  });

  it('completes the entire end-to-end lifecycle without errors', () => {
    const store = useAppStore.getState();

    // 1. PHASE 1: Verify Initial Setup & Brand
    expect(store.currentStep).toBe(1);
    expect(store.activeView).toBe('onboarding');
    expect(SUPERMARKETS.lidl).toBeDefined();

    // 2. PHASE 4: Walk through Onboarding Steps 1 to 7
    // Step 1: Select Supermarket
    store.setSupermarket('kaufland');
    expect(useAppStore.getState().preferences.supermarketId).toBe('kaufland');
    store.nextStep();
    expect(useAppStore.getState().currentStep).toBe(2);

    // Step 2: Set People Count to 3
    store.setPeopleCount(3);
    expect(useAppStore.getState().preferences.peopleCount).toBe(3);
    store.nextStep();
    expect(useAppStore.getState().currentStep).toBe(3);

    // Step 3: Set Cooking Days (Monday, Wednesday, Friday, Saturday)
    store.toggleCookingDay('tuesday'); // remove
    store.toggleCookingDay('thursday'); // remove
    store.toggleCookingDay('saturday'); // add
    const days = useAppStore.getState().preferences.cookingDays;
    expect(days).toEqual(['monday', 'wednesday', 'friday', 'saturday']);
    store.nextStep();
    expect(useAppStore.getState().currentStep).toBe(4);

    // Step 4: Set Budget
    store.setBudget(220);
    expect(useAppStore.getState().preferences.budgetRon).toBe(220);
    store.nextStep();
    expect(useAppStore.getState().currentStep).toBe(5);

    // Step 5: Set Mood Tags (initial has ['speedy', 'family_fav'])
    // Toggling 'speedy' removes it, toggling 'high_protein' adds it
    store.toggleMoodTag('speedy'); // removes 'speedy'
    store.toggleMoodTag('high_protein'); // adds 'high_protein'
    expect(useAppStore.getState().preferences.moodTags).toEqual(['family_fav', 'high_protein']);
    store.nextStep();
    expect(useAppStore.getState().currentStep).toBe(6);

    // Step 6: Select Diet (e.g. Vegetarian)
    store.setDietType('vegetarian');
    expect(useAppStore.getState().preferences.dietType).toBe('vegetarian');
    store.nextStep();
    expect(useAppStore.getState().currentStep).toBe(7);

    // Step 7: Select Appliances (Plită + Cuptor)
    useAppStore.setState({
      preferences: {
        ...useAppStore.getState().preferences,
        appliances: ['hob', 'oven'],
      },
    });
    expect(useAppStore.getState().preferences.appliances).toEqual(['hob', 'oven']);

    // 3. PHASE 3: Generate Plan via Engine
    store.generatePlan();
    const stateAfterGen = useAppStore.getState();

    expect(stateAfterGen.activeView).toBe('meals');
    expect(stateAfterGen.currentPlan).not.toBeNull();
    expect(stateAfterGen.currentPlan?.days.length).toBe(4); // 4 days selected
    expect(stateAfterGen.currentPlan?.supermarketId).toBe('kaufland');
    expect(stateAfterGen.currentPlan?.peopleCount).toBe(3);
    expect(stateAfterGen.currentPlan?.totalCartCostRon).toBeGreaterThan(0);

    // Verify all generated recipes satisfy the vegetarian and appliance constraints
    stateAfterGen.currentPlan?.days.forEach((day) => {
      expect(isDietCompatible(day.recipe.dietType, 'vegetarian')).toBe(true);
      expect(hasRequiredAppliances(day.recipe.appliances, ['hob', 'oven'])).toBe(true);
      expect(day.servings).toBe(3);
      expect(day.estimatedCostRon).toBeGreaterThan(0);
    });

    // Verify grocery items are populated and structured
    expect(stateAfterGen.groceryItems.length).toBeGreaterThan(0);
    stateAfterGen.groceryItems.forEach((item) => {
      expect(item.name).toBeTruthy();
      expect(item.packsToBuy).toBeGreaterThanOrEqual(1);
      expect(item.estimatedPriceRon).toBeGreaterThan(0);
      expect(item.isPurchased).toBe(false);
    });

    // 4. Test Swap Meal Functionality
    const originalWednesdayRecipe = stateAfterGen.currentPlan!.days.find(
      (d) => d.dayOfWeek === 'wednesday'
    )!.recipe;

    store.swapMeal('wednesday');

    const stateAfterSwap = useAppStore.getState();
    const swappedWednesdayRecipe = stateAfterSwap.currentPlan!.days.find(
      (d) => d.dayOfWeek === 'wednesday'
    )!.recipe;

    expect(swappedWednesdayRecipe.id).not.toBe(originalWednesdayRecipe.id);
    expect(isDietCompatible(swappedWednesdayRecipe.dietType, 'vegetarian')).toBe(true);
    expect(hasRequiredAppliances(swappedWednesdayRecipe.appliances, ['hob', 'oven'])).toBe(true);

    // 5. Test Grocery Checklist Toggling
    const firstItem = stateAfterSwap.groceryItems[0];
    store.toggleGroceryItem(firstItem.ingredientId);
    expect(useAppStore.getState().groceryItems[0].isPurchased).toBe(true);

    store.toggleGroceryItem(firstItem.ingredientId);
    expect(useAppStore.getState().groceryItems[0].isPurchased).toBe(false);

    // 6. Test Exclude Pantry Staples live recalculation
    const totalCostWithStaples = stateAfterSwap.currentPlan!.totalCartCostRon;
    store.setExcludePantryStaples(true);
    const totalCostWithoutStaples = useAppStore.getState().currentPlan!.totalCartCostRon;
    expect(totalCostWithoutStaples).toBeLessThanOrEqual(totalCostWithStaples);

    // 7. Test Reset back to Onboarding
    store.resetOnboarding();
    const resetState = useAppStore.getState();
    expect(resetState.activeView).toBe('onboarding');
    expect(resetState.currentStep).toBe(1);
    expect(resetState.currentPlan).toBeNull();
    expect(resetState.groceryItems.length).toBe(0);
  });
});
