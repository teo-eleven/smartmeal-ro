import fs from 'fs';
import path from 'path';

/**
 * Pure layers must not reach into the store (A.7f-3): utils and the engine take everything
 * they need as arguments. The safety answer lives in a store, so the code that reads it is
 * in src/store (guardedEngine) or in the screens, never down here.
 */
const SRC = path.join(__dirname, '..');
const PURE_LAYERS = ['utils', 'engine'];
const STORE_IMPORT = /from\s+['"](?:\.\.?\/)+(?:src\/)?store(?:\/|['"])/;

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

test.each(PURE_LAYERS)('src/%s does not import from the store', (layer) => {
  const offenders = sourceFiles(path.join(SRC, layer))
    .filter((file) => STORE_IMPORT.test(fs.readFileSync(file, 'utf8')))
    .map((file) => path.relative(SRC, file));
  expect(offenders).toEqual([]);
});
