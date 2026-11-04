import fs from 'fs';
import path from 'path';

/**
 * Every colour comes from the theme (src/styles/theme.ts), so the palette can change in one
 * place and every text keeps the contrast its tests promise. The only files allowed their own:
 */
const OWN_COLOURS_ALLOWED = [
  // The palette itself.
  'styles/theme.ts',
  // Each supermarket's brand colour, shown only as the small dot next to its name.
  'data/supermarkets.ts',
  // Natural food colours (tomato red, spinach green) on the card drawn when a photo fails.
  'utils/recipeVisual.ts',
  'components/RecipeVisual.tsx',
];
const SRC = path.join(__dirname, '..', '..');
// A colour anywhere inside a string, so one inside a shadow or a border ('0 2px 8px #000')
// is caught too, not only a string that is nothing but the colour.
const COLOUR_LITERAL = /['"`][^'"`\n]*?(#[0-9a-f]{3,8}\b|(?:rgba?|hsla?)\([^'"`)]*\))/gi;
// App.tsx sits beside src, and draws the top bar.
const APP_ROOT = path.join(SRC, '..', 'App.tsx');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

test('no file outside the allowed list draws a colour of its own', () => {
  const offenders = [...sourceFiles(SRC), APP_ROOT]
    .filter((file) => !OWN_COLOURS_ALLOWED.includes(path.relative(SRC, file)))
    .flatMap((file) =>
      fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, at) =>
          [...line.matchAll(COLOUR_LITERAL)].map(
            (match) => `${path.relative(SRC, file)}:${at + 1} ${match[1]}`
          )
        )
    );
  expect(offenders).toEqual([]);
});

test.each(OWN_COLOURS_ALLOWED)('the allowed file %s still exists', (allowed) => {
  expect(fs.existsSync(path.join(SRC, allowed))).toBe(true);
});
