/**
 * Nutrition per 100 g of the edible part, and the weights needed to turn a recipe's
 * "1 buc", "0.5 legătură" or "100 ml" into grams.
 *
 * Values are standard reference figures (USDA FoodData Central "SR Legacy" / "Foundation",
 * rounded; Romanian products matched to the closest generic food). Carbohydrates include
 * fibre, as on EU labels before the fibre line is subtracted. Dry goods (rice, pasta, lentils,
 * flour) are listed dry, because the recipes give dry weights.
 *
 * Recipe nutrition is computed from this table (see `computeRecipeNutrition`), so a recipe can
 * no longer declare 380 kcal for a biscuit salami that is closer to 850.
 */

export interface NutritionPer100g {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

const n = (kcal: number, proteinG: number, carbsG: number, fatG: number, fiberG: number) => ({
  kcal,
  proteinG,
  carbsG,
  fatG,
  fiberG,
});

export const INGREDIENT_NUTRITION: Readonly<Record<string, NutritionPer100g>> = {
  // Vegetables, fruit, herbs
  ceapa_galbena: n(40, 1.1, 9.3, 0.1, 1.7),
  ceapa_rosie: n(40, 1.1, 9.3, 0.1, 1.7),
  usturoi: n(149, 6.4, 33, 0.5, 2.1),
  cartofi_albi: n(77, 2, 17, 0.1, 2.2),
  morcovi: n(41, 0.9, 9.6, 0.2, 2.8),
  mere_romanesti: n(52, 0.3, 14, 0.2, 2.4),
  ardei_gras_rosu: n(31, 1, 6, 0.3, 2.1),
  rosii_proaspete: n(18, 0.9, 3.9, 0.2, 1.2),
  rosii_cherry: n(18, 0.9, 3.9, 0.2, 1.2),
  castraveti: n(15, 0.7, 3.6, 0.1, 0.5),
  dovlecei: n(17, 1.2, 3.1, 0.3, 1),
  patrunjel_verde: n(36, 3, 6.3, 0.8, 3.3),
  marar_verde: n(43, 3.5, 7, 1.1, 2.1),
  lamaie: n(29, 1.1, 9.3, 0.3, 2.8),
  ciuperci_champignon: n(22, 3.1, 3.3, 0.3, 1),
  ciuperci_hribi: n(30, 3, 3, 0.4, 2.5),
  spanac_baby: n(23, 2.9, 3.6, 0.4, 2.2),
  salata_verde: n(15, 1.4, 2.9, 0.2, 1.3),
  varza_alba: n(25, 1.3, 5.8, 0.1, 2.5),
  sfecla_rosie: n(43, 1.6, 9.6, 0.2, 2.8),
  conopida_proaspata: n(25, 1.9, 5, 0.3, 2),
  avocado: n(160, 2, 8.5, 14.7, 6.7),
  banane: n(89, 1.1, 23, 0.3, 2.6),
  fructe_padure_congelate: n(50, 1, 11, 0.3, 4),
  afine_congelate: n(57, 0.7, 14, 0.3, 2.4),
  ghimbir_proaspat: n(80, 1.8, 18, 0.8, 2),
  rozmarin_proaspat: n(131, 3.3, 21, 5.9, 14),
  masline_kalamata: n(230, 1.5, 6, 22, 3),
  mazare_congelata: n(77, 5.2, 13.6, 0.4, 4.5),
  fasole_verde_congelata: n(31, 1.8, 7, 0.2, 3.4),
  porumb_dulce: n(80, 2.5, 15.5, 1.2, 2),

  // Meat, fish, eggs
  piept_pui_file: n(120, 22.5, 0, 2.6, 0),
  pulpe_pui_dezosate: n(177, 18.6, 0, 10.9, 0),
  ficatei_pui_proaspeti: n(119, 17, 0.7, 4.8, 0),
  piept_curcan: n(110, 23.5, 0, 1.5, 0),
  carne_tocata_amestec: n(263, 17, 0, 21, 0),
  muschiulet_porc: n(121, 21, 0, 3.5, 0),
  antricot_vita_angus: n(248, 19.5, 0, 19, 0),
  sunca_praga: n(120, 18, 1.5, 4.5, 0),
  carnaciori_oltenesti: n(310, 15, 1, 27, 0),
  bacon_afumat: n(350, 15, 1, 32, 0),
  file_somon_proaspat: n(208, 20, 0, 13, 0),
  somon_afumat: n(117, 18, 0, 4.3, 0),
  ton_conserva: n(130, 25, 0, 3, 0),
  dorada_proaspata: n(115, 20, 0, 4, 0),
  file_cod_congelat: n(82, 18, 0, 0.7, 0),
  pastrav_proaspat: n(141, 20, 0, 6.2, 0),
  creveti_decorticati: n(85, 20, 0.2, 0.5, 0),
  oua_m: n(143, 12.6, 0.7, 9.5, 0),

  // Dairy
  lapte_3_5: n(64, 3.3, 4.7, 3.5, 0),
  branza_vaci_proaspata: n(150, 14, 3, 9, 0),
  telemea_vaca: n(260, 17, 1, 21, 0),
  branza_feta: n(264, 14, 4, 21, 0),
  smantana_20: n(206, 2.8, 3.5, 20, 0),
  smantana_gatit: n(195, 2.6, 3.5, 19, 0),
  iaurt_grecesc: n(133, 6, 4, 10, 0),
  iaurt_grecesc_10: n(133, 6, 4, 10, 0),
  unt_82: n(740, 0.6, 0.6, 82, 0),
  mozzarella_rasa: n(300, 22, 2.2, 22, 0),
  cascaval_clasic: n(360, 25, 1, 28, 0),
  parmezan_ras: n(384, 33, 0, 28, 0),
  crema_branza: n(250, 6, 4, 23, 0),

  // Grains, flour, bread, pasta (dry)
  orez_basmati: n(350, 8, 78, 0.6, 1.3),
  orez_bob_rotund: n(358, 7, 79, 0.6, 1.3),
  orez_arborio: n(350, 7, 79, 0.6, 1.3),
  paste_penne: n(357, 12.5, 71, 1.5, 3),
  paste_spaghete: n(357, 12.5, 71, 1.5, 3),
  malai_superior: n(362, 8, 77, 3.6, 4),
  faina_alba: n(364, 10, 76, 1, 2.7),
  faina_grau: n(364, 10, 76, 1, 2.7),
  pesmet_auriu: n(395, 13, 72, 5.3, 4.5),
  fulgi_ovaz: n(372, 13, 60, 7, 10),
  quinoa_alba: n(368, 14, 64, 6, 7),
  lipii_tortilla: n(310, 8.5, 51, 7.5, 3.5),
  chifle_burger: n(280, 9, 49, 4.5, 2.7),
  paine_toast: n(265, 8.5, 49, 3.5, 2.7),
  biscuiti_populari: n(435, 7, 73, 13, 2),
  porumb_popcorn: n(387, 13, 78, 4.5, 15),
  tortilla_chips_nachos: n(489, 7, 63, 23, 5),

  // Legumes (canned are drained; lentils are dry)
  fasole_rosie_conserva: n(100, 6.9, 17.4, 0.5, 6),
  fasole_boabe_conserva: n(100, 7, 17.5, 0.4, 6),
  naut_conserva: n(120, 7, 18, 2.6, 5.4),
  linte_verde_uscata: n(352, 25, 60, 1, 11),
  tofu_clasic: n(120, 13, 2, 7, 1),

  // Oils, sauces, condiments, spices
  ulei_floarea_soarelui: n(884, 0, 0, 100, 0),
  ulei_masline: n(884, 0, 0, 100, 0),
  sare_fina: n(0, 0, 0, 0, 0),
  piper_negru: n(251, 10, 64, 3.3, 25),
  boia_dulce: n(282, 14, 54, 13, 35),
  oregano_uscat: n(265, 9, 69, 4.3, 42.5),
  busuioc_uscat: n(233, 23, 48, 4, 37.7),
  cimbru_uscat: n(276, 9, 64, 7.4, 37),
  turmeric_macinat: n(312, 10, 67, 3.3, 22.7),
  scortisoara_macinata: n(247, 4, 81, 1.2, 53),
  mustar_clasic: n(66, 4, 5.8, 3.3, 3.3),
  rosii_pasate: n(30, 1.3, 5, 0.2, 1.5),
  rosii_cuburi: n(21, 1, 4, 0.1, 1.2),
  pasta_tomate: n(82, 4.3, 18.9, 0.5, 4.1),
  sos_soia: n(53, 8, 4.9, 0.6, 0.8),
  bors_proaspat: n(10, 0.3, 1.8, 0, 0),

  // Plant drinks and coconut
  lapte_cocos: n(230, 2.3, 5.5, 24, 0),
  lapte_vegetal_ovaz: n(45, 1, 6.5, 1.5, 0.8),
  lapte_migdale_fara_zahar: n(15, 0.5, 0.3, 1.2, 0.3),

  // Sweet, nuts, seeds
  miere_poliflora: n(304, 0.3, 82, 0, 0.2),
  zahar_tos: n(400, 0, 100, 0, 0),
  gem_fructe: n(250, 0.4, 62, 0.1, 1),
  ciocolata_menaj: n(546, 5, 55, 31, 7),
  ciocolata_neagra_vegana: n(598, 7.8, 46, 43, 11),
  cacao_pudra: n(360, 22, 45, 21, 33), // EU label values; USDA's 228 kcal uses other factors
  nuci_miez: n(654, 15, 14, 65, 6.7),
  unt_arahide: n(588, 25, 20, 50, 6),
  seminte_chia: n(486, 17, 42, 31, 34),
  seminte_dovleac: n(559, 30, 11, 49, 6),
};

/**
 * Edible grams in one piece ("buc") or one bunch ("legătură"). Needed wherever a recipe or
 * the catalog counts pieces: the shopping list converts through it and so does nutrition.
 */
export const GRAMS_PER_UNIT: Readonly<Record<string, number>> = {
  oua_m: 50,
  avocado: 140,
  salata_verde: 300,
  lipii_tortilla: 62,
  chifle_burger: 75,
  paine_toast: 25, // one slice
  usturoi: 5, // one clove
  lamaie: 100,
  patrunjel_verde: 50, // one bunch
  marar_verde: 40, // one bunch
};

/**
 * Grams per millilitre for liquids. Lemon is the odd one out: recipes ask for millilitres of
 * juice and the shop sells whole lemons, and a lemon yields about a third of its weight in
 * juice, so 1 ml of juice needs about 3 g of lemon.
 */
export const GRAMS_PER_ML: Readonly<Record<string, number>> = {
  ulei_floarea_soarelui: 0.92,
  ulei_masline: 0.91,
  smantana_gatit: 1.01,
  lapte_3_5: 1.03,
  sos_soia: 1.15,
  lapte_cocos: 0.97,
  lapte_vegetal_ovaz: 1.03,
  lapte_migdale_fara_zahar: 1.01,
  rosii_pasate: 1.05,
  lamaie: 3,
};
