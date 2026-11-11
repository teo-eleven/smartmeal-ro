import { currentOs } from '../../services/platformOs';
import { areHealthGoalsAvailable, HEALTH_GOALS_HIDDEN_ON_OS } from '../platformHealth';

jest.mock('../../services/platformOs', () => ({ currentOs: jest.fn() }));

const runOn = (os: string | undefined) => jest.mocked(currentOs).mockReturnValue(os);

describe('areHealthGoalsAvailable (A.8, Apple guideline 1.4.1)', () => {
  test('health goals are hidden on iOS (iPhone and iPad)', () => {
    runOn('ios');
    expect(HEALTH_GOALS_HIDDEN_ON_OS).toBe('ios');
    expect(areHealthGoalsAvailable()).toBe(false);
  });

  test.each(['android', 'web'])('health goals stay available on %s', (os) => {
    runOn(os);
    expect(areHealthGoalsAvailable()).toBe(true);
  });

  test('without a build platform (tests, tools) they stay available, as before', () => {
    runOn(undefined);
    expect(areHealthGoalsAvailable()).toBe(true);
  });

  test('reads the platform when called, not when imported', () => {
    runOn('android');
    expect(areHealthGoalsAvailable()).toBe(true);
    runOn('ios');
    expect(areHealthGoalsAvailable()).toBe(false);
  });
});
