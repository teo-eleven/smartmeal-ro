import fs from 'fs';
import path from 'path';
import { FOREST_WALNUT_PALETTE } from '../styles/theme';

/**
 * The icon, splash and web loader wear the app's palette (stage T.10). They are drawn by
 * `npm run icons` from assets/source/mark.svg.
 */
const ROOT = path.join(__dirname, '..', '..');
const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8')).expo;
const PALETTE = Object.values(FOREST_WALNUT_PALETTE).map((hex) => hex.toUpperCase());

/** Width, height and PNG colour type (2: RGB, 6: RGB with alpha), from the IHDR chunk. */
function pngHeader(asset: string) {
  const png = fs.readFileSync(path.join(ROOT, 'assets', asset));
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20), colourType: png[25] };
}
const RGB = 2;
const RGB_ALPHA = 6;

describe('app.json colours come from the palette', () => {
  const splash = appJson.plugins.find(
    (plugin: unknown) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
  )[1];

  test.each([
    ['the splash background', splash.backgroundColor],
    ['the Android adaptive icon background', appJson.android.adaptiveIcon.backgroundColor],
    ['the primary colour', appJson.primaryColor],
  ])('%s', (_name, colour: string) => {
    expect(PALETTE).toContain(colour.toUpperCase());
  });
});

describe('the image assets', () => {
  test('the app icon is 1024 px and has no transparency, as the App Store requires', () => {
    expect(pngHeader('icon.png')).toEqual({ width: 1024, height: 1024, colourType: RGB });
  });

  test.each(['adaptive-icon.png', 'splash.png'])(
    '%s is a mark on a transparent canvas, over the configured background',
    (asset) => {
      expect(pngHeader(asset)).toEqual({ width: 1024, height: 1024, colourType: RGB_ALPHA });
    }
  );

  test('the favicon is 48 px', () => {
    expect(pngHeader('favicon.png')).toMatchObject({ width: 48, height: 48 });
  });
});

describe('the web loader shown before the app starts', () => {
  const html = fs.readFileSync(path.join(ROOT, 'public/index.html'), 'utf8');

  test('uses only palette colours', () => {
    const hexes = (html.match(/#[0-9a-f]{6}\b/gi) ?? []).map((hex) => hex.toUpperCase());
    expect(hexes.filter((hex) => !PALETTE.includes(hex))).toEqual([]);
  });

  test('tints the browser bar in forest night', () => {
    expect(html).toContain(
      `<meta name="theme-color" content="${FOREST_WALNUT_PALETTE.forestNight}" />`
    );
  });

  test('has no React property names in its CSS', () => {
    expect(html).not.toMatch(/justifyContent/);
  });
});
