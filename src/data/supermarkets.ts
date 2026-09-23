import { Supermarket, SupermarketId } from '../types';

export const SUPERMARKETS: Record<SupermarketId, Supermarket> = {
  lidl: {
    id: 'lidl',
    name: 'Lidl',
    tagline: 'Mereu surprinzător & prețuri accesibile',
    brandColor: '#0050aa',
    accentColor: '#fff000',
  },
  kaufland: {
    id: 'kaufland',
    name: 'Kaufland',
    tagline: 'Gamă variată & prețuri avantajoase',
    brandColor: '#e2001a',
    accentColor: '#ffffff',
  },
  carrefour: {
    id: 'carrefour',
    name: 'Carrefour',
    tagline: 'Alegerea ta pentru prospețime',
    brandColor: '#004e9a',
    accentColor: '#f01424',
  },
  mega_image: {
    id: 'mega_image',
    name: 'Mega Image',
    tagline: 'Aproape de casă & ingrediente premium',
    brandColor: '#c8102e',
    accentColor: '#1d71b8',
  },
  auchan: {
    id: 'auchan',
    name: 'Auchan',
    tagline: 'Format mare, economii mari & gamă uriașă',
    brandColor: '#e01a22',
    accentColor: '#00843d',
  },
  penny: {
    id: 'penny',
    name: 'Penny',
    tagline: 'Economisești bani, nu calitate',
    brandColor: '#cb1b16',
    accentColor: '#ffcd00',
  },
  profi: {
    id: 'profi',
    name: 'Profi',
    tagline: 'Zilnic prețuri mici chiar lângă tine',
    brandColor: '#ed1c24',
    accentColor: '#00a651',
  },
  sezamo: {
    id: 'sezamo',
    name: 'Sezamo',
    tagline: 'Supermarket online rapid & producători locali',
    brandColor: '#00845a',
    accentColor: '#f58220',
  },
};

export const SUPERMARKET_LIST: Supermarket[] = Object.values(SUPERMARKETS);
