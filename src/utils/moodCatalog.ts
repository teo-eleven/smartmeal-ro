import { MoodTag } from '../types';

export interface MoodOptionInfo {
  id: MoodTag;
  label: string;
  icon: string;
  desc: string;
  vibe: string;
}

export const MOOD_OPTIONS_CATALOG: MoodOptionInfo[] = [
  {
    id: 'speedy',
    label: 'Mese Rapide (<25 min)',
    icon: '⚡',
    desc: 'Pentru seri aglomerate când vrei mâncare caldă în maxim 20-25 de minute.',
    vibe: 'Rapid & Eficient',
  },
  {
    id: 'romanian_classic',
    label: 'Tradițional Românesc',
    icon: '🇷🇴',
    desc: 'Mămăliguță caldă, ciorbe aromate, fripturi la cuptor și mâncăruri ca la mama acasă.',
    vibe: 'Gust Autentic',
  },
  {
    id: 'pasta_italian',
    label: 'Paste & Arome Italienești',
    icon: '🍝',
    desc: 'Spaghete cremoase, penne al pomodoro, parmezan ras și busuioc proaspăt.',
    vibe: 'Confort Italian',
  },
  {
    id: 'soups_stews',
    label: 'Ciorbe & Supe Calde',
    icon: '🍲',
    desc: 'Ciorbă rădăuțeană, supă cremă fină, tocană scăzută și fierturi reconfortante.',
    vibe: 'Căldură & Confort',
  },
  {
    id: 'grill_meat',
    label: 'Grătar & Cărnuri Fragede',
    icon: '🥩',
    desc: 'Piept de pui rumenit, mușchiuleț suculent, cotlet marinat cu mirodenii.',
    vibe: 'Proteic & Sățios',
  },
  {
    id: 'family_fav',
    label: 'Favoritele Familiei',
    icon: '👨‍👩‍👧',
    desc: 'Rețete pe gustul tuturor, iubite atât de copii cât și de adulți.',
    vibe: 'Pentru Toată Familia',
  },
  {
    id: 'high_protein',
    label: 'Bogat în Proteine (>35g)',
    icon: '💪',
    desc: 'Optimizat pentru sportivi, recuperare musculară și sațietate prelungită.',
    vibe: 'Fitness & Energie',
  },
  {
    id: 'light_dinner',
    label: 'Cină Ușoară de Seară (<400 kcal)',
    icon: '🌙',
    desc: 'Preparate ușoare, fără senzație de greutate, ideale pentru un somn odihnitor.',
    vibe: 'Digestie Ușoară',
  },
  {
    id: 'fresh_salad',
    label: 'Salate Crocante & Fresh Bowls',
    icon: '🥗',
    desc: 'Legume proaspete de sezon, semințe rumenite, brânzeturi și dressinguri vioaie.',
    vibe: 'Fresh & Detox',
  },
  {
    id: 'fakeaway',
    label: 'Fakeaway (Fast-Food acasă)',
    icon: '🍔',
    desc: 'Burgeri sănătoși, cartofi wedges aurii și aripioare crocante fără prăjeli grele.',
    vibe: 'Răsfăț de Weekend',
  },
  {
    id: 'spicy_fiesta',
    label: 'Condimentat & Mexican',
    icon: '🌶️',
    desc: 'Fajitas de pui, sos salsa, ardei iute, chimion și explozie de arome exotice.',
    vibe: 'Aromă Intensă',
  },
  {
    id: 'sweet_treat',
    label: 'Desert & Dulce de Casă',
    icon: '🍰',
    desc: 'Clătite pufoase, budincă de chia cu fructe, orez cu lapte și scorțișoară.',
    vibe: 'Dulce Fără Regrete',
  },
];
