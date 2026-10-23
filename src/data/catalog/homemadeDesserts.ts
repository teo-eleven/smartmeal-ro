import { RecipeSource } from '../../types';

/**
 * Homemade desserts: crêpes, rice pudding, biscuit salami, papanași, baked apples.
 *
 * Order matters: the planner breaks ties by catalog order, so recipes keep the position they
 * had in the original single file. See src/data/recipes.ts for how the parts are assembled.
 */
export const HOMEMADE_DESSERTS: RecipeSource[] = [
  // 🍰 DESERT DE CASĂ
  {
    id: 'clatite_subtiri_gem_capsuni',
    title: 'Clătite subțiri tradiționale cu gem de căpșuni',
    description:
      'Clătite românești fine, dantelate și parfumate, umplute generos cu gem delicios de fructe.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['family_fav', 'romanian_classic'],
    ingredients: [
      { ingredientId: 'faina_alba', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'lapte_3_5', amountPerServing: 120, unit: 'ml' },
      { ingredientId: 'oua_m', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'gem_fructe', amountPerServing: 40, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Omogenizează oul cu laptele și făina cu un tel până la obținerea unui aluat fluid.',
      },
      { stepNumber: 2, instruction: 'Încinge tigaia unsă cu câteva picături de ulei.' },
      { stepNumber: 3, instruction: 'Toarnă un polonic subțire de compoziție rotind tigaia.' },
      {
        stepNumber: 4,
        instruction: 'Coace 1 minut pe o parte, întoarce 30 secunde, apoi unge cu gem și rulează.',
      },
    ],
    suitableSlots: ['dessert'],
  },
  {
    id: 'orez_cu_lapte_scortisoara',
    title: 'Orez cremos cu lapte, vanilie și scorțișoară',
    description:
      'Desertul nostalgic al copilăriei românești: orez fiert lent în lapte dulce până devine catifelat, presărat cu scorțișoară.',
    prepTimeMinutes: 2,
    cookTimeMinutes: 18,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['healthy_comfort', 'romanian_classic', 'family_fav'],
    ingredients: [
      { ingredientId: 'orez_basmati', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'lapte_3_5', amountPerServing: 250, unit: 'ml' },
      { ingredientId: 'zahar_tos', amountPerServing: 25, unit: 'g' },
      { ingredientId: 'scortisoara_macinata', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Fierbe orezul cu 100ml de apă până când lichidul este absorbit.',
      },
      {
        stepNumber: 2,
        instruction: 'Adaugă laptele călduț și zahărul, lăsând să fiarbă la foc mic 15 minute.',
      },
      { stepNumber: 3, instruction: 'Amestecă periodic până când orezul devine moale și cremos.' },
      {
        stepNumber: 4,
        instruction: 'Pune orezul în boluri și pudrează generos cu scorțișoară aromată.',
      },
    ],
    suitableSlots: ['dessert', 'breakfast'],
  },
  {
    id: 'salam_de_biscuiti_clasic',
    title: 'Salam de biscuiți clasic de casă cu cacao și nuci',
    description:
      'Desertul emblematic românesc din biscuiți mărunțiți, sirop cald de cacao, unt și miez crocant de nucă.',
    prepTimeMinutes: 12,
    cookTimeMinutes: 3,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'family_fav', 'speedy'],
    ingredients: [
      { ingredientId: 'biscuiti_populari', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'lapte_3_5', amountPerServing: 50, unit: 'ml' },
      { ingredientId: 'unt_82', amountPerServing: 25, unit: 'g' },
      { ingredientId: 'cacao_pudra', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'zahar_tos', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'nuci_miez', amountPerServing: 25, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Rupe biscuiții în bucăți mici și mărunțește nuca într-un bol.',
      },
      {
        stepNumber: 2,
        instruction: 'Încălzește laptele cu untul, zahărul și cacao până obții un sirop lucios.',
      },
      { stepNumber: 3, instruction: 'Toarnă siropul peste biscuiți și amestecă bine compoziția.' },
      {
        stepNumber: 4,
        instruction: 'Rulează compoziția strâns într-o folie și las-o la rece înainte de feliere.',
      },
    ],
    suitableSlots: ['dessert', 'snack'],
  },
  {
    id: 'lava_cake_ciocolata_airfryer',
    title: 'Lava Cake cu ciocolată caldă la Airfryer',
    description:
      'Miez fierbinte lichid de ciocolată amăruie învelit într-un blat pufos, copt în doar 8 minute la airfryer sau cuptor.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 8,
    dietType: 'vegetarian',
    appliances: ['air_fryer'],
    moodTags: ['speedy', 'fakeaway'],
    ingredients: [
      { ingredientId: 'ciocolata_menaj', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 25, unit: 'g' },
      { ingredientId: 'oua_m', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'zahar_tos', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'faina_alba', amountPerServing: 20, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Topește ciocolata împreună cu untul într-un bol termorezistent.',
      },
      {
        stepNumber: 2,
        instruction:
          'Bate oul cu zahărul până devine spumos, apoi încorporează ciocolata topită și făina.',
      },
      { stepNumber: 3, instruction: 'Toarnă aluatul într-o formă mică unsă cu unt.' },
      {
        stepNumber: 4,
        instruction:
          'Coace la 180°C timp de 8 minute la airfryer. Miezul trebuie să rămână lichid.',
      },
    ],
    suitableSlots: ['dessert'],
    tier: 'premium',
  },
  {
    id: 'papanasi_prajiti_smantana_dulceata',
    title: 'Papanași pufoși tradiționali cu smântână și dulceață',
    description:
      'Desertul emblematic românesc: papanași aurii din brânză proaspătă de vaci, serviți fierbinți cu smântână grasă și dulceață aromată.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 10,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'family_fav'],
    ingredients: [
      { ingredientId: 'branza_vaci_proaspata', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'faina_alba', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'oua_m', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'smantana_20', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'gem_fructe', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'zahar_tos', amountPerServing: 15, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Amestecă brânza proaspătă de vaci scursă bine cu oul, zahărul și făina până obții un aluat modelabil.',
      },
      {
        stepNumber: 2,
        instruction:
          'Modelează sferele de papanași, fă o adâncitură în mijloc și formează bobițele pentru vârf.',
      },
      {
        stepNumber: 3,
        instruction:
          'Prăjește-i în ulei încins la foc mediu până devin rumeni și aurii pe ambele părți (4-5 minute).',
      },
      {
        stepNumber: 4,
        instruction:
          'Scoate-i pe șervețele de hârtie, apoi așază-i pe farfurie și toarnă generos smântână rece și dulceață.',
      },
    ],
    suitableSlots: ['dessert'],
    tier: 'medium',
  },
  {
    id: 'mere_coapte_nuca_miere',
    title: 'Mere parfumate la cuptor cu miez de nucă, miere și scorțișoară',
    description:
      'Desert cald, ușor și reconfortant: mere coapte rumenite, umplute cu miez crocant de nucă, miere aurie și scorțișoară măcinată.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 20,
    dietType: 'vegetarian',
    appliances: ['oven'],
    moodTags: ['healthy_comfort', 'low_calorie', 'romanian_classic', 'speedy'],
    ingredients: [
      { ingredientId: 'mere_romanesti', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'nuci_miez', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'miere_poliflora', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'scortisoara_macinata', amountPerServing: 2, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 5, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Spală merele și scobește cu grijă cotorul și semințele, lăsând baza intactă.',
      },
      {
        stepNumber: 2,
        instruction:
          'Umple cavitatea fiecărui măr cu miez mărunțit de nucă, un cubuleț mic de unt și multă scorțișoară.',
      },
      {
        stepNumber: 3,
        instruction:
          'Așază merele într-o tavă și coace la 180°C timp de 20 de minute până coaja se înmoaie și se rumenește.',
      },
      {
        stepNumber: 4,
        instruction: 'Picură miere lichidă peste merele fierbinți chiar înainte de servire.',
      },
    ],
    suitableSlots: ['dessert', 'snack'],
    tier: 'basic',
  },
  {
    id: 'negresa_de_casa_glazura_ciocolata',
    title: 'Negresă pufoasă de casă cu cacao și glazură de ciocolată',
    description:
      'Prăjitură clasică de familie cu aromă intensă de ciocolată, blat umed și moale, acoperită cu o glazură catifelată.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 22,
    dietType: 'vegetarian',
    appliances: ['oven'],
    moodTags: ['family_fav', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'faina_alba', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'cacao_pudra', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'zahar_tos', amountPerServing: 25, unit: 'g' },
      { ingredientId: 'lapte_3_5', amountPerServing: 60, unit: 'ml' },
      { ingredientId: 'unt_82', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'ciocolata_menaj', amountPerServing: 25, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Încălzește laptele cu zahărul, untul și cacaua până se topesc și formează un sirop fin.',
      },
      {
        stepNumber: 2,
        instruction:
          'Păstrează câteva linguri de sirop pentru glazură, iar restul amestecă-l cu făina până obții compoziția de blat.',
      },
      {
        stepNumber: 3,
        instruction:
          'Coace blatul într-o tavă mică tapetată cu hârtie de copt la 180°C timp de 20-22 minute.',
      },
      {
        stepNumber: 4,
        instruction:
          'Topește ciocolata de menaj în siropul păstrat și întinde glazura caldă peste prăjitura feliată.',
      },
    ],
    suitableSlots: ['dessert'],
    tier: 'basic',
  },
];
