import { currentOs } from '../../services/platformOs';
import { storeAccountName } from '../storeWording';

jest.mock('../../services/platformOs', () => ({ currentOs: jest.fn() }));

const runOn = (os: string | undefined) => jest.mocked(currentOs).mockReturnValue(os);

const APPLE_WORDS = /Apple|iPhone|iPad|iOS|App Store/;
const GOOGLE_WORDS = /Android|Google|Play/;

/** Each store wants no mention of the other platform (APP-6, AS-29); web names neither. */
describe('storeAccountName (A.12)', () => {
  test('names Apple on iOS, and nothing of Android', () => {
    runOn('ios');
    expect(storeAccountName()).toBe('Apple');
    expect(storeAccountName()).not.toMatch(GOOGLE_WORDS);
  });

  test('names Google Play on Android, and nothing of Apple', () => {
    runOn('android');
    expect(storeAccountName()).toBe('Google Play');
    expect(storeAccountName()).not.toMatch(APPLE_WORDS);
  });

  test.each(['web', undefined])('stays neutral on %s', (os) => {
    runOn(os);
    expect(storeAccountName()).toBe('de magazin');
  });
});
