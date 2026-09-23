import {
  getRecipeArchetype,
  getArchetypePalette,
  getRecipeIcons,
  getRecipeHighlights,
  shortenIngredientName,
  DishArchetype,
} from '../recipeVisual';
import { RECIPES, RECIPES_MAP } from '../../data/recipes';
import { INGREDIENTS } from '../../data/ingredients';
import { INGREDIENT_ICONS, getIngredientIcon } from '../../data/ingredientIcons';

describe('recipe pictograms come from the recipe itself', () => {
  test('every catalog ingredient has an icon of its own', () => {
    // A missing entry falls back to a generic plate, which says nothing about the dish.
    const missing = Object.keys(INGREDIENTS).filter((id) => !INGREDIENT_ICONS[id]);
    expect(missing).toEqual([]);
  });

  test('icons only ever describe ingredients the dish actually contains', () => {
    RECIPES.forEach((recipe) => {
      const allowed = recipe.ingredients.map((item) => getIngredientIcon(item.ingredientId));
      getRecipeIcons(recipe).forEach((icon) => expect(allowed).toContain(icon));
    });
  });

  test('every recipe produces at least one icon', () => {
    RECIPES.forEach((recipe) => {
      expect(getRecipeIcons(recipe).length).toBeGreaterThan(0);
    });
  });

  test('salt, oil and flour are never what represents a dish', () => {
    const bland = ['🧂', '🌻'];
    RECIPES.forEach((recipe) => {
      const hasCharacterfulIngredient = recipe.ingredients.some(
        (item) => !['sare_fina', 'piper_negru', 'ulei_floarea_soarelui'].includes(item.ingredientId)
      );
      if (!hasCharacterfulIngredient) return;
      expect(getRecipeIcons(recipe).some((icon) => !bland.includes(icon))).toBe(true);
    });
  });

  test('the same icon is never shown twice on one card', () => {
    RECIPES.forEach((recipe) => {
      const icons = getRecipeIcons(recipe);
      expect(new Set(icons).size).toBe(icons.length);
    });
  });

  test('highlights line up with the icons, one name each', () => {
    RECIPES.forEach((recipe) => {
      expect(getRecipeHighlights(recipe).length).toBe(getRecipeIcons(recipe).length);
    });
  });

  test('highlights name real catalog ingredients', () => {
    const catalogNames = Object.values(INGREDIENTS).map((i) => i.name);
    RECIPES.forEach((recipe) => {
      getRecipeHighlights(recipe).forEach((name) => {
        expect(catalogNames.some((full) => full.startsWith(name))).toBe(true);
      });
    });
  });
});

describe('dish archetypes', () => {
  test('every recipe resolves to an archetype with a palette', () => {
    RECIPES.forEach((recipe) => {
      const archetype = getRecipeArchetype(recipe);
      const palette = getArchetypePalette(archetype);
      expect(palette.darkColors).toHaveLength(2);
      expect(palette.lightColors).toHaveLength(2);
      expect(palette.labelRo).toBeTruthy();
    });
  });

  test('the classification is stable for the same recipe', () => {
    RECIPES.slice(0, 20).forEach((recipe) => {
      expect(getRecipeArchetype(recipe)).toBe(getRecipeArchetype(recipe));
    });
  });

  test('recognisable dishes land where a cook would expect', () => {
    const expectations: [string, DishArchetype][] = [
      ['ciorba_radauteana_rapida', 'soup'],
      ['paste_carbonara_rapide', 'pasta'],
      ['somon_la_tigaie_orez', 'seafood'],
      ['salata_greceasca_telemea', 'salad'],
      ['mousse_ciocolata_cocos', 'dessert'],
      ['terci_ovaz_vegan_banane', 'breakfast'],
      ['fasole_scazuta_afumatura', 'stew'],
    ];

    expectations.forEach(([id, expected]) => {
      const recipe = RECIPES_MAP[id];
      if (!recipe) return;
      expect(getRecipeArchetype(recipe)).toBe(expected);
    });
  });

  test('desserts are never classified as anything else', () => {
    RECIPES.filter((r) => r.suitableSlots?.includes('dessert')).forEach((recipe) => {
      expect(getRecipeArchetype(recipe)).toBe('dessert');
    });
  });

  test('all archetypes in use have distinct colours', () => {
    const used = new Set(RECIPES.map((r) => getRecipeArchetype(r)));
    const gradients = Array.from(used).map((a) => getArchetypePalette(a).darkColors.join('-'));
    expect(new Set(gradients).size).toBe(gradients.length);
  });
});

describe('shortened ingredient labels', () => {
  test('drop shelf detail a cook would not say out loud', () => {
    expect(shortenIngredientName('Pastă de tomate concentrată 28%')).toBe('Pastă de tomate');
    expect(shortenIngredientName('Fasole roșie boabe la conservă')).toBe('Fasole roșie boabe');
    expect(shortenIngredientName('Mozzarella rasă')).toBe('Mozzarella');
    expect(shortenIngredientName('Brânză de vaci proaspătă')).toBe('Brânză de vaci');
    expect(shortenIngredientName('Lapte de vacă 3,5% grăsime')).not.toContain('%');
  });

  test('never produce an empty label', () => {
    Object.values(INGREDIENTS).forEach((ingredient) => {
      expect(shortenIngredientName(ingredient.name).length).toBeGreaterThan(0);
    });
  });

  test('never mangle a word, only drop whole ones', () => {
    Object.values(INGREDIENTS).forEach((ingredient) => {
      shortenIngredientName(ingredient.name)
        .split(' ')
        .forEach((word) => expect(ingredient.name.split(/\s+/)).toContain(word));
    });
  });

  test('stay short enough for a chip', () => {
    Object.values(INGREDIENTS).forEach((ingredient) => {
      expect(shortenIngredientName(ingredient.name).split(' ').length).toBeLessThanOrEqual(3);
    });
  });
});

describe('labels read like something a cook would say', () => {
  test('cut before shelf detail rather than mid-phrase', () => {
    expect(shortenIngredientName('Orez cu bob rotund')).toBe('Orez');
    expect(shortenIngredientName('Ciocolată amăruie pentru desert 55%')).toBe('Ciocolată amăruie');
    expect(shortenIngredientName('Paste Spaghete din grâu dur')).toBe('Paste Spaghete');
    // Both the size code and "proaspete" are shelf detail, leaving the word a cook uses.
    expect(shortenIngredientName('Ouă proaspete mărimea M')).toBe('Ouă');
  });

  test('keep "de" where the name needs it', () => {
    expect(shortenIngredientName('Piept de pui file')).toBe('Piept de pui');
    expect(shortenIngredientName('Pastă de tomate concentrată 28%')).toBe('Pastă de tomate');
  });

  test('never end on a connector word', () => {
    Object.values(INGREDIENTS).forEach((ingredient) => {
      const words = shortenIngredientName(ingredient.name).split(' ');
      expect(['de', 'cu', 'din', 'pentru', 'la']).not.toContain(words[words.length - 1].toLowerCase());
    });
  });
});

describe('archetype respects when a dish is eaten', () => {
  test('a sweet breakfast is breakfast, not dessert', () => {
    const pancakes = RECIPES_MAP['clatite_vegane_banane_ovaz'];
    if (!pancakes) return;
    expect(pancakes.moodTags).toContain('sweet_treat');
    expect(getRecipeArchetype(pancakes)).toBe('breakfast');
  });

  test('labels never carry an unclosed bracket', () => {
    RECIPES.forEach((recipe) => {
      getRecipeHighlights(recipe).forEach((name) => {
        expect(name).not.toContain('(');
        expect(name).not.toContain(')');
      });
    });
  });
});
