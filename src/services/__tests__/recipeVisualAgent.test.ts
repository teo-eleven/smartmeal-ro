import { recipeVisualAgent } from '../recipeVisualAgent';
import { RECIPES } from '../../data/recipes';

describe('Adaptive Recipe Visual Agent Service', () => {
  it('builds an adaptive photographic prompt containing real ingredients and appliances', () => {
    const chickenRecipe = RECIPES.find((r) => r.id === 'pui_airfryer_cartofi');
    expect(chickenRecipe).toBeDefined();

    const prompt = recipeVisualAgent.buildAdaptiveVisualPrompt(chickenRecipe!);
    expect(prompt).toContain('Pui');
    expect(prompt).toContain('chicken breast');
    expect(prompt).toContain('potato wedges');
    expect(prompt).toContain('air-fried');
    expect(prompt).toContain('4k ultra-detailed');
  });

  it('tailors ambiance and lighting for breakfast recipes', () => {
    const omeletteRecipe = RECIPES.find((r) => r.id === 'omleta_cremoasa_spanac_branza');
    expect(omeletteRecipe).toBeDefined();

    const prompt = recipeVisualAgent.buildAdaptiveVisualPrompt(omeletteRecipe!);
    expect(prompt).toContain('breakfast');
    expect(prompt).toContain('morning');
    expect(prompt).toContain('spinach');
    expect(prompt).toContain('telemea');
  });

  it('tailors ambiance for movie/match snacks and desserts', () => {
    const popcornRecipe = RECIPES.find((r) => r.id === 'popcorn_aromat_parmezan_boia');
    expect(popcornRecipe).toBeDefined();

    const popcornPrompt = recipeVisualAgent.buildAdaptiveVisualPrompt(popcornRecipe!);
    expect(popcornPrompt).toContain('movie night');
    expect(popcornPrompt).toContain('popcorn');

    const dessertRecipe = RECIPES.find((r) => r.id === 'lava_cake_ciocolata_airfryer');
    expect(dessertRecipe).toBeDefined();

    const dessertPrompt = recipeVisualAgent.buildAdaptiveVisualPrompt(dessertRecipe!);
    expect(dessertPrompt).toContain('patisserie');
    expect(dessertPrompt).toContain('chocolate');
  });

  it('resolves local generated image assets when available', () => {
    const localAvailable = recipeVisualAgent.getAvailableLocalImages();
    expect(localAvailable.length).toBeGreaterThanOrEqual(5);
    expect(localAvailable).toContain('pui_airfryer_cartofi');
    expect(localAvailable).toContain('omleta_cremoasa_spanac_branza');

    const chickenRecipe = RECIPES.find((r) => r.id === 'pui_airfryer_cartofi')!;
    const resolved = recipeVisualAgent.resolveRecipeImage(chickenRecipe);
    expect(resolved.isLocalAsset).toBe(true);
    expect(resolved.uri).toBeDefined();
  });

  it('gracefully falls back to CDN URL or fallback placeholder when no local asset exists', () => {
    const fakeRecipe = {
      ...RECIPES[0],
      id: 'reteta_fictiva_fara_imagine',
      imageUrl: 'https://example.com/food.jpg',
    };

    const resolved = recipeVisualAgent.resolveRecipeImage(fakeRecipe);
    expect(resolved.isLocalAsset).toBe(false);
    expect(resolved.uri).toBe('https://example.com/food.jpg');
  });
});
