import { MoodTag } from '../types';

export interface MoodOptionInfo {
  id: MoodTag;
  label: string;
  icon: string;
  desc: string;
  vibe: string;
  archetype?: string;
  sampleDishes?: string[];
  highlights?: string[];
}

export const MOOD_OPTIONS_CATALOG: MoodOptionInfo[] = [
  {
    id: 'speedy',
    label: 'Mese Rapide (<25 min)',
    icon: '⚡',
    desc: 'Pentru seri aglomerate când vrei mâncare caldă în maxim 20-25 de minute.',
    vibe: 'Rapid & Eficient',
    archetype: 'breakfast',
    sampleDishes: ['Paste rapide cu pui', 'Omletă cu legume', 'Wrap cu ton'],
    highlights: ['⏱️ Sub 25 min', '⚡ Efort minim', '🍳 1 tigaie'],
  },
  {
    id: 'romanian_classic',
    label: 'Tradițional Românesc',
    icon: '🇷🇴',
    desc: 'Mămăliguță caldă, ciorbe aromate, fripturi la cuptor și mâncăruri ca la mama acasă.',
    vibe: 'Gust Autentic',
    archetype: 'stew',
    sampleDishes: ['Ciorbă Rădăuțeană', 'Ostropel de pui', 'Mămăliguță cu brânză'],
    highlights: ['🇷🇴 Rețete de casă', '🍲 Mâncare caldă', '❤️ Gustul copilăriei'],
  },
  {
    id: 'pasta_italian',
    label: 'Paste & Arome Italienești',
    icon: '🍝',
    desc: 'Spaghete cremoase, penne al pomodoro, parmezan ras și busuioc proaspăt.',
    vibe: 'Confort Italian',
    archetype: 'pasta',
    sampleDishes: ["Penne all'Arrabbiata", 'Paste cremoase cu pui', 'Spaghetti cu busuioc'],
    highlights: ['🍝 Confort italian', '🌿 Busuioc & Parmezan', '🇮🇹 Gust mediteranean'],
  },
  {
    id: 'soups_stews',
    label: 'Ciorbe & Supe Calde',
    icon: '🍲',
    desc: 'Ciorbă rădăuțeană, supă cremă fină, tocană scăzută și fierturi reconfortante.',
    vibe: 'Căldură & Confort',
    archetype: 'soup',
    sampleDishes: ['Ciorbă de pui a la grec', 'Supă cremă de linte', 'Tocăniță de legume'],
    highlights: ['🍲 Zeamă caldă', '🥄 Fiertură lentă', '🥣 Sățios'],
  },
  {
    id: 'grill_meat',
    label: 'Grătar & Cărnuri Fragede',
    icon: '🥩',
    desc: 'Piept de pui rumenit, mușchiuleț suculent, cotlet marinat cu mirodenii.',
    vibe: 'Proteic & Sățios',
    archetype: 'grill',
    sampleDishes: ['Piept de pui rumenit', 'Mușchiuleț marinat', 'Frigărui cu legume'],
    highlights: ['🥩 Carne fragedă', '🔥 Aromă de grătar', '🍋 Marinate cu mirodenii'],
  },
  {
    id: 'family_fav',
    label: 'Favoritele Familiei',
    icon: '👨‍👩‍👧',
    desc: 'Rețete pe gustul tuturor, iubite atât de copii cât și de adulți.',
    vibe: 'Pentru Toată Familia',
    archetype: 'roast',
    sampleDishes: ['Pui la cuptor cu cartofi', 'Chifteluțe rumenite', 'Paste cu brânză'],
    highlights: ['👨‍👩‍👧 Favorit copii', '🍽️ Porții generoase', '✨ Fără mofturi la masă'],
  },
  {
    id: 'high_protein',
    label: 'Bogat în Proteine (min. 28g)',
    icon: '💪',
    desc: 'Porții generoase de carne, pește și ouă, gândite pentru zilele cu sală.',
    vibe: 'Fitness & Proteine',
    archetype: 'grill',
    sampleDishes: ['Somon la tigaie', 'Curry de pui proteic', 'Mușchiuleț de porc'],
    highlights: ['💪 Min. 28g proteină', '🍗 Carne, pește, ouă', '🍽️ Porții generoase'],
  },
  {
    id: 'light_dinner',
    label: 'Cină Ușoară de Seară (max. 420 kcal)',
    icon: '🌙',
    desc: 'Preparate ușoare, max. 420 kcal, pentru o cină liniștită la final de zi.',
    vibe: 'Lejer & Ușor',
    archetype: 'seafood',
    sampleDishes: ['Doradă la cuptor', 'Salată caldă cu pui', 'Legume la abur'],
    highlights: ['🌙 Max. 420 kcal', '🐟 Pește, pui, legume', '🥗 Legume din belșug'],
  },
  {
    id: 'fresh_salad',
    label: 'Salate Crocante & Fresh Bowls',
    icon: '🥗',
    desc: 'Legume proaspete de sezon, semințe rumenite, brânzeturi și dressinguri vioaie.',
    vibe: 'Fresh & Crocant',
    archetype: 'salad',
    sampleDishes: ['Salată grecească', 'Bowl mediteranean', 'Salată cu ton & ou'],
    highlights: ['🥗 Legume crocante', '🥑 Grăsimi bune', '🌿 Dressinguri vioaie'],
  },
  {
    id: 'fakeaway',
    label: 'Fakeaway (Fast-Food acasă)',
    icon: '🍔',
    desc: 'Burgeri de casă, cartofi wedges aurii și aripioare crocante la cuptor sau air-fryer, fără prăjit în baie de ulei.',
    vibe: 'Răsfăț de Weekend',
    archetype: 'wrap',
    sampleDishes: ['Burgeri de pui de casă', 'Wedges la cuptor', 'Crispy strips la air-fryer'],
    highlights: ['🍔 Gust de fast-food', '✨ Făcut în casă', '🎉 Răsfăț de weekend'],
  },
  {
    id: 'spicy_fiesta',
    label: 'Condimentat & Mexican',
    icon: '🌶️',
    desc: 'Fajitas de pui, sos salsa, ardei iute, chimion și explozie de arome exotice.',
    vibe: 'Aromă Intensă',
    archetype: 'snack',
    sampleDishes: ['Fajitas de pui', 'Chili con carne', 'Orez condimentat'],
    highlights: ['🌶️ Ardei iute & Chimion', '🌮 Mexican & Aromat', '🔥 Explozie de gust'],
  },
  {
    id: 'sweet_treat',
    label: 'Desert & Dulce de Casă',
    icon: '🍰',
    desc: 'Clătite pufoase, budincă de chia cu fructe, orez cu lapte și scorțișoară.',
    vibe: 'Dulce & Cremos',
    archetype: 'dessert',
    sampleDishes: ['Clătite cu ovăz', 'Budincă de chia', 'Griș cu lapte'],
    highlights: ['🍰 Dulce făcut acasă', '🍓 Fructe proaspete', '🍯 Miere & scorțișoară'],
  },
];
