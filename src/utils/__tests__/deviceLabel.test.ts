import { describeDevice, devicePlatform } from '../deviceLabel';

const CHROME_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';
const EDGE_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 Edg/129.0';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0';
const CHROME_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0 Mobile/15E148 Safari/604.1';
const FIREFOX_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/131.0 Mobile/15E148 Safari/605.1.15';
const EDGE_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36 EdgA/129.0';
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36';

/** What the device list in Cont calls each phone and browser. */
describe('numele dispozitivului', () => {
  test('aplicația de iPhone', () => {
    expect(describeDevice('ios')).toBe('iPhone');
  });

  test('aplicația de Android', () => {
    expect(describeDevice('android')).toBe('Telefon Android');
  });

  test.each([
    [CHROME_MAC, 'Chrome pe Mac'],
    [EDGE_WINDOWS, 'Edge pe Windows'],
    [SAFARI_IPHONE, 'Safari pe iPhone'],
    [FIREFOX_LINUX, 'Firefox pe Linux'],
    [CHROME_ANDROID, 'Chrome pe Android'],
    [CHROME_IPHONE, 'Chrome pe iPhone'],
    [FIREFOX_IPHONE, 'Firefox pe iPhone'],
    [EDGE_ANDROID, 'Edge pe Android'],
  ])('pe web, browserul și sistemul: %#', (userAgent, expected) => {
    expect(describeDevice('web', userAgent)).toBe(expected);
  });

  test('un browser necunoscut e doar „Browser”', () => {
    expect(describeDevice('web', 'curl/8.0')).toBe('Browser');
    expect(describeDevice('web')).toBe('Browser');
  });
});

describe('platforma trimisă la server', () => {
  test.each([
    ['ios', 'ios'],
    ['android', 'android'],
    ['web', 'web'],
    [undefined, 'web'],
    ['windows', 'web'],
  ])('%s → %s', (os, expected) => {
    expect(devicePlatform(os)).toBe(expected);
  });
});
