import * as fs from 'fs';
import * as path from 'path';
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

  test('nicio rețetă nu mai afișează o fotografie clară', () => {
    // Every card goes through the same template now (ADR-14), so the registry is history:
    // it is kept only as the source material for the archetype backdrops.
    const source = fs.readFileSync(
      path.join(__dirname, '..', '..', 'components', 'RecipeVisual.tsx'),
      'utf8'
    );

    expect(source).not.toContain('LOCAL_RECIPE_IMAGES');
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

  test('o rețetă e salată doar dacă e chiar o salată, nu dacă o are ca garnitură', () => {
    expect(getRecipeArchetype(byTitle('Salată grecească'))).toBe('salad');
    expect(getRecipeArchetype(byTitle('Salată caldă cu pui'))).toBe('salad');

    // These merely mention a side salad; the dish is a schnitzel and a burger.
    expect(getRecipeArchetype(byTitle('Șnițele fragede de pui'))).not.toBe('salad');
    expect(getRecipeArchetype(byTitle('Șnițel din piept de pui'))).not.toBe('salad');
    expect(getRecipeArchetype(byTitle('Burger de pui crocant'))).not.toBe('salad');
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
