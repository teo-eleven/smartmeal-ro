import type * as OnboardingOptions from '../onboardingOptions';

/** The label is computed once when the module loads, so each platform gets a fresh copy. */
function dietStepLabel(healthGoalsAvailable: boolean): string {
  let label = '';
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const platformHealth = require('../../../utils/platformHealth');
    jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(healthGoalsAvailable);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const options: typeof OnboardingOptions = require('../onboardingOptions');
    label = options.ONBOARDING_STEPS_META[0].shortDesc;
  });
  return label;
}

describe('onboarding diet step label (A.8c-2)', () => {
  afterEach(() => jest.restoreAllMocks());

  test('on Android and web it mentions health, as before', () => {
    expect(dietStepLabel(true)).toBe('Restricții & Sănătate');
  });

  test('on iOS it has no health wording', () => {
    expect(dietStepLabel(false)).toBe('Restricții & preferințe');
  });
});
