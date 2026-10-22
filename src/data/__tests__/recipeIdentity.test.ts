import { RECIPES, RECIPES_MAP } from '../recipes';
import { RECIPE_ID_ALIASES, resolveRecipeId } from '../recipeIdAliases';

/**
 * A recipe's title is a promise about what is on the plate, and the photo, the shopping list
 * and the user's trust all follow from it. The 2026-10-21 audit found "aripioare" made with
 * thighs, "sparanghel" made with zucchini and "tagliatelle" made with spaghetti.
 */

/** Words in a title that promise a specific ingredient; [] means the catalog has none. */
const TITLE_PROMISES: [RegExp, string[]][] = [
  [/mămăligu?ț?ă|mămăligă/i, ['malai_superior']],
  [/curcan/i, ['piept_curcan']],
  [/creveți/i, ['creveti_decorticati']],
  [/aripioare/i, []],
  [/sparanghel/i, []],
  [/tagliatelle/i, []],
  [/leuștean/i, []],
  [/brânză de capră/i, []],
];

describe('titlul rețetei nu promite ce nu e în farfurie', () => {
  test.each(TITLE_PROMISES)('titlurile care spun %s au ingredientul', (pattern, ingredientIds) => {
    const broken = RECIPES.filter(
      (recipe) =>
        pattern.test(recipe.title) &&
        !recipe.ingredients.some((ing) => ingredientIds.includes(ing.ingredientId))
    );

    expect(broken.map((r) => `${r.id}: ${r.title}`)).toEqual([]);
  });

  test('niciun titlu nu apare de două ori', () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    RECIPES.forEach((recipe) => {
      const key = recipe.title.trim().toLowerCase();
      if (seen.has(key)) duplicates.push(`${seen.get(key)} = ${recipe.id}`);
      seen.set(key, recipe.id);
    });

    expect(duplicates).toEqual([]);
  });
});

describe('ID-urile vechi duc la rețeta nouă', () => {
  test('fiecare alias duce la o rețetă care există', () => {
    const dangling = Object.entries(RECIPE_ID_ALIASES).filter(([, target]) => !RECIPES_MAP[target]);

    expect(dangling).toEqual([]);
  });

  test('niciun ID vechi nu mai e și ID de rețetă', () => {
    const stillUsed = Object.keys(RECIPE_ID_ALIASES).filter((oldId) => RECIPES_MAP[oldId]);

    expect(stillUsed).toEqual([]);
  });

  test.each([
    ['aripioare_pui_airfryer', 'pulpe_pui_airfryer_cartofi'],
    ['curcan_stirfry_legume_soia', 'pui_stirfry_legume_soia'],
    ['chili_fasole_neagra_cartof_dulce', 'chili_vegan_fasole_rosie_marar'],
    ['somon_salbatic_sparanghel_turmeric', 'somon_cuptor_dovlecei_turmeric'],
    ['tagliatelle_creveti_usturoi', 'spaghete_creveti_usturoi'],
    ['omleta_ciuperci_branza_capra', 'omleta_ciuperci_telemea'],
    ['fasole_scazuta_afumatura', 'fasole_scazuta_ceapa_marar'],
    ['ghiveci_calugaresc_legume', 'ghiveci_legume_cuptor'],
  ])('%s → %s', (oldId, newId) => {
    expect(resolveRecipeId(oldId)).toBe(newId);
  });

  test('un ID curent rămâne neschimbat', () => {
    expect(resolveRecipeId('ghiveci_legume_cuptor')).toBe('ghiveci_legume_cuptor');
  });
});
