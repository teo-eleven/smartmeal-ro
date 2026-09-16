import { Recipe, MealSlot, Appliance } from '../types';
import { INGREDIENTS } from '../data/ingredients';
import { LOCAL_RECIPE_IMAGES } from '../../assets/recipes';

/**
 * Culinary Visual Descriptors for Romanian Grocery Ingredients
 * Translates ingredient IDs into sensory, photographic descriptions.
 */
const INGREDIENT_VISUAL_DESCRIPTORS: Record<string, string> = {
  piept_pui_file: 'succulent tender chicken breast with crispy golden crust',
  piept_pui: 'tender succulent chicken breast with crispy golden crumb',
  pulpe_pui_dezosate: 'caramelized juicy chicken thighs with roasted herb glaze',
  somon_file: 'glistening pan-seared pink salmon fillet with crispy skin',
  carne_tocata_amestec: 'rich savory slow-simmered bolognese meat with herbs',
  oua_m: 'farm-fresh eggs with vibrant golden yolk',
  cartofi_albi: 'roasted rustic golden potato wedges seasoned with herbs and sea salt',
  cartofi: 'roasted rustic golden potato wedges seasoned with herbs and sea salt',
  orez_basmati: 'steaming fluffy basmati rice grains',
  paste_penne: 'al dente penne pasta coated in rich sauce',
  paste_spaghetti: 'silky spaghetti ribbons twirled with sauce',
  spanac_baby: 'fresh vibrant green sautéed baby spinach leaves',
  rosii_cherry: 'blistered sweet red cherry tomatoes bursting with juice',
  rosii_pasate: 'deep red slow-simmered tomato passata',
  avocado: 'creamy ripe sliced avocado',
  telemea_vaca: 'crumbled salty white Romanian telemea cheese',
  cascaval_clasic: 'melted gooey golden cașcaval cheese pull',
  mozzarella_rasa: 'stretchy bubbling melted mozzarella',
  parmezan_ras: 'finely shaved Grana Padano parmesan cheese snow',
  unt_82: 'glossy melted butter sheen',
  smantana_fermentata: 'dollop of rich creamy Romanian smântână',
  fasole_boabe: 'hearty tender white beans simmered with aromatics',
  naut_conserva: 'smooth creamy spiced chickpea hummus',
  fulgi_ovaz: 'creamy warm rolled oats porridge',
  iaurt_grecesc: 'velvety thick Greek yogurt swirl',
  iaurt_grecesc_10: 'thick artisanal Greek yogurt with creamy texture',
  miere_poliflora: 'glossy swirl of pure golden wildflower honey',
  nuci_miez: 'toasted crunchy walnut pieces',
  ciocolata_menaj: 'molten warm dark chocolate center',
  fructe_padure_congelate: 'wild blueberries, plump raspberries, and dark blackberries',
  porumb_popcorn: 'fluffy freshly popped popcorn kernels dusted with paprika',
  tortilla_chips_nachos: 'crispy triangle corn tortilla chips',
  seminte_chia: 'plump delicate chia seed pudding layers',
  gem_fructe: 'ruby red strawberry jam glaze',
  scortisoara_macinata: 'delicate dusting of fragrant brown cinnamon',
  sunca_praga: 'thinly sliced tender Prague ham',
  patrunjel_proaspat: 'fresh chopped bright green curly parsley',
  marar_proaspat: 'delicate fresh dill sprigs',
  usturoi: 'minced fragrant garlic and herb oil',
  usturoi_capatana: 'minced fragrant garlic and herb oil',
  ceapa_galbena: 'sweet golden caramelized onions',
  morcovi: 'sweet roasted orange carrot batons',
  ardei_gras_rosu: 'sweet crunchy red bell pepper strips',
  castraveti: 'crisp refreshing cucumber slices',
  boia_dulce: 'smoky sweet red paprika dusting',
  ulei_floarea_soarelui: 'light golden oil glaze',
};

/**
 * Appliance visual cooking characteristics
 */
const APPLIANCE_VISUAL_STYLES: Record<Appliance, string> = {
  air_fryer: 'golden crispy air-fried texture with light crunch and low oil sheen',
  oven: 'oven-roasted with caramelized golden edges and gratin finish',
  hob: 'sautéed in an artisan skillet with tender juicy texture and gentle steam',
  microwave: 'warm and comforting with soft steam rising',
};

/**
 * Plating and ambiance styling based on meal slot
 */
const SLOT_AMBIANCE_STYLES: Record<MealSlot, string> = {
  breakfast: 'bistro morning breakfast aesthetic, warm morning sunbeam from window, rustic tabletop, coffee mug in soft background',
  lunch: 'contemporary vibrant lunch plate, natural daylight, fresh crisp side salad, artisan ceramic tableware',
  dinner: 'moody evening dinner presentation, warm studio lighting, elegant dark ceramic plate, shallow depth of field',
  snack: 'cozy movie night / match night finger food spread, rustic wooden board, soft warm background ambient bokeh',
  dessert: 'fine patisserie presentation, dessert fork, slate serving dish, delicate powdered garnish, fresh mint sprig',
};

/**
 * Adaptive Recipe Visual Agent
 * Inspects recipe ingredients, cooking method, and meal timing to generate
 * photorealistic, hyper-tailored culinary prompts and resolve images.
 */
export const recipeVisualAgent = {
  /**
   * Constructs an adaptive, photorealistic photographic prompt for any recipe
   * based on its real ingredients, appliance technique, and meal slot.
   */
  buildAdaptiveVisualPrompt(recipe: Recipe): string {
    // 1. Resolve ingredient visual descriptors
    const ingredientDescriptions: string[] = [];

    for (const item of recipe.ingredients) {
      const knownDescriptor = INGREDIENT_VISUAL_DESCRIPTORS[item.ingredientId];
      if (knownDescriptor) {
        ingredientDescriptions.push(knownDescriptor);
      } else {
        const catalogIng = INGREDIENTS[item.ingredientId];
        if (catalogIng) {
          ingredientDescriptions.push(`fresh ${catalogIng.name.toLowerCase()}`);
        }
      }
    }

    // Limit to top 5 prominent ingredients to keep prompt focused and punchy
    const topIngredientsStr = ingredientDescriptions.slice(0, 5).join(', ');

    // 2. Resolve appliance style
    const primaryAppliance = recipe.appliances[0] || 'hob';
    const cookingStyle = APPLIANCE_VISUAL_STYLES[primaryAppliance] || APPLIANCE_VISUAL_STYLES.hob;

    // 3. Resolve slot ambiance
    const primarySlot: MealSlot = recipe.suitableSlots?.[0] || 'dinner';
    const ambianceStyle = SLOT_AMBIANCE_STYLES[primarySlot] || SLOT_AMBIANCE_STYLES.dinner;

    // 4. Synthesize professional studio food photography prompt
    return [
      `Professional food photography of "${recipe.title}".`,
      `Key visible ingredients: ${topIngredientsStr}.`,
      `Cooking technique: ${cookingStyle}.`,
      `Styling & setting: ${ambianceStyle}.`,
      'Shot with 85mm f/1.4 lens, 4k ultra-detailed, commercial culinary studio quality, appetizing gourmet presentation.',
    ].join(' ');
  },

  /**
   * Resolves the most appropriate visual asset for a recipe:
   * 1. Locally generated AI asset from assets/recipes/ (if available)
   * 2. Curated high-res Unsplash CDN URL
   * 3. Fallback appetizing image
   */
  resolveRecipeImage(recipe: Recipe): { uri: string; isLocalAsset: boolean } {
    const localAsset = LOCAL_RECIPE_IMAGES[recipe.id];
    if (localAsset) {
      return {
        uri: typeof localAsset === 'string' ? localAsset : (localAsset as unknown as { uri?: string })?.uri || recipe.imageUrl || '',
        isLocalAsset: true,
      };
    }

    if (recipe.imageUrl && recipe.imageUrl.length > 0) {
      return {
        uri: recipe.imageUrl,
        isLocalAsset: false,
      };
    }

    return {
      uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      isLocalAsset: false,
    };
  },

  /**
   * Returns list of all recipes that have locally generated AI photography assets
   */
  getAvailableLocalImages(): string[] {
    return Object.keys(LOCAL_RECIPE_IMAGES);
  },

  /**
   * Check if a specific recipe has a locally generated image
   */
  hasLocalImage(recipeId: string): boolean {
    return Boolean(LOCAL_RECIPE_IMAGES[recipeId]);
  },
};
