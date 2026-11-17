import fs from 'fs';
import path from 'path';

/**
 * No hard-coded platform or store names in what the app says (A.12; APP-6, AS-29): on iOS
 * nothing may mention Android or Google Play, on Android nothing may mention Apple. Wording
 * that depends on the store comes from src/utils/storeWording.ts, which is tested per platform.
 * Comments are left out of the scan; code that is not shown to anyone stays allowed below.
 */
const ROOT = path.join(__dirname, '..', '..');
const SRC = path.join(ROOT, 'src');
const PLATFORM_WORD = /\b(?:Apple|iPhone|iPad|iOS|App Store|Android|Google|Play)\b/;

const ALLOWED: Record<string, string> = {
  'src/utils/storeWording.ts': 'the one place that names the store and the device, per platform',
  'src/utils/deviceLabel.ts': "names the user's own devices in Cont → Dispozitive",
  'src/data/retailProducts.ts': 'a product name ("Strongbow Gold Apple"), not a platform',
};

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

function withoutComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

test('no platform or store names hard-coded outside the wording helper', () => {
  const offenders = [...sourceFiles(SRC), path.join(ROOT, 'App.tsx')]
    .map((file) => path.relative(ROOT, file).split(path.sep).join('/'))
    .filter((file) => !(file in ALLOWED))
    .filter((file) =>
      PLATFORM_WORD.test(withoutComments(fs.readFileSync(path.join(ROOT, file), 'utf8')))
    );
  expect(offenders).toEqual([]);
});
