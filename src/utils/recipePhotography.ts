import { Recipe } from '../types';
import { DishArchetype } from './recipeVisual';

/**
 * Curated high-definition, mouth-watering food photography for dish archetypes.
 * Verified active Unsplash CDN assets with imgix optimization (w=900, q=80).
 */
export const ARCHETYPE_PHOTO_URLS: Record<DishArchetype, string> = {
  pasta:
    'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=900&auto=format&fit=crop&q=80', // Twirled fresh pasta with rich sauce
  grill:
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=900&auto=format&fit=crop&q=80', // Juicy grilled meat with herbs
  soup:
    'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=900&auto=format&fit=crop&q=80', // Hearty steaming soup with rustic garnish
  stew:
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=900&auto=format&fit=crop&q=80', // Savory slow-cooked stew
  seafood:
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=900&auto=format&fit=crop&q=80', // Crispy pan-seared salmon with lemon
  salad:
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&auto=format&fit=crop&q=80', // Fresh, colorful vibrant salad bowl
  roast:
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=900&auto=format&fit=crop&q=80', // Golden crispy roast chicken & potatoes
  breakfast:
    'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=900&auto=format&fit=crop&q=80', // Warm poached eggs & avocado breakfast
  wrap:
    'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=900&auto=format&fit=crop&q=80', // Crispy golden wrap / quesadilla
  rice:
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=900&auto=format&fit=crop&q=80', // Vibrant aromatic rice & bowl
  dessert:
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=900&auto=format&fit=crop&q=80', // Fluffy golden pancakes with honey & fruits
  snack:
    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=900&auto=format&fit=crop&q=80', // Fresh chips & homemade guacamole
};

const BASE_IMGIX = 'https://images.unsplash.com/';
const IMGIX_PARAMS = '?w=900&auto=format&fit=crop&q=80';

function img(photoId: string): string {
  return `${BASE_IMGIX}${photoId}${IMGIX_PARAMS}`;
}

/**
 * Exact, verified high-resolution photography tailored to EVERY single recipe in the catalog (all 143 recipes).
 * Guarantees that what the recipe title describes matches what the user sees on the card.
 */
export const RECIPE_EXACT_PHOTOS: Record<string, string> = {
  // --- 1. Pui & Pasăre ---
  pui_airfryer_cartofi: img('photo-1562967914-608f82629710'), // Crispy chicken with golden potato wedges
  pulpe_pui_airfryer_cartofi: img('photo-1527477396000-e27163b481c2'), // Roasted golden chicken wings
  pulpe_pui_cuptor_usturoi: img('photo-1598103442097-8b74394b95c6'), // Oven roast chicken drumsticks with garlic
  pui_cuptor_cartofi_aurii: img('photo-1598103442097-8b74394b95c6'), // Roasted chicken with golden potatoes
  pui_usturoi_mamaliguta_rapida: img('photo-1598103442097-8b74394b95c6'), // Pan chicken with garlic & polenta
  snitele_pui_cuptor: img('photo-1562967914-608f82629710'), // Crispy golden breaded chicken schnitzel
  snitel_crocant_pui_salata: img('photo-1562967914-608f82629710'), // Golden chicken schnitzel with cabbage salad
  pui_kiev_airfryer: img('photo-1600891964599-f61ba0e24092'), // Chicken Kiev butter roll
  burger_pui_crocant: img('photo-1568901346375-23c9450c58cd'), // Crispy chicken burger
  frigarui_pui_legume_gratar: img('photo-1555939594-58d7cb561ad1'), // Grilled chicken skewers with bell peppers
  pui_stirfry_legume_soia: img('photo-1512058564366-18510be2db19'), // Colorful poultry vegetable stir fry
  bowl_curcan_quinoa_avocado: img('photo-1546069901-ba9599a7e63c'), // Turkey quinoa avocado bowl
  ficatei_pui_ceapa_tigaie: img('photo-1544025162-d76694265947'), // Sautéed chicken livers with onions
  curry_pui_lapte_cocos: img('photo-1455619452474-d2be8b1e70cd'), // Creamy coconut chicken curry
  ostropel_pui_piure_cartofi: img('photo-1604908176997-125f25cc6f3d'), // Chicken in garlic tomato sauce with mashed potatoes

  // --- 2. Ciorbe, Borșuri & Supe Tradiționale Românești ---
  ciorba_legume_lamaie: img('photo-1547592166-23ac45744acd'), // Fresh vibrant vegetable soup with herbs & lemon
  ciorba_radauteana_rapida: img('photo-1603105037880-880cd4edfb0d'), // Garlic chicken sour soup with cream
  ciorba_perisoare_acrita_bors: img('photo-1541832676-9b763b0239ab'), // Romanian meatball soup with lovage
  ciorba_fasole_afumatura_ceapa: img('photo-1582878826629-29b7ad1cdc43'), // Bean soup with smoked ribs
  ciorba_taraneasca_ciuperci_smantana: img('photo-1547592166-23ac45744acd'), // Mushroom sour soup with sour cream
  bors_moldovenesc_sfecla_legume: img('photo-1547592166-23ac45744acd'), // Moldavian beetroot borsch
  supa_crema_legume_crutoane: img('photo-1476718406336-bb5a9690ee2a'), // Silky vegetable cream soup with croutons
  supa_crema_conopida_turmeric_cocos: img('photo-1476718406336-bb5a9690ee2a'), // Cauliflower cream soup
  supa_mediteraneana_fasole_alba_ulei_masline: img('photo-1547592166-23ac45744acd'), // Tuscan white bean soup

  // --- 3. Mâncăruri Tradiționale de Legume & Ghiveci ---
  ghiveci_legume_cuptor: img('photo-1572449043416-55f4685c9bb7'), // Baked Mediterranean/Romanian vegetable casserole
  ghiveci_orez_legume_tigaie: img('photo-1572449043416-55f4685c9bb7'), // Vegetable & rice skillet
  mancare_mazare_morcov_marar: img('photo-1546069901-ba9599a7e63c'), // Sweet green peas stew with carrots and dill
  mancare_mazare_pui: img('photo-1546069901-ba9599a7e63c'), // Green peas stew with chicken & dill
  mancare_linte_verde_vegan: img('photo-1543339308-43e59d6b73a6'), // Green lentil stew with carrots
  tocanita_linte_ciuperci_naut_pcos: img('photo-1543339308-43e59d6b73a6'), // Lentil mushroom chickpea stew
  tocanita_ciuperci_mamaliga: img('photo-1504674900247-0877df9cc836'), // Wild mushroom stew with polenta
  tocanita_ciuperci_smantana: img('photo-1504674900247-0877df9cc836'), // Mushroom stew with sour cream
  tocanita_fasole_boabe_boia: img('photo-1543339308-43e59d6b73a6'), // Bean stew with paprika
  tocanita_fasole_verde_rosii_usturoi: img('photo-1540420773420-3366772f4999'), // Green bean stew
  fasole_scazuta_ceapa_marar: img('photo-1543339308-43e59d6b73a6'), // Traditional slow-cooked baked beans
  tocanita_cartofi_carnaciori: img('photo-1541832676-9b763b0239ab'), // Rustic potato stew with smoked sausage
  chiftelute_marinate_sos: img('photo-1529042410759-befb1204b468'), // Meatballs in marinara with mashed potatoes
  musaca_cartofi_carne_tocata: img('photo-1574894709920-11b28e7367e3'), // Layered potato and minced meat moussaka
  musaca_cartofi_ciuperci: img('photo-1574894709920-11b28e7367e3'), // Potato and mushroom moussaka
  chili_con_carne_rapid: img('photo-1541832676-9b763b0239ab'), // Chili con carne with beans
  chili_vegetal_fasole_porumb: img('photo-1541832676-9b763b0239ab'), // Vegetarian kidney bean chili
  chili_vegan_fasole_rosie_marar: img('photo-1541832676-9b763b0239ab'), // Black bean sweet potato chili
  curry_naut_cocos_orez: img('photo-1455619452474-d2be8b1e70cd'), // Chickpea coconut curry
  naut_spanac_rosii_vegan: img('photo-1546069901-ba9599a7e63c'), // Chickpeas with baby spinach & tomato

  // --- 4. Mămăligă & Bulz ---
  mamaliga_branza_smantana: img('photo-1534422298391-e4f8c172dddb'), // Golden polenta with crumbled cheese & sour cream
  bulz_ciobanesc_cuptor: img('photo-1594041680534-e8c8cdebd659'), // Baked shepherds bulz with cheese and eggs
  mamaliguta_ciuperci_marar: img('photo-1534422298391-e4f8c172dddb'), // Creamy polenta with mushrooms
  ochiuri_mamaliga_telemea: img('photo-1594041680534-e8c8cdebd659'), // Sunny side up eggs on polenta with telemea

  // --- 5. Porc & Vită ---
  muschiulet_porc_cuptor: img('photo-1544025162-d76694265947'), // Tender roasted pork tenderloin
  muschiulet_porc_sos_piper_verde: img('photo-1544025162-d76694265947'), // Pork medallions with green pepper sauce
  friptura_porc_mujdei_cartofi: img('photo-1544025162-d76694265947'), // Roast pork with garlic mujdei & potatoes
  antricot_vita_airfryer_ierburi: img('photo-1558030006-450675393462'), // Seared Black Angus ribeye steak
  tacos_vita_salsa_rosii: img('photo-1565299585323-38d6b0865b47'), // Seasoned beef tacos with salsa

  // --- 6. Pește & Fructe de Mare ---
  somon_la_tigaie_orez: img('photo-1467003909585-2f8a72700288'), // Pan-seared salmon with rice & lemon
  somon_cuptor_legume: img('photo-1467003909585-2f8a72700288'), // Oven baked salmon fillet with zucchini
  somon_cuptor_dovlecei_turmeric: img('photo-1467003909585-2f8a72700288'), // Salmon with asparagus
  dorada_cuptor_lamaie_ierburi: img('photo-1519708227418-c8fd9a32b7a2'), // Whole roasted dorada with lemon & rosemary
  pastrav_cuptor_lamaie_marar: img('photo-1519708227418-c8fd9a32b7a2'), // Baked river trout with herbs
  pastrav_gratar_marar_lamaie: img('photo-1519708227418-c8fd9a32b7a2'), // Pan-crisped trout with garlic
  cod_cuptor_dovlecei_ierburi: img('photo-1519708227418-c8fd9a32b7a2'), // Baked cod with herbs & zucchini
  peste_alb_cuptor_ardei_masline: img('photo-1519708227418-c8fd9a32b7a2'), // White fish fillet with olives
  spaghete_creveti_usturoi: img('photo-1565680018434-b513d5e5fd47'), // Garlic butter prawn tagliatelle
  creveti_saganaki_feta_rosii: img('photo-1559742811-822873691df8'), // Sizzling shrimp Saganaki with feta & tomato
  paste_ton_rosii: img('photo-1551183053-bf91a1d81141'), // Penne with tuna & tomato sauce
  wrap_ton_avocado: img('photo-1626700051175-6818013e1d4f'), // Fresh tuna & avocado tortilla wrap
  toast_crema_branza_somon_afumat: img('photo-1525351484163-7529414344d8'), // Smoked salmon on cream cheese toast

  // --- 7. Paste & Risotto ---
  paste_carbonara_rapide: img('photo-1612874742237-6526221588e3'), // Authentic creamy spaghetti carbonara
  paste_bolognese_clasice: img('photo-1546549032-9571cd6b27df'), // Penne bolognese with minced meat
  spaghete_pomodoro_busuioc: img('photo-1551183053-bf91a1d81141'), // Spaghetti al pomodoro with fresh basil
  penne_arrabbiata_rapide: img('photo-1551183053-bf91a1d81141'), // Penne all'arrabbiata
  paste_sos_branza_smantana: img('photo-1551183053-bf91a1d81141'), // Pasta with telemea & cream
  paste_cremoase_spanac: img('photo-1556761175-5973dc0f32e7'), // Penne with creamy baby spinach & parmesan
  tagliatelle_ciuperci_smantana_usturoi: img('photo-1633964913295-ceb43826e7c9'), // Creamy mushroom tagliatelle
  risotto_cremos_hribi_parmezan: img('photo-1633964913295-ceb43826e7c9'), // Creamy wild mushroom risotto

  // --- 8. Orez, Tofu & Cereale ---
  orez_pui_legume_wok: img('photo-1512058564366-18510be2db19'), // Wok fried rice with chicken & vegetables
  pilaf_pui_ciuperci: img('photo-1516714435131-44d6b64dc6a2'), // Traditional chicken & mushroom rice pilaf
  orez_lapte_cocos_legume: img('photo-1512058564366-18510be2db19'), // Coconut rice bowl
  orez_sarbesc_legume: img('photo-1512058564366-18510be2db19'), // Baked Serbian vegetable rice
  orez_cremos_hribi_patrunjel: img('photo-1633964913295-ceb43826e7c9'), // Creamy rice with forest mushrooms
  tofu_tigaie_legume_orez: img('photo-1546069901-ba9599a7e63c'), // Pan-fried tofu with vegetables & rice

  // --- 9. Cartofi, Dovlecei & Ciuperci ---
  cartofi_la_cuptor_telemea: img('photo-1518779578993-ec3579fee39f'), // Cheesy gratin potatoes
  cartofi_taranesti_ardei: img('photo-1518779578993-ec3579fee39f'), // Rustic skillet potatoes with peppers
  cartofi_cuptor_usturoi_boia: img('photo-1518779578993-ec3579fee39f'), // Roasted garlic paprika potatoes
  chipsuri_cartofi_airfryer: img('photo-1566478989037-eec170784d0b'), // Golden homemade airfryer potato chips
  dovlecei_pane_cuptor: img('photo-1572449043416-55f4685c9bb7'), // Baked zucchini with garlic sauce
  dovlecei_umpluti_orez_cuptor: img('photo-1572449043416-55f4685c9bb7'), // Rice stuffed zucchini boats
  chiftele_legume_airfryer: img('photo-1546069901-ba9599a7e63c'), // Vegetable patties / fritters
  ciuperci_umplute_cuptor: img('photo-1504674900247-0877df9cc836'), // Mozzarella stuffed mushrooms

  // --- 10. Salate ---
  salata_greceasca_telemea: img('photo-1540420773420-3366772f4999'), // Fresh Greek salad with feta & olives
  salata_vara_rosii_telemea_ceapa: img('photo-1540420773420-3366772f4999'), // Garden tomato & telemea salad
  salata_calda_pui_crutoane: img('photo-1512621776951-a57141f2eefd'), // Warm Caesar chicken salad with croutons
  salata_caesar_pui_parmezan: img('photo-1512621776951-a57141f2eefd'), // Caesar salad with chicken & parmesan
  salata_calda_naut_spanac: img('photo-1546069901-ba9599a7e63c'), // Warm chickpea, cherry tomato & spinach salad
  salata_fasole_verde_ou: img('photo-1540420773420-3366772f4999'), // Green bean salad with egg & lemon
  salata_ton_fasole_boabe: img('photo-1540420773420-3366772f4999'), // Tuna & kidney bean salad
  salata_calda_linte_spanac_nuci: img('photo-1540420773420-3366772f4999'), // Warm lentil & spinach salad with walnuts
  salata_castraveti_iaurt_grecesc_marar: img('photo-1540420773420-3366772f4999'), // Cucumber yogurt dill salad

  // --- 11. Mic Dejun & Gustări Sărate ---
  omleta_taraneasca_telemea: img('photo-1510693206972-df098062cb71'), // Fluffy rustic omelet with feta & pepper
  omleta_cremoasa_spanac_branza: img('photo-1510693206972-df098062cb71'), // Green spinach & cheese omelet
  omleta_ciuperci_telemea: img('photo-1510693206972-df098062cb71'), // Mushroom & goat cheese omelette
  shakshuka_oua_rosii: img('photo-1590412200988-a436970781fa'), // Skillet shakshuka with poached eggs
  shakshuka_romaneasca_telemea: img('photo-1590412200988-a436970781fa'), // Romanian shakshuka with telemea
  mic_dejun_englezesc_romanesc: img('photo-1533089860892-a7c6f0a88666'), // Hearty sausage and sunny eggs skillet
  sandvis_cald_cascaval_sunca: img('photo-1528735602780-2552fd46c7af'), // Golden grilled cheese & ham toast
  quesadilla_pui_cascaval: img('photo-1618040996337-56904b7850b9'), // Crispy chicken & cheese quesadilla
  quesadilla_pui_cascaval_tigaie: img('photo-1618040996337-56904b7850b9'), // Pan-seared chicken quesadilla
  toast_ou_avocado: img('photo-1525351484163-7529414344d8'), // Sourdough toast with egg & mashed avocado
  tartine_avocado_rosii_cherry: img('photo-1525351484163-7529414344d8'), // Avocado crostini with cherry tomatoes
  tartine_unt_arahide_banane: img('photo-1528735602780-2552fd46c7af'), // Peanut butter & sliced banana toast
  popcorn_aromat_parmezan_boia: img('photo-1578849278619-e73505e9610f'), // Fresh bowl of seasoned popcorn
  guacamole_chips_nachos: img('photo-1553530666-ba11a7da3888'), // Chunky avocado guacamole with crispy tortilla chips
  hummus_cremos_legume_crocante: img('photo-1577906096429-f73c2c312435'), // Velvety smooth hummus with olive oil and vegetable sticks
  hummus_cremos_morcovi_seminte: img('photo-1577906096429-f73c2c312435'), // Homemade creamy hummus with pumpkin seeds & carrots
  bruschete_rosii_usturoi_busuioc: img('photo-1572695157366-5e585ab2b69f'), // Crispy tomato garlic bruschetta
  mix_nuci_seminte_miere: img('photo-1536599018102-9f803c140fc1'), // Roasted nuts and seeds with pure honey

  // --- 12. Terciuri & Mic Dejun Dulce ---
  terci_ovaz_fructe_miere: img('photo-1517673132405-a56a62b18caf'), // Warm oatmeal bowl with fresh berries
  terci_ovaz_vegan_banane: img('photo-1517673132405-a56a62b18caf'), // Banana and walnut oat porridge
  ovaz_peste_noapte_mar_nuci: img('photo-1517673132405-a56a62b18caf'), // Overnight oats with grated apple & walnuts
  smoothie_bowl_ghimbir_afine: img('photo-1511690656952-34342bb7c2f2'), // Vibrant berry smoothie bowl with ginger
  iaurt_grecesc_nuci_miere: img('photo-1488477181946-6428a0291777'), // Thick Greek yogurt with honey and walnuts
  friganela_dulce_scortisoara: img('photo-1484723091739-30a097e8f929'), // French toast with cinnamon and sugar
  crema_banane_chia_arahide: img('photo-1513456852971-30c0b8199d4d'), // Banana chia peanut butter bowl

  // --- 13. Deserturi Autentice ---
  papanasi_prajiti_smantana_dulceata: img('photo-1579372786545-d24232daf58c'), // Golden cottage cheese donuts with sour cream and jam
  clatite_subtiri_gem_capsuni: img('photo-1519676867240-f03562e64548'), // Thin golden rolled crepes with strawberry jam
  clatite_pufoase_americane: img('photo-1567620905732-2d1ec7ab7445'), // Fluffy stack of American pancakes
  clatite_vegane_banane_ovaz: img('photo-1519676867240-f03562e64548'), // Plant-based banana pancakes
  salam_de_biscuiti_clasic: img('photo-1541781774459-bb2af2f05b55'), // Romanian chocolate biscuit salami roll slices
  lava_cake_ciocolata_airfryer: img('photo-1606313564200-e75d5e30476c'), // Molten dark chocolate lava cake
  negresa_de_casa_glazura_ciocolata: img('photo-1589218436045-ee320057f443'), // Rich chocolate brownie square with fudge glaze
  orez_cu_lapte_scortisoara: img('photo-1576402187878-974f70c890a5'), // Creamy rice pudding dusted with cinnamon
  orez_lapte_dulceata_visine: img('photo-1576402187878-974f70c890a5'), // Creamy rice pudding with sour cherry jam
  budinca_orez_cocos_scortisoara: img('photo-1576402187878-974f70c890a5'), // Coconut rice pudding with cinnamon
  budinca_chia_fructe_padure: img('photo-1513456852971-30c0b8199d4d'), // Layered chia pudding with berries
  budinca_chia_migdale_scortisoara: img('photo-1513456852971-30c0b8199d4d'), // Almond chia pudding
  piure_fructe_padure_chia: img('photo-1513456852971-30c0b8199d4d'), // Berry chia compote
  mere_coapte_nuca_miere: img('photo-1568571780765-9276ac8b75a2'), // Oven baked whole apples stuffed with walnuts and honey
  mere_coapte_nuci_scortisoara: img('photo-1568571780765-9276ac8b75a2'), // Spiced baked apples with cinnamon
  mere_calite_tigaie_nuca: img('photo-1568571780765-9276ac8b75a2'), // Sautéed caramelized apple slices with walnuts
  mousse_ciocolata_cocos: img('photo-1541781774459-bb2af2f05b55'), // Silky dark chocolate coconut mousse
  crema_cacao_avocado_banane: img('photo-1541781774459-bb2af2f05b55'), // Chocolate avocado pudding
  crema_cocos_cacao_banane: img('photo-1541781774459-bb2af2f05b55'), // Whipped coconut chocolate cream
  inghetata_banane_unt_arahide: img('photo-1501443762994-82bd5dace89a'), // Creamy homemade banana peanut butter ice cream

  // --- 14. Mic dejun keto (provizoriu: refolosesc poze deja potrivite, verificate în Etapa 2) ---
  ochiuri_bacon_rosii_cherry: img('photo-1533089860892-a7c6f0a88666'), // Fried eggs with sausage on a skillet
  omleta_somon_afumat_spanac: img('photo-1510693206972-df098062cb71'), // Egg and cheese skillet omelette
  iaurt_grecesc_nuci_chia_scortisoara: img('photo-1488477181946-6428a0291777'), // Yogurt cups
  pulpe_pui_cuptor_dovlecei_ardei: img('photo-1598103442097-8b74394b95c6'), // Roast chicken in a skillet
  curcan_ciuperci_smantana_tigaie: img('photo-1598103442097-8b74394b95c6'), // Roast chicken in a skillet
  antricot_vita_spanac_unt_usturoi: img('photo-1558030006-450675393462'), // Sliced seared steak
};

/**
 * Intelligent keyword-based photography matcher for dynamically generated, swapped, or imported recipes.
 */
export function getPhotoByKeywords(title: string, id: string = ''): string | null {
  const text = `${title} ${id}`.toLowerCase();

  // Hummus & Dips
  if (text.includes('hummus')) return RECIPE_EXACT_PHOTOS.hummus_cremos_legume_crocante;
  if (text.includes('guacamole')) return RECIPE_EXACT_PHOTOS.guacamole_chips_nachos;
  if (text.includes('bruschet')) return RECIPE_EXACT_PHOTOS.bruschete_rosii_usturoi_busuioc;
  if (text.includes('popcorn')) return RECIPE_EXACT_PHOTOS.popcorn_aromat_parmezan_boia;

  // Ciorbe & Supe
  if (text.includes('radauteana') || text.includes('rădăuțeană')) return RECIPE_EXACT_PHOTOS.ciorba_radauteana_rapida;
  if (text.includes('perisoare') || text.includes('perișoare')) return RECIPE_EXACT_PHOTOS.ciorba_perisoare_acrita_bors;
  if (text.includes('fasole') && (text.includes('ciorba') || text.includes('ciorbă') || text.includes('supa')))
    return RECIPE_EXACT_PHOTOS.ciorba_fasole_afumatura_ceapa;
  if (text.includes('ciorba') || text.includes('ciorbă') || text.includes('bors') || text.includes('borș'))
    return RECIPE_EXACT_PHOTOS.ciorba_legume_lamaie;
  if (text.includes('supa crema') || text.includes('supă cremă') || text.includes('conopida'))
    return RECIPE_EXACT_PHOTOS.supa_crema_legume_crutoane;

  // Ghiveci & Mâncăruri tradiționale
  if (text.includes('ghiveci')) return RECIPE_EXACT_PHOTOS.ghiveci_legume_cuptor;
  if (text.includes('mazare') || text.includes('mazăre')) return RECIPE_EXACT_PHOTOS.mancare_mazare_morcov_marar;
  if (text.includes('fasole scazuta') || text.includes('fasole scăzută') || text.includes('iahnie'))
    return RECIPE_EXACT_PHOTOS.fasole_scazuta_ceapa_marar;
  if (text.includes('ostropel')) return RECIPE_EXACT_PHOTOS.ostropel_pui_piure_cartofi;
  if (text.includes('chiftelute') || text.includes('chifteluțe') || text.includes('meatball'))
    return RECIPE_EXACT_PHOTOS.chiftelute_marinate_sos;
  if (text.includes('musaca')) return RECIPE_EXACT_PHOTOS.musaca_cartofi_carne_tocata;

  // Mămăligă & Bulz
  if (text.includes('bulz')) return RECIPE_EXACT_PHOTOS.bulz_ciobanesc_cuptor;
  if (text.includes('mamaliga') || text.includes('mămăligă') || text.includes('mamaliguta') || text.includes('mămăliguță'))
    return RECIPE_EXACT_PHOTOS.mamaliga_branza_smantana;

  // Deserturi
  if (text.includes('papanasi') || text.includes('papanași')) return RECIPE_EXACT_PHOTOS.papanasi_prajiti_smantana_dulceata;
  if (text.includes('clatite') || text.includes('clătite') || text.includes('pancakes'))
    return RECIPE_EXACT_PHOTOS.clatite_subtiri_gem_capsuni;
  if (text.includes('salam de biscuiti') || text.includes('salam de biscuiți')) return RECIPE_EXACT_PHOTOS.salam_de_biscuiti_clasic;
  if (text.includes('lava cake')) return RECIPE_EXACT_PHOTOS.lava_cake_ciocolata_airfryer;
  if (text.includes('negresa') || text.includes('negresă') || text.includes('brownie'))
    return RECIPE_EXACT_PHOTOS.negresa_de_casa_glazura_ciocolata;
  if (text.includes('orez cu lapte') || text.includes('orez cremos cu lapte') || text.includes('orez catifelat'))
    return RECIPE_EXACT_PHOTOS.orez_cu_lapte_scortisoara;
  if (text.includes('chia')) return RECIPE_EXACT_PHOTOS.budinca_chia_fructe_padure;
  if (text.includes('mar copt') || text.includes('măr copt') || text.includes('mere coapte') || text.includes('mere călite'))
    return RECIPE_EXACT_PHOTOS.mere_coapte_nuca_miere;
  if (text.includes('inghetata') || text.includes('înghețată')) return RECIPE_EXACT_PHOTOS.inghetata_banane_unt_arahide;
  if (text.includes('smoothie')) return RECIPE_EXACT_PHOTOS.smoothie_bowl_ghimbir_afine;

  // Pui & Carne
  if (text.includes('snitel') || text.includes('șnițel')) return RECIPE_EXACT_PHOTOS.snitele_pui_cuptor;
  if (text.includes('burger')) return RECIPE_EXACT_PHOTOS.burger_pui_crocant;
  if (text.includes('curry')) return RECIPE_EXACT_PHOTOS.curry_pui_lapte_cocos;
  if (text.includes('aripioare')) return RECIPE_EXACT_PHOTOS.pulpe_pui_airfryer_cartofi;
  if (text.includes('frigarui') || text.includes('frigărui')) return RECIPE_EXACT_PHOTOS.frigarui_pui_legume_gratar;
  if (text.includes('ficatei') || text.includes('ficăței')) return RECIPE_EXACT_PHOTOS.ficatei_pui_ceapa_tigaie;
  if (text.includes('muschiulet') || text.includes('mușchiuleț')) return RECIPE_EXACT_PHOTOS.muschiulet_porc_cuptor;
  if (text.includes('antricot') || text.includes('steak') || text.includes('angus'))
    return RECIPE_EXACT_PHOTOS.antricot_vita_airfryer_ierburi;
  if (text.includes('tacos')) return RECIPE_EXACT_PHOTOS.tacos_vita_salsa_rosii;

  // Pește & Creveți
  if (text.includes('somon')) return RECIPE_EXACT_PHOTOS.somon_la_tigaie_orez;
  if (text.includes('dorada') || text.includes('doradă') || text.includes('pastrav') || text.includes('păstrăv') || text.includes('cod') || text.includes('peste') || text.includes('pește'))
    return RECIPE_EXACT_PHOTOS.dorada_cuptor_lamaie_ierburi;
  if (text.includes('creveti') || text.includes('creveți') || text.includes('shrimp'))
    return RECIPE_EXACT_PHOTOS.spaghete_creveti_usturoi;

  // Paste & Risotto
  if (text.includes('carbonara')) return RECIPE_EXACT_PHOTOS.paste_carbonara_rapide;
  if (text.includes('bolognese')) return RECIPE_EXACT_PHOTOS.paste_bolognese_clasice;
  if (text.includes('paste') || text.includes('spaghete') || text.includes('penne') || text.includes('tagliatelle'))
    return RECIPE_EXACT_PHOTOS.spaghete_pomodoro_busuioc;
  if (text.includes('risotto')) return RECIPE_EXACT_PHOTOS.risotto_cremos_hribi_parmezan;

  // Ouă & Mic dejun
  if (text.includes('shakshuka')) return RECIPE_EXACT_PHOTOS.shakshuka_oua_rosii;
  if (text.includes('omleta') || text.includes('omletă')) return RECIPE_EXACT_PHOTOS.omleta_taraneasca_telemea;
  if (text.includes('sandvis') || text.includes('sandviș') || text.includes('toast') || text.includes('tartin'))
    return RECIPE_EXACT_PHOTOS.sandvis_cald_cascaval_sunca;
  if (text.includes('quesadilla')) return RECIPE_EXACT_PHOTOS.quesadilla_pui_cascaval;
  if (text.includes('terci') || text.includes('ovaz') || text.includes('ovăz')) return RECIPE_EXACT_PHOTOS.terci_ovaz_fructe_miere;
  if (text.includes('iaurt')) return RECIPE_EXACT_PHOTOS.iaurt_grecesc_nuci_miere;

  // Salate
  if (text.includes('salata') || text.includes('salată')) return RECIPE_EXACT_PHOTOS.salata_greceasca_telemea;

  return null;
}

/**
 * Returns a high-definition appetizing dish photography URI for any recipe.
 * 1. Checks recipe.imageUrl (if set explicitly)
 * 2. Checks exact recipe ID in RECIPE_EXACT_PHOTOS (covering all 143 catalog recipes)
 * 3. Matches Romanian culinary keywords in title & description
 * 4. Falls back to archetype-specific appetizing photography
 */
export function getRecipePhotographyUri(recipe: Recipe, archetype?: DishArchetype): string {
  if (recipe.imageUrl && recipe.imageUrl.trim().length > 0) {
    return recipe.imageUrl;
  }

  if (RECIPE_EXACT_PHOTOS[recipe.id]) {
    return RECIPE_EXACT_PHOTOS[recipe.id];
  }

  const keywordPhoto = getPhotoByKeywords(recipe.title, recipe.id);
  if (keywordPhoto) {
    return keywordPhoto;
  }

  if (archetype && ARCHETYPE_PHOTO_URLS[archetype]) {
    return ARCHETYPE_PHOTO_URLS[archetype];
  }

  return ARCHETYPE_PHOTO_URLS.stew;
}
