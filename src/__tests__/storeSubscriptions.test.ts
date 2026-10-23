import fs from 'fs';
import path from 'path';

/**
 * `useAppStore()` with no selector subscribes a component to the whole store, so the board
 * and every open modal re-rendered on each tick of the notice queue or the window counter.
 * Components pick what they read, through a selector or useShallow.
 */
const ROOT = path.resolve(__dirname, '../..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

test('nicio componentă nu se abonează la tot store-ul', () => {
  const offenders = [...sourceFiles(path.join(ROOT, 'src')), path.join(ROOT, 'App.tsx')]
    .filter((file) => fs.readFileSync(file, 'utf8').includes('useAppStore()'))
    .map((file) => path.relative(ROOT, file));

  expect(offenders).toEqual([]);
});
