/**
 * Every recipe photograph the app is allowed to show, and the record that someone looked at it.
 *
 * A URL proves nothing about what is in the picture: the previous registry pointed the biscuit
 * salami at a cat and the oat porridge at a stack of books, and its tests passed. An entry is
 * added here only after the photo was looked at next to the recipe it illustrates (see ADR-20
 * and `scripts/photoContactSheet.mjs`). A recipe with no entry shows the generated card.
 */

export type PhotoSource = 'unsplash' | 'wikimedia';

export interface PhotoCredit {
  author: string;
  license: string;
  /** The file's page on its source site, where the licence can be checked. */
  sourceUrl: string;
}

export interface RecipePhoto {
  url: string;
  source: PhotoSource;
  /** Required for Wikimedia Commons (CC BY / CC BY-SA); Unsplash's licence asks for none. */
  credit?: PhotoCredit;
  /** ISO date of the visual check against the recipe. */
  verifiedAt: string;
}

const UNSPLASH_PARAMS = '?w=900&auto=format&fit=crop&q=80';

/** First visual audit of the existing Unsplash photos, all 65 of them, one by one. */
const UNSPLASH_AUDIT_DATE = '2026-10-21';

/** Visual check of the photos chosen on Wikimedia Commons. */
const COMMONS_REVIEW_DATE = '2026-10-22';

function unsplash(photoId: string): RecipePhoto {
  return {
    url: `https://images.unsplash.com/${photoId}${UNSPLASH_PARAMS}`,
    source: 'unsplash',
    verifiedAt: UNSPLASH_AUDIT_DATE,
  };
}

function wikimedia(url: string, author: string, license: string, sourceUrl: string): RecipePhoto {
  return {
    url,
    source: 'wikimedia',
    credit: { author, license, sourceUrl },
    verifiedAt: COMMONS_REVIEW_DATE,
  };
}

export const RECIPE_PHOTO_MANIFEST: Readonly<Record<string, RecipePhoto>> = {
  // --- Unsplash, kept after the 2026-10-21 visual audit ---
  pui_airfryer_cartofi: unsplash('photo-1562967914-608f82629710'),
  pulpe_pui_cuptor_usturoi: unsplash('photo-1598103442097-8b74394b95c6'),
  pui_cuptor_cartofi_aurii: unsplash('photo-1598103442097-8b74394b95c6'),
  pui_usturoi_mamaliguta_rapida: unsplash('photo-1598103442097-8b74394b95c6'),
  snitele_pui_cuptor: unsplash('photo-1562967914-608f82629710'),
  snitel_crocant_pui_salata: unsplash('photo-1562967914-608f82629710'),
  burger_pui_crocant: unsplash('photo-1568901346375-23c9450c58cd'),
  frigarui_pui_legume_gratar: unsplash('photo-1555939594-58d7cb561ad1'),
  bowl_curcan_quinoa_avocado: unsplash('photo-1546069901-ba9599a7e63c'),
  curry_pui_lapte_cocos: unsplash('photo-1455619452474-d2be8b1e70cd'),
  ciorba_legume_lamaie: unsplash('photo-1547592166-23ac45744acd'),
  supa_crema_legume_crutoane: unsplash('photo-1476718406336-bb5a9690ee2a'),
  supa_crema_conopida_turmeric_cocos: unsplash('photo-1476718406336-bb5a9690ee2a'),
  supa_mediteraneana_fasole_alba_ulei_masline: unsplash('photo-1547592166-23ac45744acd'),
  chiftelute_marinate_sos: unsplash('photo-1529042410759-befb1204b468'),
  musaca_cartofi_carne_tocata: unsplash('photo-1574894709920-11b28e7367e3'),
  musaca_cartofi_ciuperci: unsplash('photo-1574894709920-11b28e7367e3'),
  curry_naut_cocos_orez: unsplash('photo-1455619452474-d2be8b1e70cd'),
  muschiulet_porc_cuptor: unsplash('photo-1544025162-d76694265947'),
  muschiulet_porc_sos_piper_verde: unsplash('photo-1544025162-d76694265947'),
  friptura_porc_mujdei_cartofi: unsplash('photo-1544025162-d76694265947'),
  antricot_vita_airfryer_ierburi: unsplash('photo-1558030006-450675393462'),
  tacos_vita_salsa_rosii: unsplash('photo-1565299585323-38d6b0865b47'),
  somon_la_tigaie_orez: unsplash('photo-1467003909585-2f8a72700288'),
  somon_cuptor_legume: unsplash('photo-1467003909585-2f8a72700288'),
  somon_cuptor_dovlecei_turmeric: unsplash('photo-1467003909585-2f8a72700288'),
  creveti_saganaki_feta_rosii: unsplash('photo-1559742811-822873691df8'),
  paste_ton_rosii: unsplash('photo-1551183053-bf91a1d81141'),
  wrap_ton_avocado: unsplash('photo-1626700051175-6818013e1d4f'),
  toast_crema_branza_somon_afumat: unsplash('photo-1525351484163-7529414344d8'),
  paste_carbonara_rapide: unsplash('photo-1612874742237-6526221588e3'),
  paste_bolognese_clasice: unsplash('photo-1546549032-9571cd6b27df'),
  spaghete_pomodoro_busuioc: unsplash('photo-1551183053-bf91a1d81141'),
  penne_arrabbiata_rapide: unsplash('photo-1551183053-bf91a1d81141'),
  paste_sos_branza_smantana: unsplash('photo-1551183053-bf91a1d81141'),
  tagliatelle_ciuperci_smantana_usturoi: unsplash('photo-1633964913295-ceb43826e7c9'),
  risotto_cremos_hribi_parmezan: unsplash('photo-1633964913295-ceb43826e7c9'),
  orez_pui_legume_wok: unsplash('photo-1512058564366-18510be2db19'),
  pilaf_pui_ciuperci: unsplash('photo-1516714435131-44d6b64dc6a2'),
  orez_cremos_hribi_patrunjel: unsplash('photo-1633964913295-ceb43826e7c9'),
  tofu_tigaie_legume_orez: unsplash('photo-1546069901-ba9599a7e63c'),
  salata_greceasca_telemea: unsplash('photo-1540420773420-3366772f4999'),
  salata_vara_rosii_telemea_ceapa: unsplash('photo-1540420773420-3366772f4999'),
  salata_calda_naut_spanac: unsplash('photo-1546069901-ba9599a7e63c'),
  salata_fasole_verde_ou: unsplash('photo-1540420773420-3366772f4999'),
  salata_ton_fasole_boabe: unsplash('photo-1540420773420-3366772f4999'),
  salata_calda_linte_spanac_nuci: unsplash('photo-1540420773420-3366772f4999'),
  salata_castraveti_iaurt_grecesc_marar: unsplash('photo-1540420773420-3366772f4999'),
  omleta_taraneasca_telemea: unsplash('photo-1510693206972-df098062cb71'),
  omleta_cremoasa_spanac_branza: unsplash('photo-1510693206972-df098062cb71'),
  omleta_ciuperci_telemea: unsplash('photo-1510693206972-df098062cb71'),
  shakshuka_oua_rosii: unsplash('photo-1590412200988-a436970781fa'),
  shakshuka_romaneasca_telemea: unsplash('photo-1590412200988-a436970781fa'),
  mic_dejun_englezesc_romanesc: unsplash('photo-1533089860892-a7c6f0a88666'),
  sandvis_cald_cascaval_sunca: unsplash('photo-1528735602780-2552fd46c7af'),
  quesadilla_pui_cascaval: unsplash('photo-1618040996337-56904b7850b9'),
  quesadilla_pui_cascaval_tigaie: unsplash('photo-1618040996337-56904b7850b9'),
  toast_ou_avocado: unsplash('photo-1525351484163-7529414344d8'),
  tartine_avocado_rosii_cherry: unsplash('photo-1525351484163-7529414344d8'),
  tartine_unt_arahide_banane: unsplash('photo-1528735602780-2552fd46c7af'),
  popcorn_aromat_parmezan_boia: unsplash('photo-1578849278619-e73505e9610f'),
  bruschete_rosii_usturoi_busuioc: unsplash('photo-1572695157366-5e585ab2b69f'),
  friganela_dulce_scortisoara: unsplash('photo-1484723091739-30a097e8f929'),
  clatite_subtiri_gem_capsuni: unsplash('photo-1519676867240-f03562e64548'),
  clatite_pufoase_americane: unsplash('photo-1567620905732-2d1ec7ab7445'),
  clatite_vegane_banane_ovaz: unsplash('photo-1519676867240-f03562e64548'),
  negresa_de_casa_glazura_ciocolata: unsplash('photo-1589218436045-ee320057f443'),
  inghetata_banane_unt_arahide: unsplash('photo-1501443762994-82bd5dace89a'),

  // --- Wikimedia Commons, chosen and checked on 2026-10-22 ---
  antricot_vita_spanac_unt_usturoi: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/New_York_Strip_with_Beurre_Maitre_d%27Hotel%2C_potatoes_and_creamed_spinach.jpg/960px-New_York_Strip_with_Beurre_Maitre_d%27Hotel%2C_potatoes_and_creamed_spinach.jpg',
    'Kimberly Vardeman from Lubbock, TX, USA',
    'CC BY 2.0',
    'https://commons.wikimedia.org/wiki/File:New_York_Strip_with_Beurre_Maitre_d%27Hotel,_potatoes_and_creamed_spinach.jpg'
  ),
  bors_moldovenesc_sfecla_legume: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/0/09/Borscht_with_cream.jpg',
    'Kelly Sue DeConnick',
    'CC BY-SA 2.0',
    'https://commons.wikimedia.org/wiki/File:Borscht_with_cream.jpg'
  ),
  budinca_chia_fructe_padure: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Chia_pudding_with_coconut_milk_and_berries_%28KETO%2C_LCHF%2C_Low_Carb%2C_Gluten_free%2C_FIT%29_-_52774529156.jpg/960px-Chia_pudding_with_coconut_milk_and_berries_%28KETO%2C_LCHF%2C_Low_Carb%2C_Gluten_free%2C_FIT%29_-_52774529156.jpg',
    'Ewelina Podrez-Siama',
    'CC BY 2.0',
    'https://commons.wikimedia.org/wiki/File:Chia_pudding_with_coconut_milk_and_berries_(KETO,_LCHF,_Low_Carb,_Gluten_free,_FIT)_-_52774529156.jpg'
  ),
  budinca_chia_migdale_scortisoara: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Chia_Seed_Pudding_in_a_cup.jpg/960px-Chia_Seed_Pudding_in_a_cup.jpg',
    'Gogerr',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Chia_Seed_Pudding_in_a_cup.jpg'
  ),
  budinca_orez_cocos_scortisoara: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Homemade_dessert.jpg/960px-Homemade_dessert.jpg',
    'E4024',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Homemade_dessert.jpg'
  ),
  bulz_ciobanesc_cuptor: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Bulz_cu_ou.jpg/960px-Bulz_cu_ou.jpg',
    'Nicubunu',
    'CC BY-SA 3.0',
    'https://commons.wikimedia.org/wiki/File:Bulz_cu_ou.jpg'
  ),
  cartofi_cuptor_usturoi_boia: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/2/2a/Roasted_potatoes_in_bowl.jpg',
    'Punker1999',
    'CC0',
    'https://commons.wikimedia.org/wiki/File:Roasted_potatoes_in_bowl.jpg'
  ),
  cartofi_la_cuptor_telemea: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Potato_gratin_on_stove.jpg/960px-Potato_gratin_on_stove.jpg',
    'Dreamyshade',
    'CC BY-SA 3.0',
    'https://commons.wikimedia.org/wiki/File:Potato_gratin_on_stove.jpg'
  ),
  cartofi_taranesti_ardei: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Roasted_potatoes_chicken.jpg/960px-Roasted_potatoes_chicken.jpg',
    'P1898',
    'CC BY 4.0',
    'https://commons.wikimedia.org/wiki/File:Roasted_potatoes_chicken.jpg'
  ),
  chiftele_legume_airfryer: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Zucchini_%26_feta_fritters_%287804257920%29.jpg/960px-Zucchini_%26_feta_fritters_%287804257920%29.jpg',
    'Nicole Bratt from Seattle, WA, USA',
    'CC BY-SA 2.0',
    'https://commons.wikimedia.org/wiki/File:Zucchini_%26_feta_fritters_(7804257920).jpg'
  ),
  chili_con_carne_rapid: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Chili_con_carne_cuisson.jpg/960px-Chili_con_carne_cuisson.jpg',
    'Aerith',
    'CC0',
    'https://commons.wikimedia.org/wiki/File:Chili_con_carne_cuisson.jpg'
  ),
  chili_vegan_fasole_rosie_marar: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Chilli_sine_carne_Zur_Tanne_Harsdorf.jpg/960px-Chilli_sine_carne_Zur_Tanne_Harsdorf.jpg',
    'Benreis',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Chilli_sine_carne_Zur_Tanne_Harsdorf.jpg'
  ),
  chili_vegetal_fasole_porumb: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Chilli_sine_carne_Zur_Tanne_Harsdorf.jpg/960px-Chilli_sine_carne_Zur_Tanne_Harsdorf.jpg',
    'Benreis',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Chilli_sine_carne_Zur_Tanne_Harsdorf.jpg'
  ),
  chipsuri_cartofi_airfryer: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Homemade_Potato_Chips_%2811115638044%29.jpg/960px-Homemade_Potato_Chips_%2811115638044%29.jpg',
    'Ann from USA',
    'CC BY 2.0',
    'https://commons.wikimedia.org/wiki/File:Homemade_Potato_Chips_(11115638044).jpg'
  ),
  ciorba_fasole_afumatura_ceapa: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/3/35/Fasole_cu_ciolan.jpg',
    'Red Zenith',
    'CC BY-SA 3.0',
    'https://commons.wikimedia.org/wiki/File:Fasole_cu_ciolan.jpg'
  ),
  ciorba_perisoare_acrita_bors: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Ciorb%C4%83_cu_peri%C8%99oare.jpg/960px-Ciorb%C4%83_cu_peri%C8%99oare.jpg',
    'Sacha47',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Ciorb%C4%83_cu_peri%C8%99oare.jpg'
  ),
  ciorba_radauteana_rapida: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Ciorba_radauteana.jpg/960px-Ciorba_radauteana.jpg',
    'Romaniancook',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Ciorba_radauteana.jpg'
  ),
  ciorba_taraneasca_ciuperci_smantana: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/20260915_Vasilki_Minsk_mushroom_soup.jpg/960px-20260915_Vasilki_Minsk_mushroom_soup.jpg',
    'Sergey A. Demidov',
    'CC BY 4.0',
    'https://commons.wikimedia.org/wiki/File:20260915_Vasilki_Minsk_mushroom_soup.jpg'
  ),
  ciuperci_umplute_cuptor: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Baby_bella_mushrooms%2C_baked_with_cheeses%2C_garlic%2C_and_olive_oil_-_Massachusetts.jpg/960px-Baby_bella_mushrooms%2C_baked_with_cheeses%2C_garlic%2C_and_olive_oil_-_Massachusetts.jpg',
    'Daderot',
    'CC0',
    'https://commons.wikimedia.org/wiki/File:Baby_bella_mushrooms,_baked_with_cheeses,_garlic,_and_olive_oil_-_Massachusetts.jpg'
  ),
  cod_cuptor_dovlecei_ierburi: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Cuisine_of_Spain-Bacalo_al_horno_001.JPG/960px-Cuisine_of_Spain-Bacalo_al_horno_001.JPG',
    'Valdavia',
    'CC BY-SA 3.0',
    'https://commons.wikimedia.org/wiki/File:Cuisine_of_Spain-Bacalo_al_horno_001.JPG'
  ),
  crema_cacao_avocado_banane: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Avocado_chocolate_mousse_%2848839488586%29.jpg/960px-Avocado_chocolate_mousse_%2848839488586%29.jpg',
    'Ella Olsson from Stockholm, Sweden',
    'CC BY 2.0',
    'https://commons.wikimedia.org/wiki/File:Avocado_chocolate_mousse_(48839488586).jpg'
  ),
  crema_cocos_cacao_banane: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Chocolate_pudding_with_a_butterfly.jpg/960px-Chocolate_pudding_with_a_butterfly.jpg',
    'E4024',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Chocolate_pudding_with_a_butterfly.jpg'
  ),
  curcan_ciuperci_smantana_tigaie: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Turkey_escalopes_%2876652605%29.jpg/960px-Turkey_escalopes_%2876652605%29.jpg',
    'Andy / Andrew Fogg from near Cambridge, UK',
    'CC BY 2.0',
    'https://commons.wikimedia.org/wiki/File:Turkey_escalopes_(76652605).jpg'
  ),
  dorada_cuptor_lamaie_ierburi: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Dorade_royale_grill%C3%A9e.jpg/960px-Dorade_royale_grill%C3%A9e.jpg',
    'Arnaud 25',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Dorade_royale_grill%C3%A9e.jpg'
  ),
  dovlecei_pane_cuptor: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Baked_Zucchini_Fries_%2836335607325%29.jpg/960px-Baked_Zucchini_Fries_%2836335607325%29.jpg',
    'A Healthier Michigan from Detroit, United States',
    'CC BY-SA 2.0',
    'https://commons.wikimedia.org/wiki/File:Baked_Zucchini_Fries_(36335607325).jpg'
  ),
  dovlecei_umpluti_orez_cuptor: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Kousa_Mahshi.jpg/960px-Kousa_Mahshi.jpg',
    'Bazel',
    'Public domain',
    'https://commons.wikimedia.org/wiki/File:Kousa_Mahshi.jpg'
  ),
  ficatei_pui_ceapa_tigaie: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/H%C3%A4hnchen-Leber_Fr%C3%B6schbrunna_Kronach.jpg/960px-H%C3%A4hnchen-Leber_Fr%C3%B6schbrunna_Kronach.jpg',
    'Benreis',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:H%C3%A4hnchen-Leber_Fr%C3%B6schbrunna_Kronach.jpg'
  ),
  ghiveci_legume_cuptor: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Ratatouille.jpg/960px-Ratatouille.jpg',
    'Marcus Guimarães',
    'CC BY 2.0',
    'https://commons.wikimedia.org/wiki/File:Ratatouille.jpg'
  ),
  ghiveci_orez_legume_tigaie: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Vegetable_rice_image.jpg/960px-Vegetable_rice_image.jpg',
    'safaritravelplus',
    'CC0',
    'https://commons.wikimedia.org/wiki/File:Vegetable_rice_image.jpg'
  ),
  guacamole_chips_nachos: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Guacamole_with_Homemade_Tortilla_Chips.jpg/960px-Guacamole_with_Homemade_Tortilla_Chips.jpg',
    'Robert Loescher',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Guacamole_with_Homemade_Tortilla_Chips.jpg'
  ),
  hummus_cremos_legume_crocante: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Vegetables_and_Hummus_%287271118362%29.jpg/960px-Vegetables_and_Hummus_%287271118362%29.jpg',
    'Jennifer from Vancouver, Canada',
    'CC BY 2.0',
    'https://commons.wikimedia.org/wiki/File:Vegetables_and_Hummus_(7271118362).jpg'
  ),
  hummus_cremos_morcovi_seminte: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Hummus_and_carrot_%283841125815%29.jpg/960px-Hummus_and_carrot_%283841125815%29.jpg',
    'Vegan Feast Catering',
    'CC BY 2.0',
    'https://commons.wikimedia.org/wiki/File:Hummus_and_carrot_(3841125815).jpg'
  ),
  iaurt_grecesc_nuci_chia_scortisoara: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Breakfast_-_Greek_Yogurt_with_chia_seeds%2C_sunflower_seeds%2C_almond_flakes_and_walnuts_-_Holiday_Inn_-_Bloomsbury_-_London_2026-06-05.jpg/960px-Breakfast_-_Greek_Yogurt_with_chia_seeds%2C_sunflower_seeds%2C_almond_flakes_and_walnuts_-_Holiday_Inn_-_Bloomsbury_-_London_2026-06-05.jpg',
    'Haydn Blackey',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Breakfast_-_Greek_Yogurt_with_chia_seeds,_sunflower_seeds,_almond_flakes_and_walnuts_-_Holiday_Inn_-_Bloomsbury_-_London_2026-06-05.jpg'
  ),
  iaurt_grecesc_nuci_miere: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Kos_me_mjalt%C3%AB_dhe_arra.jpg/960px-Kos_me_mjalt%C3%AB_dhe_arra.jpg',
    'MirelaAndoni',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Kos_me_mjalt%C3%AB_dhe_arra.jpg'
  ),
  lava_cake_ciocolata_airfryer: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Coulant_with_chocolate.JPG/960px-Coulant_with_chocolate.JPG',
    'Kippelboy',
    'CC BY-SA 3.0',
    'https://commons.wikimedia.org/wiki/File:Coulant_with_chocolate.JPG'
  ),
  mamaliga_branza_smantana: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/%D0%9A%D0%B0%D1%87%D0%B0%D0%BC%D0%B0%D0%BA_%D1%81%D0%BE_%D0%BE%D0%B2%D1%87%D0%BE_%D1%81%D0%B8%D1%80%D0%B5%D1%9A%D0%B5.jpg/960px-%D0%9A%D0%B0%D1%87%D0%B0%D0%BC%D0%B0%D0%BA_%D1%81%D0%BE_%D0%BE%D0%B2%D1%87%D0%BE_%D1%81%D0%B8%D1%80%D0%B5%D1%9A%D0%B5.jpg',
    'Merima Sara Ebip',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:%D0%9A%D0%B0%D1%87%D0%B0%D0%BC%D0%B0%D0%BA_%D1%81%D0%BE_%D0%BE%D0%B2%D1%87%D0%BE_%D1%81%D0%B8%D1%80%D0%B5%D1%9A%D0%B5.jpg'
  ),
  mamaliguta_ciuperci_marar: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Polenta_con_i_funghi_%2849653224713%29.jpg/960px-Polenta_con_i_funghi_%2849653224713%29.jpg',
    'やましこ',
    'CC BY-SA 2.0',
    'https://commons.wikimedia.org/wiki/File:Polenta_con_i_funghi_(49653224713).jpg'
  ),
  mancare_linte_verde_vegan: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Bowl_of_lentil_soup_with_green_and_red_lentils.jpg/960px-Bowl_of_lentil_soup_with_green_and_red_lentils.jpg',
    'Whoisjohngalt',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Bowl_of_lentil_soup_with_green_and_red_lentils.jpg'
  ),
  mancare_mazare_morcov_marar: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Bezelye_yeme%C4%9Fi.jpg/960px-Bezelye_yeme%C4%9Fi.jpg',
    'E4024',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Bezelye_yeme%C4%9Fi.jpg'
  ),
  mancare_mazare_pui: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Liat_Portal_for_Foodie_Disorder_-_Majadra_Style_Peas_with_Carrots_and_Chicken.jpg/960px-Liat_Portal_for_Foodie_Disorder_-_Majadra_Style_Peas_with_Carrots_and_Chicken.jpg',
    'HaJunkiyada',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Liat_Portal_for_Foodie_Disorder_-_Majadra_Style_Peas_with_Carrots_and_Chicken.jpg'
  ),
  mere_coapte_nuca_miere: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Bratapfel_1.jpg/960px-Bratapfel_1.jpg',
    'Geolina163',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Bratapfel_1.jpg'
  ),
  mere_coapte_nuci_scortisoara: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Bratapfel300.jpg/960px-Bratapfel300.jpg',
    'Manfred Heyde',
    'CC BY-SA 3.0',
    'https://commons.wikimedia.org/wiki/File:Bratapfel300.jpg'
  ),
  mousse_ciocolata_cocos: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Chocolate_mousse_-_stonesoup.jpg/960px-Chocolate_mousse_-_stonesoup.jpg',
    'jules / stonesoup',
    'CC BY 2.0',
    'https://commons.wikimedia.org/wiki/File:Chocolate_mousse_-_stonesoup.jpg'
  ),
  naut_spanac_rosii_vegan: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Nohutlu_Ispanak.JPG/960px-Nohutlu_Ispanak.JPG',
    'Miansari66',
    'CC0',
    'https://commons.wikimedia.org/wiki/File:Nohutlu_Ispanak.JPG'
  ),
  ochiuri_mamaliga_telemea: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Bulz_cu_ou.jpg/960px-Bulz_cu_ou.jpg',
    'Nicubunu',
    'CC BY-SA 3.0',
    'https://commons.wikimedia.org/wiki/File:Bulz_cu_ou.jpg'
  ),
  omleta_somon_afumat_spanac: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Buckeye_Roadhouse_-_Feb_2019_-_Sarah_Stierch_04.jpg/960px-Buckeye_Roadhouse_-_Feb_2019_-_Sarah_Stierch_04.jpg',
    'Missvain',
    'CC BY 4.0',
    'https://commons.wikimedia.org/wiki/File:Buckeye_Roadhouse_-_Feb_2019_-_Sarah_Stierch_04.jpg'
  ),
  orez_cu_lapte_scortisoara: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Risgrynsgr%C3%B6t.jpg/960px-Risgrynsgr%C3%B6t.jpg',
    'Caesar',
    'CC BY-SA 3.0',
    'https://commons.wikimedia.org/wiki/File:Risgrynsgr%C3%B6t.jpg'
  ),
  orez_lapte_cocos_legume: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Rice_with_peas_%287326913484%29.jpg/960px-Rice_with_peas_%287326913484%29.jpg',
    'pelican from Tokyo, Japan',
    'CC BY-SA 2.0',
    'https://commons.wikimedia.org/wiki/File:Rice_with_peas_(7326913484).jpg'
  ),
  orez_lapte_dulceata_visine: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Risalamande%2C_a_Danish_Christmas_dessert.jpg/960px-Risalamande%2C_a_Danish_Christmas_dessert.jpg',
    'Lorie Shaull',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Risalamande,_a_Danish_Christmas_dessert.jpg'
  ),
  orez_sarbesc_legume: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Djuvecreis.jpg/960px-Djuvecreis.jpg',
    'No machine-readable author provided. Rainer Zenz assumed (based on copyright claims).',
    'CC BY-SA 3.0',
    'https://commons.wikimedia.org/wiki/File:Djuvecreis.jpg'
  ),
  ostropel_pui_piure_cartofi: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Ostrpel.png/960px-Ostrpel.png',
    'Sacha47',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Ostrpel.png'
  ),
  papanasi_prajiti_smantana_dulceata: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Papana%C8%99i.jpg/960px-Papana%C8%99i.jpg',
    'Josep Renalias Lohen11',
    'CC BY 4.0',
    'https://commons.wikimedia.org/wiki/File:Papana%C8%99i.jpg'
  ),
  paste_cremoase_spanac: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Creamy_spinach_pasta_%284463852122%29.jpg/960px-Creamy_spinach_pasta_%284463852122%29.jpg',
    'Karen and Brad Emerson',
    'CC BY 2.0',
    'https://commons.wikimedia.org/wiki/File:Creamy_spinach_pasta_(4463852122).jpg'
  ),
  pastrav_cuptor_lamaie_marar: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Baked_trout.jpg/960px-Baked_trout.jpg',
    'Petar Milošević',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Baked_trout.jpg'
  ),
  pastrav_gratar_marar_lamaie: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Trout%2C_Kelkheim.jpg/960px-Trout%2C_Kelkheim.jpg',
    'Gerda Arendt',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Trout,_Kelkheim.jpg'
  ),
  piure_fructe_padure_chia: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Lima_Region_chia_pudding_%28Unsplash%29.jpg/960px-Lima_Region_chia_pudding_%28Unsplash%29.jpg',
    'Sebastián LP elmundoderabbitlp',
    'CC0',
    'https://commons.wikimedia.org/wiki/File:Lima_Region_chia_pudding_(Unsplash).jpg'
  ),
  pui_kiev_airfryer: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/0/08/Chicken_Kiev_-_Ukrainian_East_Village_restaurant.jpg',
    'Jason Lam',
    'CC BY-SA 2.0',
    'https://commons.wikimedia.org/wiki/File:Chicken_Kiev_-_Ukrainian_East_Village_restaurant.jpg'
  ),
  pui_stirfry_legume_soia: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Healthy_Chicken_and_Vegetables_Stir_Fry.jpg/960px-Healthy_Chicken_and_Vegetables_Stir_Fry.jpg',
    'FitTasteTic',
    'CC BY-SA 2.0',
    'https://commons.wikimedia.org/wiki/File:Healthy_Chicken_and_Vegetables_Stir_Fry.jpg'
  ),
  pulpe_pui_airfryer_cartofi: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Chicken_leg_quarter_20260412_145303.jpg/960px-Chicken_leg_quarter_20260412_145303.jpg',
    'Vauia Rex',
    'CC0',
    'https://commons.wikimedia.org/wiki/File:Chicken_leg_quarter_20260412_145303.jpg'
  ),
  pulpe_pui_cuptor_dovlecei_ardei: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/%22Kagawa_style%22_bone-in_roasted_chicken_thigh%2C_steamed_cabbage%2C_red_bell_pepper%2C_and_snow_peas_with_brown_rice_and_wakame_seaweed_soup_%E9%A6%99%E5%B7%9D%E9%AA%A8%E4%BB%98%E3%81%8D%E9%B6%8F%E3%81%AB%E8%92%B8%E3%81%97%E3%82%AD%E3%83%A3%E3%83%99%E3%83%84%E3%80%81%E3%83%91%E3%83%97%E3%83%AA%E3%82%AB%E3%80%81%E3%82%B5%E3%83%A4%E3%82%A8%E3%83%B3%E3%83%89%E3%82%A6%E3%80%81%E7%8E%84%E7%B1%B3%E3%83%AF%E3%82%AB%E3%83%A1%E3%82%B9%E3%83%BC%E3%83%97.jpg/960px-thumbnail.jpg',
    'naotakem',
    'CC BY 2.0',
    'https://commons.wikimedia.org/wiki/File:%22Kagawa_style%22_bone-in_roasted_chicken_thigh,_steamed_cabbage,_red_bell_pepper,_and_snow_peas_with_brown_rice_and_wakame_seaweed_soup_%E9%A6%99%E5%B7%9D%E9%AA%A8%E4%BB%98%E3%81%8D%E9%B6%8F%E3%81%AB%E8%92%B8%E3%81%97%E3%82%AD%E3%83%A3%E3%83%99%E3%83%84%E3%80%81%E3%83%91%E3%83%97%E3%83%AA%E3%82%AB%E3%80%81%E3%82%B5%E3%83%A4%E3%82%A8%E3%83%B3%E3%83%89%E3%82%A6%E3%80%81%E7%8E%84%E7%B1%B3%E3%83%AF%E3%82%AB%E3%83%A1%E3%82%B9%E3%83%BC%E3%83%97.jpg'
  ),
  salam_de_biscuiti_clasic: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/7/78/Salame_de_chocolate_-_Chocolat_Salami.jpg',
    'jppaguilar',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Salame_de_chocolate_-_Chocolat_Salami.jpg'
  ),
  salata_caesar_pui_parmezan: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Chicken_Caesar_Salad_at_French_Market_Restaurant.jpg/960px-Chicken_Caesar_Salad_at_French_Market_Restaurant.jpg',
    'pattyonflickr',
    'CC BY 2.0',
    'https://commons.wikimedia.org/wiki/File:Chicken_Caesar_Salad_at_French_Market_Restaurant.jpg'
  ),
  salata_calda_pui_crutoane: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/%D0%A6%D0%B5%D0%B7%D0%B0%D1%80_%D1%81%D0%B0%D0%BB%D0%B0%D1%82%D0%B0_02.jpg/960px-%D0%A6%D0%B5%D0%B7%D0%B0%D1%80_%D1%81%D0%B0%D0%BB%D0%B0%D1%82%D0%B0_02.jpg',
    'BlueEagle1',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:%D0%A6%D0%B5%D0%B7%D0%B0%D1%80_%D1%81%D0%B0%D0%BB%D0%B0%D1%82%D0%B0_02.jpg'
  ),
  smoothie_bowl_ghimbir_afine: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Smoothie_bowl_-_blueberry.jpg/960px-Smoothie_bowl_-_blueberry.jpg',
    'Sesily Kraight',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Smoothie_bowl_-_blueberry.jpg'
  ),
  spaghete_creveti_usturoi: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/DFC_4054_Garlic_chili_spaghetti_tossed_with_shrimp_fresh_parsley_and_vibrant_veggies_-_a_simple_savory_seafood_pasta_delight.jpg/960px-DFC_4054_Garlic_chili_spaghetti_tossed_with_shrimp_fresh_parsley_and_vibrant_veggies_-_a_simple_savory_seafood_pasta_delight.jpg',
    'PattayaPatrol',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:DFC_4054_Garlic_chili_spaghetti_tossed_with_shrimp_fresh_parsley_and_vibrant_veggies_-_a_simple_savory_seafood_pasta_delight.jpg'
  ),
  terci_ovaz_fructe_miere: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/1/18/Oatmeal_with_Berries.jpg',
    'Clarissa Savel',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Oatmeal_with_Berries.jpg'
  ),
  terci_ovaz_vegan_banane: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Porrrrrrage.jpg/960px-Porrrrrrage.jpg',
    'Comotoze',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Porrrrrrage.jpg'
  ),
  tocanita_cartofi_carnaciori: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Svensk_p%C3%B8lseret.jpg/960px-Svensk_p%C3%B8lseret.jpg',
    'Nillerdk',
    'CC BY 3.0',
    'https://commons.wikimedia.org/wiki/File:Svensk_p%C3%B8lseret.jpg'
  ),
  tocanita_ciuperci_mamaliga: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Polenta_fritta_con_sugo_di_funghi_%2849653224258%29.jpg/960px-Polenta_fritta_con_sugo_di_funghi_%2849653224258%29.jpg',
    'やましこ',
    'CC BY-SA 2.0',
    'https://commons.wikimedia.org/wiki/File:Polenta_fritta_con_sugo_di_funghi_(49653224258).jpg'
  ),
  tocanita_fasole_boabe_boia: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Kuru_fasulye_%28etsiz%29.jpg/960px-Kuru_fasulye_%28etsiz%29.jpg',
    'E4024',
    'CC BY-SA 4.0',
    'https://commons.wikimedia.org/wiki/File:Kuru_fasulye_(etsiz).jpg'
  ),
  tocanita_fasole_verde_rosii_usturoi: wikimedia(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/FasolakiaPrasinaLadera.jpg/960px-FasolakiaPrasinaLadera.jpg',
    'Robert Kindermann aka RobertK',
    'CC BY-SA 2.5',
    'https://commons.wikimedia.org/wiki/File:FasolakiaPrasinaLadera.jpg'
  ),
};
