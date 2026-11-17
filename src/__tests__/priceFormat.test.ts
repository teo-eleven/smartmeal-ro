import fs from 'fs';
import path from 'path';

/**
 * Prices are written the Romanian way, "7,90 lei" (A.11f-11). A price shown with toFixed
 * prints a dot, so every amount goes through utils/formatRon instead. Whole numbers
 * (toFixed(0)) and non-price figures are not the concern here.
 */
const SRC = path.join(__dirname, '..');
const DECIMAL_TO_FIXED = /\.toFixed\(\s*[12]\s*\)/;

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

test('no screen or component prints a decimal with toFixed, so no price has a dot', () => {
  const offenders = sourceFiles(SRC)
    .filter((file) => DECIMAL_TO_FIXED.test(fs.readFileSync(file, 'utf8')))
    .map((file) => path.relative(SRC, file));

  expect(offenders).toEqual([]);
});
