import { RecipeSource } from '../../types';

/**
 * The original catalog, first half: everyday mains and breakfasts.
 *
 * Order matters: the planner breaks ties by catalog order, so recipes keep the position they
 * had in the original single file. See src/data/recipes.ts for how the parts are assembled.
 */
export const CLASSIC_RECIPES_PART_1: RecipeSource[] = [
  {
    id: 'pui_airfryer_cartofi',
    title: 'Pui crocant la Air Fryer cu cartofi wedges',
    description:
      'Bucăți fragede de piept de pui marinate cu boia și usturoi, alături de cartofi wedges rumeniți fără exces de ulei.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    dietType: 'omnivore',
    appliances: ['air_fryer'],
    moodTags: ['speedy', 'high_protein', 'family_fav'],
    ingredients: [
      { ingredientId: 'piept_pui_file', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'cartofi_albi', amountPerServing: 250, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 15, unit: 'ml' },
      { ingredientId: 'boia_dulce', amountPerServing: 5, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 5, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
      { ingredientId: 'piper_negru', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Taie cartofii în felii wedges groase și pieptul de pui în fâșii uniforme.',
      },
      {
        stepNumber: 2,
        instruction:
          'Amestecă puiul și cartofii cu uleiul, boiaua, usturoiul zdrobit, sarea și piperul.',
      },
      {
        stepNumber: 3,
        instruction: 'Așază cartofii în coșul air fryer-ului la 190°C timp de 12 minute.',
      },
      {
        stepNumber: 4,
        instruction:
          'Adaugă și fâșiile de pui și continuă gătirea încă 8-10 minute la 200°C până când carnea e suculentă și rumenită.',
      },
    ],
  },
  {
    id: 'mamaliga_branza_smantana',
    title: 'Mămăliguță caldă cu telemea și smântână',
    description:
      'Clasicul confort românesc: mămăligă aburindă servită cu telemea sfărâmată, smântână grasă și unt topit.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 15,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'healthy_comfort', 'speedy'],
    ingredients: [
      { ingredientId: 'malai_superior', amountPerServing: 100, unit: 'g' },
      { ingredientId: 'telemea_vaca', amountPerServing: 90, unit: 'g' },
      { ingredientId: 'smantana_20', amountPerServing: 70, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Pune apa la fiert cu o linguriță de sare într-o cratiță.' },
      {
        stepNumber: 2,
        instruction:
          'Când apa începe să clocotească, toarnă mălaiul în ploaie, amestecând energic cu un tel.',
      },
      {
        stepNumber: 3,
        instruction:
          'Fierbe mămăliga la foc mic timp de 10-12 minute, amestecând des cu o lingură de lemn.',
      },
      {
        stepNumber: 4,
        instruction:
          'Răstoarnă mămăliga caldă în farfurie, adaugă untul să se topească, apoi presară telemeaua rasă și smântâna.',
      },
    ],
  },
  {
    id: 'paste_carbonara_rapide',
    title: 'Spaghete cremoase rapide cu ou și parmezan',
    description:
      'Paste italienești preparate în mai puțin de 20 de minute, legate fin cu ou proaspăt și parmezan aromat.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 15,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'family_fav', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'paste_spaghete', amountPerServing: 100, unit: 'g' },
      { ingredientId: 'oua_m', amountPerServing: 2, unit: 'buc' },
      { ingredientId: 'parmezan_ras', amountPerServing: 25, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'piper_negru', amountPerServing: 2, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Fierbe spaghetele în multă apă cu sare conform instrucțiunilor de pe pachet.',
      },
      {
        stepNumber: 2,
        instruction:
          'Bate ouăle într-un bol împreună cu parmezanul ras și mult piper negru proaspăt măcinat.',
      },
      {
        stepNumber: 3,
        instruction: 'Scurge pastele, păstrând o jumătate de cană din apa în care au fiert.',
      },
      {
        stepNumber: 4,
        instruction:
          'Amestecă pastele fierbinți cu untul, ia cratița de pe foc și toarnă compoziția de ouă, amestecând rapid pentru un sos mătăsos.',
      },
    ],
  },
  {
    id: 'somon_la_tigaie_orez',
    title: 'File de somon la tigaie cu orez basmati și lămâie',
    description:
      'Somon cu crustă aurie și interior fraged, acompaniat de orez basmati aromat și zeamă proaspătă de lămâie.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 18,
    dietType: 'pescatarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'high_protein', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'file_somon_proaspat', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'orez_basmati', amountPerServing: 75, unit: 'g' },
      { ingredientId: 'lamaie', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'ulei_masline', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
      { ingredientId: 'piper_negru', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Clătește orezul basmati și pune-l la fiert în apă cu sare (proporție 1:2) timp de 12-14 minute.',
      },
      {
        stepNumber: 2,
        instruction:
          'Condimentează fileul de somon cu sare, piper și câteva picături de ulei de măsline.',
      },
      {
        stepNumber: 3,
        instruction:
          'Prăjește somonul într-o tigaie încinsă timp de 4 minute pe partea cu pielea, apoi încă 3 minute pe cealaltă parte.',
      },
      {
        stepNumber: 4,
        instruction:
          'Servește somonul cald peste orezul presărat cu pătrunjel tocat și felii de lămâie proaspătă.',
      },
    ],
  },
  {
    id: 'quesadilla_pui_cascaval',
    title: 'Quesadilla crocantă cu pui și cașcaval topit',
    description:
      'Lipii tortilla umplute cu fâșii suculente de pui la tigaie, ardei gras roșu și un strat generos de mozzarella topită.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['speedy', 'fakeaway', 'high_protein'],
    ingredients: [
      { ingredientId: 'lipii_tortilla', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'piept_pui_file', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'mozzarella_rasa', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'ardei_gras_rosu', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'boia_dulce', amountPerServing: 3, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Taie pieptul de pui și ardeiul gras în fâșii subțiri.' },
      {
        stepNumber: 2,
        instruction:
          'Trage puiul și ardeiul la tigaie în puțin ulei încins cu boia și sare timp de 6-7 minute.',
      },
      {
        stepNumber: 3,
        instruction:
          'Așază lipia într-o tigaie curată, pune pe o jumătate compoziția de pui și mozzarella, apoi împăturește.',
      },
      {
        stepNumber: 4,
        instruction:
          'Rumenește pe ambele părți la foc mediu până când lipia este crocantă și brânza s-a topit complet.',
      },
    ],
  },
  {
    id: 'tocanita_ciuperci_mamaliga',
    title: 'Tocăniță de ciuperci cu sos de roșii și mămăligă',
    description:
      'Mâncare de post tradițională din ciuperci champignon călite cu ceapă, usturoi, passata dulce și mărar verde.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'healthy_comfort', 'low_calorie'],
    ingredients: [
      { ingredientId: 'ciuperci_champignon', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'rosii_pasate', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 8, unit: 'g' },
      { ingredientId: 'malai_superior', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'marar_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Călește ceapa tocată mărunt în ulei până devine translucidă.',
      },
      {
        stepNumber: 2,
        instruction:
          'Adaugă ciupercile feliate și usturoiul mărunțit, lăsându-le să-și lase apa timp de 8 minute.',
      },
      {
        stepNumber: 3,
        instruction:
          'Toarnă passata de roșii, potrivește de sare și fierbe înăbușit 10 minute până scade sosul.',
      },
      {
        stepNumber: 4,
        instruction:
          'Fă o mămăligă caldă separat și servește tocănița presărată din belșug cu mărar proaspăt.',
      },
    ],
  },
  {
    id: 'paste_bolognese_clasice',
    title: 'Penne Bolognese cu carne tocată și sos aromat',
    description:
      'Sos bogat de carne tocată rumenită cu ceapă, morcov, pastă de tomate și busuioc/oregano peste penne al dente.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['family_fav', 'healthy_comfort', 'high_protein'],
    ingredients: [
      { ingredientId: 'paste_penne', amountPerServing: 90, unit: 'g' },
      { ingredientId: 'carne_tocata_amestec', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'rosii_pasate', amountPerServing: 130, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'oregano_uscat', amountPerServing: 2, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Încinge uleiul și călește ceapa tocată fin și morcovul dat pe răzătoare timp de 5 minute.',
      },
      {
        stepNumber: 2,
        instruction:
          'Adaugă carnea tocată și rumenește-o bine desfăcând cocoloașele cu lingura de lemn.',
      },
      {
        stepNumber: 3,
        instruction:
          'Toarnă passata de roșii, sarea și oregano, apoi lasă sosul să fiarbă la foc mic 15-20 de minute.',
      },
      {
        stepNumber: 4,
        instruction:
          'Fierbe pastele penne al dente, scurge-le și combină-le direct cu sosul aromat.',
      },
    ],
  },
  {
    id: 'snitele_pui_cuptor',
    title: 'Șnițele fragede de pui la cuptor cu salată de varză',
    description:
      'Piept de pui în crustă aurie de pesmet copt la cuptor, fără prăjeală grea, servit cu salată crocantă de varză albă.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    dietType: 'omnivore',
    appliances: ['oven'],
    moodTags: ['family_fav', 'healthy_comfort', 'high_protein'],
    ingredients: [
      { ingredientId: 'piept_pui_file', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'oua_m', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'pesmet_auriu', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'faina_alba', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'varza_alba', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Bate ușor feliile de piept de pui și condimentează-le cu sare și piper.',
      },
      {
        stepNumber: 2,
        instruction: 'Treci fiecare bucată prin făină, ou bătut și apoi pesmet auriu.',
      },
      {
        stepNumber: 3,
        instruction:
          'Așază șnițelele pe o tavă cu hârtie de copt, pulverizează puțin ulei și coace-le la 200°C timp de 18-20 de minute.',
      },
      {
        stepNumber: 4,
        instruction:
          'Toacă varza fin, freac-o cu sare și un strop de ulei/oțet și servește alături de șnițelele calde.',
      },
    ],
  },
  {
    id: 'shakshuka_oua_rosii',
    title: 'Shakshuka aromată cu roșii, ardei și telemea',
    description:
      'Ouă gătite direct într-un sos dens de roșii cuburi, ardei kapia și ceapă călită, presărate cu telemea sfărâmată.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 15,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'healthy_comfort', 'low_calorie'],
    ingredients: [
      { ingredientId: 'oua_m', amountPerServing: 2, unit: 'buc' },
      { ingredientId: 'rosii_cuburi', amountPerServing: 180, unit: 'g' },
      { ingredientId: 'ardei_gras_rosu', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'telemea_vaca', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'ulei_masline', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Călește ceapa și ardeiul gras tăiat feliuțe în ulei de măsline timp de 5 minute.',
      },
      {
        stepNumber: 2,
        instruction:
          'Adaugă roșiile cuburi și lasă sosul să clocotească ușor 6-7 minute până se îngroașă.',
      },
      {
        stepNumber: 3,
        instruction: 'Formează două mici adâncituri în sos și sparge cu grijă ouăle în ele.',
      },
      {
        stepNumber: 4,
        instruction:
          'Acoperă tigaia cu un capac și lasă ouăle 4-5 minute până când albușul e făcut și gălbenușul moale. Presară telemea și pătrunjel.',
      },
    ],
  },
  {
    id: 'orez_pui_legume_wok',
    title: 'Orez prăjit la tigaie cu pui și legume proaspete',
    description:
      'Stil wok rapid acasă: orez basmati sărat cu cubulețe de pui, mazăre, morcovi și sos aromat de soia.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['speedy', 'fakeaway', 'high_protein'],
    ingredients: [
      { ingredientId: 'piept_pui_file', amountPerServing: 180, unit: 'g' },
      { ingredientId: 'orez_basmati', amountPerServing: 75, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'mazare_congelata', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'sos_soia', amountPerServing: 20, unit: 'ml' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Fierbe orezul basmati în prealabil și lasă-l să se răcească ușor.',
      },
      {
        stepNumber: 2,
        instruction:
          'Rumeneste cubulețele de piept de pui la foc iute într-o tigaie mare sau wok timp de 5 minute.',
      },
      {
        stepNumber: 3,
        instruction:
          'Adaugă ceapa, morcovul tăiat bastonașe fine și mazărea, călindu-le încă 4 minute.',
      },
      {
        stepNumber: 4,
        instruction:
          'Încorporează orezul fiert și toarnă sosul de soia, amestecând energic pe foc mare încă 2-3 minute.',
      },
    ],
  },
  {
    id: 'chiftelute_marinate_sos',
    title: 'Chifteluțe marinate în sos de roșii cu piure de cartofi',
    description:
      'Chifteluțe rumenite din carne tocată cu mărar și usturoi, scăzute în sos bogat de roșii cu garnitură de piure cremos.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 25,
    dietType: 'omnivore',
    appliances: ['hob', 'oven'],
    moodTags: ['romanian_classic', 'family_fav', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'carne_tocata_amestec', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'oua_m', amountPerServing: 0.5, unit: 'buc' },
      { ingredientId: 'cartofi_albi', amountPerServing: 250, unit: 'g' },
      { ingredientId: 'rosii_pasate', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'lapte_3_5', amountPerServing: 50, unit: 'ml' },
      { ingredientId: 'unt_82', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 5, unit: 'g' },
      { ingredientId: 'marar_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Amestecă carnea tocată cu oul, usturoiul zdrobit, mărarul tocat și sare, formând biluțe mici.',
      },
      {
        stepNumber: 2,
        instruction: 'Coace chifteluțele la cuptor la 200°C timp de 15 minute până prind crustă.',
      },
      {
        stepNumber: 3,
        instruction:
          'Fierbe cartofii tăiați cuburi și zdrobește-i cu untul cald și laptele pentru piure.',
      },
      {
        stepNumber: 4,
        instruction:
          'Transferă chifteluțele într-o cratiță cu sosul de passata încălzit și lasă-le să scadă 7-8 minute.',
      },
    ],
  },
  {
    id: 'salata_greceasca_telemea',
    title: 'Salată grecească răcoroasă cu telemea de vacă',
    description:
      'Salată proaspătă și rapidă cu roșii dulci, castraveți crocanți, ardei gras, oregano și cuburi de telemea românească.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    dietType: 'vegetarian',
    appliances: [], // no appliance strictly required, hob used as neutral
    moodTags: ['speedy', 'low_calorie', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'rosii_proaspete', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'castraveti', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'ardei_gras_rosu', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'ceapa_rosie', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'telemea_vaca', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'ulei_masline', amountPerServing: 12, unit: 'ml' },
      { ingredientId: 'oregano_uscat', amountPerServing: 2, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Spală bine legumele și taie roșiile și castraveții în bucăți generoase.',
      },
      { stepNumber: 2, instruction: 'Taie ardeiul feliuțe și ceapa roșie solzișori subțiri.' },
      {
        stepNumber: 3,
        instruction:
          'Pune toate legumele într-un bol mare, asezonează cu sare, ulei de măsline și oregano.',
      },
      {
        stepNumber: 4,
        instruction: 'Așază cuburile de telemea deasupra și amestecă ușor înainte de servire.',
      },
    ],
  },
  {
    id: 'muschiulet_porc_cuptor',
    title: 'Mușchiuleț de porc fraged la cuptor cu cartofi rumeni',
    description:
      'Carne fragedă de porc rumenită la cuptor cu usturoi și boia, însoțită de cartofi rumeniți cu crustă crocantă.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 30,
    dietType: 'omnivore',
    appliances: ['oven'],
    moodTags: ['high_protein', 'healthy_comfort', 'family_fav'],
    ingredients: [
      { ingredientId: 'muschiulet_porc', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'cartofi_albi', amountPerServing: 250, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 8, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 12, unit: 'ml' },
      { ingredientId: 'boia_dulce', amountPerServing: 4, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Curăță cartofii și taie-i cuburi mari; unge-i cu jumătate din ulei, boia și sare.',
      },
      {
        stepNumber: 2,
        instruction:
          'Masează mușchiulețul de porc cu usturoi zdrobit, sare, piper și restul de ulei.',
      },
      {
        stepNumber: 3,
        instruction:
          'Așază carnea și cartofii într-o tavă de cuptor la 190°C timp de 25-30 de minute.',
      },
      {
        stepNumber: 4,
        instruction: 'Lasă mușchiulețul să se odihnească 5 minute înainte de a-l felia frumos.',
      },
    ],
  },
  {
    id: 'paste_ton_rosii',
    title: 'Penne rapide cu ton și sos aromat de roșii',
    description:
      'Cină gata în 15 minute: paste penne cu bucăți de ton fraged, sos de roșii cuburi, usturoi și pătrunjel proaspăt.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 12,
    dietType: 'pescatarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'low_calorie', 'high_protein'],
    ingredients: [
      { ingredientId: 'paste_penne', amountPerServing: 90, unit: 'g' },
      { ingredientId: 'ton_conserva', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'rosii_cuburi', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 6, unit: 'g' },
      { ingredientId: 'ulei_masline', amountPerServing: 8, unit: 'ml' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Pune pastele la fiert în apă cu sare conform timpului indicat pe pachet.',
      },
      {
        stepNumber: 2,
        instruction:
          'Într-o tigaie, călește usturoiul feliat în uleiul de măsline timp de 1 minut.',
      },
      {
        stepNumber: 3,
        instruction:
          'Adaugă roșiile cuburi și tonul scurs, lăsând sosul să dea în clocot 6-7 minute.',
      },
      {
        stepNumber: 4,
        instruction: 'Combină pastele fierte cu sosul fierbinte și presară pătrunjel verde tocat.',
      },
    ],
  },
  {
    id: 'burger_pui_crocant',
    title: 'Burger de pui crocant la Air Fryer cu salată',
    description:
      'Chifla pufoasă rumenită, piept de pui crocant gătit fără ulei greu, salată verde și sos cremos de iaurt cu muștar.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 12,
    dietType: 'omnivore',
    appliances: ['air_fryer'],
    moodTags: ['fakeaway', 'high_protein', 'family_fav'],
    ingredients: [
      { ingredientId: 'chifle_burger', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'piept_pui_file', amountPerServing: 160, unit: 'g' },
      { ingredientId: 'pesmet_auriu', amountPerServing: 30, unit: 'g' },
      { ingredientId: 'iaurt_grecesc', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'mustar_clasic', amountPerServing: 10, unit: 'g' },
      { ingredientId: 'salata_verde', amountPerServing: 0.3, unit: 'buc' },
      { ingredientId: 'rosii_proaspete', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Aplatizează pieptul de pui, condimentează-l cu sare și tăvălește-l prin pesmet auriu.',
      },
      {
        stepNumber: 2,
        instruction:
          'Gătește puiul la air fryer la 195°C timp de 10-12 minute până devine foarte crocant.',
      },
      {
        stepNumber: 3,
        instruction: 'Amestecă iaurtul grecesc cu muștarul pentru sosul cremos al burgerului.',
      },
      {
        stepNumber: 4,
        instruction:
          'Taie chifla, rumenește-o 1 minut, adaugă sosul, frunze de salată, felii de roșii și puiul cald.',
      },
    ],
  },
  {
    id: 'ciorba_radauteana_rapida',
    title: 'Ciorbă rădăuțeană rapidă de pui cu smântână și mujdei',
    description:
      'Gust autentic românesc pregătit rapid: fâșii de pui în supă bogată de legume, legată cu gălbenuș, smântână și oțet/lămâie.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'healthy_comfort', 'high_protein'],
    ingredients: [
      { ingredientId: 'piept_pui_file', amountPerServing: 180, unit: 'g' },
      { ingredientId: 'smantana_20', amountPerServing: 70, unit: 'g' },
      { ingredientId: 'oua_m', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'morcovi', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 8, unit: 'g' },
      { ingredientId: 'lamaie', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Pune pieptul de pui la fiert în apă cu sare, ceapă întreagă și morcov timp de 15 minute.',
      },
      {
        stepNumber: 2,
        instruction:
          'Scoate carnea și taie-o în fâșii subțiri, apoi reintrodu-o în supa strecurată.',
      },
      {
        stepNumber: 3,
        instruction:
          'Într-un bol, bate gălbenușul cu smântâna și usturoiul pisat; temperează cu două polonice de supă caldă.',
      },
      {
        stepNumber: 4,
        instruction:
          'Toarnă amestecul înapoi în oală la foc foarte mic, adaugă zeamă de lămâie după gust și pătrunjel tocat.',
      },
    ],
  },
  {
    id: 'dovlecei_pane_cuptor',
    title: 'Dovlecei aromați la cuptor cu sos de usturoi și iaurt',
    description:
      'Rondele de dovlecei trecute prin pesmet auriu și coapte rumen la cuptor, acompaniate de sos proaspăt de iaurt.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    dietType: 'vegetarian',
    appliances: ['oven'],
    moodTags: ['low_calorie', 'healthy_comfort', 'speedy'],
    ingredients: [
      { ingredientId: 'dovlecei', amountPerServing: 250, unit: 'g' },
      { ingredientId: 'pesmet_auriu', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'oua_m', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'iaurt_grecesc', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 5, unit: 'g' },
      { ingredientId: 'marar_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 8, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Taie dovleceii rondele de 1 cm și presară-i cu sare, lăsându-i 5 minute să se scurgă.',
      },
      {
        stepNumber: 2,
        instruction: 'Treci feliile prin ou bătut și apoi pesmet auriu amestecat cu mărar.',
      },
      {
        stepNumber: 3,
        instruction:
          'Așază-le pe o tavă cu hârtie de copt și coace-le la 200°C timp de 18-20 de minute până devin crocante.',
      },
      {
        stepNumber: 4,
        instruction:
          'Servește cu sosul rece preparat din iaurt grecesc, usturoi mărunțit și mărar proaspăt.',
      },
    ],
  },
  {
    id: 'pulpe_pui_airfryer_cartofi',
    title: 'Pulpe de pui rumenite la Air Fryer cu cartofi aromați',
    description:
      'Pulpe dezosate crocante la exterior și suculente la interior, pregătite rapid cu mirodenii tradiționale.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 20,
    dietType: 'omnivore',
    appliances: ['air_fryer'],
    moodTags: ['speedy', 'high_protein', 'fakeaway'],
    ingredients: [
      { ingredientId: 'pulpe_pui_dezosate', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'cartofi_albi', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'boia_dulce', amountPerServing: 4, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 5, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Taie pulpele în bucăți potrivite și cartofii felii subțiri.' },
      {
        stepNumber: 2,
        instruction: 'Condimentează totul cu boia dulce, usturoi răzuit, sare și puțin ulei.',
      },
      {
        stepNumber: 3,
        instruction:
          'Așază în air fryer la 190°C timp de 15 minute, scuturând coșul la jumătatea timpului.',
      },
      {
        stepNumber: 4,
        instruction:
          'Crește temperatura la 205°C pentru ultimele 4 minute pentru o crustă super crocantă.',
      },
    ],
  },
  {
    id: 'curry_pui_lapte_cocos',
    title: 'Curry cremos de pui cu lapte de cocos și orez',
    description:
      'Bucățele de pui fierte molcom într-un sos mătăsos de lapte de cocos, legume și orez basmati la abur.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 18,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['fakeaway', 'healthy_comfort', 'high_protein'],
    ingredients: [
      { ingredientId: 'piept_pui_file', amountPerServing: 180, unit: 'g' },
      { ingredientId: 'lapte_cocos', amountPerServing: 120, unit: 'ml' },
      { ingredientId: 'orez_basmati', amountPerServing: 75, unit: 'g' },
      { ingredientId: 'ardei_gras_rosu', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Pune orezul la fiert în apă cu sare conform instrucțiunilor de pe ambalaj.',
      },
      {
        stepNumber: 2,
        instruction:
          'Călește cuburile de pui în ulei 4-5 minute, apoi adaugă ceapa și ardeiul feliate.',
      },
      {
        stepNumber: 3,
        instruction:
          'Toarnă laptele de cocos, potrivește de sare și lasă sosul să fiarbă la foc mediu 10 minute.',
      },
      {
        stepNumber: 4,
        instruction: 'Servește curry-ul fierbinte turnat peste orezul basmati pufos.',
      },
    ],
  },
];
