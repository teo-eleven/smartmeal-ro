import { RECIPES, RECIPES_MAP } from '../recipes';

/**
 * Mood tags are promises the craving cards make: "Bogat în Proteine", "Mese Rapide",
 * "Cină Ușoară", "Desert". The audit found 21 "high protein" dishes under the threshold (hummus
 * got it because /ton/ matched "bastonașe"), 9 "speedy" dishes taking 28-32 minutes and
 * guacamole tagged as a dessert because /tort/ matched "tortilla".
 */

const HIGH_PROTEIN_MIN_G = 28;
const SPEEDY_MAX_MINUTES = 25;
const LIGHT_DINNER_MAX_KCAL = 420;
const LOW_CALORIE_MAX_KCAL = 550;

const totalMinutes = (id: string) =>
  RECIPES_MAP[id].prepTimeMinutes + RECIPES_MAP[id].cookTimeMinutes;

describe('etichetele de poftă spun adevărul', () => {
  test(`„Bogat în proteine” înseamnă cel puțin ${HIGH_PROTEIN_MIN_G} g de proteine pe porție`, () => {
    const false_ = RECIPES.filter(
      (r) =>
        r.moodTags.includes('high_protein') &&
        r.nutritionPerServing.proteinGrams < HIGH_PROTEIN_MIN_G
    );

    expect(false_.map((r) => `${r.id}: ${r.nutritionPerServing.proteinGrams}g`)).toEqual([]);
  });

  test(`„Rapid” înseamnă sub ${SPEEDY_MAX_MINUTES} de minute în total`, () => {
    const slow = RECIPES.filter(
      (r) => r.moodTags.includes('speedy') && totalMinutes(r.id) >= SPEEDY_MAX_MINUTES
    );

    expect(slow.map((r) => `${r.id}: ${totalMinutes(r.id)} min`)).toEqual([]);
  });

  test(`„Cină ușoară” înseamnă cel mult ${LIGHT_DINNER_MAX_KCAL} kcal`, () => {
    const heavy = RECIPES.filter(
      (r) =>
        r.moodTags.includes('light_dinner') &&
        r.nutritionPerServing.calories > LIGHT_DINNER_MAX_KCAL
    );

    expect(heavy.map((r) => `${r.id}: ${r.nutritionPerServing.calories} kcal`)).toEqual([]);
  });

  test(`„Sub 550 kcal” înseamnă sub ${LOW_CALORIE_MAX_KCAL} kcal`, () => {
    const heavy = RECIPES.filter(
      (r) =>
        r.moodTags.includes('low_calorie') && r.nutritionPerServing.calories >= LOW_CALORIE_MAX_KCAL
    );

    expect(heavy.map((r) => `${r.id}: ${r.nutritionPerServing.calories} kcal`)).toEqual([]);
  });

  test('„Desert” se pune doar pe rețete care chiar pot fi servite ca desert', () => {
    const notDesserts = RECIPES.filter(
      (r) => r.moodTags.includes('sweet_treat') && !(r.suitableSlots ?? []).includes('dessert')
    );

    expect(notDesserts.map((r) => r.id)).toEqual([]);
  });

  test('guacamole nu e desert, iar hummus-ul nu e bogat în proteine', () => {
    expect(RECIPES_MAP.guacamole_chips_nachos.moodTags).not.toContain('sweet_treat');
    expect(RECIPES_MAP.hummus_cremos_legume_crocante.moodTags).not.toContain('high_protein');
  });

  test('fiecare rețetă păstrează cel puțin o etichetă de poftă', () => {
    const untagged = RECIPES.filter((r) => r.moodTags.length === 0);

    expect(untagged.map((r) => r.id)).toEqual([]);
  });
});
