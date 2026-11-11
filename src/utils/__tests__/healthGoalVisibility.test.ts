import * as platformHealth from '../platformHealth';
import { isGoalShown, shownGoalCatalog, shownGoalTags } from '../healthGoalVisibility';
import { HEALTH_GOALS_CATALOG, PORK_FREE_TAG } from '../../data/healthTags';
import { HealthGoalTag } from '../../types';

const STORED: HealthGoalTag[] = ['diabetic_friendly', 'pork_free', 'high_fiber'];

describe('which health goals may be shown (A.8)', () => {
  afterEach(() => jest.restoreAllMocks());

  test('on Android and web every goal is shown, as before', () => {
    expect(isGoalShown('diabetic_friendly')).toBe(true);
    expect(shownGoalTags(STORED)).toEqual(STORED);
    expect(shownGoalCatalog()).toEqual(HEALTH_GOALS_CATALOG);
  });

  describe('on iOS', () => {
    beforeEach(() => jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(false));

    test('only pork-free is shown: it is religious or personal, not medical', () => {
      expect(isGoalShown('diabetic_friendly')).toBe(false);
      expect(isGoalShown(PORK_FREE_TAG)).toBe(true);
      expect(shownGoalCatalog().map((g) => g.id)).toEqual([PORK_FREE_TAG]);
    });

    test('filters a copy and leaves the stored list as it was', () => {
      expect(shownGoalTags(STORED)).toEqual(['pork_free']);
      expect(STORED).toEqual(['diabetic_friendly', 'pork_free', 'high_fiber']);
    });

    test('copes with no stored goals', () => {
      expect(shownGoalTags(undefined)).toEqual([]);
    });
  });
});
