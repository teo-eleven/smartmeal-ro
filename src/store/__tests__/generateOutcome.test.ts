import { useAppStore } from '../useAppStore';
import { asSubscriber } from '../../__tests__/helpers/subscriber';

/**
 * S1 from the 2026-10-21 audit: an impossible combination on the last onboarding step still
 * navigated to the "generating" screen and then to an empty board spinning forever, because
 * generatePlan only raised a notice and the caller could not tell it had failed.
 */

const store = () => useAppStore.getState();

beforeEach(() => {
  asSubscriber();
  useAppStore.setState({ currentPlan: null, groceryItems: [], activeNotice: null });
});

describe('generatePlan spune dacă a reușit', () => {
  test('întoarce true și creează planul când preferințele permit un meniu', () => {
    useAppStore.setState({
      preferences: {
        ...store().preferences,
        dietType: 'omnivore',
        dietTypes: ['omnivore'],
        avoidedAllergens: [],
      },
    });

    expect(store().generatePlan()).toBe(true);
    expect(store().currentPlan).not.toBeNull();
  });

  test('întoarce false, nu creează nimic și explică de ce, când nicio rețetă nu e posibilă', () => {
    useAppStore.setState({
      preferences: {
        ...store().preferences,
        // No cooking day at all: nothing can be planned, whatever else is chosen.
        cookingDays: [],
      },
    });

    expect(store().generatePlan()).toBe(false);
    expect(store().currentPlan).toBeNull();
    expect(store().activeNotice?.type).toBe('warning');
  });
});
