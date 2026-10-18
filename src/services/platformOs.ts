/**
 * The platform the bundle was built for: 'ios', 'android' or 'web'.
 *
 * babel-preset-expo replaces the literal `process.env.EXPO_OS` with the target platform at
 * build time, so it must stay written exactly like this. It sits in its own module because
 * a test cannot set it: without a build platform the expression compiles to undefined, and
 * tests mock this module instead.
 */
export function currentOs(): string | undefined {
  return process.env.EXPO_OS;
}
