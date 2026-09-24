import { ARCHETYPE_BACKDROPS } from '../../../assets/recipes/backdrops';
import { RECIPES } from '../../data/recipes';
import { getRecipeArchetype, getArchetypePalette, DishArchetype } from '../../utils/recipeVisual';

/**
 * The backdrop behind a recipe name is a photograph of a different dish. That is only
 * acceptable while it comes from the same archetype and stays decorative; these pin both.
 */
describe('archetype backdrops', () => {
  test('every backdrop names an archetype the app actually uses', () => {
    Object.keys(ARCHETYPE_BACKDROPS).forEach((key) => {
      expect(() => getArchetypePalette(key as DishArchetype)).not.toThrow();
      expect(getArchetypePalette(key as DishArchetype).labelRo).toBeTruthy();
    });
  });

  test('each backdrop resolves to a real asset', () => {
    Object.entries(ARCHETYPE_BACKDROPS).forEach(([key, asset]) => {
      expect(asset).toBeTruthy();
      expect(key).toMatch(/^[a-z]+$/);
    });
  });

  test('an archetype without a suitable photo has no backdrop rather than a borrowed one', () => {
    // salad and wrap have no photograph of their own kind in the library.
    expect(ARCHETYPE_BACKDROPS.salad).toBeUndefined();
    expect(ARCHETYPE_BACKDROPS.wrap).toBeUndefined();
  });

  test('most recipes get a backdrop from their own archetype', () => {
    const covered = RECIPES.filter((r) => ARCHETYPE_BACKDROPS[getRecipeArchetype(r)]);
    expect(covered.length / RECIPES.length).toBeGreaterThan(0.9);
  });

  test('every recipe resolves to either a backdrop or a gradient', () => {
    // Neither can throw, so no recipe can end up with a blank card.
    RECIPES.forEach((recipe) => {
      const archetype = getRecipeArchetype(recipe);
      const hasSomething =
        Boolean(ARCHETYPE_BACKDROPS[archetype]) ||
        Boolean(getArchetypePalette(archetype).darkColors);
      expect(hasSomething).toBe(true);
    });
  });
});
