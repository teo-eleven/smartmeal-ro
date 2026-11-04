// Draws the app icon, Android adaptive icon, splash mark and web favicon from
// assets/source/mark.svg, with the Chromium Playwright already installs: `npm run icons`.
//
// Usage: node scripts/renderIcons.mjs [out-dir]   (default: assets)
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = process.argv[2] ?? join(ROOT, 'assets');
const MARK = readFileSync(join(ROOT, 'assets/source/mark.svg'), 'utf8');

// Midnight Forest & Smoked Walnut (src/styles/theme.ts): forest at the centre, night at the edge.
const FOREST = '#323828';
const FOREST_NIGHT = '#1E2114';

/**
 * Each asset: its size, whether it carries the forest background, and how large the mark is.
 * Android crops adaptive icons to a circle of 66% of the canvas, so its mark is smaller.
 */
const ASSETS = [
  { file: 'icon.png', size: 1024, background: true, scale: 1 },
  { file: 'adaptive-icon.png', size: 1024, background: false, scale: 0.82 },
  { file: 'splash.png', size: 1024, background: false, scale: 1 },
  { file: 'favicon.png', size: 48, background: true, scale: 1.12 },
];

function page({ size, background, scale }) {
  const fill = background
    ? `<defs><radialGradient id="bg" cx="50%" cy="45%" r="70%">
         <stop offset="0" stop-color="${FOREST}" /><stop offset="1" stop-color="${FOREST_NIGHT}" />
       </radialGradient></defs><rect width="1024" height="1024" fill="url(#bg)" />`
    : '';
  const mark = `<g transform="translate(512 512) scale(${scale}) translate(-512 -512)">${MARK}</g>`;
  return `<!DOCTYPE html><html><body style="margin:0;background:transparent">
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"
      viewBox="0 0 1024 1024">${fill}${mark}</svg></body></html>`;
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const asset of ASSETS) {
    const tab = await browser.newPage({ viewport: { width: asset.size, height: asset.size } });
    await tab.setContent(page(asset));
    await tab.locator('svg').screenshot({ path: join(OUT, asset.file), omitBackground: true });
    await tab.close();
    console.log(`${asset.file} ${asset.size}px`);
  }
} finally {
  await browser.close();
}
