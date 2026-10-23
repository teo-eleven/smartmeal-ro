import fs from 'fs';
import path from 'path';

/**
 * The exported web pages carry script-src 'self' (scripts/injectCsp.mjs), which blocks inline
 * scripts. Caught here, at test time, instead of as a blank page after deploy.
 */
const PUBLIC = path.resolve(__dirname, '../../public');

test('nicio pagină web nu are scripturi inline', () => {
  const offenders = fs
    .readdirSync(PUBLIC)
    .filter((file) => file.endsWith('.html'))
    .filter((file) =>
      /<script(?![^>]*\bsrc=)[^>]*>/i.test(fs.readFileSync(path.join(PUBLIC, file), 'utf8'))
    );

  expect(offenders).toEqual([]);
});

test('nicio pagină nu folosește atribute de eveniment inline (onclick etc.)', () => {
  const offenders = fs
    .readdirSync(PUBLIC)
    .filter((file) => file.endsWith('.html'))
    .filter((file) =>
      /\son[a-z]+\s*=\s*["']/i.test(fs.readFileSync(path.join(PUBLIC, file), 'utf8'))
    );

  expect(offenders).toEqual([]);
});
