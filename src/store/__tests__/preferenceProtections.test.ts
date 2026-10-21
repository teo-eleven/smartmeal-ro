import { mergeProtections, stricterDiet } from '../preferenceProtections';
import { UserPreferences } from '../../types';

const BASE: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: ['monday'],
  budgetRon: 500,
  moodTags: [],
  dietType: 'omnivore',
  dietTypes: ['omnivore'],
  appliances: ['hob'],
  excludePantryStaples: true,
  mealSlots: ['dinner'],
};
const p = (o: Partial<UserPreferences>): UserPreferences => ({ ...BASE, ...o });

describe('stricterDiet', () => {
  test('alege baza mai strictă', () => {
    expect(stricterDiet(p({ dietType: 'vegan', dietTypes: ['vegan'] }), p({})).dietTypes).toEqual([
      'vegan',
    ]);
    expect(
      stricterDiet(p({}), p({ dietType: 'vegetarian', dietTypes: ['vegetarian'] })).dietTypes
    ).toEqual(['vegetarian']);
  });

  test('keto de pe o parte și fără gluten de pe cealaltă rămân amândouă', () => {
    const result = stricterDiet(
      p({ dietTypes: ['omnivore', 'keto'] }),
      p({ dietTypes: ['omnivore', 'gluten_free'] })
    );

    expect(result.dietTypes).toEqual(expect.arrayContaining(['gluten_free', 'keto']));
  });

  test('un modificator incompatibil cu baza mai strictă e scos (vegan + keto nu există)', () => {
    const result = stricterDiet(
      p({ dietTypes: ['vegan'] }),
      p({ dietTypes: ['omnivore', 'keto'] })
    );

    expect(result.dietTypes).toEqual(['vegan']);
  });
});

describe('mergeProtections', () => {
  test('reunește alergiile și rețetele respinse și păstrează „Fără porc” de pe oricare parte', () => {
    const merged = mergeProtections(
      p({
        avoidedAllergens: ['gluten'],
        dislikedRecipeIds: ['a'],
        healthGoalTags: ['heart_healthy'],
      }),
      p({
        avoidedAllergens: ['nuci'],
        dislikedRecipeIds: ['b'],
        healthGoalTags: ['pork_free', 'high_fiber'],
      })
    );

    expect(merged.avoidedAllergens).toEqual(['gluten', 'nuci']);
    expect(merged.dislikedRecipeIds).toEqual(['a', 'b']);
    expect(merged.healthGoalTags).toEqual(['heart_healthy', 'pork_free']);
  });

  test('suportă câmpuri care nu sunt liste', () => {
    const merged = mergeProtections(
      p({ avoidedAllergens: 'gluten' as never }),
      p({ dislikedRecipeIds: null as never })
    );

    expect(merged.avoidedAllergens).toEqual([]);
    expect(merged.dislikedRecipeIds).toEqual([]);
  });
});
