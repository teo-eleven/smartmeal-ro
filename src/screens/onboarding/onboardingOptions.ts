import { DayOfWeek, FoodTier, MealSlot } from '../../types';

export interface StepMeta {
  step: number;
  title: string;
  icon: string;
  shortDesc: string;
}

export const ONBOARDING_STEPS_META: StepMeta[] = [
  { step: 1, title: 'Dietă', icon: '🥗', shortDesc: 'Restricții & Sănătate' },
  { step: 2, title: 'Pofte', icon: '⚡', shortDesc: 'Stiluri & Vibe' },
  { step: 3, title: 'Persoane', icon: '👥', shortDesc: 'Porții' },
  { step: 4, title: 'Zile & Mese', icon: '🍽️', shortDesc: 'Program & Calitate' },
  { step: 5, title: 'Aparate', icon: '🍳', shortDesc: 'Dotare bucătărie' },
  { step: 6, title: 'Magazin', icon: '🏪', shortDesc: 'Alegere retail' },
  { step: 7, title: 'Ronțăieli', icon: '🍿', shortDesc: 'Snacks & Băuturi' },
  { step: 8, title: 'Buget', icon: '💰', shortDesc: 'Optimizare cost' },
];

export const COOKING_DAY_PRESETS: {
  id: string;
  label: string;
  days: DayOfWeek[];
}[] = [
  {
    id: 'all_week',
    label: '🌟 Toată săptămâna (7 zile)',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  },
  {
    id: 'workdays',
    label: '💼 Luni - Vineri (5 zile)',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  },
  {
    id: 'weekend',
    label: '🎉 Weekend (2 zile)',
    days: ['saturday', 'sunday'],
  },
];

export const MEAL_MOMENT_OPTIONS: {
  slot: MealSlot;
  title: string;
  icon: string;
  subtitle: string;
}[] = [
  {
    slot: 'breakfast',
    title: 'Mic Dejun',
    icon: '🥞',
    subtitle: 'Omlete pufoase, ouă, iaurt grecesc, terci de ovăz și preparate rapide de dimineață.',
  },
  {
    slot: 'lunch',
    title: 'Prânz',
    icon: '🍲',
    subtitle: 'Ciorbe calde, supe cremă, fripturi fragede cu garnituri și prânzuri consistente.',
  },
  {
    slot: 'dinner',
    title: 'Cină',
    icon: '🍽️',
    subtitle: 'Mâncăruri echilibrate, pește la cuptor, salate bogate și cine savuroase.',
  },
  {
    slot: 'dessert',
    title: 'Desert de Casă',
    icon: '🍰',
    subtitle: 'Papanași tradiționali, lava cake, clătite, budinci catifelate și delicii dulci.',
  },
];

export const FOOD_TIER_OPTIONS: {
  id: FoodTier;
  label: string;
  icon: string;
  priceEst: string;
  desc: string;
}[] = [
  {
    id: 'basic',
    label: 'Basic (Economic & Buget)',
    icon: '🥉',
    priceEst: '~8-12 lei / porție',
    desc: 'Ingrediente de bază accesibile: pui, ouă, orez, cartofi, legume de sezon, paste, mămăligă.',
  },
  {
    id: 'medium',
    label: 'Medium (Echilibrat & Familie)',
    icon: '🥈',
    priceEst: '~13-18 lei / porție',
    desc: 'Calitate superioară: piept de pui dezosat, sos bolognese, ciorbe bogate, telemea superioară, iaurt grecesc.',
  },
  {
    id: 'premium',
    label: 'Premium (Gourmet & Răsfăț)',
    icon: '🥇',
    priceEst: '~20-35+ lei / porție',
    desc: 'Ingrediente fine: steak din antricot Black Angus, somon proaspăt, creveți aromați, budinci de chia, lava cake.',
  },
];
