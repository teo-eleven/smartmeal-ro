import { RECIPES, RECIPES_MAP } from '../../data/recipes';
import { RECIPE_PHOTO_MANIFEST } from '../../data/recipePhotoManifest';
import {
  ARCHETYPE_PHOTO_URLS,
  getPhotoByKeywords,
  getRecipePhoto,
  matchDishKeyword,
} from '../recipePhotography';
import { Recipe } from '../../types';

/**
 * The old tests compared each recipe's URL with an id typed into the test, so they "proved"
 * that the biscuit salami showed photo-1541781774459 — a cat under a blanket. A URL says
 * nothing about what is in the picture. What can be tested is the process: every photo comes
 * from the manifest, every manifest entry records who checked it and when, and anything the
 * manifest does not cover gets the generated card instead of a guess.
 */

const ALLOWED_HOSTS = ['images.unsplash.com', 'upload.wikimedia.org'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const fabricated = (title: string): Recipe => ({ ...RECIPES[0], id: 'reteta_noua_ai', title });

describe('manifestul de fotografii', () => {
  test('fiecare intrare aparține unei rețete din catalog', () => {
    const orphans = Object.keys(RECIPE_PHOTO_MANIFEST).filter((id) => !RECIPES_MAP[id]);

    expect(orphans).toEqual([]);
  });

  test('fiecare poză vine de pe o gazdă permisă, prin https', () => {
    const offHost = Object.entries(RECIPE_PHOTO_MANIFEST).filter(([, photo]) => {
      const url = new URL(photo.url);
      return url.protocol !== 'https:' || !ALLOWED_HOSTS.includes(url.hostname);
    });

    expect(offHost.map(([id]) => id)).toEqual([]);
  });

  test('fiecare poză are data verificării vizuale', () => {
    const unverified = Object.entries(RECIPE_PHOTO_MANIFEST).filter(
      ([, photo]) => !ISO_DATE.test(photo.verifiedAt)
    );

    expect(unverified.map(([id]) => id)).toEqual([]);
  });

  test('pozele de pe Wikimedia au autor, licență și link sursă (cerință de licență)', () => {
    const uncredited = Object.entries(RECIPE_PHOTO_MANIFEST).filter(
      ([, photo]) =>
        photo.source === 'wikimedia' &&
        !(photo.credit?.author && photo.credit.license && photo.credit.sourceUrl)
    );

    expect(uncredited.map(([id]) => id)).toEqual([]);
  });

  test('pozele confirmate greșite în auditul din 21.10.2026 nu mai apar nicăieri', () => {
    const KNOWN_WRONG = [
      'photo-1541781774459-bb2af2f05b55', // cat under a blanket
      'photo-1517673132405-a56a62b18caf', // stack of books
      'photo-1556761175-5973dc0f32e7', // office meeting
      'photo-1536599018102-9f803c140fc1', // city skyline
      'photo-1513456852971-30c0b8199d4d', // nachos (was on chia puddings)
      'photo-1534422298391-e4f8c172dddb', // dumplings (was on mămăligă)
      'photo-1576402187878-974f70c890a5', // penne (was on rice pudding)
      'photo-1582878826629-29b7ad1cdc43', // pho (was on bean soup)
      'photo-1579372786545-d24232daf58c', // cupcakes (was on papanași)
    ];
    const everywhere = [
      ...Object.values(RECIPE_PHOTO_MANIFEST).map((photo) => photo.url),
      ...Object.values(ARCHETYPE_PHOTO_URLS),
    ];

    KNOWN_WRONG.forEach((photoId) => {
      expect(everywhere.filter((url) => url.includes(photoId))).toEqual([]);
    });
  });
});

describe('getRecipePhoto', () => {
  test('o rețetă din manifest primește poza ei verificată', () => {
    const [recipeId, photo] = Object.entries(RECIPE_PHOTO_MANIFEST)[0];

    expect(getRecipePhoto(RECIPES_MAP[recipeId])).toEqual(photo);
  });

  test('o rețetă fără poză verificată și fără potrivire primește null (cardul generat)', () => {
    expect(getRecipePhoto(fabricated('Fel inventat fără niciun cuvânt cunoscut'))).toBeNull();
  });

  test('imageUrl explicit are prioritate', () => {
    const custom = { ...RECIPES[0], imageUrl: 'https://upload.wikimedia.org/x.jpg' };

    expect(getRecipePhoto(custom)?.url).toBe('https://upload.wikimedia.org/x.jpg');
  });
});

describe('potrivirea după cuvinte cheie (rețete noi, fără ID în manifest)', () => {
  test('„Ovăz peste noapte” e ovăz, nu pește', () => {
    expect(matchDishKeyword('Ovăz peste noapte cu banane')).toBe('ovaz_peste_noapte_mar_nuci');
  });

  test('garnitura nu decide poza: pui cu mămăligă nu e mămăligă', () => {
    expect(matchDishKeyword('Pulpe de pui la cuptor cu mujdei și mămăligă')).toBeNull();
  });

  test('sosul nu decide poza: dovlecei cu sos de iaurt nu sunt desertul cu iaurt', () => {
    expect(matchDishKeyword('Dovlecei la cuptor cu sos de iaurt')).toBeNull();
  });

  test('felul principal câștigă și când e un singur cuvânt', () => {
    expect(matchDishKeyword('Ciorbă de perișoare acrită cu borș')).toBe(
      'ciorba_perisoare_acrita_bors'
    );
    expect(matchDishKeyword('Somon la tigaie cu orez')).toBe('somon_la_tigaie_orez');
  });

  test('un cuvânt-cheie cu rețetă fără poză verificată dă null, nu altă poză', () => {
    const recipeId = matchDishKeyword('Mămăligă cu brânză');
    expect(recipeId).toBe('mamaliga_branza_smantana');
    expect(getPhotoByKeywords('Mămăligă cu brânză')).toEqual(
      RECIPE_PHOTO_MANIFEST[recipeId!] ?? null
    );
  });

  test('doar cuvinte întregi: „avocado” nu e „cod”', () => {
    expect(getPhotoByKeywords('Cremă de avocado')).toBeNull();
  });

  test('felul principal se recunoaște și cu diacritice și fără', () => {
    expect(getPhotoByKeywords('Ciorbă rădăuțeană de casă')).toEqual(
      getPhotoByKeywords('Ciorba radauteana de casa')
    );
  });
});
