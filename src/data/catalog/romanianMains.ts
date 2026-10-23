import { RecipeSource } from '../../types';

/**
 * Romanian and premium mains: ciorbe, mâncăruri, steak, fish and seafood.
 *
 * Order matters: the planner breaks ties by catalog order, so recipes keep the position they
 * had in the original single file. See src/data/recipes.ts for how the parts are assembled.
 */
export const ROMANIAN_MAINS: RecipeSource[] = [
  {
    id: 'antricot_vita_airfryer_ierburi',
    title: 'Steak din antricot Black Angus la Air Fryer cu unt și ierburi',
    description:
      'Antricot de vită Black Angus maturat, gătit suculent la airfryer și finisat cu unt topit, rozmarin și usturoi.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 12,
    dietType: 'omnivore',
    appliances: ['air_fryer'],
    moodTags: ['speedy', 'high_protein', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'antricot_vita_angus', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'cartofi_albi', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 5, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
      { ingredientId: 'piper_negru', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Scoate carnea cu 20 de minute înainte și tamponează cu șervețele de hârtie.',
      },
      {
        stepNumber: 2,
        instruction:
          'Unge friptura cu ulei, asezonează generos cu sare grunjoasă și piper măcinat proaspăt.',
      },
      {
        stepNumber: 3,
        instruction:
          'Gătește la air fryer la 200°C timp de 9-11 minute pentru o gătire medium-rare.',
      },
      {
        stepNumber: 4,
        instruction:
          'Așază cubul de unt și usturoiul zdrobit peste friptură și las-o să se odihnească 5 minute.',
      },
    ],
    suitableSlots: ['dinner', 'lunch'],
    tier: 'premium',
  },
  {
    id: 'spaghete_creveti_usturoi',
    title: 'Spaghete cremoase cu creveți trași în unt și roșii cherry',
    description:
      'Paste al dente aromate cu creveți suculenți, roșii cherry dulci, usturoi rumenit și pătrunjel verde proaspăt.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    dietType: 'pescatarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'fakeaway', 'high_protein'],
    ingredients: [
      { ingredientId: 'creveti_decorticati', amountPerServing: 180, unit: 'g' },
      { ingredientId: 'paste_spaghete', amountPerServing: 100, unit: 'g' },
      { ingredientId: 'rosii_cherry', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 5, unit: 'g' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 1, unit: 'legatura' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'piper_negru', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Fierbe pastele în multă apă cu sare până devin al dente.' },
      {
        stepNumber: 2,
        instruction:
          'Încinge tigaia cu unt și ulei, adaugă usturoiul feliat și roșiile cherry tăiate în jumătăți.',
      },
      {
        stepNumber: 3,
        instruction:
          'Adaugă creveții și sotează la foc iute timp de 2-3 minute până devin roz și fragezi.',
      },
      {
        stepNumber: 4,
        instruction:
          'Transferă pastele fierte direct în tigaie, presară pătrunjel tocat și omogenizează sosul.',
      },
    ],
    suitableSlots: ['dinner', 'lunch'],
    tier: 'premium',
  },
  {
    id: 'mic_dejun_englezesc_romanesc',
    title: 'Mic dejun la tigaie cu cârnăciori oltenești și ouă ochiuri',
    description:
      'Mic dejun energizant și sățios: cârnăciori rumeniți, ouă ochiuri moi, fasole boabe caldă și pâine prăjită crocantă.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['speedy', 'high_protein', 'family_fav'],
    ingredients: [
      { ingredientId: 'carnaciori_oltenesti', amountPerServing: 100, unit: 'g' },
      { ingredientId: 'oua_m', amountPerServing: 2, unit: 'buc' },
      { ingredientId: 'fasole_boabe_conserva', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'paine_toast', amountPerServing: 2, unit: 'buc' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Călește rondelele de cârnăciori într-o tigaie încinsă până devin crocante.',
      },
      {
        stepNumber: 2,
        instruction: 'Adaugă fasolea boabe scursă să se încălzească alături de cârnăciori.',
      },
      {
        stepNumber: 3,
        instruction:
          'În aceeași tigaie, prăjește ouăle ochiuri la foc mediu până albușul e copt și gălbenușul moale.',
      },
      { stepNumber: 4, instruction: 'Servește imediat cu felii de pâine toast rumenită.' },
    ],
    suitableSlots: ['breakfast'],
    tier: 'medium',
  },
  {
    id: 'toast_crema_branza_somon_afumat',
    title: 'Toast crocant cu cremă fină de brânză și somon afumat',
    description:
      'Pâine toast caldă unsă cu cremă de brânză proaspătă, feliuțe generoase de somon afumat și zeamă de lămâie.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 3,
    dietType: 'pescatarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'high_protein', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'paine_toast', amountPerServing: 2, unit: 'buc' },
      { ingredientId: 'crema_branza', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'somon_afumat', amountPerServing: 70, unit: 'g' },
      { ingredientId: 'lamaie', amountPerServing: 30, unit: 'g' },
      { ingredientId: 'piper_negru', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Prăjește feliile de pâine până devin aurii și crocante.' },
      {
        stepNumber: 2,
        instruction: 'Întinde un strat generos de cremă de brânză pe fiecare felie caldă.',
      },
      {
        stepNumber: 3,
        instruction:
          'Așază feliile de somon afumat deasupra, stropește cu lămâie și asezonează cu piper proaspăt măcinat.',
      },
    ],
    suitableSlots: ['breakfast'],
    tier: 'premium',
  },
  {
    id: 'friganela_dulce_scortisoara',
    title: 'Frigănele aurii la tigaie cu lapte și scorțișoară',
    description:
      'Frigănele pufoase din copilărie, îmbibate în amestec de ou și lapte dulce, rumenite în unt cu scorțișoară.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 6,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'family_fav', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'paine_toast', amountPerServing: 3, unit: 'buc' },
      { ingredientId: 'oua_m', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'lapte_3_5', amountPerServing: 80, unit: 'ml' },
      { ingredientId: 'unt_82', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'zahar_tos', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'scortisoara_macinata', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Bate oul cu laptele, zahărul și scorțișoara într-o farfurie adâncă.',
      },
      {
        stepNumber: 2,
        instruction: 'Înmoaie feliile de pâine pe ambele părți timp de câteva secunde.',
      },
      {
        stepNumber: 3,
        instruction:
          'Rumenește în unt încins timp de 2 minute pe fiecare parte până devin rumene și parfumate.',
      },
    ],
    suitableSlots: ['breakfast', 'snack'],
    tier: 'basic',
  },
  {
    id: 'ciorba_fasole_afumatura_ceapa',
    title: 'Ciorbă ardelenească de fasole cu afumătură și ceapă roșie',
    description:
      'Ciorbă deasă și aromată din fasole boabe, costiță afumată rumenită, morcovi, sos dulce de roșii și leuștean/pătrunjel.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'family_fav', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'fasole_boabe_conserva', amountPerServing: 240, unit: 'g' },
      { ingredientId: 'bacon_afumat', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'ceapa_rosie', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 70, unit: 'g' },
      { ingredientId: 'rosii_pasate', amountPerServing: 100, unit: 'ml' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Rumenește baconul afumat tăiat cubulețe într-o oală adâncă.' },
      {
        stepNumber: 2,
        instruction: 'Adaugă ceapa și morcovul tocat mărunt, călindu-le 3-4 minute.',
      },
      {
        stepNumber: 3,
        instruction:
          'Toarnă passata și 400ml apă fierbinte, apoi adaugă fasolea boabe scursă și lasă să dea în clocot 15 minute.',
      },
      {
        stepNumber: 4,
        instruction:
          'Potrivește de sare și presară pătrunjel verde tocat mărunt. Servește cu ceapă roșie zdrobită cu sare.',
      },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'basic',
  },
  {
    id: 'bulz_ciobanesc_cuptor',
    title: 'Bulz ciobănesc rumenit la cuptor cu telemea și ou',
    description:
      'Mămăligă caldă umplută cu straturi generoase de brânză telemea, unt proaspăt și un ou rumenit auriu la cuptor.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    dietType: 'vegetarian',
    appliances: ['hob', 'oven'],
    moodTags: ['romanian_classic', 'family_fav', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'malai_superior', amountPerServing: 100, unit: 'g' },
      { ingredientId: 'telemea_vaca', amountPerServing: 100, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'oua_m', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'smantana_20', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Prepară o mămăligă mai pripită pe aragaz din mălai, apă și sare (circa 10 minute).',
      },
      {
        stepNumber: 2,
        instruction:
          'Așază jumătate din mămăligă într-un vas termorezistent, pune un strat generos de telemea rasă și cuburi de unt.',
      },
      {
        stepNumber: 3,
        instruction:
          'Acoperă cu restul de mămăligă, fă o adâncitură în mijloc și sparge oul proaspăt.',
      },
      {
        stepNumber: 4,
        instruction:
          'Coace la cuptor la 200°C timp de 12-15 minute până când oul și brânza se rumenesc apetisant.',
      },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'basic',
  },
  {
    id: 'spaghete_pomodoro_busuioc',
    title: 'Spaghete al dente cu sos dulce de roșii și busuioc',
    description:
      'Rețetă italiană rapidă și economică: spaghete fierte al dente, îmbrăcate în sos de passata dulce, usturoi rumenit și busuioc.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 12,
    dietType: 'vegan',
    appliances: ['hob'],
    moodTags: ['speedy', 'family_fav', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'paste_spaghete', amountPerServing: 110, unit: 'g' },
      { ingredientId: 'rosii_pasate', amountPerServing: 150, unit: 'ml' },
      { ingredientId: 'usturoi', amountPerServing: 5, unit: 'g' },
      { ingredientId: 'ulei_masline', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'busuioc_uscat', amountPerServing: 2, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Fierbe spaghetele în apă clocotită cu sare conform instrucțiunilor de pe pachet.',
      },
      {
        stepNumber: 2,
        instruction:
          'Încinge uleiul de măsline într-o tigaie, călește usturoiul feliat timp de 1 minut.',
      },
      {
        stepNumber: 3,
        instruction:
          'Toarnă passata de roșii, adaugă busuiocul și lasă sosul să scadă la foc mic 8 minute.',
      },
      {
        stepNumber: 4,
        instruction:
          'Adaugă pastele scurse direct în sos și amestecă la foc mediu timp de 1 minut.',
      },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'basic',
  },
  {
    id: 'tocanita_cartofi_carnaciori',
    title: 'Mâncare rustică de cartofi cu rondele de cârnăciori afumați',
    description:
      'Mâncare tradițională de casă: cartofi fierți în sos dulceag de ceapă călită cu boia dulce și rondele de cârnăciori oltenești rumeniți.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'family_fav', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'cartofi_albi', amountPerServing: 300, unit: 'g' },
      { ingredientId: 'carnaciori_oltenesti', amountPerServing: 100, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'boia_dulce', amountPerServing: 3, unit: 'g' },
      { ingredientId: 'rosii_pasate', amountPerServing: 80, unit: 'ml' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Rumenește rondelele de cârnăciori în tigaie, apoi scoate-le deoparte.',
      },
      {
        stepNumber: 2,
        instruction:
          'Călește ceapa tocată mărunt cu boiaua dulce, apoi adaugă cartofii tăiați cuburi mari.',
      },
      {
        stepNumber: 3,
        instruction:
          'Toarnă passata și apă cât să acopere cartofii, lăsând să fiarbă sub capac 20 de minute.',
      },
      {
        stepNumber: 4,
        instruction:
          'Adaugă cârnăciorii rumeniți înapoi în cratiță, mai lasă 3 minute și presară pătrunjel verde tocat.',
      },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'basic',
  },
  {
    id: 'orez_sarbesc_legume',
    title: 'Orez sârbesc la cuptor cu legume dulci și sos de roșii',
    description:
      'Garnitură sau fel principal vegan: orez bob rotund copt cu ceapă, ardei roșu, morcov ras și sos dulce de tomate.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    dietType: 'vegan',
    appliances: ['hob', 'oven'],
    moodTags: ['healthy_comfort', 'family_fav', 'romanian_classic'],
    ingredients: [
      { ingredientId: 'orez_bob_rotund', amountPerServing: 90, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'ardei_gras_rosu', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'rosii_pasate', amountPerServing: 80, unit: 'ml' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Călește ceapa, morcovul ras și ardeiul cubulețe în ulei timp de 5 minute.',
      },
      {
        stepNumber: 2,
        instruction:
          'Adaugă orezul spălat și călește-l 1 minut timp de 1 minut până devine sticlos.',
      },
      {
        stepNumber: 3,
        instruction:
          'Toarnă passata și 200ml apă caldă cu sare, apoi transferă într-o tavă de cuptor.',
      },
      {
        stepNumber: 4,
        instruction:
          'Coace la 190°C timp de 20-25 de minute până când orezul a absorbit tot sosul și boabele sunt fragede.',
      },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'basic',
  },
  {
    id: 'ostropel_pui_piure_cartofi',
    title: 'Ostropel fraged de pui în sos usturoiat cu piure de cartofi',
    description:
      'Pulpă de pui fragedă scăzută în sos bogat de tomate cu mult usturoi zdrobit, servită alături de un piure pufos de cartofi cu unt.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'family_fav', 'high_protein'],
    ingredients: [
      { ingredientId: 'pulpe_pui_dezosate', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'cartofi_albi', amountPerServing: 250, unit: 'g' },
      { ingredientId: 'lapte_3_5', amountPerServing: 50, unit: 'ml' },
      { ingredientId: 'unt_82', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'rosii_pasate', amountPerServing: 100, unit: 'ml' },
      { ingredientId: 'usturoi', amountPerServing: 10, unit: 'g' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Rumenește pulpele de pui la tigaie pe ambele părți timp de 8 minute.',
      },
      {
        stepNumber: 2,
        instruction:
          'Adaugă passata de roșii, usturoiul zdrobit și 100ml apă, lăsând să scadă 15 minute la foc mic.',
      },
      {
        stepNumber: 3,
        instruction:
          'Separat, fierbe cartofii tăiați cuburi în apă cu sare, apoi pasează-i cu unt și lapte cald.',
      },
      {
        stepNumber: 4,
        instruction:
          'Așază piureul pe farfurie, toarnă carnea și sosul aromat de ostropel și presară pătrunjel verde.',
      },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'medium',
  },
  {
    id: 'snitel_crocant_pui_salata',
    title: 'Șnițel din piept de pui în crustă aurie cu salată de varză',
    description:
      'Șnițel fraged de pui trecut prin făină și ou, prăjit crocant, acompaniat de o salată răcoritoare de varză albă frecată cu lămâie.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 12,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['family_fav', 'high_protein', 'speedy'],
    ingredients: [
      { ingredientId: 'piept_pui_file', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'faina_grau', amountPerServing: 30, unit: 'g' },
      { ingredientId: 'oua_m', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'varza_alba', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 20, unit: 'ml' },
      { ingredientId: 'lamaie', amountPerServing: 30, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Bate ușor feliile de piept de pui și condimentează-le cu sare și piper.',
      },
      {
        stepNumber: 2,
        instruction:
          'Trece puiul prin făină, apoi prin oul bătut, și prăjește-l în ulei încins câte 4-5 minute pe fiecare parte.',
      },
      {
        stepNumber: 3,
        instruction:
          'Toacă varza mărunt, freac-o cu sare și asezoneaz-o cu ulei și zeamă proaspătă de lămâie.',
      },
      {
        stepNumber: 4,
        instruction: 'Servește șnițelul fierbinte și crocant alături de salata proaspătă de varză.',
      },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'medium',
  },
  {
    id: 'musaca_cartofi_carne_tocata',
    title: 'Musaca tradițională de cartofi cu carne tocată la cuptor',
    description:
      'Straturi alternante de felii de cartofi și carne tocată aromată cu ceapă călită, acoperite cu smântână și ou rumenit.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 35,
    dietType: 'omnivore',
    appliances: ['hob', 'oven'],
    moodTags: ['romanian_classic', 'family_fav', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'carne_tocata_amestec', amountPerServing: 150, unit: 'g' },
      { ingredientId: 'cartofi_albi', amountPerServing: 250, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'rosii_pasate', amountPerServing: 80, unit: 'ml' },
      { ingredientId: 'oua_m', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'smantana_20', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
      { ingredientId: 'piper_negru', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Fierbe cartofii în coajă 15 minute, curăță-i și taie-i în felii rotunde groase.',
      },
      {
        stepNumber: 2,
        instruction:
          'Călește carnea tocată cu ceapa și passata de roșii timp de 8 minute până se evaporă lichidul.',
      },
      {
        stepNumber: 3,
        instruction:
          'Așază într-un vas termorezistent un strat de cartofi, un strat de carne și încă un strat de cartofi.',
      },
      {
        stepNumber: 4,
        instruction:
          'Bate oul cu smântâna, toarnă deasupra și coace la cuptor la 190°C timp de 25-30 de minute până se rumenește auriu.',
      },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'medium',
  },
  {
    id: 'ciorba_perisoare_acrita_bors',
    title: 'Ciorbă de perișoare pufoase acrită cu borș de tărâțe',
    description:
      'Ciorbă clasică românească cu perișoare fragede din carne tocată cu orez, legume rădăcinoase și borș proaspăt.',
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['romanian_classic', 'family_fav', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'carne_tocata_amestec', amountPerServing: 140, unit: 'g' },
      { ingredientId: 'orez_bob_rotund', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'oua_m', amountPerServing: 1, unit: 'buc' },
      { ingredientId: 'morcovi', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'bors_proaspat', amountPerServing: 150, unit: 'ml' },
      { ingredientId: 'patrunjel_verde', amountPerServing: 0.5, unit: 'legatura' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Formează perișoare mici din carne tocată amestecată cu orez, jumătate de ou și un praf de sare.',
      },
      {
        stepNumber: 2,
        instruction:
          'Fierbe morcovul și ceapa tocate mărunt în 500ml apă cu sare timp de 10 minute.',
      },
      {
        stepNumber: 3,
        instruction:
          'Adaugă perișoarele una câte una în supa clocotită și lasă-le să fiarbă 15 minute până se ridică la suprafață.',
      },
      {
        stepNumber: 4,
        instruction:
          'Adaugă borșul fiert separat, lasă încă 2 minute, oprește focul și presară mult pătrunjel verde tocat.',
      },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'medium',
  },
  {
    id: 'pui_stirfry_legume_soia',
    title: 'Stir-fry crocant de pui cu legume colorate și sos de soia',
    description:
      'Fâșii subțiri de carne de pui trase la foc iute cu ardei kapia, morcov și ciuperci în sos de soia, peste orez basmati.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 12,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['speedy', 'high_protein', 'fakeaway'],
    ingredients: [
      { ingredientId: 'piept_pui_file', amountPerServing: 180, unit: 'g' },
      { ingredientId: 'ardei_gras_rosu', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'morcovi', amountPerServing: 50, unit: 'g' },
      { ingredientId: 'ciuperci_champignon', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'sos_soia', amountPerServing: 20, unit: 'ml' },
      { ingredientId: 'ulei_floarea_soarelui', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'orez_basmati', amountPerServing: 70, unit: 'g' },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Fierbe orezul basmati în apă cu sare timp de 12 minute.' },
      {
        stepNumber: 2,
        instruction: 'Trage fâșiile de pui într-o tigaie mare/wok la foc iute timp de 4 minute.',
      },
      {
        stepNumber: 3,
        instruction:
          'Adaugă legumele tăiate fâșii subțiri și ciupercile, sotând încă 4 minute ca să rămână crocante.',
      },
      {
        stepNumber: 4,
        instruction:
          'Toarnă sosul de soia, amestecă rapid 1 minut și servește fierbinte peste orez.',
      },
    ],
    suitableSlots: ['lunch', 'dinner'],
    tier: 'medium',
  },
  {
    id: 'muschiulet_porc_sos_piper_verde',
    title: 'Medalioane din mușchiuleț de porc cu sos cremos de piper',
    description:
      'Mușchiuleț de porc fraged rumenit la tigaie, scăzut în sos catifelat de smântână cu boabe de piper, alături de cartofi rumeniți.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    dietType: 'omnivore',
    appliances: ['hob'],
    moodTags: ['speedy', 'high_protein', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'muschiulet_porc', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'cartofi_albi', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'smantana_gatit', amountPerServing: 80, unit: 'ml' },
      { ingredientId: 'piper_negru', amountPerServing: 3, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 15, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Taie mușchiulețul în medalioane groase de 2-3 cm și presează-le ușor cu palma.',
      },
      {
        stepNumber: 2,
        instruction:
          'Rumenește carnea în unt timp de 3-4 minute pe fiecare parte, apoi scoate-o pe o farfurie caldă.',
      },
      {
        stepNumber: 3,
        instruction:
          'În aceeași tigaie, adaugă smântâna lichidă de gătit și boabele zdrobite de piper, lăsând sosul să se lege 2 minute.',
      },
      {
        stepNumber: 4,
        instruction:
          'Pune medalioanele înapoi în sosul cremos și servește imediat alături de cartofi copți.',
      },
    ],
    suitableSlots: ['dinner', 'lunch'],
    tier: 'premium',
  },
  {
    id: 'dorada_cuptor_lamaie_ierburi',
    title: 'Doradă proaspătă la cuptor cu lămâie, usturoi și ierburi',
    description:
      'Pește nobil copt întreg pe pat de felii de lămâie și usturoi aromat, servit cu cartofi aurii și ulei de măsline.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    dietType: 'pescatarian',
    appliances: ['oven'],
    moodTags: ['healthy_comfort', 'high_protein', 'speedy'],
    ingredients: [
      { ingredientId: 'dorada_proaspata', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'cartofi_albi', amountPerServing: 200, unit: 'g' },
      { ingredientId: 'lamaie', amountPerServing: 60, unit: 'g' },
      { ingredientId: 'usturoi', amountPerServing: 5, unit: 'g' },
      { ingredientId: 'ulei_masline', amountPerServing: 15, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 3, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Crestează ușor pielea doradei pe ambele părți și condimentează cu sare și piper.',
      },
      {
        stepNumber: 2,
        instruction:
          'Umple cavitatea peștelui cu felii subțiri de lămâie și căței de usturoi zdrobiți.',
      },
      {
        stepNumber: 3,
        instruction:
          'Așază peștele în tavă alături de rondele subțiri de cartofi stropite cu ulei de măsline.',
      },
      {
        stepNumber: 4,
        instruction:
          'Coace la 200°C timp de 18-20 de minute până când carnea este albă și fragedă, iar pielea rumenită.',
      },
    ],
    suitableSlots: ['dinner', 'lunch'],
    tier: 'premium',
  },
  {
    id: 'risotto_cremos_hribi_parmezan',
    title: 'Risotto cremos cu hribi de pădure, unt și parmezan',
    description:
      'Orez Arborio gătit lent în stil clasic italian, cu hribi aromați sotați în unt, finisat cu parmezan din belșug.',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    dietType: 'vegetarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'fakeaway', 'healthy_comfort'],
    ingredients: [
      { ingredientId: 'orez_arborio', amountPerServing: 90, unit: 'g' },
      { ingredientId: 'ciuperci_hribi', amountPerServing: 120, unit: 'g' },
      { ingredientId: 'ceapa_galbena', amountPerServing: 40, unit: 'g' },
      { ingredientId: 'unt_82', amountPerServing: 20, unit: 'g' },
      { ingredientId: 'parmezan_ras', amountPerServing: 30, unit: 'g' },
      { ingredientId: 'ulei_masline', amountPerServing: 10, unit: 'ml' },
      { ingredientId: 'sare_fina', amountPerServing: 2, unit: 'g' },
      { ingredientId: 'piper_negru', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Sotează hribii în jumătate din unt timp de 5 minute până se evaporă apa, apoi pune-i deoparte.',
      },
      {
        stepNumber: 2,
        instruction:
          'În aceeași cratiță, călește ceapa tocată fin în ulei de măsline, adaugă orezul Arborio și prăjește-l 1 minut.',
      },
      {
        stepNumber: 3,
        instruction:
          'Adaugă apă fierbinte cu sare polonic cu polonic, amestecând continuu timp de 16-18 minute.',
      },
      {
        stepNumber: 4,
        instruction:
          'Oprește focul, adaugă hribii, restul de unt rece și parmezanul ras, amestecând energic pentru o cremă perfectă.',
      },
    ],
    suitableSlots: ['dinner', 'lunch'],
    tier: 'premium',
  },
  {
    id: 'creveti_saganaki_feta_rosii',
    title: 'Creveți Saganaki trași la tigaie cu sos dulce de roșii și feta',
    description:
      'Specialitate grecească: creveți suculenți în sos bogat de roșii cu usturoi și oregano, acoperiți cu bucăți de brânză feta topită.',
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    dietType: 'pescatarian',
    appliances: ['hob'],
    moodTags: ['speedy', 'fakeaway', 'high_protein'],
    ingredients: [
      { ingredientId: 'creveti_decorticati', amountPerServing: 180, unit: 'g' },
      { ingredientId: 'branza_feta', amountPerServing: 80, unit: 'g' },
      { ingredientId: 'rosii_pasate', amountPerServing: 120, unit: 'ml' },
      { ingredientId: 'usturoi', amountPerServing: 5, unit: 'g' },
      { ingredientId: 'ulei_masline', amountPerServing: 15, unit: 'ml' },
      { ingredientId: 'oregano_uscat', amountPerServing: 2, unit: 'g' },
      { ingredientId: 'sare_fina', amountPerServing: 1, unit: 'g' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction:
          'Încinge uleiul de măsline într-o tigaie și sotează usturoiul feliat timp de 1 minut.',
      },
      {
        stepNumber: 2,
        instruction:
          'Adaugă passata de roșii și oregano, lăsând sosul să clocotească și să scadă 4 minute.',
      },
      {
        stepNumber: 3,
        instruction: 'Adaugă creveții și lasă-i să fiarbă în sos 3 minute până devin roz.',
      },
      {
        stepNumber: 4,
        instruction:
          'Sfărâmă brânza feta generoasă deasupra, pune capacul 2 minute până când brânza începe să se topească și servește cald.',
      },
    ],
    suitableSlots: ['dinner', 'lunch'],
    tier: 'premium',
  },
];
