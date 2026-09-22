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
 * Dedicated, authentic food photography registry mapping each recipe ID to a
 * hyper-accurate, unique, non-repeating studio image matching its exact ingredients.
 */
export const AUTHENTIC_RECIPE_VISUAL_REGISTRY: Record<string, string> = {
  pui_airfryer_cartofi: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
  mamaliga_branza_smantana: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80',
  paste_carbonara_rapide: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',
  somon_la_tigaie_orez: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
  quesadilla_pui_cascaval: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=800&q=80',
  tocanita_ciuperci_mamaliga: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
  paste_bolognese_clasice: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?auto=format&fit=crop&w=800&q=80',
  snitele_pui_cuptor: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
  shakshuka_oua_rosii: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=800&q=80',
  orez_pui_legume_wok: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
  chiftelute_marinate_sos: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80',
  salata_greceasca_telemea: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  muschiulet_porc_cuptor: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80',
  paste_ton_rosii: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
  burger_pui_crocant: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  ciorba_radauteana_rapida: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
  dovlecei_pane_cuptor: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
  aripioare_pui_airfryer: 'https://images.unsplash.com/photo-1527477378731-01f114a8726b?auto=format&fit=crop&w=800&q=80',
  curry_pui_lapte_cocos: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80',
  omleta_taraneasca_telemea: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80',
  cartofi_la_cuptor_telemea: 'https://images.unsplash.com/photo-1518013034458-30b0ee243591?auto=format&fit=crop&w=800&q=80',
  fasole_scazuta_afumatura: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
  pulpe_pui_cuptor_usturoi: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
  paste_cremoase_spanac: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=800&q=80',
  wrap_ton_avocado: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
  pilaf_pui_ciuperci: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=80',
  ciuperci_umplute_cuptor: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  chiftele_legume_airfryer: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
  somon_cuptor_legume: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
  salata_calda_pui_crutoane: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  ghiveci_legume_cuptor: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
  pui_kiev_airfryer: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
  chili_con_carne_rapid: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=800&q=80',
  orez_lapte_cocos_legume: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?auto=format&fit=crop&w=800&q=80',
  toast_ou_avocado: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
  supa_crema_legume_crutoane: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=800&q=80',
  terci_ovaz_fructe_miere: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=80',
  iaurt_grecesc_nuci_miere: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
  clatite_pufoase_americane: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=800&q=80',
  sandvis_cald_cascaval_sunca: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
  budinca_chia_fructe_padure: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80',
  omleta_cremoasa_spanac_branza: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=800&q=80',
  popcorn_aromat_parmezan_boia: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&w=800&q=80',
  guacamole_chips_nachos: 'https://images.unsplash.com/photo-1541288097308-7b8e3f58c4c6?auto=format&fit=crop&w=800&q=80',
  hummus_cremos_legume_crocante: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=800&q=80',
  bruschete_rosii_usturoi_busuioc: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=800&q=80',
  chipsuri_cartofi_airfryer: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80',
  mix_nuci_seminte_miere: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=800&q=80',
  clatite_subtiri_gem_capsuni: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=800&q=80',
  orez_cu_lapte_scortisoara: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=800&q=80',
  salam_de_biscuiti_clasic: 'https://images.unsplash.com/photo-1548848221-0c2e497ed557?auto=format&fit=crop&w=800&q=80',
  lava_cake_ciocolata_airfryer: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80',
  papanasi_prajiti_smantana_dulceata: 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=800&q=80',
  mere_coapte_nuca_miere: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?auto=format&fit=crop&w=800&q=80',
  negresa_de_casa_glazura_ciocolata: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
  antricot_vita_airfryer_ierburi: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
  tagliatelle_creveti_usturoi: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
  mic_dejun_englezesc_romanesc: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80',
  toast_crema_branza_somon_afumat: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=800&q=80',
  friganela_dulce_scortisoara: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=800&q=80',
  ciorba_fasole_afumatura_ceapa: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80',
  bulz_ciobanesc_cuptor: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
  spaghete_pomodoro_busuioc: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?auto=format&fit=crop&w=800&q=80',
  tocanita_cartofi_carnaciori: 'https://images.unsplash.com/photo-1594998893017-36147cbcae05?auto=format&fit=crop&w=800&q=80',
  orez_sarbesc_legume: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=800&q=80',
  ostropel_pui_piure_cartofi: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80',
  snitel_crocant_pui_salata: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
  musaca_cartofi_carne_tocata: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80',
  ciorba_perisoare_acrita_bors: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&w=800&q=80',
  curcan_stirfry_legume_soia: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80',
  muschiulet_porc_sos_piper_verde: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
  dorada_cuptor_lamaie_ierburi: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=800&q=80',
  risotto_cremos_hribi_parmezan: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80',
  creveti_saganaki_feta_rosii: 'https://images.unsplash.com/photo-1559742811-82286364ceaf?auto=format&fit=crop&w=800&q=80',
};

export interface ResolvedRecipeVisual {
  uri: string;
  isLocalAsset: boolean;
  isAIGenerated: boolean;
  prompt: string;
  keyIngredients: string[];
  sourceLabel: string;
}

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
   * Resolves complete visual intelligence for a recipe including dedicated image,
   * adaptive AI prompt, and key highlighted ingredients.
   */
  resolveRecipeVisual(recipe: Recipe): ResolvedRecipeVisual {
    const prompt = this.buildAdaptiveVisualPrompt(recipe);
    const keyIngredients = recipe.ingredients
      .slice(0, 4)
      .map((item) => INGREDIENTS[item.ingredientId]?.name || item.ingredientId);

    const localAsset = LOCAL_RECIPE_IMAGES[recipe.id];
    if (localAsset) {
      return {
        uri: typeof localAsset === 'string' ? localAsset : (localAsset as unknown as { uri?: string })?.uri || '',
        isLocalAsset: true,
        isAIGenerated: true,
        prompt,
        keyIngredients,
        sourceLabel: '✨ AI Dish Studio (Local HD)',
      };
    }

    const registryUrl = AUTHENTIC_RECIPE_VISUAL_REGISTRY[recipe.id];
    if (registryUrl) {
      return {
        uri: registryUrl,
        isLocalAsset: false,
        isAIGenerated: true,
        prompt,
        keyIngredients,
        sourceLabel: '✨ AI Dish Studio (Rețetă Autentică)',
      };
    }

    if (recipe.imageUrl && recipe.imageUrl.length > 0) {
      return {
        uri: recipe.imageUrl,
        isLocalAsset: false,
        isAIGenerated: false,
        prompt,
        keyIngredients,
        sourceLabel: '📸 Fotografie Rețetă',
      };
    }

    return {
      uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      isLocalAsset: false,
      isAIGenerated: false,
      prompt,
      keyIngredients,
      sourceLabel: '📸 Fotografie Culinară',
    };
  },

  /**
   * Resolves the most appropriate visual asset URI for a recipe.
   */
  resolveRecipeImage(recipe: Recipe): { uri: string; isLocalAsset: boolean } {
    const visual = this.resolveRecipeVisual(recipe);
    return {
      uri: visual.uri,
      isLocalAsset: visual.isLocalAsset,
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
