import { RecipeSource } from '../../types';

/**
 * Plant-based porridges, toasts and light desserts.
 *
 * Order matters: the planner breaks ties by catalog order, so recipes keep the position they
 * had in the original single file. See src/data/recipes.ts for how the parts are assembled.
 */
export const LIGHT_BREAKFASTS_AND_DESSERTS: RecipeSource[] = [
  {
    id: 'terci_ovaz_vegan_banane',
    title: 'Terci de ovăz cu băutură de ovăz, banane și nucă',
    description:
      '100% vegetal. Fulgi de ovăz fierți cremos în băutură de ovăz, cu banane caramelizate natural și miez de nucă.',
    prepTimeMinutes: 3,
    cookTimeMinutes: 7,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['speedy', 'healthy_comfort', 'low_calorie'],
    ingredients: [
      { ingredientId: 'fulgi_ovaz', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'lapte_vegetal_ovaz', amountPerServing: 220, unit: 'ml' },
      { ingredientId: 'banane', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'nuci_miez', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'scortisoara_macinata', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Pune fulgii de ovăz și băutura de ovăz într-o crăticioară la foc mediu.',
      },
      {
        stepNumber: 2,
        instruction: 'Amestecă 5-6 minute până când terciul se leagă și devine cremos.',
      },
      {
        stepNumber: 3,
        instruction: 'Feliază banana și adaugă jumătate în terci, lăsând-o să se înmoaie un minut.',
      },
      {
        stepNumber: 4,
        instruction: 'Servește cu restul de banană, nuca zdrobită și un praf de scorțișoară.',
      },
    ],
    suitableSlots: ['breakfast'],
    tier: 'basic',
  },
  {
    id: 'tartine_avocado_rosii_cherry',
    title: 'Tartine cu avocado cremos, roșii cherry și lămâie',
    description:
      '100% vegetal. Pâine prăjită acoperită cu avocado pasat, roșii cherry dulci și un strop de lămâie proaspătă.',
    prepTimeMinutes: 7,
    cookTimeMinutes: 0,
    dietType: 'vegan',
    appliances: [],
    moodTags: ['speedy', 'fresh_salad', 'low_calorie'],
    ingredients: [
      { ingredientId: 'paine_toast', amountPerServing: 70, unit: 'g' },
      { ingredientId: 'avocado', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'rosii_cherry', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'lamaie', amountPerServing: 0.25, unit: 'buc' },
      { ingredientId: 'ulei_masline', amountPerServing: 5, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Pasează miezul de avocado cu o furculiță și stropește-l imediat cu zeamă de lămâie.',
      },
      {
        stepNumber: 2,
        instruction: 'Condimentează crema cu sare și amestecă până devine omogenă.',
      },
      { stepNumber: 3, instruction: 'Întinde crema generos pe felii de pâine.' },
      {
        stepNumber: 4,
        instruction:
          'Aranjează roșiile cherry tăiate în jumătăți deasupra și finisează cu ulei de măsline.',
      },
    ],
    suitableSlots: ['breakfast', 'snack'],
    tier: 'medium',
  },
  {
    id: 'clatite_vegane_banane_ovaz',
    title: 'Clătite vegane pufoase cu banane și ovăz',
    description:
      '100% vegetal. Clătite legate natural cu banană pasată, fără ou și fără lactate, rumenite auriu în tigaie.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 10,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['family_fav', 'healthy_comfort', 'sweet_treat'],
    ingredients: [
      { ingredientId: 'banane', amountPerServing: 140, unit: 'g' },
      { ingredientId: 'fulgi_ovaz', amountPerServing: 45, unit: 'g' },
      { ingredientId: 'faina_alba', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'lapte_vegetal_ovaz', amountPerServing: 120, unit: 'ml' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'gem_fructe', amountPerServing: 20, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Pasează bananele bine cu furculița până obții un piure fin.' },
      {
        stepNumber: 2,
        instruction:
          'Adaugă fulgii de ovăz, făina și băutura de ovăz, amestecând până la un aluat gros și omogen.',
      },
      {
        stepNumber: 3,
        instruction: 'Încinge tigaia cu puțin ulei și toarnă porții mici de aluat.',
      },
      {
        stepNumber: 4,
        instruction:
          'Prăjește 2-3 minute pe fiecare parte, până se rumenesc, și servește cu gem de fructe.',
      },
    ],
    suitableSlots: ['breakfast'],
    tier: 'basic',
  },
  {
    id: 'ovaz_peste_noapte_mar_nuci',
    title: 'Ovăz peste noapte cu măr ras, nuci și scorțișoară',
    description:
      '100% vegetal. Se pregătește seara în 5 minute și te așteaptă rece dimineața, cremos și sățios.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    dietType: 'vegan',
    appliances: [],
    moodTags: ['speedy', 'healthy_comfort', 'low_calorie'],
    ingredients: [
      { ingredientId: 'fulgi_ovaz', amountPerServing: 55, unit: 'g' },
      { ingredientId: 'lapte_vegetal_ovaz', amountPerServing: 180, unit: 'ml' },
      { ingredientId: 'mere_romanesti', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'nuci_miez', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'seminte_chia', amountPerServing: 10, unit: 'g' },
      { ingredientId: 'scortisoara_macinata', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Amestecă fulgii de ovăz cu semințele de chia și băutura de ovăz într-un borcan.',
      },
      { stepNumber: 2, instruction: 'Rade mărul și încorporează-l împreună cu scorțișoara.' },
      {
        stepNumber: 3,
        instruction: 'Acoperă borcanul și lasă-l la frigider peste noapte, minimum 6 ore.',
      },
      {
        stepNumber: 4,
        instruction: 'Dimineața amestecă din nou și presară nuca zdrobită deasupra.',
      },
    ],
    suitableSlots: ['breakfast'],
    tier: 'basic',
  },
  {
    id: 'tartine_unt_arahide_banane',
    title: 'Tartine cu unt de arahide, banane și scorțișoară',
    description:
      '100% vegetal. Mic dejun bogat în proteine, gata în 5 minute, cu unt de arahide natural și banane felii.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 0,
    dietType: 'vegan',
    appliances: [],
    moodTags: ['speedy', 'high_protein', 'family_fav'],
    ingredients: [
      { ingredientId: 'paine_toast', amountPerServing: 70, unit: 'g' },
      { ingredientId: 'unt_arahide', amountPerServing: 30, unit: 'g' },
      { ingredientId: 'banane', amountPerServing: 110, unit: 'g' },
      { ingredientId: 'scortisoara_macinata', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Întinde untul de arahide uniform pe feliile de pâine.' },
      { stepNumber: 2, instruction: 'Feliază banana în rondele subțiri.' },
      { stepNumber: 3, instruction: 'Aranjează rondelele peste untul de arahide, ușor suprapuse.' },
      { stepNumber: 4, instruction: 'Presară scorțișoară deasupra și servește imediat.' },
    ],
    suitableSlots: ['breakfast', 'snack'],
    tier: 'medium',
  },
  {
    id: 'mousse_ciocolata_cocos',
    title: 'Mousse de ciocolată neagră cu lapte de cocos',
    description:
      '100% vegetal. Desert dens și catifelat din ciocolată neagră fără lactate topită în lapte de cocos cremos.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 5,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['sweet_treat', 'family_fav'],
    ingredients: [
      { ingredientId: 'ciocolata_neagra_vegana', amountPerServing: 55, unit: 'g' },
      { ingredientId: 'lapte_cocos', amountPerServing: 120, unit: 'ml' },
      { ingredientId: 'cacao_pudra', amountPerServing: 5, unit: 'g' },
      { ingredientId: 'zahar_tos', amountPerServing: 10, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Încălzește laptele de cocos la foc mic, fără să îl lași să dea în clocot.',
      },
      {
        stepNumber: 2,
        instruction:
          'Ia vasul de pe foc, adaugă ciocolata ruptă bucăți și amestecă până se topește complet.',
      },
      {
        stepNumber: 3,
        instruction: 'Încorporează cacaua și zahărul, amestecând până compoziția devine lucioasă.',
      },
      {
        stepNumber: 4,
        instruction: 'Toarnă în pahare și lasă la frigider minimum 2 ore până se întărește.',
      },
    ],
    suitableSlots: ['dessert'],
    tier: 'medium',
  },
  {
    id: 'mere_coapte_nuci_scortisoara',
    title: 'Mere coapte la cuptor cu nuci și scorțișoară',
    description:
      '100% vegetal. Desert cald de toamnă: mere românești coapte până devin moi, umplute cu nucă și scorțișoară.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 25,
    dietType: 'vegan',
    appliances: ['oven'],
    moodTags: ['sweet_treat', 'romanian_classic', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'mere_romanesti', amountPerServing: 220, unit: 'g' },
      { ingredientId: 'nuci_miez', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'zahar_tos', amountPerServing: 12, unit: 'g' },
      { ingredientId: 'scortisoara_macinata', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Încinge cuptorul la 180°C și scoate cotorul merelor, păstrându-le întregi.',
      },
      { stepNumber: 2, instruction: 'Amestecă nuca zdrobită cu zahărul și scorțișoara.' },
      {
        stepNumber: 3,
        instruction: 'Umple fiecare măr cu compoziția de nucă și așază-le într-o tavă.',
      },
      {
        stepNumber: 4,
        instruction:
          'Coace 25 de minute, până când merele devin moi și siropul caramelizează ușor.',
      },
    ],
    suitableSlots: ['dessert'],
    tier: 'basic',
  },
  {
    id: 'crema_cacao_avocado_banane',
    title: 'Cremă rapidă de cacao cu avocado și banane',
    description:
      '100% vegetal. Desert fără gătit, cremos ca o budincă, din avocado copt, banane și cacao pudră.',
    prepTimeMinutes: 8,
    cookTimeMinutes: 0,
    dietType: 'vegan',
    appliances: [],
    moodTags: ['sweet_treat', 'speedy', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'avocado', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'banane', amountPerServing: 130, unit: 'g' },
      { ingredientId: 'cacao_pudra', amountPerServing: 12, unit: 'g' },
      { ingredientId: 'zahar_tos', amountPerServing: 10, unit: 'g' },
      { ingredientId: 'fructe_padure_congelate', amountPerServing: 50, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Scoate miezul de avocado și pasează-l împreună cu bananele până obții o cremă fină.',
      },
      {
        stepNumber: 2,
        instruction: 'Adaugă cacaua și zahărul, amestecând energic până dispar cocoloașele.',
      },
      { stepNumber: 3, instruction: 'Repartizează crema în boluri mici.' },
      {
        stepNumber: 4,
        instruction: 'Lasă 20 de minute la rece și servește cu fructe de pădure deasupra.',
      },
    ],
    suitableSlots: ['dessert', 'snack'],
    tier: 'medium',
  },
];
