import { useAppStore } from '../useAppStore';

describe('useAppStore Health & Snack Actions', () => {
  beforeEach(() => {
    useAppStore.setState({
      preferences: {
        supermarketId: 'lidl',
        peopleCount: 2,
        cookingDays: ['monday', 'tuesday'],
        mealSlots: ['dinner'],
        budgetRon: 250,
        moodTags: ['speedy'],
        healthGoalTags: [],
        snackTastePreference: 'both',
        dietType: 'omnivore',
        appliances: ['hob', 'oven'],
        excludePantryStaples: true,
      },
      currentPlan: null,
      activeNotice: null,
    });
  });

  it('toggles health goal tags correctly', () => {
    const { toggleHealthGoalTag } = useAppStore.getState();

    toggleHealthGoalTag('anti_inflammatory');
    expect(useAppStore.getState().preferences.healthGoalTags).toContain('anti_inflammatory');

    toggleHealthGoalTag('pcos_friendly');
    expect(useAppStore.getState().preferences.healthGoalTags).toContain('anti_inflammatory');
    expect(useAppStore.getState().preferences.healthGoalTags).toContain('pcos_friendly');

    // Untoggle
    toggleHealthGoalTag('anti_inflammatory');
    expect(useAppStore.getState().preferences.healthGoalTags).not.toContain('anti_inflammatory');
    expect(useAppStore.getState().preferences.healthGoalTags).toContain('pcos_friendly');
  });

  it('sets health goal tags directly', () => {
    const { setHealthGoalTags } = useAppStore.getState();

    setHealthGoalTags(['diabetic_friendly', 'high_fiber', 'pork_free']);
    expect(useAppStore.getState().preferences.healthGoalTags).toEqual([
      'diabetic_friendly',
      'high_fiber',
      'pork_free',
    ]);
  });

  it('sets snack taste preference', () => {
    const { setSnackTastePreference } = useAppStore.getState();

    setSnackTastePreference('sweet');
    expect(useAppStore.getState().preferences.snackTastePreference).toBe('sweet');

    setSnackTastePreference('savory');
    expect(useAppStore.getState().preferences.snackTastePreference).toBe('savory');
  });
});
