import * as fs from 'fs';
import * as path from 'path';

/**
 * Prices are estimates from usual shelf prices, not live data from the chains, and the app
 * has no relationship with any of them. "Prețuri reale", "oficial" and "catalog oficial" said
 * otherwise on five screens: a misleading claim Apple rejects (2.3.1), and one that implied
 * a partnership the store listing itself denies. This keeps them from coming back.
 */
const BANNED = [/prețuri reale/i, /\boficial/i, /catalog(ul)? oficial/i, /revist\w* oficial/i];

function uiFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : uiFiles(full);
    return /\.tsx$/.test(e.name) ? [full] : [];
  });
}

describe('afirmațiile despre prețuri', () => {
  test('nicio interfață nu pretinde prețuri reale sau oficiale', () => {
    const root = path.join(__dirname, '..', '..');
    const files = [...uiFiles(path.join(root, 'src')), path.join(root, 'App.tsx')];
    const hits = files.flatMap((file) =>
      fs
        .readFileSync(file, 'utf8')
        .split('\n')
        .map((line, i) => ({ line, at: `${path.relative(root, file)}:${i + 1}` }))
        .filter(({ line }) => BANNED.some((re) => re.test(line)))
        .map(({ at, line }) => `${at}  ${line.trim()}`)
    );

    expect(hits).toEqual([]);
  });
});
