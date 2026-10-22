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
};
