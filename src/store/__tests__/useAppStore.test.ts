import { useAppStore } from '../useAppStore';

describe('Zustand App Store & Onboarding Flow (Phase 4)', () => {
  beforeEach(() => {
    useAppStore.getState().resetOnboarding();
  });

  // HAPPY PATHS
  describe('Happy Path: Step Navigation & Preference Setting', () => {
    it('initializes with default values at step 1', () => {
      const state = useAppStore.getState();
      expect(state.currentStep).toBe(1);
      expect(state.totalSteps).toBe(8);
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
  });

  // EDGE CASES
  describe('Edge Cases: Boundaries and Limits', () => {
    it('enforces maximum 3 mood tags', () => {
      const store = useAppStore.getState();
      // Clear existing
      useAppStore.setState({
        preferences: { ...store.preferences, moodTags: [] },
      });

      store.toggleMoodTag('speedy');
      store.toggleMoodTag('low_calorie');
      store.toggleMoodTag('family_fav');
      expect(useAppStore.getState().preferences.moodTags.length).toBe(3);

      // Try adding a 4th
      store.toggleMoodTag('high_protein');
      expect(useAppStore.getState().preferences.moodTags.length).toBe(3);
      expect(useAppStore.getState().preferences.moodTags).not.toContain('high_protein');
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

    it('manages extra slots (snack and dessert) and per-day dynamic additions/removals', () => {
      const store = useAppStore.getState();
      store.generatePlan();

      // Toggle snack slot globally
      store.toggleExtraSlot('snack');
      expect(useAppStore.getState().preferences.mealSlots).toContain('snack');
      expect(useAppStore.getState().currentPlan?.days[0].meals.some((m) => m.slot === 'snack')).toBe(true);

      // Add dessert specifically to monday
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
  });

  // ERROR & RECOVERY CASES
  describe('Error & Recovery Cases', () => {
    it('clamps step boundaries between 1 and totalSteps', () => {
      const store = useAppStore.getState();
      store.goToStep(-1);
      expect(useAppStore.getState().currentStep).toBe(1);

      store.goToStep(100);
      expect(useAppStore.getState().currentStep).toBe(8);
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
