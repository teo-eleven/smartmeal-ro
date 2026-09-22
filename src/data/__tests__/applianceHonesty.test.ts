import { RECIPES } from '../recipes';
import { getEligibleRecipes } from '../../engine/plannerEngine';
import { Appliance, DayOfWeek, UserPreferences } from '../../types';

function buildPreferences(appliances: Appliance[]): UserPreferences {
  const week: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  return {
    supermarketId: 'lidl',
    peopleCount: 2,
    cookingDays: week,
    budgetRon: 400,
    moodTags: ['speedy'],
    dietType: 'omnivore',
    dietTypes: ['omnivore'],
    appliances,
    excludePantryStaples: true,
    pantryInventory: [],
    avoidedAllergens: [],
    mealSlots: ['dinner'],
    foodTier: 'medium',
    selectedSnackIds: [],
    selectedDrinkIds: [],
    includeAlcohol: false,
  };
}

describe('a recipe only asks for appliances it actually uses', () => {
  test('nothing that is never cooked demands an appliance', () => {
    // Arrange & Act
    const dishonest = RECIPES.filter(
      (recipe) => recipe.cookTimeMinutes === 0 && recipe.appliances.length > 0
    ).map((recipe) => `${recipe.id} -> [${recipe.appliances.join(', ')}]`);

    // Assert
    expect(dishonest).toEqual([]);
  });

  test('anything that is cooked still declares how', () => {
    // Arrange & Act
    const missing = RECIPES.filter(
      (recipe) => recipe.cookTimeMinutes > 0 && recipe.appliances.length === 0
    ).map((recipe) => recipe.id);

    // Assert
    expect(missing).toEqual([]);
  });

  test('a kitchen with only a microwave still gets a usable set of dishes', () => {
    // Act
    const available = getEligibleRecipes(buildPreferences(['microwave']));

    // Assert: enough distinct options to fill a week without repeating more than twice
    expect(available.length).toBeGreaterThanOrEqual(4);
  });

  test('the appliance filter alone never hides a dish that is not cooked', () => {
    // Arrange: the only thing that differs between these two runs is the kitchen, so any
    // recipe present with everything but absent with one appliance was hidden by that filter.
    const withEverything = getEligibleRecipes(
      buildPreferences(['hob', 'oven', 'air_fryer', 'microwave'])
    );
    const noCookWithEverything = withEverything
      .filter((recipe) => recipe.cookTimeMinutes === 0)
      .map((recipe) => recipe.id);
    const applianceSets: Appliance[][] = [['hob'], ['oven'], ['air_fryer'], ['microwave']];

    // Act & Assert
    applianceSets.forEach((appliances) => {
      const availableIds = getEligibleRecipes(buildPreferences(appliances)).map((r) => r.id);
      noCookWithEverything.forEach((id) => expect(availableIds).toContain(id));
    });
  });
});
