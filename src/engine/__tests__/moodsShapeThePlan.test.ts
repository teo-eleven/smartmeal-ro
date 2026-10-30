import { generateMealPlan } from '../plannerEngine';
import { MoodTag, UserPreferences } from '../../types';

/**
 * Reported by the user on 2026-10-23: "the cravings I pick have nothing to do with the
 * recipes I get". Measured: the food tier (Medium by default) was a hard filter applied
 * before any craving was read. 17 of the 19 soups are Basic, so a Medium household asking for
 * soups got the only 2 Medium ones; "grill" produced the very same menu as no craving at all.
 * A recipe matching a chosen craving now passes the tier filter when it is the chosen tier
 * or a cheaper one.
 */
const BASE: UserPreferences = {
  supermarketId: 'lidl',
  peopleCount: 2,
  cookingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  budgetRon: 900,
  moodTags: [],
  dietType: 'omnivore',
  dietTypes: ['omnivore'],
  appliances: ['hob', 'oven', 'air_fryer'],
  excludePantryStaples: true,
  pantryInventory: [],
  avoidedAllergens: [],
  mealSlots: ['lunch', 'dinner'],
  foodTier: 'medium',
  selectedSnackIds: [],
  selectedDrinkIds: [],
  includeAlcohol: false,
};

function mainMeals(prefs: UserPreferences) {
  return generateMealPlan(prefs)
    .days.flatMap((d) => d.meals)
    .filter((m) => !m.isLeftover && m.slot !== 'dessert' && m.slot !== 'snack');
}

function shareWith(mood: MoodTag, prefs: Partial<UserPreferences> = {}) {
  const meals = mainMeals({ ...BASE, ...prefs, moodTags: [mood] });
  return meals.filter((m) => m.recipe.moodTags.includes(mood)).length / meals.length;
}

describe('poftele chiar schimbă meniul', () => {
  test.each<[MoodTag, number]>([
    ['soups_stews', 0.6],
    ['pasta_italian', 0.5],
    ['fresh_salad', 0.5],
    ['romanian_classic', 0.8],
  ])('pofta %s apare în cel puțin %d din mese, chiar la nivelul Medium', (mood, minShare) => {
    expect(shareWith(mood)).toBeGreaterThanOrEqual(minShare);
  });

  test('două pofte diferite dau meniuri diferite', () => {
    const soups = new Set(
      mainMeals({ ...BASE, moodTags: ['soups_stews'] }).map((m) => m.recipe.id)
    );
    const grill = new Set(mainMeals({ ...BASE, moodTags: ['grill_meat'] }).map((m) => m.recipe.id));
    const shared = [...soups].filter((id) => grill.has(id)).length;

    expect(shared / soups.size).toBeLessThan(0.5);
  });

  test('o poftă dă alt meniu decât niciuna', () => {
    const none = new Set(mainMeals(BASE).map((m) => m.recipe.id));
    const grill = mainMeals({ ...BASE, moodTags: ['grill_meat'] }).map((m) => m.recipe.id);

    expect(grill.filter((id) => !none.has(id)).length).toBeGreaterThan(0);
  });
});

describe('nivelul de ingrediente rămâne respectat', () => {
  test('la Basic, o poftă nu aduce rețete Premium (bugetul rămâne protejat)', () => {
    const meals = mainMeals({
      ...BASE,
      foodTier: 'basic',
      budgetRon: 300,
      moodTags: ['grill_meat'],
    });

    expect(meals.filter((m) => m.recipe.tier === 'premium')).toEqual([]);
  });

  test('fără pofte, Medium rămâne Medium', () => {
    const meals = mainMeals(BASE);

    expect(meals.every((m) => m.recipe.tier === 'medium')).toBe(true);
  });
});
