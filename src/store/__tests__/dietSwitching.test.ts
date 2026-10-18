import { useAppStore } from '../useAppStore';

describe('Diet Switching without Deadlocks', () => {
  beforeEach(() => {
    useAppStore.getState().resetOnboarding();
  });

  it('starts with omnivore by default', () => {
    const prefs = useAppStore.getState().preferences;
    expect(prefs.dietType).toBe('omnivore');
  });

  it('switches directly to vegetarian without deadlock or error', () => {
    useAppStore.getState().toggleDietType('vegetarian');
    const prefs = useAppStore.getState().preferences;

    expect(prefs.dietType).toBe('vegetarian');
    expect(prefs.dietTypes).toContain('vegetarian');
    expect(prefs.dietTypes).not.toContain('omnivore');
    expect(useAppStore.getState().activeNotice).toBeNull();
  });

  it('switches directly to vegan without deadlock or error', () => {
    useAppStore.getState().toggleDietType('vegan');
    const prefs = useAppStore.getState().preferences;

    expect(prefs.dietType).toBe('vegan');
    expect(prefs.dietTypes).toContain('vegan');
    expect(prefs.dietTypes).not.toContain('omnivore');
    expect(useAppStore.getState().activeNotice).toBeNull();
  });

  it('switches directly to pescatarian without deadlock or error', () => {
    useAppStore.getState().toggleDietType('pescatarian');
    const prefs = useAppStore.getState().preferences;

    expect(prefs.dietType).toBe('pescatarian');
    expect(prefs.dietTypes).toContain('pescatarian');
    expect(prefs.dietTypes).not.toContain('omnivore');
    expect(useAppStore.getState().activeNotice).toBeNull();
  });

  it('allows toggling gluten_free modifier on top of vegetarian', () => {
    useAppStore.getState().toggleDietType('vegetarian');
    useAppStore.getState().toggleDietType('gluten_free');
    const prefs = useAppStore.getState().preferences;

    expect(prefs.dietType).toBe('vegetarian');
    expect(prefs.dietTypes).toEqual(['vegetarian', 'gluten_free']);

    // Toggling gluten_free again removes it
    useAppStore.getState().toggleDietType('gluten_free');
    expect(useAppStore.getState().preferences.dietTypes).toEqual(['vegetarian']);
  });

  it('preserves compatible modifier when switching base diet', () => {
    useAppStore.getState().toggleDietType('vegetarian');
    useAppStore.getState().toggleDietType('gluten_free');

    // Switch from vegetarian to pescatarian
    useAppStore.getState().toggleDietType('pescatarian');
    const prefs = useAppStore.getState().preferences;

    expect(prefs.dietType).toBe('pescatarian');
    expect(prefs.dietTypes).toEqual(['pescatarian', 'gluten_free']);
  });

  it('prevents incompatible modifier keto on vegan base diet', () => {
    useAppStore.getState().toggleDietType('vegan');
    useAppStore.getState().toggleDietType('keto');

    const state = useAppStore.getState();
    expect(state.preferences.dietType).toBe('vegan');
    expect(state.preferences.dietTypes).not.toContain('keto');
    expect(state.activeNotice).not.toBeNull();
    expect(state.activeNotice?.type).toBe('warning');
  });
});
