import { Recipe } from '../types';
import { DishArchetype } from './recipeVisual';
import { PhotoCredit, RECIPE_PHOTO_MANIFEST } from '../data/recipePhotoManifest';

/** What a card needs to show a photograph: where it is, and whom to credit. */
export interface DisplayPhoto {
  url: string;
  credit?: PhotoCredit;
}

/**
 * One photograph per dish type, used only by the onboarding mood cards, where the card names
 * a kind of food rather than a recipe. Recipe cards never fall back to these: a recipe with
 * no verified photo of its own shows the generated card instead (ADR-07, ADR-20).
 */
const ARCHETYPE_PARAMS = '?w=900&auto=format&fit=crop&q=80';
const archetypePhoto = (photoId: string) =>
  `https://images.unsplash.com/${photoId}${ARCHETYPE_PARAMS}`;

export const ARCHETYPE_PHOTO_URLS: Record<DishArchetype, string> = {
  pasta: archetypePhoto('photo-1612874742237-6526221588e3'), // twirled spaghetti
  grill: archetypePhoto('photo-1544025162-d76694265947'), // grilled ribs
  soup: archetypePhoto('photo-1547592166-23ac45744acd'), // bowl of soup
  stew: archetypePhoto('photo-1541832676-9b763b0239ab'), // braised meat with rice
  seafood: archetypePhoto('photo-1467003909585-2f8a72700288'), // salmon fillet
  salad: archetypePhoto('photo-1540420773420-3366772f4999'), // mixed salad
  roast: archetypePhoto('photo-1598103442097-8b74394b95c6'), // roast chicken
  breakfast: archetypePhoto('photo-1525351484163-7529414344d8'), // egg on toast
  wrap: archetypePhoto('photo-1626700051175-6818013e1d4f'), // tortilla wraps
  rice: archetypePhoto('photo-1512058564366-18510be2db19'), // rice bowl
  dessert: archetypePhoto('photo-1567620905732-2d1ec7ab7445'), // stack of pancakes
  // Wikimedia Commons, CC0 (no attribution required): tortilla chips with guacamole.
  snack:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/2018-02-01-Guacamole_mit_Nachos-7937.jpg/960px-2018-02-01-Guacamole_mit_Nachos-7937.jpg',
};

/** Lower case, no diacritics: "Mămăliguță" and "mamaliguta" are the same word. */
function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/**
 * The dish itself, without its garnish: "Pulpe de pui la cuptor cu mujdei și mămăligă" is
 * chicken, not polenta. Matching the whole title used to give that card the polenta photo,
 * and "Dovlecei cu sos de iaurt" the yogurt-dessert photo.
 */
const GARNISH_BOUNDARY = /\s(cu|la|si|in|pe|din)\s|,/;

function leadingDishWords(title: string): string[] {
  const lead = normalize(title).split(GARNISH_BOUNDARY)[0];
  return lead.split(/[^a-z]+/).filter(Boolean);
}

/**
 * Dish names, each pointing at the recipe whose verified photo it may borrow. Phrases are
 * written without diacritics. Only recipes with a manifest entry can lend a photo.
 */
const KEYWORD_PHOTOS: [string, string][] = [
  ['hummus', 'hummus_cremos_legume_crocante'],
  ['guacamole', 'guacamole_chips_nachos'],
  ['bruschete', 'bruschete_rosii_usturoi_busuioc'],
  ['bruschetta', 'bruschete_rosii_usturoi_busuioc'],
  ['popcorn', 'popcorn_aromat_parmezan_boia'],
  ['ciorba radauteana', 'ciorba_radauteana_rapida'],
  ['ciorba de perisoare', 'ciorba_perisoare_acrita_bors'],
  ['ciorba de fasole', 'ciorba_fasole_afumatura_ceapa'],
  ['ciorba', 'ciorba_legume_lamaie'],
  ['bors', 'bors_moldovenesc_sfecla_legume'],
  ['supa crema', 'supa_crema_legume_crutoane'],
  ['ghiveci', 'ghiveci_legume_cuptor'],
  ['mancare de mazare', 'mancare_mazare_morcov_marar'],
  ['fasole scazuta', 'fasole_scazuta_ceapa_marar'],
  ['ostropel', 'ostropel_pui_piure_cartofi'],
  ['chiftelute', 'chiftelute_marinate_sos'],
  ['musaca', 'musaca_cartofi_carne_tocata'],
  ['bulz', 'bulz_ciobanesc_cuptor'],
  ['mamaliga', 'mamaliga_branza_smantana'],
  ['mamaliguta', 'mamaliga_branza_smantana'],
  ['papanasi', 'papanasi_prajiti_smantana_dulceata'],
  ['clatite', 'clatite_subtiri_gem_capsuni'],
  ['pancakes', 'clatite_pufoase_americane'],
  ['salam de biscuiti', 'salam_de_biscuiti_clasic'],
  ['negresa', 'negresa_de_casa_glazura_ciocolata'],
  ['brownie', 'negresa_de_casa_glazura_ciocolata'],
  ['orez cu lapte', 'orez_cu_lapte_scortisoara'],
  ['budinca de chia', 'budinca_chia_fructe_padure'],
  ['mere coapte', 'mere_coapte_nuca_miere'],
  ['inghetata', 'inghetata_banane_unt_arahide'],
  ['smoothie', 'smoothie_bowl_ghimbir_afine'],
  ['snitel', 'snitele_pui_cuptor'],
  ['snitele', 'snitele_pui_cuptor'],
  ['burger', 'burger_pui_crocant'],
  ['curry', 'curry_pui_lapte_cocos'],
  ['frigarui', 'frigarui_pui_legume_gratar'],
  ['ficatei', 'ficatei_pui_ceapa_tigaie'],
  ['muschiulet', 'muschiulet_porc_cuptor'],
  ['antricot', 'antricot_vita_airfryer_ierburi'],
  ['tacos', 'tacos_vita_salsa_rosii'],
  ['somon', 'somon_la_tigaie_orez'],
  ['dorada', 'dorada_cuptor_lamaie_ierburi'],
  ['pastrav', 'pastrav_cuptor_lamaie_marar'],
  ['creveti', 'creveti_saganaki_feta_rosii'],
  ['carbonara', 'paste_carbonara_rapide'],
  ['bolognese', 'paste_bolognese_clasice'],
  ['spaghete', 'spaghete_pomodoro_busuioc'],
  ['paste', 'spaghete_pomodoro_busuioc'],
  ['penne', 'penne_arrabbiata_rapide'],
  ['risotto', 'risotto_cremos_hribi_parmezan'],
  ['shakshuka', 'shakshuka_oua_rosii'],
  ['omleta', 'omleta_taraneasca_telemea'],
  ['quesadilla', 'quesadilla_pui_cascaval'],
  ['sandvis', 'sandvis_cald_cascaval_sunca'],
  ['toast', 'toast_ou_avocado'],
  ['tartine', 'tartine_avocado_rosii_cherry'],
  ['terci', 'terci_ovaz_fructe_miere'],
  ['ovaz', 'ovaz_peste_noapte_mar_nuci'],
  ['salata', 'salata_greceasca_telemea'],
];

/** Index of the first word where `phrase` starts, as whole words, or -1. */
function phraseIndex(words: string[], phrase: string): number {
  const parts = phrase.split(' ');
  for (let i = 0; i + parts.length <= words.length; i++) {
    if (parts.every((part, offset) => words[i + offset] === part)) return i;
  }
  return -1;
}

/**
 * The catalog dish a recipe name says it is, or null. The keyword that appears EARLIEST in the
 * dish name wins, so "Ovăz peste noapte" is oats, not fish ("peste" is also "over").
 */
export function matchDishKeyword(title: string): string | null {
  const words = leadingDishWords(title);
  let best: { index: number; recipeId: string } | null = null;

  for (const [phrase, recipeId] of KEYWORD_PHOTOS) {
    const index = phraseIndex(words, phrase);
    if (index >= 0 && (best === null || index < best.index)) best = { index, recipeId };
  }

  return best ? best.recipeId : null;
}

/**
 * A verified photo for a recipe the manifest does not know (new, imported or AI-suggested),
 * borrowed from the catalog dish its name says it is.
 */
export function getPhotoByKeywords(title: string): DisplayPhoto | null {
  const recipeId = matchDishKeyword(title);
  return recipeId ? (RECIPE_PHOTO_MANIFEST[recipeId] ?? null) : null;
}

/**
 * The photograph for a recipe card, or null when there is no verified one, in which case
 * the card is generated from the recipe's own ingredients. Never a guess from another dish
 * type: that is how a chickpea dip was shown a dark meat stew.
 */
export function getRecipePhoto(recipe: Recipe): DisplayPhoto | null {
  if (recipe.imageUrl && recipe.imageUrl.trim().length > 0) {
    return { url: recipe.imageUrl };
  }
  return RECIPE_PHOTO_MANIFEST[recipe.id] ?? getPhotoByKeywords(recipe.title);
}
