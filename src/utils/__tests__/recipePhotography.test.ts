import { RECIPES } from '../../data/recipes';
import {
  getRecipePhotographyUri,
  getPhotoByKeywords,
  RECIPE_EXACT_PHOTOS,
  ARCHETYPE_PHOTO_URLS,
} from '../recipePhotography';
import { getRecipeArchetype } from '../recipeVisual';

describe('Recipe Photography System', () => {
  test('every recipe in the catalog has a dedicated photo mapping', () => {

    RECIPES.forEach((recipe) => {
      const uri = getRecipePhotographyUri(recipe, getRecipeArchetype(recipe));
      expect(typeof uri).toBe('string');
      expect(uri.startsWith('https://images.unsplash.com/')).toBe(true);
      expect(RECIPE_EXACT_PHOTOS[recipe.id]).toBeDefined();
    });
  });

  test('hummus displays a dedicated hummus photo, not generic snack platter', () => {
    const hummus = RECIPES.find((r) => r.id === 'hummus_cremos_legume_crocante')!;
    const uri = getRecipePhotographyUri(hummus, getRecipeArchetype(hummus));

    expect(uri).toContain('photo-1577906096429-f73c2c312435');
  });

  test('ciorba de legume displays a vibrant vegetable ciorba photo, not dark meat soup', () => {
    const ciorba = RECIPES.find((r) => r.id === 'ciorba_legume_lamaie')!;
    const uri = getRecipePhotographyUri(ciorba, getRecipeArchetype(ciorba));

    expect(uri).toContain('photo-1547592166-23ac45744acd');
  });

  test('ghiveci calugaresc displays a roasted vegetable casserole photo, not chicken roast', () => {
    const ghiveci = RECIPES.find((r) => r.id === 'ghiveci_legume_cuptor')!;
    const uri = getRecipePhotographyUri(ghiveci, getRecipeArchetype(ghiveci));

    expect(uri).toContain('photo-1572449043416-55f4685c9bb7');
  });

  test('mamaliga cu telemea displays authentic golden polenta with cheese', () => {
    const mamaliga = RECIPES.find((r) => r.id === 'mamaliga_branza_smantana')!;
    const uri = getRecipePhotographyUri(mamaliga, getRecipeArchetype(mamaliga));

    expect(uri).toContain('photo-1534422298391-e4f8c172dddb');
  });

  test('papanasi displays traditional fried cheese donuts with cream and jam', () => {
    const papanasi = RECIPES.find((r) => r.id === 'papanasi_prajiti_smantana_dulceata')!;
    const uri = getRecipePhotographyUri(papanasi, getRecipeArchetype(papanasi));

    expect(uri).toContain('photo-1579372786545-d24232daf58c');
  });

  test('salam de biscuiti displays authentic chocolate biscuit salami', () => {
    const salam = RECIPES.find((r) => r.id === 'salam_de_biscuiti_clasic')!;
    const uri = getRecipePhotographyUri(salam, getRecipeArchetype(salam));

    expect(uri).toContain('photo-1541781774459-bb2af2f05b55');
  });

  test('mancare de mazare displays sweet green peas stew', () => {
    const mazare = RECIPES.find((r) => r.id === 'mancare_mazare_morcov_marar')!;
    const uri = getRecipePhotographyUri(mazare, getRecipeArchetype(mazare));

    expect(uri).toContain('photo-1546069901-ba9599a7e63c');
  });

  test('keyword photo resolver matches dynamically generated Romanian dish titles', () => {
    expect(getPhotoByKeywords('Ciorbă de pui a la grec')).toContain('photo-1547592166-23ac45744acd');
    expect(getPhotoByKeywords('Hummus cu susan')).toContain('photo-1577906096429-f73c2c312435');
    expect(getPhotoByKeywords('Papanași fierți cu nucă')).toContain('photo-1579372786545-d24232daf58c');
    expect(getPhotoByKeywords('Mâncărică de mazăre')).toContain('photo-1546069901-ba9599a7e63c');
  });

  test('explicit recipe.imageUrl takes top priority when present', () => {
    const customRecipe = {
      ...RECIPES[0],
      imageUrl: 'https://custom-chef-photo.com/my-dish.jpg',
    };
    const uri = getRecipePhotographyUri(customRecipe, 'grill');
    expect(uri).toBe('https://custom-chef-photo.com/my-dish.jpg');
  });
});
