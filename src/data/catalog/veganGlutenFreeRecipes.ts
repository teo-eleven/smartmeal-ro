import { RecipeSource } from '../../types';

/**
 * Vegan and gluten-free dishes added so those diets fill a week without repeats (ADR-16).
 *
 * Order matters: the planner breaks ties by catalog order, so recipes keep the position they
 * had in the original single file. See src/data/recipes.ts for how the parts are assembled.
 */
export const VEGAN_GLUTEN_FREE_RECIPES: RecipeSource[] = [
  // ---------------------------------------------------------------------------------------
  // Added 2026-09-24. Every one is vegan AND gluten-free on purpose: those were the two
  // diets with fewer than seven dishes per slot, which forced the planner to repeat inside
  // a single week however good its variety rules were. See ADR-16.
  // ---------------------------------------------------------------------------------------
  {
    id: 'mamaliguta_ciuperci_marar',
    title: 'Mămăliguță cremoasă cu ciuperci călite și mărar',
    description:
      'Mălai fiert cremos, peste care se pun ciuperci champignon călite cu ceapă și mărar proaspăt. Fără lactate, fără gluten.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 20,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'healthy_comfort', 'low_calorie'],
    ingredients: [
      { ingredientId: 'malai_superior', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'ciuperci_champignon', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'marar_verde', amountPerServing: 0.2, unit: 'legatura' },
      { ingredientId: 'ulei_masline', amountPerServing: 15, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Pune apa cu sare la fiert și toarnă mălaiul în ploaie, amestecând continuu.',
      },
      {
        stepNumber: 2,
        instruction: 'Lasă mămăliga la foc mic 15 minute, amestecând des ca să nu se prindă.',
      },
      {
        stepNumber: 3,
        instruction: 'Între timp călește ceapa tocată în ulei, apoi adaugă ciupercile feliate.',
      },
      {
        stepNumber: 4,
        instruction: 'Lasă ciupercile să-și scoată apa și să se rumenească 8 minute.',
      },
      {
        stepNumber: 5,
        instruction: 'Servește mămăliga cu ciupercile deasupra și mărar tocat proaspăt.',
      },
    ],
    suitableSlots: ['breakfast', 'lunch'],
    tier: 'basic',
  },
  {
    id: 'cartofi_taranesti_ardei',
    title: 'Cartofi țărănești la tigaie cu ardei și ceapă roșie',
    description:
      'Cartofi tăiați cubulețe, rumeniți încet la tigaie cu ardei gras și ceapă roșie, cu boia dulce și pătrunjel.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 22,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'family_fav', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'cartofi_albi', amountPerServing: 300, unit: 'g' },
      { ingredientId: 'ardei_gras_rosu', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'ceapa_rosie', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'boia_dulce', amountPerServing: 3, unit: 'g' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.2, unit: 'legatura' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 18, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Taie cartofii cubulețe de un centimetru și usucă-i bine cu un prosop.',
      },
      {
        stepNumber: 2,
        instruction:
          'Încinge uleiul și pune cartofii într-un singur strat, fără să-i amesteci 5 minute.',
      },
      {
        stepNumber: 3,
        instruction: 'Întoarce-i și lasă-i să se rumenească încă 10 minute la foc mediu.',
      },
      { stepNumber: 4, instruction: 'Adaugă ardeiul și ceapa tăiate fâșii și mai lasă 6 minute.' },
      {
        stepNumber: 5,
        instruction: 'Stinge focul, presară boiaua și pătrunjelul tocat și amestecă o dată.',
      },
    ],
    suitableSlots: ['breakfast', 'lunch', 'dinner'],
    tier: 'basic',
  },
  {
    id: 'crema_banane_chia_arahide',
    title: 'Cremă de banane cu unt de arahide și semințe de chia',
    description:
      'Micul dejun de trei minute, fără foc: banane pisate cu unt de arahide, semințe de chia și scorțișoară.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    dietType: 'vegan',
    appliances: [],
    moodTags: ['speedy', 'healthy_comfort', 'sweet_treat'],
    ingredients: [
      { ingredientId: 'banane', amountPerServing: 160, unit: 'g' },
      { ingredientId: 'unt_arahide', amountPerServing: 25, unit: 'g' },
      { ingredientId: 'seminte_chia', amountPerServing: 12, unit: 'g' },
      { ingredientId: 'lapte_vegetal_ovaz', amountPerServing: 80, unit: 'ml' },
      { ingredientId: 'scortisoara_macinata', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Pisează bananele cu furculița într-un bol până se fac piure.',
      },
      {
        stepNumber: 2,
        instruction: 'Amestecă untul de arahide și băutura de ovăz până se omogenizează.',
      },
      { stepNumber: 3, instruction: 'Adaugă semințele de chia și lasă 5 minute să se umfle.' },
      { stepNumber: 4, instruction: 'Presară scorțișoară și servește imediat.' },
    ],
    suitableSlots: ['breakfast', 'snack'],
    tier: 'basic',
  },
  {
    id: 'ghiveci_orez_legume_tigaie',
    title: 'Ghiveci de legume cu orez și roșii la tigaie',
    description:
      'Orez fiert împreună cu morcov, ardei, dovlecel și roșii cuburi, într-o singură tigaie, până se leagă.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'healthy_comfort', 'family_fav'],
    ingredients: [
      { ingredientId: 'orez_basmati', amountPerServing: 90, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 70, unit: 'g' },
      { ingredientId: 'ardei_gras_rosu', amountPerServing: 70, unit: 'g' },
      { ingredientId: 'dovlecei', amountPerServing: 90, unit: 'g' },
      { ingredientId: 'rosii_cuburi', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'ulei_masline', amountPerServing: 15, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Călește ceapa tocată și morcovul tăiat rondele în ulei, 5 minute.',
      },
      {
        stepNumber: 2,
        instruction: 'Adaugă ardeiul și dovlecelul tăiate cuburi și mai lasă 3 minute.',
      },
      {
        stepNumber: 3,
        instruction: 'Pune orezul spălat și amestecă un minut să se îmbrace în ulei.',
      },
      {
        stepNumber: 4,
        instruction: 'Toarnă roșiile și apă cât să acopere, apoi fierbe la foc mic 18 minute.',
      },
      { stepNumber: 5, instruction: 'Stinge focul și lasă acoperit 5 minute înainte de servire.' },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'basic',
  },
  {
    id: 'tocanita_fasole_boabe_boia',
    title: 'Tocăniță de fasole boabe cu ceapă călită și boia afumată',
    description:
      'Fasole boabe scăzută încet cu multă ceapă, boia și pătrunjel. Mâncarea de post clasică, gata în 25 de minute.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 22,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'healthy_comfort', 'high_protein'],
    ingredients: [
      { ingredientId: 'fasole_boabe_conserva', amountPerServing: 220, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'pasta_tomate', amountPerServing: 25, unit: 'g' },
      { ingredientId: 'boia_dulce', amountPerServing: 4, unit: 'g' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.25, unit: 'legatura' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 15, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Călește ceapa tocată mărunt în ulei, la foc mic, până devine aurie.',
      },
      { stepNumber: 2, instruction: 'Adaugă morcovul ras și lasă-l 4 minute să se înmoaie.' },
      {
        stepNumber: 3,
        instruction: 'Pune pasta de tomate și boiaua, amestecând rapid ca să nu se ardă.',
      },
      {
        stepNumber: 4,
        instruction: 'Adaugă fasolea scursă și apă cât s-o acopere, apoi fierbe 15 minute.',
      },
      { stepNumber: 5, instruction: 'Potrivește de sare și presară pătrunjel tocat la final.' },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'basic',
  },
  {
    id: 'curry_naut_cocos_orez',
    title: 'Curry de năut cu lapte de cocos și orez basmati',
    description:
      'Năut fiert în lapte de cocos cu roșii și ceapă, servit peste orez basmati pufos. Cremos, fără nicio picătură de lactate.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 22,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['fakeaway', 'healthy_comfort', 'high_protein'],
    ingredients: [
      { ingredientId: 'naut_conserva', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'lapte_cocos', amountPerServing: 120, unit: 'ml' },
      { ingredientId: 'orez_basmati', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'rosii_cuburi', amountPerServing: 100, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 6, unit: 'g' },
      { ingredientId: 'boia_dulce', amountPerServing: 3, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 12, unit: 'ml' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Pune orezul la fiert în apă cu sare, după indicațiile de pe pachet.',
      },
      {
        stepNumber: 2,
        instruction: 'Călește ceapa tocată și usturoiul zdrobit în ulei, 4 minute.',
      },
      { stepNumber: 3, instruction: 'Adaugă boiaua și roșiile, apoi lasă să scadă 5 minute.' },
      {
        stepNumber: 4,
        instruction: 'Toarnă laptele de cocos și năutul scurs și fierbe la foc mic 10 minute.',
      },
      {
        stepNumber: 5,
        instruction: 'Servește currysul peste orezul scurs și afânat cu furculița.',
      },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'medium',
  },
  {
    id: 'chili_vegetal_fasole_porumb',
    title: 'Chili vegetal de fasole roșie cu porumb dulce și ardei',
    description:
      'Fasole roșie și porumb fierte în sos de roșii condimentat, fără carne. Se face într-o oală, într-o jumătate de oră.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 20,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['spicy_fiesta', 'high_protein', 'family_fav'],
    ingredients: [
      { ingredientId: 'fasole_rosie_conserva', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'porumb_dulce', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'ardei_gras_rosu', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'rosii_pasate', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'ceapa_rosie', amountPerServing: 70, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 6, unit: 'g' },
      { ingredientId: 'boia_dulce', amountPerServing: 4, unit: 'g' },
      { ingredientId: 'ulei_masline', amountPerServing: 12, unit: 'ml' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Călește ceapa și ardeiul tăiate cubulețe în ulei, 6 minute.' },
      {
        stepNumber: 2,
        instruction: 'Adaugă usturoiul zdrobit și boiaua și amestecă 30 de secunde.',
      },
      { stepNumber: 3, instruction: 'Toarnă roșiile pasate și lasă să dea în clocot.' },
      {
        stepNumber: 4,
        instruction: 'Pune fasolea scursă și porumbul, apoi fierbe la foc mic 12 minute.',
      },
      {
        stepNumber: 5,
        instruction: 'Potrivește de sare și lasă 5 minute deoparte înainte de servire.',
      },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'basic',
  },
  {
    id: 'orez_cremos_hribi_patrunjel',
    title: 'Orez cremos cu hribi de pădure și pătrunjel',
    description:
      'Orezul se leagă singur, cremos, din amidonul lui, cu hribi căliți și mult pătrunjel. Fără unt și fără parmezan.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 24,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['healthy_comfort', 'romanian_classic'],
    ingredients: [
      { ingredientId: 'orez_arborio', amountPerServing: 90, unit: 'g' },
      { ingredientId: 'ciuperci_hribi', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 5, unit: 'g' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.25, unit: 'legatura' },
      { ingredientId: 'ulei_masline', amountPerServing: 18, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Călește ceapa tocată mărunt în ulei până devine sticloasă.' },
      { stepNumber: 2, instruction: 'Adaugă hribii feliați și lasă-i să se rumenească 6 minute.' },
      { stepNumber: 3, instruction: 'Pune orezul și amestecă un minut să se îmbrace în ulei.' },
      {
        stepNumber: 4,
        instruction: 'Adaugă apă caldă câte un polonic, amestecând, timp de 16 minute.',
      },
      {
        stepNumber: 5,
        instruction: 'Stinge focul, adaugă usturoiul zdrobit și pătrunjelul și amestecă viguros.',
      },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'medium',
  },
  {
    id: 'dovlecei_umpluti_orez_cuptor',
    title: 'Dovlecei umpluți cu orez și legume la cuptor',
    description:
      'Jumătăți de dovlecel scobite, umplute cu orez călit cu morcov și roșii, coapte până se rumenesc pe deasupra.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 35,
    dietType: 'vegan',
    appliances: ['oven'],
    moodTags: ['romanian_classic', 'healthy_comfort', 'low_calorie'],
    ingredients: [
      { ingredientId: 'dovlecei', amountPerServing: 250, unit: 'g' },
      { ingredientId: 'orez_basmati', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'rosii_cuburi', amountPerServing: 90, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'marar_verde', amountPerServing: 0.2, unit: 'legatura' },
      { ingredientId: 'ulei_masline', amountPerServing: 15, unit: 'ml' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Taie dovleceii pe lung și scobește miezul cu o lingură.' },
      {
        stepNumber: 2,
        instruction: 'Călește ceapa, morcovul ras și miezul tocat în ulei, 6 minute.',
      },
      {
        stepNumber: 3,
        instruction: 'Adaugă orezul și roșiile și lasă 5 minute să se lege compoziția.',
      },
      {
        stepNumber: 4,
        instruction: 'Umple bărcuțele de dovlecel și așază-le într-o tavă cu puțină apă.',
      },
      {
        stepNumber: 5,
        instruction: 'Coace 30 de minute la 190°C și presară mărar tocat la final.',
      },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'basic',
  },
  {
    id: 'budinca_orez_cocos_scortisoara',
    title: 'Budincă de orez cu lapte de cocos și scorțișoară',
    description:
      'Orez cu bob rotund fiert încet în lapte de cocos, cu scorțișoară. Cremos ca orezul cu lapte, dar fără lactate.',
    prepTimeMinutes: 3,
    cookTimeMinutes: 27,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['sweet_treat', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'orez_bob_rotund', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'lapte_cocos', amountPerServing: 150, unit: 'ml' },
      { ingredientId: 'zahar_tos', amountPerServing: 18, unit: 'g' },
      { ingredientId: 'scortisoara_macinata', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Spală orezul și pune-l la fiert în apă cu un praf de sare, 10 minute.',
      },
      { stepNumber: 2, instruction: 'Scurge orezul și toarnă peste el laptele de cocos.' },
      { stepNumber: 3, instruction: 'Fierbe la foc mic 15 minute, amestecând des, până se leagă.' },
      {
        stepNumber: 4,
        instruction: 'Adaugă zahărul, amestecă și servește cald sau rece, cu scorțișoară.',
      },
    ],
    suitableSlots: ['dessert'],
    tier: 'basic',
  },
  {
    id: 'piure_fructe_padure_chia',
    title: 'Piure de fructe de pădure cu semințe de chia și nucă',
    description:
      'Fructe de pădure încălzite scurt, legate cu semințe de chia și presărate cu miez de nucă. Desert în zece minute.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 6,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['sweet_treat', 'speedy', 'low_calorie'],
    ingredients: [
      { ingredientId: 'fructe_padure_congelate', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'seminte_chia', amountPerServing: 14, unit: 'g' },
      { ingredientId: 'nuci_miez', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'zahar_tos', amountPerServing: 12, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Pune fructele de pădure în crăticioară cu două linguri de apă.',
      },
      {
        stepNumber: 2,
        instruction: 'Încălzește 5 minute la foc mic, până se desfac și lasă zeamă.',
      },
      { stepNumber: 3, instruction: 'Adaugă zahărul și semințele de chia, apoi amestecă bine.' },
      { stepNumber: 4, instruction: 'Lasă 10 minute la rece să se lege și presară nuca zdrobită.' },
    ],
    suitableSlots: ['dessert', 'snack'],
    tier: 'medium',
  },
  {
    id: 'inghetata_banane_unt_arahide',
    title: 'Înghețată rapidă de banane cu unt de arahide',
    description:
      'Banane congelate pisate până devin cremoase ca o înghețată, amestecate cu unt de arahide și cacao. Fără foc.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 0,
    dietType: 'vegan',
    appliances: [],
    moodTags: ['sweet_treat', 'speedy'],
    ingredients: [
      { ingredientId: 'banane', amountPerServing: 180, unit: 'g' },
      { ingredientId: 'unt_arahide', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'cacao_pudra', amountPerServing: 6, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Feliază bananele și ține-le la congelator cel puțin două ore.',
      },
      {
        stepNumber: 2,
        instruction: 'Pisează feliile înghețate cu furculița sau blenderul până devin cremă.',
      },
      { stepNumber: 3, instruction: 'Adaugă untul de arahide și cacaua și amestecă scurt.' },
      { stepNumber: 4, instruction: 'Servește imediat, cât încă e rece.' },
    ],
    suitableSlots: ['dessert', 'snack'],
    tier: 'basic',
  },
  {
    id: 'mere_calite_tigaie_nuca',
    title: 'Mere călite la tigaie cu nucă și scorțișoară',
    description:
      'Felii de măr călite scurt în tigaie până se caramelizează la margini, cu nucă zdrobită și scorțișoară.',
    prepTimeMinutes: 6,
    cookTimeMinutes: 9,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['sweet_treat', 'romanian_classic', 'speedy'],
    ingredients: [
      { ingredientId: 'mere_romanesti', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'nuci_miez', amountPerServing: 18, unit: 'g' },
      { ingredientId: 'zahar_tos', amountPerServing: 14, unit: 'g' },
      { ingredientId: 'scortisoara_macinata', amountPerServing: 2, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 8, unit: 'ml' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Taie merele felii groase de jumătate de centimetru, fără cotor.',
      },
      {
        stepNumber: 2,
        instruction: 'Încinge uleiul și pune feliile într-un singur strat, 4 minute.',
      },
      {
        stepNumber: 3,
        instruction: 'Întoarce-le, presară zahărul și lasă să se caramelizeze 4 minute.',
      },
      {
        stepNumber: 4,
        instruction: 'Stinge focul, adaugă scorțișoara și nuca zdrobită și servește cald.',
      },
    ],
    suitableSlots: ['dessert'],
    tier: 'basic',
  },
  {
    id: 'crema_cocos_cacao_banane',
    title: 'Cremă de cocos cu cacao și banane',
    description:
      'Laptele de cocos gros bătut cu cacao până se face cremă, peste felii de banană. Se face în cinci minute.',
    prepTimeMinutes: 7,
    cookTimeMinutes: 0,
    dietType: 'vegan',
    appliances: [],
    moodTags: ['sweet_treat', 'speedy'],
    ingredients: [
      { ingredientId: 'lapte_cocos', amountPerServing: 120, unit: 'ml' },
      { ingredientId: 'cacao_pudra', amountPerServing: 10, unit: 'g' },
      { ingredientId: 'banane', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'zahar_tos', amountPerServing: 15, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Ține cutia de lapte de cocos la rece și folosește doar partea groasă.',
      },
      { stepNumber: 2, instruction: 'Bate crema cu zahărul până se albește ușor.' },
      { stepNumber: 3, instruction: 'Cerne cacaua peste ea și amestecă până se omogenizează.' },
      { stepNumber: 4, instruction: 'Servește peste felii de banană, în pahare mici.' },
    ],
    suitableSlots: ['dessert', 'snack'],
    tier: 'medium',
  },
  {
    id: 'ciorba_legume_lamaie',
    title: 'Ciorbă de legume acrită cu lămâie și pătrunjel',
    description:
      'Zarzavat fiert cu cartof și orez, acrit cu lămâie în loc de borș, ca să rămână și fără gluten.',
    prepTimeMinutes: 12,
    cookTimeMinutes: 28,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['soups_stews', 'romanian_classic', 'low_calorie'],
    ingredients: [
      { ingredientId: 'cartofi_albi', amountPerServing: 140, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'ardei_gras_rosu', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'orez_basmati', amountPerServing: 25, unit: 'g' },
      { ingredientId: 'lamaie', amountPerServing: 25, unit: 'g' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.25, unit: 'legatura' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 12, unit: 'ml' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Călește ceapa, morcovul și ardeiul tocate în ulei, 6 minute.',
      },
      { stepNumber: 2, instruction: 'Adaugă apă, cartoful cubulețe și orezul spălat.' },
      { stepNumber: 3, instruction: 'Fierbe la foc mediu 20 de minute, până se înmoaie legumele.' },
      { stepNumber: 4, instruction: 'Stinge focul și acrește cu zeamă de lămâie, după gust.' },
      { stepNumber: 5, instruction: 'Presară pătrunjel tocat și lasă acoperit 5 minute.' },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'basic',
  },
  {
    id: 'salata_calda_naut_spanac',
    title: 'Salată caldă de năut cu roșii cherry și spanac baby',
    description:
      'Năut rumenit în tigaie cu usturoi, amestecat cald peste spanac baby și roșii cherry, cu lămâie.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 12,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['high_protein', 'fresh_salad', 'light_dinner'],
    ingredients: [
      { ingredientId: 'naut_conserva', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'spanac_baby', amountPerServing: 70, unit: 'g' },
      { ingredientId: 'rosii_cherry', amountPerServing: 100, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 6, unit: 'g' },
      { ingredientId: 'lamaie', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'ulei_masline', amountPerServing: 18, unit: 'ml' },
      { ingredientId: 'boia_dulce', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Scurge și usucă năutul, apoi rumenește-l în ulei 8 minute.' },
      { stepNumber: 2, instruction: 'Adaugă usturoiul zdrobit și boiaua în ultimul minut.' },
      {
        stepNumber: 3,
        instruction: 'Pune spanacul într-un bol mare și toarnă năutul fierbinte peste el.',
      },
      { stepNumber: 4, instruction: 'Adaugă roșiile tăiate în două și stoarce lămâia deasupra.' },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'medium',
  },
  {
    id: 'cartofi_cuptor_usturoi_boia',
    title: 'Cartofi la cuptor cu usturoi, boia și pătrunjel',
    description:
      'Sferturi de cartof coapte până se fac crocante la exterior, cu usturoi zdrobit și boia dulce.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 40,
    dietType: 'vegan',
    appliances: ['oven'],
    moodTags: ['family_fav', 'romanian_classic', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'cartofi_albi', amountPerServing: 320, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 10, unit: 'g' },
      { ingredientId: 'boia_dulce', amountPerServing: 4, unit: 'g' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.2, unit: 'legatura' },
      { ingredientId: 'ulei_masline', amountPerServing: 18, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 4, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Taie cartofii în sferturi și amestecă-i cu uleiul, sarea și boiaua.',
      },
      {
        stepNumber: 2,
        instruction: 'Întinde-i într-o tavă într-un singur strat, cu tăietura în jos.',
      },
      {
        stepNumber: 3,
        instruction: 'Coace 25 de minute la 200°C, apoi întoarce-i și mai lasă 15.',
      },
      {
        stepNumber: 4,
        instruction: 'Amestecă usturoiul zdrobit cu pătrunjelul și presară peste cartofii calzi.',
      },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'basic',
  },
  {
    id: 'mancare_mazare_morcov_marar',
    title: 'Mâncare de mazăre cu morcov și mărar proaspăt',
    description:
      'Mazăre scăzută cu morcov și ceapă, legată cu roșii pasate și multă verdeață. Mâncare de post de duminică.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 24,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'healthy_comfort', 'low_calorie'],
    ingredients: [
      { ingredientId: 'mazare_congelata', amountPerServing: 220, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 70, unit: 'g' },
      { ingredientId: 'rosii_pasate', amountPerServing: 100, unit: 'g' },
      { ingredientId: 'marar_verde', amountPerServing: 0.3, unit: 'legatura' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 15, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Călește ceapa tocată și morcovul rondele în ulei, 6 minute.' },
      { stepNumber: 2, instruction: 'Adaugă mazărea și amestecă un minut.' },
      { stepNumber: 3, instruction: 'Toarnă roșiile pasate și apă cât să acopere pe jumătate.' },
      { stepNumber: 4, instruction: 'Fierbe la foc mic 15 minute, până scade sosul.' },
      { stepNumber: 5, instruction: 'Stinge focul și presară mărar tocat din belșug.' },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'basic',
  },
];
