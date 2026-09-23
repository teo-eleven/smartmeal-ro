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

    expect(recipeVisualAgent.hasLocalImage('pui_airfryer_cartofi')).toBe(true);
  });

  it('reports no local photograph for a recipe that has none', () => {
    // Nothing is invented in its place: the card falls back to the generated visual.
    expect(recipeVisualAgent.hasLocalImage('reteta_fictiva_fara_imagine')).toBe(false);
  });
});
