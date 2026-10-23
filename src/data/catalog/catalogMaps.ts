import { FoodTier, HealthGoalTag, MealSlot, SupermarketId } from '../../types';

/** Per-recipe slots, tiers, store availability and health tags, keyed by recipe id. */
export const RECIPE_SLOTS_MAP: Record<string, MealSlot[]> = {
  pui_airfryer_cartofi: ['dinner', 'lunch'],
  mamaliga_branza_smantana: ['dinner', 'lunch'],
  paste_carbonara_rapide: ['dinner', 'lunch'],
  somon_la_tigaie_orez: ['dinner', 'lunch'],
  quesadilla_pui_cascaval: ['lunch', 'dinner', 'snack'],
  tocanita_ciuperci_mamaliga: ['dinner', 'lunch'],
  paste_bolognese_clasice: ['dinner', 'lunch'],
  snitele_pui_cuptor: ['dinner', 'lunch'],
  shakshuka_oua_rosii: ['breakfast', 'dinner'],
  orez_pui_legume_wok: ['lunch', 'dinner'],
  chiftelute_marinate_sos: ['dinner', 'lunch'],
  salata_greceasca_telemea: ['lunch', 'dinner'],
  muschiulet_porc_cuptor: ['dinner'],
  paste_ton_rosii: ['lunch', 'dinner'],
  burger_pui_crocant: ['dinner', 'lunch'],
  ciorba_radauteana_rapida: ['lunch'],
  dovlecei_pane_cuptor: ['lunch', 'dinner', 'snack'],
  pulpe_pui_airfryer_cartofi: ['dinner', 'snack'],
  curry_pui_lapte_cocos: ['dinner', 'lunch'],
  omleta_taraneasca_telemea: ['breakfast'],
  cartofi_la_cuptor_telemea: ['dinner', 'lunch'],
  fasole_scazuta_ceapa_marar: ['dinner', 'lunch'],
  pulpe_pui_cuptor_usturoi: ['dinner'],
  paste_cremoase_spanac: ['lunch', 'dinner'],
  wrap_ton_avocado: ['lunch', 'snack'],
  pilaf_pui_ciuperci: ['dinner', 'lunch'],
  ciuperci_umplute_cuptor: ['dinner', 'lunch', 'snack'],
  chiftele_legume_airfryer: ['lunch', 'dinner', 'snack'],
  somon_cuptor_legume: ['dinner', 'lunch'],
  salata_calda_pui_crutoane: ['lunch', 'dinner'],
  ghiveci_legume_cuptor: ['dinner', 'lunch'],
  pui_kiev_airfryer: ['dinner'],
  chili_con_carne_rapid: ['dinner', 'lunch'],
  orez_lapte_cocos_legume: ['lunch', 'dinner'],
  toast_ou_avocado: ['breakfast', 'snack'],
  supa_crema_legume_crutoane: ['lunch'],
};

export const RECIPE_TIERS_MAP: Record<string, FoodTier> = {
  // Base recipes
  pui_airfryer_cartofi: 'medium',
  mamaliga_branza_smantana: 'basic',
  paste_carbonara_rapide: 'medium',
  somon_la_tigaie_orez: 'premium',
  quesadilla_pui_cascaval: 'medium',
  tocanita_ciuperci_mamaliga: 'basic',
  paste_bolognese_clasice: 'medium',
  snitele_pui_cuptor: 'medium',
  shakshuka_oua_rosii: 'basic',
  orez_pui_legume_wok: 'medium',
  chiftelute_marinate_sos: 'medium',
  salata_greceasca_telemea: 'medium',
  muschiulet_porc_cuptor: 'medium',
  paste_ton_rosii: 'basic',
  burger_pui_crocant: 'medium',
  ciorba_radauteana_rapida: 'medium',
  dovlecei_pane_cuptor: 'basic',
  pulpe_pui_airfryer_cartofi: 'basic',
  curry_pui_lapte_cocos: 'medium',
  omleta_taraneasca_telemea: 'basic',
  cartofi_la_cuptor_telemea: 'basic',
  fasole_scazuta_ceapa_marar: 'basic',
  pulpe_pui_cuptor_usturoi: 'basic',
  paste_cremoase_spanac: 'basic',
  wrap_ton_avocado: 'medium',
  pilaf_pui_ciuperci: 'basic',
  ciuperci_umplute_cuptor: 'basic',
  chiftele_legume_airfryer: 'basic',
  somon_cuptor_legume: 'premium',
  salata_calda_pui_crutoane: 'medium',
  ghiveci_legume_cuptor: 'basic',
  pui_kiev_airfryer: 'medium',
  chili_con_carne_rapid: 'medium',
  orez_lapte_cocos_legume: 'basic',
  toast_ou_avocado: 'premium',
  supa_crema_legume_crutoane: 'basic',

  // Extra & New recipes
  terci_ovaz_fructe_miere: 'basic',
  iaurt_grecesc_nuci_miere: 'medium',
  clatite_pufoase_americane: 'medium',
  sandvis_cald_cascaval_sunca: 'basic',
  budinca_chia_fructe_padure: 'premium',
  omleta_cremoasa_spanac_branza: 'basic',
  popcorn_aromat_parmezan_boia: 'basic',
  guacamole_chips_nachos: 'premium',
  hummus_cremos_legume_crocante: 'medium',
  bruschete_rosii_usturoi_busuioc: 'basic',
  chipsuri_cartofi_airfryer: 'basic',
  mix_nuci_seminte_miere: 'premium',
  clatite_subtiri_gem_capsuni: 'basic',
  orez_cu_lapte_scortisoara: 'basic',
  salam_de_biscuiti_clasic: 'basic',
  lava_cake_ciocolata_airfryer: 'premium',
  antricot_vita_airfryer_ierburi: 'premium',
  spaghete_creveti_usturoi: 'premium',

  // 17 Newly added diverse recipes
  mic_dejun_englezesc_romanesc: 'medium',
  toast_crema_branza_somon_afumat: 'premium',
  friganela_dulce_scortisoara: 'basic',
  ciorba_fasole_afumatura_ceapa: 'basic',
  bulz_ciobanesc_cuptor: 'basic',
  spaghete_pomodoro_busuioc: 'basic',
  tocanita_cartofi_carnaciori: 'basic',
  orez_sarbesc_legume: 'basic',
  ostropel_pui_piure_cartofi: 'medium',
  snitel_crocant_pui_salata: 'medium',
  musaca_cartofi_carne_tocata: 'medium',
  ciorba_perisoare_acrita_bors: 'medium',
  pui_stirfry_legume_soia: 'medium',
  muschiulet_porc_sos_piper_verde: 'premium',
  dorada_cuptor_lamaie_ierburi: 'premium',
  risotto_cremos_hribi_parmezan: 'premium',
  creveti_saganaki_feta_rosii: 'premium',
};

export interface RecipeStoreSpec {
  availableSupermarkets?: SupermarketId[];
  storeSignature?: SupermarketId;
  storeBadgeLabel?: string;
}

export const RECIPE_STORE_SPEC_MAP: Record<string, RecipeStoreSpec> = {
  // Fresh fish & seafood - exclusive / specialty
  dorada_cuptor_lamaie_ierburi: {
    availableSupermarkets: ['carrefour', 'kaufland'],
    storeSignature: 'carrefour',
    storeBadgeLabel: '🐟 Pescărie Carrefour',
  },
  spaghete_creveti_usturoi: {
    availableSupermarkets: ['carrefour', 'mega_image', 'kaufland'],
    storeSignature: 'carrefour',
    storeBadgeLabel: '🦐 Pescăria Carrefour',
  },
  creveti_saganaki_feta_rosii: {
    availableSupermarkets: ['carrefour', 'mega_image', 'kaufland'],
    storeSignature: 'carrefour',
    storeBadgeLabel: '🦐 Specialitate Carrefour',
  },
  somon_la_tigaie_orez: {
    availableSupermarkets: ['carrefour', 'mega_image', 'kaufland'],
    storeSignature: 'carrefour',
    storeBadgeLabel: '🐟 Pescărie Carrefour',
  },
  somon_cuptor_legume: {
    storeSignature: 'carrefour',
    storeBadgeLabel: '🐟 Pescărie Carrefour',
  },

  // Premium Angus & Gourmet Deli - Mega Image & Carrefour
  antricot_vita_airfryer_ierburi: {
    availableSupermarkets: ['mega_image', 'carrefour'],
    storeSignature: 'mega_image',
    storeBadgeLabel: '🥩 Mega Gourmet Angus',
  },
  risotto_cremos_hribi_parmezan: {
    availableSupermarkets: ['mega_image', 'carrefour', 'kaufland'],
    storeSignature: 'mega_image',
    storeBadgeLabel: '🍄 Selecție Mega Gourmet',
  },
  toast_crema_branza_somon_afumat: {
    availableSupermarkets: ['mega_image', 'carrefour', 'kaufland'],
    storeSignature: 'mega_image',
    storeBadgeLabel: '✨ Mega Gourmet Brunch',
  },
  budinca_chia_fructe_padure: {
    availableSupermarkets: ['mega_image', 'carrefour'],
    storeSignature: 'mega_image',
    storeBadgeLabel: '🫐 Mega Apetit Healthy',
  },
  toast_ou_avocado: {
    availableSupermarkets: ['mega_image', 'carrefour', 'kaufland'],
    storeSignature: 'mega_image',
    storeBadgeLabel: '🥑 Mega Apetit',
  },
  lava_cake_ciocolata_airfryer: {
    availableSupermarkets: ['mega_image', 'carrefour', 'lidl'],
    storeSignature: 'mega_image',
    storeBadgeLabel: '🍫 Mega Delhaize',
  },

  // Traditional Butcher & Romanian Classics - Kaufland
  ciorba_perisoare_acrita_bors: {
    availableSupermarkets: ['kaufland', 'carrefour', 'mega_image'],
    storeSignature: 'kaufland',
    storeBadgeLabel: '🍲 Tradiție Kaufland',
  },
  muschiulet_porc_sos_piper_verde: {
    storeSignature: 'kaufland',
    storeBadgeLabel: '🥩 Măcelăria Kaufland',
  },
  tocanita_cartofi_carnaciori: {
    storeSignature: 'kaufland',
    storeBadgeLabel: '🥩 Măcelăria Kaufland',
  },
  mic_dejun_englezesc_romanesc: {
    storeSignature: 'kaufland',
    storeBadgeLabel: '🥩 Măcelăria Kaufland',
  },
  bulz_ciobanesc_cuptor: {
    storeSignature: 'kaufland',
    storeBadgeLabel: '🇷🇴 Vreau din România',
  },
  papanasi_prajiti_smantana_dulceata: {
    storeSignature: 'kaufland',
    storeBadgeLabel: '🇷🇴 Vreau din România',
  },
  ostropel_pui_piure_cartofi: {
    storeSignature: 'kaufland',
    storeBadgeLabel: '🍲 Tradiție Kaufland',
  },
  musaca_cartofi_carne_tocata: {
    storeSignature: 'kaufland',
    storeBadgeLabel: '🍲 Tradiție Kaufland',
  },

  // Smart & Budget Favorites - Lidl
  pui_airfryer_cartofi: {
    storeSignature: 'lidl',
    storeBadgeLabel: '🏷️ Favorit Lidl',
  },
  ciorba_fasole_afumatura_ceapa: {
    storeSignature: 'lidl',
    storeBadgeLabel: '🏷️ Cămara Noastră',
  },
  salam_de_biscuiti_clasic: {
    storeSignature: 'lidl',
    storeBadgeLabel: '🏷️ Cămara Noastră',
  },
  mere_coapte_nuca_miere: {
    storeSignature: 'lidl',
    storeBadgeLabel: '🍎 Piața Lidl',
  },
  snitele_pui_cuptor: {
    storeSignature: 'lidl',
    storeBadgeLabel: '🏷️ Favorit Lidl',
  },
  cartofi_la_cuptor_telemea: {
    storeSignature: 'lidl',
    storeBadgeLabel: '🏷️ Cămara Noastră',
  },

  // Carrefour signature fresh & filiere
  pui_stirfry_legume_soia: {
    storeSignature: 'carrefour',
    storeBadgeLabel: '🌿 Filiera Calității',
  },
  supa_crema_legume_crutoane: {
    storeSignature: 'carrefour',
    storeBadgeLabel: '🌿 Filiera Calității',
  },

  // Extended recipes signatures
  ochiuri_mamaliga_telemea: {
    storeSignature: 'lidl',
    storeBadgeLabel: '🍳 Cămara Noastră',
  },
  ficatei_pui_ceapa_tigaie: {
    storeSignature: 'kaufland',
    storeBadgeLabel: '🥘 Tradiție Kaufland',
  },
  tofu_tigaie_legume_orez: {
    storeSignature: 'mega_image',
    storeBadgeLabel: '🌱 Mega Bio & Plant',
  },
};

export const RECIPE_HEALTH_TAGS_MAP: Record<string, HealthGoalTag[]> = {
  // Fish & Seafood (Omega-3 & Anti-inflammatory & PCOS & Heart)
  somon_la_tigaie_orez: [
    'anti_inflammatory',
    'pcos_friendly',
    'diabetic_friendly',
    'heart_healthy',
  ],
  somon_cuptor_legume: ['anti_inflammatory', 'pcos_friendly', 'diabetic_friendly', 'heart_healthy'],
  dorada_cuptor_lamaie_ierburi: [
    'anti_inflammatory',
    'pcos_friendly',
    'diabetic_friendly',
    'heart_healthy',
  ],
  spaghete_creveti_usturoi: ['anti_inflammatory', 'heart_healthy'],
  creveti_saganaki_feta_rosii: ['anti_inflammatory', 'heart_healthy'],
  wrap_ton_avocado: ['anti_inflammatory', 'heart_healthy', 'pcos_friendly'],
  paste_ton_rosii: ['anti_inflammatory', 'heart_healthy'],
  toast_crema_branza_somon_afumat: ['anti_inflammatory', 'heart_healthy', 'pcos_friendly'],

  // Poultry & High Protein (PCOS & Anti-inflammatory & Diabetic)
  pui_airfryer_cartofi: ['pcos_friendly'],
  pulpe_pui_cuptor_usturoi: ['anti_inflammatory', 'pcos_friendly', 'heart_healthy'],
  curry_pui_lapte_cocos: ['anti_inflammatory', 'pcos_friendly'],
  salata_calda_pui_crutoane: ['anti_inflammatory', 'pcos_friendly', 'high_fiber'],
  orez_pui_legume_wok: ['anti_inflammatory', 'pcos_friendly'],
  ostropel_pui_piure_cartofi: ['pcos_friendly'],
  ciorba_radauteana_rapida: ['diabetic_friendly', 'pcos_friendly'],
  pui_stirfry_legume_soia: ['anti_inflammatory', 'pcos_friendly', 'diabetic_friendly'],
  pulpe_pui_airfryer_cartofi: ['pcos_friendly'],
  quesadilla_pui_cascaval: ['pcos_friendly'],

  // Plant-based, Legumes & High Fiber
  hummus_cremos_legume_crocante: [
    'anti_inflammatory',
    'high_fiber',
    'diabetic_friendly',
    'heart_healthy',
    'pcos_friendly',
  ],
  guacamole_chips_nachos: ['anti_inflammatory', 'high_fiber', 'heart_healthy'],
  salata_calda_naut_spanac: [
    'anti_inflammatory',
    'high_fiber',
    'diabetic_friendly',
    'heart_healthy',
  ],
  curry_naut_cocos_orez: ['anti_inflammatory', 'high_fiber', 'diabetic_friendly', 'heart_healthy'],
  ghiveci_legume_cuptor: ['anti_inflammatory', 'high_fiber', 'diabetic_friendly', 'heart_healthy'],
  ciorba_legume_lamaie: ['anti_inflammatory', 'high_fiber', 'diabetic_friendly', 'heart_healthy'],
  mancare_mazare_morcov_marar: ['high_fiber', 'diabetic_friendly', 'heart_healthy'],
  tocanita_fasole_boabe_boia: ['high_fiber', 'diabetic_friendly', 'heart_healthy'],
  chili_vegetal_fasole_porumb: ['high_fiber', 'heart_healthy'],
  dovlecei_pane_cuptor: ['anti_inflammatory'],
  ciuperci_umplute_cuptor: ['anti_inflammatory', 'diabetic_friendly', 'pcos_friendly'],
  chiftele_legume_airfryer: ['high_fiber', 'heart_healthy'],
  salata_greceasca_telemea: ['anti_inflammatory', 'heart_healthy'],
  supa_crema_legume_crutoane: ['anti_inflammatory', 'high_fiber', 'diabetic_friendly'],
  bruschete_rosii_usturoi_busuioc: ['anti_inflammatory', 'heart_healthy'],
  tartine_avocado_rosii_cherry: ['anti_inflammatory', 'heart_healthy'],
  dovlecei_umpluti_orez_cuptor: ['anti_inflammatory', 'high_fiber', 'heart_healthy'],

  // Breakfast & Oats & Snacks
  terci_ovaz_fructe_miere: ['high_fiber', 'heart_healthy'],
  terci_ovaz_vegan_banane: ['high_fiber', 'heart_healthy'],
  ovaz_peste_noapte_mar_nuci: ['high_fiber', 'heart_healthy', 'anti_inflammatory'],
  budinca_chia_fructe_padure: ['anti_inflammatory', 'high_fiber', 'pcos_friendly', 'heart_healthy'],
  omleta_cremoasa_spanac_branza: ['pcos_friendly', 'diabetic_friendly'],
  omleta_taraneasca_telemea: ['diabetic_friendly', 'pcos_friendly'],
  toast_ou_avocado: ['anti_inflammatory', 'pcos_friendly', 'heart_healthy'],
  mix_nuci_seminte_miere: ['high_fiber', 'heart_healthy', 'anti_inflammatory'],

  // Dedicated Health Specialty Recipes
  somon_cuptor_dovlecei_turmeric: [
    'anti_inflammatory',
    'heart_healthy',
    'diabetic_friendly',
    'pcos_friendly',
  ],
  supa_crema_conopida_turmeric_cocos: ['anti_inflammatory', 'heart_healthy', 'diabetic_friendly'],
  smoothie_bowl_ghimbir_afine: ['anti_inflammatory', 'high_fiber', 'heart_healthy'],
  salata_calda_linte_spanac_nuci: [
    'anti_inflammatory',
    'high_fiber',
    'diabetic_friendly',
    'heart_healthy',
  ],
  bowl_curcan_quinoa_avocado: [
    'pcos_friendly',
    'anti_inflammatory',
    'diabetic_friendly',
    'high_fiber',
  ],
  budinca_chia_migdale_scortisoara: [
    'pcos_friendly',
    'diabetic_friendly',
    'high_fiber',
    'anti_inflammatory',
  ],
  tocanita_linte_ciuperci_naut_pcos: [
    'pcos_friendly',
    'diabetic_friendly',
    'high_fiber',
    'heart_healthy',
  ],
  cod_cuptor_dovlecei_ierburi: [
    'pcos_friendly',
    'diabetic_friendly',
    'heart_healthy',
    'anti_inflammatory',
  ],
  tocanita_fasole_verde_rosii_usturoi: [
    'diabetic_friendly',
    'high_fiber',
    'anti_inflammatory',
    'heart_healthy',
  ],
  peste_alb_cuptor_ardei_masline: [
    'diabetic_friendly',
    'anti_inflammatory',
    'heart_healthy',
    'pcos_friendly',
  ],
  omleta_ciuperci_telemea: ['diabetic_friendly', 'pcos_friendly'],
  salata_castraveti_iaurt_grecesc_marar: ['diabetic_friendly', 'pcos_friendly', 'heart_healthy'],
  chili_vegan_fasole_rosie_marar: ['high_fiber', 'heart_healthy', 'anti_inflammatory'],
  hummus_cremos_morcovi_seminte: [
    'high_fiber',
    'anti_inflammatory',
    'heart_healthy',
    'diabetic_friendly',
  ],
  pastrav_gratar_marar_lamaie: [
    'heart_healthy',
    'anti_inflammatory',
    'diabetic_friendly',
    'pcos_friendly',
  ],
  supa_mediteraneana_fasole_alba_ulei_masline: ['heart_healthy', 'high_fiber', 'anti_inflammatory'],
};
