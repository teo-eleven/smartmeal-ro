import { ARCHETYPE_BACKDROPS } from '../../../assets/recipes/backdrops';
import { LOCAL_RECIPE_IMAGES } from '../../../assets/recipes';
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

  test('most recipes without a photo still get a backdrop from their own archetype', () => {
    const withoutPhoto = RECIPES.filter((r) => !LOCAL_RECIPE_IMAGES[r.id]);
    const covered = withoutPhoto.filter((r) => ARCHETYPE_BACKDROPS[getRecipeArchetype(r)]);
    expect(covered.length / withoutPhoto.length).toBeGreaterThan(0.8);
  });

  test('every recipe resolves to either its own photo, a backdrop, or a gradient', () => {
    // None of the three can throw, so no recipe can end up with a blank card.
    RECIPES.forEach((recipe) => {
      const archetype = getRecipeArchetype(recipe);
      const hasSomething =
        Boolean(LOCAL_RECIPE_IMAGES[recipe.id]) ||
        Boolean(ARCHETYPE_BACKDROPS[archetype]) ||
        Boolean(getArchetypePalette(archetype).darkColors);
      expect(hasSomething).toBe(true);
    });
  });
});
