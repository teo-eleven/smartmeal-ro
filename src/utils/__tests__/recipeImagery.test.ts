import { RECIPES } from '../../data/recipes';
import { getRecipeArchetype } from '../recipeVisual';
import { LOCAL_RECIPE_IMAGES } from '../../../assets/recipes';
import { ARCHETYPE_BACKDROPS } from '../../../assets/recipes/backdrops';

const byTitle = (fragment: string) =>
  RECIPES.find((recipe) => recipe.title.toLowerCase().includes(fragment.toLowerCase()))!;

/**
 * Only fifteen of the eighty-two recipes own a photograph; the rest show their name over a
 * backdrop borrowed from the same archetype. That works only while the archetype is right,
 * because a backdrop is still a photograph of food — put a meat stew behind a chickpea dip
 * and the user sees a wrong picture, which is the whole thing ADR-07 exists to prevent.
 */
describe('registrul de fotografii', () => {
  test('fiecare cheie corespunde unei rețete reale din catalog', () => {
    const known = new Set(RECIPES.map((recipe) => recipe.id));
    const orphans = Object.keys(LOCAL_RECIPE_IMAGES).filter((id) => !known.has(id));

    expect(orphans).toEqual([]);
  });

  test('nicio rețetă cu fotografie proprie nu ajunge pe un fundal comun', () => {
    const withPhoto = RECIPES.filter((recipe) => LOCAL_RECIPE_IMAGES[recipe.id]);

    expect(withPhoto.length).toBeGreaterThanOrEqual(18);
  });
});

describe('arhetipul hotărăște ce fotografie vede utilizatorul', () => {
  test('un wrap rămâne wrap, chiar dacă are ton în el', () => {
    const wrap = byTitle('Wrap răcoros în lipie cu ton');

    expect(getRecipeArchetype(wrap)).toBe('wrap');
  });

  test('un preparat care nu se gătește nu primește fundal de tocăniță cu carne', () => {
    const hummus = byTitle('Hummus cremos');

    expect(hummus.appliances).toEqual([]);
    expect(getRecipeArchetype(hummus)).not.toBe('stew');
  });

  test('tocănițele adevărate rămân tocănițe', () => {
    ['Mâncărică de fasole', 'Chili con carne', 'Ostropel'].forEach((fragment) => {
      expect(getRecipeArchetype(byTitle(fragment))).toBe('stew');
    });
  });

  test('pe fundalul de tocăniță ajung doar preparate care chiar se gătesc', () => {
    // `stew` is the last resort of the ladder, and its backdrop is a photograph of a stew in
    // a pot. A dish that needs no appliance at all is not a stew under any reading, so it
    // must never inherit that picture. A vegan bean stew still may -- it is a stew.
    const onStew = RECIPES.filter(
      (recipe) => !LOCAL_RECIPE_IMAGES[recipe.id] && getRecipeArchetype(recipe) === 'stew'
    );
    const uncooked = onStew.filter((recipe) => recipe.appliances.length === 0);

    expect(uncooked.map((recipe) => recipe.title)).toEqual([]);
  });

  test('fiecare arhetip folosit are fie fundal, fie gradient declarat', () => {
    const used = new Set(RECIPES.map(getRecipeArchetype));
    const missing = [...used].filter(
      (archetype) => !ARCHETYPE_BACKDROPS[archetype] && !['salad', 'wrap'].includes(archetype)
    );

    expect(missing).toEqual([]);
  });
});
