import fs from 'fs';
import path from 'path';

/**
 * Screens take every colour from the theme (src/styles/theme.ts), so the palette can change
 * in one place and every text keeps the contrast its tests promise. Folders join this list as
 * the theme reaches them (docs/HEALTH_CRAVINGS_STEPS.md, stage T).
 */
const THEMED_FOLDERS = ['screens/onboarding'];
const SRC = path.join(__dirname, '..', '..');
const COLOUR_LITERAL = /['"`](#[0-9a-f]{3,8}|rgba?\([^'"`]*\))['"`]/gi;

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

test.each(THEMED_FOLDERS)('%s draws no colour of its own', (folder) => {
  const offenders = sourceFiles(path.join(SRC, folder)).flatMap((file) =>
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
