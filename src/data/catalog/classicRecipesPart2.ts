import { RecipeSource } from '../../types';

/**
 * The original catalog, second half: everyday mains and breakfasts.
 *
 * Order matters: the planner breaks ties by catalog order, so recipes keep the position they
 * had in the original single file. See src/data/recipes.ts for how the parts are assembled.
 */
export const CLASSIC_RECIPES_PART_2: RecipeSource[] = [
  {
    id: 'omleta_taraneasca_telemea',
    title: 'Omletă țărănească bogată cu telemea și ardei',
    description:
      'Omletă pufoasă pregătită rapid cu ouă proaspete, cubulețe de telemea, ceapă călită și ardei kapia.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 8,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'high_protein', 'romanian_classic'],
    ingredients: [
      { ingredientId: 'oua_m', amountPerServing: 3, unit: 'buc' },
      { ingredientId: 'telemea_vaca', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'ardei_gras_rosu', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 30, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 12, unit: 'g' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'piper_negru', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Călește ceapa tocată fin și ardeiul cubulețe în unt topit timp de 3 minute.',
      },
      { stepNumber: 2, instruction: 'Bate ouăle cu piper și telemeaua sfărâmată.' },
      {
        stepNumber: 3,
        instruction:
          'Toarnă compoziția în tigaie la foc mic spre mediu și lasă omleta să se coaguleze uniform.',
      },
      {
        stepNumber: 4,
        instruction: 'Presară pătrunjel tocat mărunt, pliază omleta în două și servește imediat.',
      },
    ],
  },
  {
    id: 'cartofi_la_cuptor_telemea',
    title: 'Cartofi gratinați la cuptor cu smântână și telemea',
    description:
      'Feliuțe subțiri de cartofi scăldate în smântână aromată și acoperite cu un strat generos de telemea gratinată.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 35,
    dietType: 'vegetarian',
    appliances: ['oven'],
    moodTags: ['healthy_comfort', 'family_fav', 'romanian_classic'],
    ingredients: [
      { ingredientId: 'cartofi_albi', amountPerServing: 300, unit: 'g' },
      { ingredientId: 'smantana_20', amountPerServing: 100, unit: 'g' },
      { ingredientId: 'telemea_vaca', amountPerServing: 70, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 5, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 10, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Curăță cartofii și taie-i în rondele foarte subțiri.' },
      {
        stepNumber: 2,
        instruction:
          'Unge o tavă termorezistentă cu unt și așază cartofii în straturi uniforme, presărând sare și usturoi.',
      },
      {
        stepNumber: 3,
        instruction:
          'Toarnă smântâna uniform peste cartofi și acoperă totul cu telemeaua dată pe răzătoare.',
      },
      {
        stepNumber: 4,
        instruction:
          'Coace la 190°C timp de 35 de minute până când cartofii sunt moi și crusta e aurie.',
      },
    ],
  },
  {
    id: 'fasole_scazuta_ceapa_marar',
    title: 'Mâncărică de fasole scăzută cu ceapă și mărar',
    description:
      'Rețetă consistentă și economică din boabe de fasole roșie gătite cu sos concentrat de roșii, ceapă călită și cimbru/mărar.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 15,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'healthy_comfort', 'low_calorie'],
    ingredients: [
      { ingredientId: 'fasole_rosie_conserva', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'pasta_tomate', amountPerServing: 30, unit: 'g' },
      { ingredientId: 'rosii_pasate', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'marar_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Călește ceapa tocată în ulei până capătă o culoare aurie plăcută.',
      },
      {
        stepNumber: 2,
        instruction: 'Dizolvă pasta de tomate și toarnă passata de roșii cu 50ml apă călduță.',
      },
      {
        stepNumber: 3,
        instruction:
          'Adaugă fasolea boabe scursă și clătită, lăsând să scadă la foc domol 10 minute.',
      },
      { stepNumber: 4, instruction: 'Potrivește de sare și finalizează cu mărar verde tocat fin.' },
    ],
  },
  {
    id: 'pulpe_pui_cuptor_usturoi',
    title: 'Pulpe de pui la cuptor cu mujdei și mămăligă',
    description:
      'Pulpe crocante la tavă cu piele rumenită, servite alături de mămăligă fierbinte și mujdei aromat de usturoi.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 35,
    dietType: 'omnivore',
    appliances: ['oven', 'hob'],
    moodTags: ['romanian_classic', 'family_fav', 'high_protein'],
    ingredients: [
      { ingredientId: 'pulpe_pui_dezosate', amountPerServing: 220, unit: 'g' },
      { ingredientId: 'malai_superior', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 10, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'boia_dulce', amountPerServing: 4, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Freacă pulpele cu sare, boia dulce și puțin ulei.' },
      {
        stepNumber: 2,
        instruction:
          'Coace carnea la cuptor la 200°C timp de 30-35 de minute până se rumenește superb.',
      },
      { stepNumber: 3, instruction: 'Fă o mămăligă caldă din mălai și apă cu sare pe aragaz.' },
      {
        stepNumber: 4,
        instruction:
          'Zdrobește usturoiul cu puțină sare și apă călduță pentru mujdei și servește totul fierbinte.',
      },
    ],
  },
  {
    id: 'paste_cremoase_spanac',
    title: 'Penne cremoase cu baby spanac și parmezan',
    description:
      'Paste rapide legate într-un sos mătăsos de smântână, frunze proaspete de baby spanac și parmezan răzuit.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 12,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'healthy_comfort', 'family_fav'],
    ingredients: [
      { ingredientId: 'paste_penne', amountPerServing: 90, unit: 'g' },
      { ingredientId: 'spanac_baby', amountPerServing: 70, unit: 'g' },
      { ingredientId: 'smantana_20', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'parmezan_ras', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 5, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 10, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Fierbe pastele penne în apă cu sare până sunt al dente.' },
      {
        stepNumber: 2,
        instruction:
          'Într-o tigaie, topește untul și călește usturoiul zdrobit timp de 30 de secunde.',
      },
      {
        stepNumber: 3,
        instruction:
          'Adaugă frunzele de spanac până se înmoaie (circa 1-2 minute), apoi toarnă smântâna.',
      },
      {
        stepNumber: 4,
        instruction: 'Amestecă pastele fierbinți cu sosul de spanac și presară parmezanul ras.',
      },
    ],
  },
  {
    id: 'wrap_ton_avocado',
    title: 'Wrap răcoros în lipie cu ton, avocado și porumb',
    description:
      'Cină proaspătă și lejeră: lipie din grâu unsă cu iaurt, umplută cu ton mărunțit, cuburi de avocado și porumb dulce.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 0,
    dietType: 'pescatarian',
    appliances: [],
    moodTags: ['speedy', 'low_calorie', 'high_protein'],
    ingredients: [
      { ingredientId: 'lipii_tortilla', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'ton_conserva', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'avocado', amountPerServing: 0.5, unit: 'buc' },
      { ingredientId: 'porumb_dulce', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'iaurt_grecesc', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'salata_verde', amountPerServing: 0.3, unit: 'buc' },
      { ingredientId: 'sare_fina', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Scurge bine tonul și boabele de porumb dulce.' },
      {
        stepNumber: 2,
        instruction:
          'Pisează ușor miezul de avocado cu o furculiță și amestecă-l cu iaurtul grecesc și sarea.',
      },
      {
        stepNumber: 3,
        instruction:
          'Unge lipia cu sosul de avocado, așază frunzele de salată verde, tonul și porumbul.',
      },
      {
        stepNumber: 4,
        instruction: 'Rulează strâns lipia și taie-o oblic pentru o servire elegantă.',
      },
    ],
  },
  {
    id: 'pilaf_pui_ciuperci',
    title: 'Pilaf sârbesc de orez cu pui și ciuperci',
    description:
      'Orez bob cu bob gătit molcom cu ceapă, morcov dulce, felii de ciuperci și bucăți aromate de piept de pui.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'family_fav', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'piept_pui_file', amountPerServing: 180, unit: 'g' },
      { ingredientId: 'orez_basmati', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'ciuperci_champignon', amountPerServing: 100, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Rumenește bucățelele de piept de pui în ulei timp de 4-5 minute, apoi scoate-le pe o farfurie.',
      },
      {
        stepNumber: 2,
        instruction:
          'În aceeași cratiță, călește ceapa, morcovul ras și ciupercile feliate timp de 5 minute.',
      },
      {
        stepNumber: 3,
        instruction: 'Adaugă orezul spălat, puiul înapoi și apă fierbinte (raport 1:3 orez/apă).',
      },
      {
        stepNumber: 4,
        instruction:
          'Fierbe acoperit la foc mic 15 minute până orezul absoarbe lichidul; presară pătrunjel din belșug.',
      },
    ],
  },
  {
    id: 'ciuperci_umplute_cuptor',
    title: 'Pălării de ciuperci umplute cu mozzarella la cuptor',
    description:
      'Aperitiv cald sau cină lejeră: ciuperci mari champignon umplute cu codițele lor călite cu usturoi și mozzarella rumenită.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 15,
    dietType: 'vegetarian',
    appliances: ['oven', 'air_fryer'],
    moodTags: ['low_calorie', 'speedy', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'ciuperci_champignon', amountPerServing: 250, unit: 'g' },
      { ingredientId: 'mozzarella_rasa', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 5, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 10, unit: 'g' },
      { ingredientId: 'marar_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Rupe codițele ciupercilor și toacă-le mărunt; păstrează pălăriile întregi.',
      },
      {
        stepNumber: 2,
        instruction:
          'Călește codițele tocate cu usturoiul și untul 3 minute, apoi amestecă cu jumătate din mozzarella și mărar.',
      },
      {
        stepNumber: 3,
        instruction:
          'Umple pălăriile ciupercilor cu acest amestec și presară restul de mozzarella deasupra.',
      },
      {
        stepNumber: 4,
        instruction:
          'Coace la 200°C la cuptor sau air fryer timp de 12-14 minute până se gratinează frumos.',
      },
    ],
  },
  {
    id: 'chiftele_legume_airfryer',
    title: 'Pârjoale fragede de dovlecei și morcovi la Air Fryer',
    description:
      'Chifteluțe vegetariene rumenite și aromate din dovlecei rași, morcov dulce, ou, telemea și mărar, fără baie de ulei.',
    prepTimeMinutes: 12,
    cookTimeMinutes: 15,
    dietType: 'vegetarian',
    appliances: ['air_fryer', 'oven'],
    moodTags: ['healthy_comfort', 'low_calorie', 'romanian_classic'],
    ingredients: [
      { ingredientId: 'dovlecei', amountPerServing: 250, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'oua_m', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'telemea_vaca', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'faina_alba', amountPerServing: 30, unit: 'g' },
      { ingredientId: 'marar_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Dă dovleceii și morcovul pe răzătoare, sărează-i și stoarce-i foarte bine de lichid după 5 minute.',
      },
      {
        stepNumber: 2,
        instruction:
          'Amestecă legumele stoarse cu oul, telemeaua zdrobită, mărarul tocat și făina.',
      },
      {
        stepNumber: 3,
        instruction:
          'Modelează chifteluțe plate și așază-le în coșul air fryer-ului pe hârtie perforată.',
      },
      {
        stepNumber: 4,
        instruction:
          'Coace la 190°C timp de 15 minute, întorcându-le la jumătatea timpului până devin aurii.',
      },
    ],
  },
  {
    id: 'somon_cuptor_legume',
    title: 'Somon fraged la cuptor cu dovlecei și ardei copți',
    description:
      'O cină lejeră și plină de acizi grași omega-3: file de somon rumenit la tavă alături de fâșii dulci de legume de sezon.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 18,
    dietType: 'pescatarian',
    appliances: ['oven'],
    moodTags: ['low_calorie', 'high_protein', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'file_somon_proaspat', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'dovlecei', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'ardei_gras_rosu', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'lamaie', amountPerServing: 30, unit: 'g' },
      { ingredientId: 'ulei_masline', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Taie dovleceii și ardeiul în fâșii groase și amestecă-le cu ulei de măsline și sare.',
      },
      {
        stepNumber: 2,
        instruction:
          'Așază legumele pe tavă, iar în centru pune fileul de somon asezonat cu sare și felii de lămâie.',
      },
      {
        stepNumber: 3,
        instruction:
          'Coace la cuptor la 200°C timp de 16-18 minute până când somonul se desface ușor în feliuțe.',
      },
      {
        stepNumber: 4,
        instruction: 'Stropește cu zeamă proaspătă de lămâie chiar înainte de servire.',
      },
    ],
  },
  {
    id: 'salata_calda_pui_crutoane',
    title: 'Salată caldă cu pui rumenit, crutoane și iaurt',
    description:
      'Mix proaspăt de salată verde cu piept de pui cald fript la tigaie, crutoane crocante de pâine toast și dressing de iaurt.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['speedy', 'high_protein', 'low_calorie'],
    ingredients: [
      { ingredientId: 'piept_pui_file', amountPerServing: 180, unit: 'g' },
      { ingredientId: 'salata_verde', amountPerServing: 0.5, unit: 'buc' },
      { ingredientId: 'paine_toast', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'iaurt_grecesc', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'parmezan_ras', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 3, unit: 'g' },
      { ingredientId: 'ulei_masline', amountPerServing: 8, unit: 'ml' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Rumenește fâșiile de piept de pui la tigaie cu sare și piper timp de 7-8 minute.',
      },
      {
        stepNumber: 2,
        instruction:
          'Taie feliile de pâine toast cubulețe și rumenește-le într-o tigaie uscată pentru crutoane crocante.',
      },
      {
        stepNumber: 3,
        instruction:
          'Amestecă iaurtul grecesc cu usturoiul răzuit fin, parmezanul și o linguriță de ulei de măsline.',
      },
      {
        stepNumber: 4,
        instruction:
          'Așază salata verde ruptă bucăți într-un bol, toarnă sosul și adaugă puiul fierbinte și crutoanele.',
      },
    ],
  },
  {
    id: 'ghiveci_legume_cuptor',
    title: 'Ghiveci călugăresc de legume la cuptor',
    description:
      'Rețetă plină de arome din cartofi, dovlecei, morcovi, ceapă și ardei, coapte înăbușit în sos dulce de roșii pasate.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 35,
    dietType: 'vegan',
    appliances: ['oven'],
    moodTags: ['romanian_classic', 'healthy_comfort', 'low_calorie'],
    ingredients: [
      { ingredientId: 'cartofi_albi', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'dovlecei', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'ardei_gras_rosu', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'rosii_pasate', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Curăță toate legumele și taie-le în cuburi mari egale.' },
      {
        stepNumber: 2,
        instruction:
          'Pune legumele într-o tavă adâncă, toarnă passata de roșii, uleiul, sarea și 100ml apă.',
      },
      {
        stepNumber: 3,
        instruction:
          'Acoperă tava cu folie și coace la 190°C timp de 25 de minute; scoate folia și lasă încă 10 minute să scadă.',
      },
      { stepNumber: 4, instruction: 'Presară pătrunjel verde proaspăt tocat la final.' },
    ],
  },
  {
    id: 'pui_kiev_airfryer',
    title: 'Rulouri de pui cu unt aromat la Air Fryer',
    description:
      'Piept de pui fraged rulat cu unt și mărar, trecut prin pesmet crocant și copt la perfecție în aer cald.',
    prepTimeMinutes: 12,
    cookTimeMinutes: 16,
    dietType: 'omnivore',
    appliances: ['air_fryer'],
    moodTags: ['high_protein', 'family_fav', 'fakeaway'],
    ingredients: [
      { ingredientId: 'piept_pui_file', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 25, unit: 'g' },
      { ingredientId: 'pesmet_auriu', amountPerServing: 30, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 4, unit: 'g' },
      { ingredientId: 'marar_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Bate untul moale cu usturoi răzuit, mărar tocat și un praf de sare, formând un rulou mic la rece.',
      },
      {
        stepNumber: 2,
        instruction:
          'Despică pieptul de pui în formă de buzunar, pune bucata de unt aromat în mijloc și fixează cu scobitori.',
      },
      {
        stepNumber: 3,
        instruction: 'Treci puiul prin pesmet auriu și așază-l în coșul air fryer-ului.',
      },
      {
        stepNumber: 4,
        instruction:
          'Gătește la 185°C timp de 16 minute până se rumenește impecabil și untul din interior e topit.',
      },
    ],
  },
  {
    id: 'chili_con_carne_rapid',
    title: 'Chili con carne rapid cu fasole roșie și porumb',
    description:
      'Preparat consistent și picant-aromat din carne tocată, boabe de fasole roșie, porumb dulce și sos de roșii.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 20,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['fakeaway', 'high_protein', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'carne_tocata_amestec', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'fasole_rosie_conserva', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'porumb_dulce', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'rosii_pasate', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'boia_dulce', amountPerServing: 4, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 8, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Călește ceapa în ulei, apoi adaugă carnea tocată și rumenește-o 6-7 minute.',
      },
      { stepNumber: 2, instruction: 'Presară boiaua dulce, sarea și toarnă passata de roșii.' },
      {
        stepNumber: 3,
        instruction:
          'Adaugă fasolea roșie și porumbul dulce scurs, lăsând să fiarbă la foc mic 12 minute.',
      },
      { stepNumber: 4, instruction: 'Servește cald cu lipie sau orez simplu.' },
    ],
  },
  {
    id: 'orez_lapte_cocos_legume',
    title: 'Orez cremos cu lapte de cocos, mazăre și morcovi',
    description:
      'Orez fin și parfumat fiert în lapte de cocos cu mazăre dulce și morcovi cubulețe, complet vegan și hrănitor.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 18,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['healthy_comfort', 'low_calorie'],
    ingredients: [
      { ingredientId: 'orez_basmati', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'lapte_cocos', amountPerServing: 100, unit: 'ml' },
      { ingredientId: 'mazare_congelata', amountPerServing: 70, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 8, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Călește ceapa și morcovul cubulețe în puțin ulei timp de 3 minute.',
      },
      {
        stepNumber: 2,
        instruction: 'Adaugă orezul spălat și călește-l 1 minut până devine sticlos.',
      },
      {
        stepNumber: 3,
        instruction: 'Toarnă laptele de cocos, 120ml apă și sare; fierbe la foc mic 10 minute.',
      },
      {
        stepNumber: 4,
        instruction:
          'Adaugă mazărea congelată și mai fierbe încă 4-5 minute până tot lichidul este absorbit.',
      },
    ],
  },
  {
    id: 'toast_ou_avocado',
    title: 'Toast crocant cu ou ochi, avocado și telemea',
    description:
      'Micul dejun la cină: felii crocante de pâine toast unse cu pastă de avocado, acoperite cu ou ochi moale și telemea sărată.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 5,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'paine_toast', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'oua_m', amountPerServing: 2, unit: 'buc' },
      { ingredientId: 'avocado', amountPerServing: 0.5, unit: 'buc' },
      { ingredientId: 'telemea_vaca', amountPerServing: 30, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 10, unit: 'g' },
      { ingredientId: 'piper_negru', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Prăjește feliile de pâine toast într-o tigaie uscată până devin aurii și crocante.',
      },
      {
        stepNumber: 2,
        instruction: 'Pisează jumătatea de avocado cu furculița și unge uniform feliile de pâine.',
      },
      {
        stepNumber: 3,
        instruction:
          'Fă cele două ouă ochiuri în puțin unt topit, păstrând gălbenușul moale și lichid.',
      },
      {
        stepNumber: 4,
        instruction:
          'Așază ouăle fierbinți peste pâine, presară telemeaua mărunțită și piper negru proaspăt.',
      },
    ],
  },
  {
    id: 'supa_crema_legume_crutoane',
    title: 'Supă cremă catifelată de legume cu crutoane',
    description:
      'Supă cremă fină din cartofi, morcovi, dovlecei și ceapă, servită cu smântână și crutoane crocante de pâine toast.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['healthy_comfort', 'romanian_classic', 'low_calorie'],
    ingredients: [
      { ingredientId: 'cartofi_albi', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'dovlecei', amountPerServing: 100, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'smantana_20', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'paine_toast', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Curăță și taie cuburi cartofii, morcovii, dovlecelul și ceapa.',
      },
      {
        stepNumber: 2,
        instruction: 'Fierbe legumele în apă cu sare timp de 15 minute până când sunt complet moi.',
      },
      {
        stepNumber: 3,
        instruction:
          'Pasează legumele cu un blender vertical împreună cu smântâna până obții o textură catifelată.',
      },
      {
        stepNumber: 4,
        instruction:
          'Rumenește cubulețe de pâine toast într-o tigaie și servește-le deasupra supei fierbinți.',
      },
    ],
  },
];
