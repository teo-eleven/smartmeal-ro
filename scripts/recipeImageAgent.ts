/**
 * Local Recipe Image Agent CLI
 * Run with: npx ts-node scripts/recipeImageAgent.ts
 *
 * Scans catalog recipes, produces adaptive culinary photography prompts
 * tailored to exact ingredients, and reports local asset coverage.
 */

import { RECIPES } from '../src/data/recipes';
import { recipeVisualAgent } from '../src/services/recipeVisualAgent';

function runLocalRecipeImageAgent() {
  console.log('='.repeat(80));
  console.log('🤖 SMARTMEAL RO - LOCAL ADAPTIVE RECIPE IMAGE AGENT');
  console.log('='.repeat(80));

  const totalRecipes = RECIPES.length;
  const localImages = recipeVisualAgent.getAvailableLocalImages();
  console.log(`\n📊 Catalog Status: ${totalRecipes} total recipes`);
  console.log(`📸 Local AI Generated Assets: ${localImages.length} available\n`);

  console.log('Sample Adaptive Culinary Prompts (Tailored to Real Ingredients & Appliances):');
  console.log('-'.repeat(80));

  // Display a diverse sample of meal types (breakfast, lunch, dinner, snack, dessert)
  const sampleIds = [
    'pui_crispy_cartofi_airfryer',
    'omleta_cremoasa_spanac_branza',
    'terci_ovaz_fructe_miere',
    'popcorn_aromat_parmezan_boia',
    'lava_cake_ciocolata_airfryer',
  ];

  sampleIds.forEach((id) => {
    const recipe = RECIPES.find((r) => r.id === id);
    if (!recipe) return;

    const hasLocal = recipeVisualAgent.hasLocalImage(recipe.id);
    const prompt = recipeVisualAgent.buildAdaptiveVisualPrompt(recipe);

    console.log(`\n🍲 [${recipe.suitableSlots?.join(', ') || 'dinner'}] ${recipe.title}`);
    console.log(`   🏷️ ID: ${recipe.id} | Local Asset: ${hasLocal ? '✅ AVAILABLE' : '🌐 CDN'}`);
    console.log(`   🥘 Ingredients: ${recipe.ingredients.map((i) => i.ingredientId).join(', ')}`);
    console.log(`   🎨 Adaptive Prompt:\n   "${prompt}"`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ Local Recipe Image Agent inspection completed successfully.');
  console.log('='.repeat(80));
}

runLocalRecipeImageAgent();
