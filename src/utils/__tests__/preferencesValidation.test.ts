import { parseUserPreferences, sanitizePantryStock } from '../preferencesValidation';
import { isRecipeMatchingDiets } from '../dietCompatibility';
import { getEligibleRecipes } from '../../engine/plannerEngine';
import { RECIPES } from '../../data/recipes';
import { DayOfWeek, UserPreferences } from '../../types';

const WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const SAFE: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: WEEK,
  budgetRon: 900,
  moodTags: ['family_fav'],
  dietType: 'omnivore',
  dietTypes: ['omnivore'],
  appliances: ['hob', 'oven', 'air_fryer'],
  excludePantryStaples: true,
  pantryInventory: [],
  pantryStock: {},
  avoidedAllergens: [],
  mealSlots: ['dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

/**
 * Preferences arrive from local storage, from a cloud row and from older builds of this app.
 * All three used to be cast straight to `UserPreferences`, which is how a diet could stop
 * applying entirely: `dietTypes: 'vegan'` satisfies `.length > 0`, iterates as characters and
 * matches nothing.
 */
describe('parseUserPreferences', () => {
  test('o dietă trimisă ca șir nu mai dezactivează dieta', () => {
    const parsed = parseUserPreferences({ ...SAFE, dietTypes: 'vegan' }, SAFE);

    expect(Array.isArray(parsed.dietTypes) || parsed.dietTypes === undefined).toBe(true);
    const eligible = getEligibleRecipes({ ...parsed, dietType: 'vegan' });
    expect(eligible.filter((r) => r.dietType === 'omnivore')).toEqual([]);
  });

  test('alergiile trimise ca șir nu devin litere', () => {
    const parsed = parseUserPreferences({ ...SAFE, avoidedAllergens: 'lactate' }, SAFE);

    expect(parsed.avoidedAllergens).toEqual([]);
  });

  test('păstrează doar alergenii recunoscuți', () => {
    const parsed = parseUserPreferences(
      { ...SAFE, avoidedAllergens: ['lactate', 'inventat', 42] },
      SAFE
    );

    expect(parsed.avoidedAllergens).toEqual(['lactate']);
  });

  test('un număr de persoane imposibil este adus între limite', () => {
    expect(parseUserPreferences({ ...SAFE, peopleCount: -3 }, SAFE).peopleCount).toBe(1);
    expect(parseUserPreferences({ ...SAFE, peopleCount: 900 }, SAFE).peopleCount).toBe(10);
    expect(parseUserPreferences({ ...SAFE, peopleCount: 'trei' }, SAFE).peopleCount).toBe(2);
  });

  test('o săptămână goală revine la cea de rezervă, nu rămâne goală', () => {
    expect(parseUserPreferences({ ...SAFE, cookingDays: [] }, SAFE).cookingDays).toEqual(WEEK);
    expect(parseUserPreferences({ ...SAFE, cookingDays: 'luni' }, SAFE).cookingDays).toEqual(WEEK);
  });

  test('o bucătărie fără aparate revine la cea de rezervă', () => {
    expect(parseUserPreferences({ ...SAFE, appliances: [] }, SAFE).appliances).toEqual(
      SAFE.appliances
    );
    expect(parseUserPreferences({ ...SAFE, appliances: ['cuptor cu lemne'] }, SAFE).appliances)
      .toEqual(SAFE.appliances);
  });

  test('un magazin necunoscut revine la cel de rezervă', () => {
    expect(parseUserPreferences({ ...SAFE, supermarketId: 'magazinul lui nea Ion' }, SAFE)
      .supermarketId).toBe('lidl');
  });

  test('un obiect complet gol nu lasă nimic nedefinit', () => {
    const parsed = parseUserPreferences({}, SAFE);

    expect(parsed.peopleCount).toBe(2);
    expect(parsed.cookingDays).toEqual(WEEK);
    expect(parsed.appliances).toEqual(SAFE.appliances);
    expect(parsed.avoidedAllergens).toEqual([]);
    expect(parsed.moodTags).toEqual([]);
  });

  test('ce nu e obiect deloc întoarce rezerva întreagă', () => {
    expect(parseUserPreferences('nonsens', SAFE)).toEqual({ ...SAFE, dietTypes: SAFE.dietTypes });
    expect(parseUserPreferences(null, SAFE).peopleCount).toBe(2);
    expect(parseUserPreferences([1, 2], SAFE).peopleCount).toBe(2);
  });
});

describe('sanitizePantryStock', () => {
  test('o cantitate nenumerică este eliminată, nu devine NaN', () => {
    expect(sanitizePantryStock({ paine_toast: 'plin', orez_basmati: 500 })).toEqual({
      orez_basmati: 500,
    });
  });

  test('cantitățile negative sau zero sunt eliminate', () => {
    expect(sanitizePantryStock({ a: -5, b: 0, c: 10 })).toEqual({ c: 10 });
  });

  test('ce nu e obiect devine cămară goală', () => {
    expect(sanitizePantryStock('plin')).toEqual({});
    expect(sanitizePantryStock([1, 2])).toEqual({});
    expect(sanitizePantryStock(null)).toEqual({});
  });
});

describe('dieta refuză implicit ce nu recunoaște', () => {
  test('o dietă necunoscută nu mai permite totul', () => {
    const meat = RECIPES.find((r) => r.dietType === 'omnivore')!;

    expect(isRecipeMatchingDiets(meat, ['halal' as never])).toBe(false);
  });

  test('dietele cunoscute funcționează în continuare', () => {
    const meat = RECIPES.find((r) => r.dietType === 'omnivore')!;
    const vegan = RECIPES.find((r) => r.dietType === 'vegan')!;

    expect(isRecipeMatchingDiets(meat, ['omnivore'])).toBe(true);
    expect(isRecipeMatchingDiets(meat, ['vegan'])).toBe(false);
    expect(isRecipeMatchingDiets(vegan, ['vegetarian'])).toBe(true);
  });
});
