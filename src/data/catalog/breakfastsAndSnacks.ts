import { RecipeSource } from '../../types';

/**
 * Breakfast combinations and savoury snacks for film or match nights.
 *
 * Order matters: the planner breaks ties by catalog order, so recipes keep the position they
 * had in the original single file. See src/data/recipes.ts for how the parts are assembled.
 */
export const BREAKFASTS_AND_SNACKS: RecipeSource[] = [
  // 🍳 COMBINAȚII MIC DEJUN
  {
    id: 'terci_ovaz_fructe_miere',
    title: 'Terci cremos de ovăz cu fructe de pădure și miere',
    description:
      'Mic dejun energizant din fulgi fini de ovăz fierți în lapte călduț, îmbogățiți cu fructe de pădure parfumate și miere polifloră.',
    prepTimeMinutes: 3,
    cookTimeMinutes: 7,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'healthy_comfort', 'low_calorie'],
    ingredients: [
      { ingredientId: 'fulgi_ovaz', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'lapte_3_5', amountPerServing: 200, unit: 'ml' },
      { ingredientId: 'fructe_padure_congelate', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'miere_poliflora', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'scortisoara_macinata', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Pune fulgii de ovăz și laptele într-o crăticioară la foc mediu.',
      },
      {
        stepNumber: 2,
        instruction: 'Amestecă continuu timp de 5 minute până când terciul devine legat și fin.',
      },
      {
        stepNumber: 3,
        instruction: 'Adaugă fructele de pădure în ultimul minut pentru a se pătrunde ușor.',
      },
      {
        stepNumber: 4,
        instruction:
          'Răstoarnă într-un bol, decorează cu miere polifloră curgătoare și un praf de scorțișoară.',
      },
    ],
    suitableSlots: ['breakfast'],
  },
  {
    id: 'iaurt_grecesc_nuci_miere',
    title: 'Bol de iaurt grecesc cu nuci crocante, miere și scorțișoară',
    description:
      'Iaurt grecesc 10% dens și catifelat, combinat cu miez de nucă rumenit, miere aurie și aromă discretă de scorțișoară.',
    prepTimeMinutes: 3,
    cookTimeMinutes: 0,
    dietType: 'vegetarian',
    appliances: [],
    moodTags: ['speedy', 'healthy_comfort', 'high_protein'],
    ingredients: [
      { ingredientId: 'iaurt_grecesc_10', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'nuci_miez', amountPerServing: 30, unit: 'g' },
      { ingredientId: 'miere_poliflora', amountPerServing: 25, unit: 'g' },
      { ingredientId: 'scortisoara_macinata', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Rumenește ușor miezul de nucă într-o tigaie uscată timp de 2 minute pentru o aromă intensă.',
      },
      { stepNumber: 2, instruction: 'Pune iaurtul grecesc rece și cremos într-un bol adânc.' },
      { stepNumber: 3, instruction: 'Presară nucile crocante tăiate grosier deasupra iaurtului.' },
      {
        stepNumber: 4,
        instruction: 'Toarnă mierea polifloră în fir subțire și pudrează cu scorțișoară.',
      },
    ],
    suitableSlots: ['breakfast', 'snack'],
  },
  {
    id: 'clatite_pufoase_americane',
    title: 'Pancakes pufoase americane cu miere și fructe',
    description:
      'Clătite americane groase, aurii și extrem de pufoase, preparate rapid la tigaie și servite cu miere și fructe.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['family_fav', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'faina_alba', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'lapte_3_5', amountPerServing: 100, unit: 'ml' },
      { ingredientId: 'oua_m', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'miere_poliflora', amountPerServing: 25, unit: 'g' },
      { ingredientId: 'fructe_padure_congelate', amountPerServing: 50, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Bate oul cu laptele într-un bol, apoi încorporează făina până obții un aluat dens.',
      },
      {
        stepNumber: 2,
        instruction: 'Încinge o tigaie antiaderentă unsă cu puțin ulei la foc mediu-mic.',
      },
      {
        stepNumber: 3,
        instruction:
          'Toarnă aluatul cu un polonic mic și coace până când apar bule la suprafață (2 minute).',
      },
      {
        stepNumber: 4,
        instruction:
          'Întoarce clătita și coace încă 1 minut. Servește cu miere și fructe de pădure.',
      },
    ],
    suitableSlots: ['breakfast', 'dessert'],
  },
  {
    id: 'sandvis_cald_cascaval_sunca',
    title: 'Sandviș cald crocant cu cașcaval topit și șuncă',
    description:
      'Pâine toast rumenită la tigaie cu unt, umplută cu șuncă de Praga fragedă și cașcaval topit abundent.',
    prepTimeMinutes: 3,
    cookTimeMinutes: 6,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['speedy', 'family_fav', 'high_protein'],
    ingredients: [
      { ingredientId: 'paine_toast', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'cascaval_clasic', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'sunca_praga', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 10, unit: 'g' },
      { ingredientId: 'mustar_clasic', amountPerServing: 10, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Unge interiorul feliilor de pâine cu un strat subțire de muștar clasic.',
      },
      { stepNumber: 2, instruction: 'Așază feliile de șuncă și cașcavalul răzuit între felii.' },
      { stepNumber: 3, instruction: 'Unge exteriorul sandvișului cu unt moale.' },
      {
        stepNumber: 4,
        instruction:
          'Rumenește sandvișul într-o tigaie fierbinte câte 3 minute pe fiecare parte până cașcavalul se topește.',
      },
    ],
    suitableSlots: ['breakfast', 'lunch', 'snack'],
  },
  {
    id: 'budinca_chia_fructe_padure',
    title: 'Budincă de chia cu lapte de cocos și piure de fructe',
    description:
      '100% vegetal. Mic dejun sau gustare reconfortantă din semințe de chia hidratate în lapte de cocos, servite cu fructe de pădure.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    dietType: 'vegan',
    appliances: [],
    moodTags: ['speedy', 'healthy_comfort', 'low_calorie'],
    ingredients: [
      { ingredientId: 'seminte_chia', amountPerServing: 35, unit: 'g' },
      { ingredientId: 'lapte_cocos', amountPerServing: 150, unit: 'ml' },
      { ingredientId: 'gem_fructe', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'fructe_padure_congelate', amountPerServing: 60, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Omogenizează semințele de chia cu laptele de cocos și gemul de fructe într-un pahar.',
      },
      {
        stepNumber: 2,
        instruction:
          'Lasă compoziția la rece 15 minute pentru a căpăta o textură densă de budincă.',
      },
      {
        stepNumber: 3,
        instruction: 'Pasează fructele de pădure cu o furculiță pentru a obține un sos proaspăt.',
      },
      {
        stepNumber: 4,
        instruction: 'Toarnă sosul de fructe deasupra budincii de chia înainte de servire.',
      },
    ],
    suitableSlots: ['breakfast', 'snack', 'dessert'],
  },
  {
    id: 'omleta_cremoasa_spanac_branza',
    title: 'Omletă pufoasă cu spanac proaspăt și telemea',
    description:
      'Ouă proaspete bătute spumă cu frunze tinere de spanac trase în unt și telemea sărată de vacă.',
    prepTimeMinutes: 3,
    cookTimeMinutes: 5,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'high_protein', 'low_calorie'],
    ingredients: [
      { ingredientId: 'oua_m', amountPerServing: 2, unit: 'buc' },
      { ingredientId: 'spanac_baby', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'telemea_vaca', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 10, unit: 'g' },
      { ingredientId: 'piper_negru', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Sotează spanacul proaspăt în tigaie cu unt timp de 1 minut până se înmoaie.',
      },
      {
        stepNumber: 2,
        instruction: 'Bate ouăle cu piper și toarnă-le uniform peste spanac la foc mediu-mic.',
      },
      {
        stepNumber: 3,
        instruction:
          'Când omleta prinde crustă, presară telemeaua mărunțită pe jumătate din suprafață.',
      },
      {
        stepNumber: 4,
        instruction:
          'Împăturește omleta în două și lasă brânza să devină cremoasă timp de 30 secunde.',
      },
    ],
    suitableSlots: ['breakfast'],
  },

  // 🍿 RONȚĂIALĂ / GUSTĂRI (FILM, MECI & RELAXARE)
  {
    id: 'popcorn_aromat_parmezan_boia',
    title: 'Popcorn proaspăt de casă cu parmezan și boia afumată',
    description:
      'Floricele de porumb proaspete pocnite în oală, pudrate cu parmezan fin, boia dulce și sare. Gustarea supremă de film sau meci.',
    prepTimeMinutes: 2,
    cookTimeMinutes: 5,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'family_fav', 'fakeaway'],
    ingredients: [
      { ingredientId: 'porumb_popcorn', amountPerServing: 70, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 15, unit: 'ml' },
      { ingredientId: 'parmezan_ras', amountPerServing: 25, unit: 'g' },
      { ingredientId: 'boia_dulce', amountPerServing: 3, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Încinge uleiul într-o oală adâncă cu fund gros la foc mediu.',
      },
      {
        stepNumber: 2,
        instruction:
          'Adaugă boabele de porumb, acoperă cu capac și mișcă periodic oala pe flacără.',
      },
      {
        stepNumber: 3,
        instruction: 'Ia oala de pe foc când pocniturile se răresc la 2-3 secunde.',
      },
      {
        stepNumber: 4,
        instruction:
          'Toarnă popcornul fierbinte într-un bol mare, adaugă parmezanul, boiaua și sarea și scutură bine bolul.',
      },
    ],
    suitableSlots: ['snack'],
  },
  {
    id: 'guacamole_chips_nachos',
    title: 'Guacamole proaspăt cu tortilla chips crocante',
    description:
      'Avocado copt și cremos zdrobit cu roșii dulci, lămâie proaspătă, ceapă roșie fină și tortilla chips sărate.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 0,
    dietType: 'vegan',
    appliances: [],
    moodTags: ['speedy', 'healthy_comfort', 'fakeaway'],
    ingredients: [
      { ingredientId: 'avocado', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'rosii_cherry', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'lamaie', amountPerServing: 30, unit: 'g' },
      { ingredientId: 'ceapa_rosie', amountPerServing: 30, unit: 'g' },
      { ingredientId: 'tortilla_chips_nachos', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Taie avocado în două, îndepărtează sâmburele și scoate pulpa cu o lingură.',
      },
      {
        stepNumber: 2,
        instruction:
          'Zdrobește pulpa cu o furculiță într-un bol până la textura dorită (ușor rustică).',
      },
      {
        stepNumber: 3,
        instruction:
          'Încorporează roșiile cherry cubulețe, ceapa tocată fin, sarea și sucul proaspăt de lămâie.',
      },
      { stepNumber: 4, instruction: 'Servește imediat cu tortilla chips crocante de porumb.' },
    ],
    suitableSlots: ['snack'],
  },
  {
    id: 'hummus_cremos_legume_crocante',
    title: 'Hummus cremos de casă cu bastonașe crocante de legume',
    description:
      'Năut boabe pasat fin cu ulei de măsline extravirgin, usturoi și zeamă de lămâie, servit cu bastonașe proaspete de morcov și castravete.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    dietType: 'vegan',
    appliances: [],
    moodTags: ['speedy', 'healthy_comfort', 'low_calorie'],
    ingredients: [
      { ingredientId: 'naut_conserva', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'ulei_masline', amountPerServing: 20, unit: 'ml' },
      { ingredientId: 'usturoi', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'lamaie', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'castraveti', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Scurge năutul boabe, păstrând 2 linguri din lichidul din conservă.',
      },
      {
        stepNumber: 2,
        instruction:
          'Pasează la blender năutul cu uleiul de măsline, usturoiul zdrobit, zeama de lămâie și sarea.',
      },
      { stepNumber: 3, instruction: 'Mixează până obții o pastă fină și mătăsoasă.' },
      {
        stepNumber: 4,
        instruction:
          'Taie morcovii și castraveții în bastonașe lungi și servește-le alături de hummus.',
      },
    ],
    suitableSlots: ['snack', 'lunch'],
  },
  {
    id: 'bruschete_rosii_usturoi_busuioc',
    title: 'Bruschete crocante cu roșii dulci, usturoi și ulei de măsline',
    description:
      'Pâine toast rumenită și frecată cu usturoi aromat, acoperită cu roșii cuburi, oregano și ulei de măsline extravirgin.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 5,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['speedy', 'healthy_comfort', 'family_fav'],
    ingredients: [
      { ingredientId: 'paine_toast', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'rosii_proaspete', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'ulei_masline', amountPerServing: 15, unit: 'ml' },
      { ingredientId: 'oregano_uscat', amountPerServing: 2, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Prăjește feliile de pâine în tigaie până devin aurii și crocante.',
      },
      {
        stepNumber: 2,
        instruction: 'Freacă feliile calde cu un cățel de usturoi tăiat pe jumătate.',
      },
      {
        stepNumber: 3,
        instruction: 'Amestecă roșiile tăiate cubulețe cu uleiul de măsline, oregano și sarea.',
      },
      {
        stepNumber: 4,
        instruction: 'Pune amestecul de roșii peste feliile de pâine și servește imediat.',
      },
    ],
    suitableSlots: ['snack'],
  },
  {
    id: 'chipsuri_cartofi_airfryer',
    title: 'Chipsuri aurii de cartofi la airfryer cu boia și sare',
    description:
      'Feliuțe subțiri de cartofi rumenite crocant la airfryer fără exces de grăsime, condimentate cu boia dulce și sare.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 12,
    dietType: 'vegan',
    appliances: ['air_fryer'],
    moodTags: ['speedy', 'fakeaway', 'low_calorie'],
    ingredients: [
      { ingredientId: 'cartofi_albi', amountPerServing: 250, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'boia_dulce', amountPerServing: 2, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Taie cartofii în felii foarte subțiri și usucă-i bine cu un prosop de hârtie.',
      },
      {
        stepNumber: 2,
        instruction: 'Amestecă rondelele de cartof cu uleiul, sarea și boiaua dulce.',
      },
      {
        stepNumber: 3,
        instruction: 'Pune feliile în coșul airfryer-ului fără a le înghesui excesiv.',
      },
      {
        stepNumber: 4,
        instruction: 'Coace la 180°C timp de 12-14 minute, agitând coșul la jumătatea timpului.',
      },
    ],
    suitableSlots: ['snack'],
  },
  {
    id: 'mix_nuci_seminte_miere',
    title: 'Mix energizant de nuci rumenite și semințe cu miere',
    description:
      'Miez de nucă românească și semințe crocante de chia rumenite la tigaie cu miere și parfum de scorțișoară.',
    prepTimeMinutes: 2,
    cookTimeMinutes: 4,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'healthy_comfort', 'high_protein'],
    ingredients: [
      { ingredientId: 'nuci_miez', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'seminte_chia', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'miere_poliflora', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'scortisoara_macinata', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Rumenește nucile într-o tigaie uscată la foc mic timp de 3 minute.',
      },
      {
        stepNumber: 2,
        instruction: 'Oprește focul, adaugă mierea și scorțișoara și amestecă pentru a le glazura.',
      },
      { stepNumber: 3, instruction: 'Presară semințele de chia care vor îmbrăca nucile călduțe.' },
      { stepNumber: 4, instruction: 'Lasă să se răcească 5 minute și savurează la film sau meci.' },
    ],
    suitableSlots: ['snack'],
  },
];
