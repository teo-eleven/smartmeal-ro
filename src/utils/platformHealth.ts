import { currentOs } from '../services/platformOs';

/**
 * Where health goals are hidden: on iOS (iPhone and iPad) every health goal, label, badge and
 * question is left out, and the planner does not apply them. Apple's App Review guideline
 * 1.4.1 asks that health claims be substantiated, and no dietitian has reviewed ours yet
 * (docs/research/LEGAL_CLAIMS.md). Pork-free is religious or personal, not medical, and stays.
 *
 * The goals a user already saved are kept in the data, only not shown and not applied.
 */
export const HEALTH_GOALS_HIDDEN_ON_OS = 'ios';

/**
 * False on iOS. Read through platformOs (the build platform), not Platform.OS, so the store and
 * the pure layers can ask too: they run under plain Node in tests, where react-native cannot
 * load. Web stays available even in Safari on an iPhone, since the build platform is 'web'.
 */
export function areHealthGoalsAvailable(): boolean {
  return currentOs() !== HEALTH_GOALS_HIDDEN_ON_OS;
}
