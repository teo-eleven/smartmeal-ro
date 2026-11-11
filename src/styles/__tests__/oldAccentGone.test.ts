import fs from 'fs';
import path from 'path';

/**
 * The amber accent the app had before the Midnight Forest & Smoked Walnut theme. Buttons,
 * progress bars and step dots take `theme.primaryGradient` instead; these four tones must
 * not creep back into a screen.
 */
const OLD_AMBER = ['#F3C06D', '#E6A756', '#D98E3A', '#C88232'];
/** The same four as rgba(), spaces ignored. */
const OLD_AMBER_RGB = ['243,192,109', '230,167,86', '217,142,58', '200,130,50'];
const SRC = path.join(__dirname, '..', '..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

test('no screen still paints the old amber accent', () => {
  const offenders = sourceFiles(SRC).flatMap((file) => {
    const text = fs.readFileSync(file, 'utf8').toUpperCase();
    const compact = text.replace(/\s+/g, '');
    const found = [
      ...OLD_AMBER.filter((hex) => text.includes(hex)),
      ...OLD_AMBER_RGB.filter((rgb) => compact.includes(`RGBA(${rgb},`)),
    ];
    return found.map((colour) => `${path.relative(SRC, file)}: ${colour}`);
  });
  expect(offenders).toEqual([]);
});
