import { useAppStore } from '../useAppStore';
import { RECIPES } from '../../data/recipes';

describe('Zustand App Store & Onboarding Flow (Phase 4)', () => {
  beforeEach(() => {
    useAppStore.getState().resetOnboarding();
  });

  // HAPPY PATHS
  describe('Happy Path: Step Navigation & Preference Setting', () => {
    it('initializes with default values at step 1', () => {
      const state = useAppStore.getState();
      expect(state.currentStep).toBe(1);
      expect(state.totalSteps).toBe(9);
      expect(state.activeView).toBe('onboarding');
      expect(state.preferences.peopleCount).toBe(2);
      expect(state.preferences.supermarketId).toBe('lidl');
      expect(state.preferences.mealSlots).toEqual(['dinner']);
      expect(state.currentPlan).toBeNull();
    });

    it('navigates through steps correctly with nextStep and prevStep', () => {
      const store = useAppStore.getState();
      expect(store.currentStep).toBe(1);

      store.nextStep();
      expect(useAppStore.getState().currentStep).toBe(2);

      store.nextStep();
      expect(useAppStore.getState().currentStep).toBe(3);

      store.prevStep();
      expect(useAppStore.getState().currentStep).toBe(2);
    });

    it('updates supermarket and people count properly', () => {
      const store = useAppStore.getState();
      store.setSupermarket('kaufland');
      expect(useAppStore.getState().preferences.supermarketId).toBe('kaufland');

      store.setPeopleCount(4);
      expect(useAppStore.getState().preferences.peopleCount).toBe(4);
    });

    it('generates plan and populates grocery items and meals view', () => {
      const store = useAppStore.getState();
      store.generatePlan();

      const updated = useAppStore.getState();
      expect(updated.currentPlan).not.toBeNull();
      expect(updated.currentPlan?.days.length).toBe(5);
      expect(updated.groceryItems.length).toBeGreaterThan(0);
      expect(updated.activeView).toBe('meals');
    });

    it('toggles purchase state on a grocery item', () => {
      const store = useAppStore.getState();
      store.generatePlan();

      const item = useAppStore.getState().groceryItems[0];
      expect(item.isPurchased).toBe(false);

      store.toggleGroceryItem(item.ingredientId);
      expect(useAppStore.getState().groceryItems[0].isPurchased).toBe(true);

      store.toggleGroceryItem(item.ingredientId);
      expect(useAppStore.getState().groceryItems[0].isPurchased).toBe(false);
    });

    it('adapts meal plan when switching foodTier (basic, medium, premium)', () => {
      const store = useAppStore.getState();
      store.generatePlan();
      expect(useAppStore.getState().preferences.foodTier).toBe('medium');

      // Switch to basic tier
      store.setFoodTier('basic');
      expect(useAppStore.getState().preferences.foodTier).toBe('basic');
      const basicPlan = useAppStore.getState().currentPlan;
      expect(basicPlan).not.toBeNull();
      basicPlan?.days.forEach((day) => {
        expect(day.recipe.tier).toBe('basic');
      });

      // Switch to premium tier
      store.setFoodTier('premium');
      expect(useAppStore.getState().preferences.foodTier).toBe('premium');
      const premiumPlan = useAppStore.getState().currentPlan;
      expect(premiumPlan).not.toBeNull();
      const tiers = premiumPlan?.days.map((d) => d.recipe.tier);
      expect(tiers).toContain('premium');
    });

    it('dynamically recalculates meal costs and grocery list prices when changing supermarket', () => {
      const store = useAppStore.getState();
      // Set to lidl first and generate plan
      store.setSupermarket('lidl');
      store.generatePlan();

      const lidlCartCost = useAppStore.getState().currentPlan?.totalCartCostRon || 0;
      const lidlRecipeCost = useAppStore.getState().currentPlan?.totalRecipeCostRon || 0;
      expect(lidlCartCost).toBeGreaterThan(0);
      expect(lidlRecipeCost).toBeGreaterThan(0);

      // Switch to mega_image (consistently higher prices across grocery catalog)
      store.setSupermarket('mega_image');
      expect(useAppStore.getState().preferences.supermarketId).toBe('mega_image');

      const megaCartCost = useAppStore.getState().currentPlan?.totalCartCostRon || 0;
      const megaRecipeCost = useAppStore.getState().currentPlan?.totalRecipeCostRon || 0;

      // Ensure costs are dynamically recalculated and reflect Mega Image catalog rates
      expect(megaCartCost).toBeGreaterThan(lidlCartCost);
      expect(megaRecipeCost).toBeGreaterThan(lidlRecipeCost);

      // Verify grocery items have updated catalog prices and correct supermarket
      expect(useAppStore.getState().currentPlan?.supermarketId).toBe('mega_image');
      const groceryItems = useAppStore.getState().groceryItems;
      expect(groceryItems.length).toBeGreaterThan(0);
      groceryItems.forEach((item) => {
        expect(item.estimatedPriceRon).toBeGreaterThan(0);
      });
    });
  });

  // EDGE CASES
  describe('Edge Cases: Boundaries and Limits', () => {
    it('enforces maximum 5 mood tags and sets activeNotice', () => {
      const store = useAppStore.getState();
      // Clear existing
      useAppStore.setState({
        preferences: { ...store.preferences, moodTags: [] },
      });

      store.toggleMoodTag('speedy');
      store.toggleMoodTag('low_calorie');
      store.toggleMoodTag('family_fav');
      store.toggleMoodTag('high_protein');
      store.toggleMoodTag('healthy_comfort');
      expect(useAppStore.getState().preferences.moodTags.length).toBe(5);

      // Try adding a 6th
      store.toggleMoodTag('fakeaway');
      expect(useAppStore.getState().preferences.moodTags.length).toBe(5);
      expect(useAppStore.getState().preferences.moodTags).not.toContain('fakeaway');
      expect(useAppStore.getState().activeNotice).toBeDefined();
      expect(useAppStore.getState().activeNotice?.title).toContain('5 pofte');
    });

    it('does not allow people count below 1 or above 10', () => {
      const store = useAppStore.getState();
      store.setPeopleCount(0);
      expect(useAppStore.getState().preferences.peopleCount).toBe(1);

      store.setPeopleCount(-5);
      expect(useAppStore.getState().preferences.peopleCount).toBe(1);

      store.setPeopleCount(20);
      expect(useAppStore.getState().preferences.peopleCount).toBe(10);
    });

    it('prevents deselecting all cooking days (must retain at least 1 day)', () => {
      const store = useAppStore.getState();
      useAppStore.setState({
        preferences: { ...store.preferences, cookingDays: ['monday'] },
      });

      // Try unchecking the only selected day
      store.toggleCookingDay('monday');
      expect(useAppStore.getState().preferences.cookingDays).toEqual(['monday']);
    });

    it('prevents deselecting all appliances (must retain at least 1 appliance)', () => {
      const store = useAppStore.getState();
      useAppStore.setState({
        preferences: { ...store.preferences, appliances: ['hob'] },
      });

      // Try unchecking the only selected appliance
      store.toggleAppliance('hob');
      expect(useAppStore.getState().preferences.appliances).toEqual(['hob']);
    });

    it('switches meals per day count and updates plan dynamically', () => {
      const store = useAppStore.getState();
      store.generatePlan();
      expect(useAppStore.getState().currentPlan?.days[0].meals.length).toBe(1);

      // Switch to 2 meals per day
      store.setMealsPerDayCount(2);
      expect(useAppStore.getState().preferences.mealSlots).toEqual(['lunch', 'dinner']);
      expect(useAppStore.getState().currentPlan?.days[0].meals.length).toBe(2);

      // Switch to 3 meals per day
      store.setMealsPerDayCount(3);
      expect(useAppStore.getState().preferences.mealSlots).toEqual(['breakfast', 'lunch', 'dinner']);
      expect(useAppStore.getState().currentPlan?.days[0].meals.length).toBe(3);
    });

    it('manages extra homemade dessert slot and per-day dynamic additions/removals', () => {
      const store = useAppStore.getState();
      store.generatePlan();

      // Toggle dessert slot globally
      store.toggleExtraSlot('dessert');
      expect(useAppStore.getState().preferences.mealSlots).toContain('dessert');
      expect(useAppStore.getState().currentPlan?.days[0].meals.some((m) => m.slot === 'dessert')).toBe(true);

      // Remove global dessert to test adding to a single day
      store.toggleExtraSlot('dessert');
      const mondayMealsBefore = useAppStore.getState().currentPlan?.days.find((d) => d.dayOfWeek === 'monday')?.meals || [];
      store.addExtraMealToDay('monday', 'dessert');
      const mondayMealsAfter = useAppStore.getState().currentPlan?.days.find((d) => d.dayOfWeek === 'monday')?.meals || [];
      expect(mondayMealsAfter.length).toBe(mondayMealsBefore.length + 1);
      expect(mondayMealsAfter.some((m) => m.slot === 'dessert')).toBe(true);

      // Remove a meal from monday
      const dessertMeal = mondayMealsAfter.find((m) => m.slot === 'dessert')!;
      store.removeMealFromDay('monday', dessertMeal.id);
      const mondayMealsFinal = useAppStore.getState().currentPlan?.days.find((d) => d.dayOfWeek === 'monday')?.meals || [];
      expect(mondayMealsFinal.some((m) => m.id === dessertMeal.id)).toBe(false);
    });

    it('adds different contextual desserts to different days without duplicating recipes', () => {
      const store = useAppStore.getState();
      store.setCookingDays(['monday', 'tuesday', 'wednesday', 'thursday']);
      store.generatePlan();

      store.addExtraMealToDay('monday', 'dessert');
      store.addExtraMealToDay('tuesday', 'dessert');
      store.addExtraMealToDay('wednesday', 'dessert');

      const plan = useAppStore.getState().currentPlan!;
      const mondayDessert = plan.days.find((d) => d.dayOfWeek === 'monday')?.meals.find((m) => m.slot === 'dessert');
      const tuesdayDessert = plan.days.find((d) => d.dayOfWeek === 'tuesday')?.meals.find((m) => m.slot === 'dessert');
      const wednesdayDessert = plan.days.find((d) => d.dayOfWeek === 'wednesday')?.meals.find((m) => m.slot === 'dessert');

      expect(mondayDessert).toBeDefined();
      expect(tuesdayDessert).toBeDefined();
      expect(wednesdayDessert).toBeDefined();

      // All desserts must be different recipes!
      expect(mondayDessert?.recipe.id).not.toBe(tuesdayDessert?.recipe.id);
      expect(tuesdayDessert?.recipe.id).not.toBe(wednesdayDessert?.recipe.id);
      expect(mondayDessert?.recipe.id).not.toBe(wednesdayDessert?.recipe.id);
    });

    it('automatically swaps recipes incompatible with new supermarket when switching store', () => {
      const store = useAppStore.getState();
      store.setSupermarket('carrefour');
      store.setFoodTier('premium');
      store.setCookingDays(['monday']);
      store.generatePlan();

      // Find a Carrefour-exclusive / fish counter recipe
      const doradaRecipe = RECIPES.find((r) => r.id === 'dorada_cuptor_lamaie_ierburi')!;
      expect(doradaRecipe).toBeDefined();

      // Manually replace monday's dinner with Dorada (valid at Carrefour)
      store.replaceMealWithRecipe('monday', doradaRecipe, 'dinner');
      const mondayMealCarrefour = useAppStore.getState().currentPlan?.days[0].meals.find((m) => m.slot === 'dinner');
      expect(mondayMealCarrefour?.recipe.id).toBe('dorada_cuptor_lamaie_ierburi');

      // Now switch supermarket to LIDL (where Dorada is strictly NOT available!)
      store.setSupermarket('lidl');

      const mondayMealLidl = useAppStore.getState().currentPlan?.days[0].meals.find((m) => m.slot === 'dinner');
      expect(mondayMealLidl?.recipe.id).not.toBe('dorada_cuptor_lamaie_ierburi');
      expect(mondayMealLidl?.estimatedCostRon).toBeGreaterThan(0);
      expect(useAppStore.getState().currentPlan?.supermarketId).toBe('lidl');
    });
  });

  // ERROR & RECOVERY CASES
  describe('Error & Recovery Cases', () => {
    it('clamps step boundaries between 1 and totalSteps', () => {
      const store = useAppStore.getState();
      store.goToStep(-1);
      expect(useAppStore.getState().currentStep).toBe(1);

      store.goToStep(100);
      expect(useAppStore.getState().currentStep).toBe(9);
    });

    it('manages retail snacks, drinks and 18+ alcohol selections in grocery aggregation', () => {
      const store = useAppStore.getState();
      store.toggleSnackProduct('chipsuri_cartofi_sare');
      store.toggleDrinkProduct('coca_cola_regular_2l');
      store.setIncludeAlcohol(true);
      store.toggleDrinkProduct('bere_blonda_ursus_500ml');

      const prefs = useAppStore.getState().preferences;
      expect(prefs.selectedSnackIds).toContain('chipsuri_cartofi_sare');
      expect(prefs.selectedDrinkIds).toContain('coca_cola_regular_2l');
      expect(prefs.selectedDrinkIds).toContain('bere_blonda_ursus_500ml');
      expect(prefs.includeAlcohol).toBe(true);

      store.generatePlan();
      const state = useAppStore.getState();
      const snackItem = state.groceryItems.find((i) => i.ingredientId === 'chipsuri_cartofi_sare');
      const softDrinkItem = state.groceryItems.find((i) => i.ingredientId === 'coca_cola_regular_2l');
      const beerItem = state.groceryItems.find((i) => i.ingredientId === 'bere_blonda_ursus_500ml');

      expect(snackItem).toBeDefined();
      expect(snackItem?.category).toBe('snacks');
      expect(softDrinkItem).toBeDefined();
      expect(softDrinkItem?.category).toBe('beverages');
      expect(beerItem).toBeDefined();
      expect(beerItem?.category).toBe('alcohol');
      const totalCost = state.groceryItems.reduce((acc, item) => acc + item.estimatedPriceRon, 0);
      expect(totalCost).toBeGreaterThan(0);
    });

    it('re-shuffles weekly meals with alternative dishes when reshufflePlan is called', () => {
      const store = useAppStore.getState();
      store.setCookingDays(['monday', 'tuesday', 'wednesday']);
      store.setMealsPerDayCount(2);
      store.generatePlan();

      const initialPlan = useAppStore.getState().currentPlan!;
      const initialRecipeIds = initialPlan.days.flatMap((d) => d.meals.map((m) => m.recipe.id));

      // Call reshufflePlan
      store.reshufflePlan();

      const shuffledPlan = useAppStore.getState().currentPlan!;
      expect(shuffledPlan).toBeDefined();
      expect(shuffledPlan.days.length).toBe(3);
      expect(shuffledPlan.days[0].meals.length).toBe(2);

      const shuffledRecipeIds = shuffledPlan.days.flatMap((d) => d.meals.map((m) => m.recipe.id));

      // Reshuffled plan should contain new/alternative recipes
      const hasDifferentRecipes = shuffledRecipeIds.some((id, idx) => id !== initialRecipeIds[idx]);
      expect(hasDifferentRecipes).toBe(true);
    });

    it('updates preferences and rebuilds the active plan smoothly via updatePreferencesAndRebuild', () => {
      const store = useAppStore.getState();
      store.setCookingDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
      store.generatePlan();

      expect(useAppStore.getState().currentPlan?.days.length).toBe(5);

      // Change cooking days to 3 and budget to 300
      store.updatePreferencesAndRebuild({
        cookingDays: ['monday', 'wednesday', 'friday'],
        budgetRon: 300,
        peopleCount: 4,
      });

      const updatedPlan = useAppStore.getState().currentPlan!;
      expect(updatedPlan.days.length).toBe(3);
      expect(updatedPlan.peopleCount).toBe(4);
      expect(updatedPlan.totalBudgetRon).toBe(300);
      expect(useAppStore.getState().groceryItems.length).toBeGreaterThan(0);
    });

    it('cleanly resets all state back to step 1 upon resetOnboarding', () => {
      const store = useAppStore.getState();
      store.generatePlan();
      expect(useAppStore.getState().activeView).toBe('meals');

      store.resetOnboarding();
      const resetState = useAppStore.getState();
      expect(resetState.currentStep).toBe(1);
      expect(resetState.activeView).toBe('onboarding');
      expect(resetState.currentPlan).toBeNull();
      expect(resetState.groceryItems.length).toBe(0);
    });
  });
});
