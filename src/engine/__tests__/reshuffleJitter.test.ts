import { generateMealPlan, getEligibleRecipes } from '../plannerEngine';
import { UserPreferences } from '../../types';

/**
 * The reshuffle jitter was drawn inside the sort comparator, twice per comparison, so the
 * same recipe scored differently each time it was compared. A comparator that is not
 * consistent gives an undefined order. One draw per candidate is enough and is consistent.
 */

const prefs: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
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

describe('jitter-ul de la „Regenerează”', () => {
  afterEach(() => jest.restoreAllMocks());

  test('se trage o singură dată per rețetă candidată, nu la fiecare comparație', () => {
    const random = jest.spyOn(Math, 'random');
    const eligible = getEligibleRecipes(prefs).length;
    const meals = prefs.cookingDays.length * prefs.mealSlots.length;

    generateMealPlan(prefs, { reshuffle: true, excludedRecipeIds: new Set() });

    expect(random.mock.calls.length).toBeLessThanOrEqual(eligible * meals);
  });

  test('fără reshuffle nu se folosește deloc hazardul', () => {
    const random = jest.spyOn(Math, 'random');

    generateMealPlan(prefs);

    expect(random).not.toHaveBeenCalled();
  });
});
