import { Allergen } from '../types';

export interface AllergenInfo {
  id: Allergen;
  label: string;
  icon: string;
  /** What the user actually avoids, in their own words. */
  description: string;
}

/**
 * The subset of the EU's 14 declarable allergens that this ingredient catalog can actually
 * contain. Adding an allergen here without mapping the ingredients that carry it would be
 * worse than not offering it at all, so the two are kept side by side in this file.
 */
export const ALLERGEN_CATALOG: AllergenInfo[] = [
  {
    id: 'gluten',
    label: 'Gluten',
    icon: '🌾',
    description: 'Grâu, pâine, paste, pesmet, biscuiți',
  },
  { id: 'lactate', label: 'Lactate', icon: '🥛', description: 'Lapte, brânză, smântână, unt' },
  { id: 'oua', label: 'Ouă', icon: '🥚', description: 'Ouă și preparate care le conțin' },
  { id: 'peste', label: 'Pește', icon: '🐟', description: 'Somon, doradă, ton, cod, păstrăv' },
  { id: 'crustacee', label: 'Crustacee', icon: '🦐', description: 'Creveți și fructe de mare' },
  { id: 'nuci', label: 'Nuci', icon: '🌰', description: 'Nucă, migdale, lapte de cocos' },
  { id: 'arahide', label: 'Arahide', icon: '🥜', description: 'Arahide și unt de arahide' },
  { id: 'soia', label: 'Soia', icon: '🫘', description: 'Sos de soia și derivate' },
  {
    id: 'susan',
    label: 'Susan',
    icon: '🫓',
    description: 'Semințe de susan, chifle cu susan, tahini',
  },
  { id: 'mustar', label: 'Muștar', icon: '🟡', description: 'Muștar și sosuri cu muștar' },
];

/**
 * Ingredient -> allergens it carries. Only ingredients that carry at least one appear.
 *
 * An omission here means a user who declared an allergy is served the allergen anyway, so
 * every new ingredient must be checked against this map.
 */
export const INGREDIENT_ALLERGENS: Record<string, Allergen[]> = {
  // Gluten
  paste_penne: ['gluten'],
  paste_spaghete: ['gluten'],
  faina_alba: ['gluten'],
  faina_grau: ['gluten'],
  pesmet_auriu: ['gluten'],
  // Romanian sliced toast bread commonly contains soy flour as an improver.
  paine_toast: ['gluten', 'soia'],
  // The bun is sold as "cu susan"; most Romanian ones also list soy flour.
  chifle_burger: ['gluten', 'susan'],
  lipii_tortilla: ['gluten'],
  // Plain biscuits are usually made with egg and soy lecithin.
  biscuiti_populari: ['gluten', 'lactate', 'oua', 'soia'],
  fulgi_ovaz: ['gluten'],
  bors_proaspat: ['gluten'],
  // Oat drink is made from oats, which the catalog already treats as gluten.
  lapte_vegetal_ovaz: ['gluten'],
  // Product-dependent: many brands are made with wheat flour, so the cautious reading wins.
  tortilla_chips_nachos: ['gluten'],

  // Dairy
  lapte_3_5: ['lactate'],
  branza_vaci_proaspata: ['lactate'],
  telemea_vaca: ['lactate'],
  smantana_20: ['lactate'],
  smantana_gatit: ['lactate'],
  iaurt_grecesc: ['lactate'],
  iaurt_grecesc_10: ['lactate'],
  unt_82: ['lactate'],
  mozzarella_rasa: ['lactate'],
  cascaval_clasic: ['lactate'],
  parmezan_ras: ['lactate'],
  crema_branza: ['lactate'],
  branza_feta: ['lactate'],
  // Dark baking chocolate: milk fat plus soy lecithin as the emulsifier.
  ciocolata_menaj: ['lactate', 'soia'],
  ciocolata_neagra_vegana: ['soia'],

  // Eggs
  oua_m: ['oua'],

  // Fish & shellfish
  file_somon_proaspat: ['peste'],
  somon_afumat: ['peste'],
  ton_conserva: ['peste'],
  dorada_proaspata: ['peste'],
  file_cod_congelat: ['peste'],
  pastrav_proaspat: ['peste'],
  creveti_decorticati: ['crustacee'],

  // Nuts, peanuts, sesame
  nuci_miez: ['nuci'],
  unt_arahide: ['arahide'],
  lapte_migdale_fara_zahar: ['nuci'],
  // Not a tree nut under EU rules, but the US lists coconut as one; the cautious reading wins.
  lapte_cocos: ['nuci'],

  // Processed pork: Romanian ham and smoked sausages routinely list soy protein and milk powder.
  sunca_praga: ['soia', 'lactate'],
  carnaciori_oltenesti: ['soia', 'lactate'],

  // Soy & mustard
  sos_soia: ['soia', 'gluten'],
  tofu_clasic: ['soia'],
  mustar_clasic: ['mustar'],
};

/**
 * Ingredients someone checked and found to carry none of the allergens above.
 *
 * Kept as an explicit list rather than "anything not in the map", because silence is exactly
 * how cod, trout and almond drink reached allergic users: a new ingredient now fails the
 * catalog test until someone decides which of the two lists it belongs in.
 */
export const ALLERGEN_FREE_INGREDIENT_IDS: ReadonlySet<string> = new Set([
  'ceapa_galbena',
  'ceapa_rosie',
  'usturoi',
  'cartofi_albi',
  'morcovi',
  'mere_romanesti',
  'ardei_gras_rosu',
  'rosii_proaspete',
  'rosii_cherry',
  'castraveti',
  'dovlecei',
  'patrunjel_verde',
  'marar_verde',
  'lamaie',
  'ciuperci_champignon',
  'spanac_baby',
  'salata_verde',
  'varza_alba',
  'sfecla_rosie',
  'avocado',
  'piept_pui_file',
  'pulpe_pui_dezosate',
  'carne_tocata_amestec',
  'muschiulet_porc',
  'antricot_vita_angus',
  'orez_basmati',
  'orez_bob_rotund',
  'malai_superior',
  'ulei_floarea_soarelui',
  'ulei_masline',
  'sare_fina',
  'piper_negru',
  'boia_dulce',
  'oregano_uscat',
  'busuioc_uscat',
  'rosii_pasate',
  'rosii_cuburi',
  'pasta_tomate',
  'fasole_rosie_conserva',
  'fasole_boabe_conserva',
  'porumb_dulce',
  'mazare_congelata',
  'miere_poliflora',
  'fructe_padure_congelate',
  'zahar_tos',
  'cacao_pudra',
  'porumb_popcorn',
  'naut_conserva',
  'seminte_chia',
  'gem_fructe',
  'scortisoara_macinata',
  'bacon_afumat',
  'orez_arborio',
  'ciuperci_hribi',
  'banane',
  'fasole_verde_congelata',
  'ficatei_pui_proaspeti',
  'linte_verde_uscata',
  'turmeric_macinat',
  'quinoa_alba',
  'seminte_dovleac',
  'piept_curcan',
  'conopida_proaspata',
  'afine_congelate',
  'ghimbir_proaspat',
  'masline_kalamata',
  'cimbru_uscat',
  'rozmarin_proaspat',
]);

export function getIngredientAllergens(ingredientId: string): Allergen[] {
  return INGREDIENT_ALLERGENS[ingredientId] ?? [];
}
