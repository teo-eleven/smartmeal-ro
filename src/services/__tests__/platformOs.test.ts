import { transformFileSync } from '@babel/core';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const PLATFORM_OS_FILE = path.join(ROOT, 'src/services/platformOs.ts');

/** Compiles platformOs.ts the way Metro does for one platform, with the project babel config. */
function compileFor(platform: string): string {
  const caller = { name: 'metro', bundler: 'metro', platform };
  const output = transformFileSync(PLATFORM_OS_FILE, {
    cwd: ROOT,
    configFile: path.join(ROOT, 'babel.config.js'),
    babelrc: false,
    caller,
  });
  return output?.code ?? '';
}

/**
 * The iOS health-goal switch (A.8) depends on babel-preset-expo replacing `process.env.EXPO_OS`
 * with the build platform. A rewrite such as `const { EXPO_OS } = process.env` is not inlined
 * and would silently show health goals on iOS; this fails first (A.8c-3).
 */
describe('currentOs is inlined at build time (A.8c-3)', () => {
  test.each(['ios', 'android'])('a %s bundle returns the literal platform', (platform) => {
    expect(compileFor(platform)).toMatch(new RegExp(`return\\s*"${platform}"`));
  });
});
