import {
  HEALTH_SAFETY_QUESTION_RO,
  isGoalBlocked,
  needsSafetyQuestion,
  withoutBlockedGoals,
} from '../healthSafety';
import { HEALTH_GOALS_CATALOG } from '../../data/healthTags';
import { HealthGoalTag } from '../../types';

const MEDICAL_GOALS = HEALTH_GOALS_CATALOG.map((g) => g.id).filter((id) => id !== 'pork_free');

describe('health safety question (A.7a)', () => {
  test('asks before the first health goal, and only while unanswered', () => {
    expect(needsSafetyQuestion('diabetic_friendly', null)).toBe(true);
    expect(needsSafetyQuestion('diabetic_friendly', 'no')).toBe(false);
    expect(needsSafetyQuestion('diabetic_friendly', 'yes')).toBe(false);
  });

  test('pork-free is a religious or personal choice: never asks, never blocked', () => {
    expect(needsSafetyQuestion('pork_free', null)).toBe(false);
    expect(isGoalBlocked('pork_free', 'yes')).toBe(false);
  });

  test('a "yes" blocks every health goal; "no" and no answer block none', () => {
    for (const goal of MEDICAL_GOALS) {
      expect(isGoalBlocked(goal, 'yes')).toBe(true);
      expect(isGoalBlocked(goal, 'no')).toBe(false);
      expect(isGoalBlocked(goal, null)).toBe(false);
    }
  });

  test('a "yes" strips health goals already chosen, keeps pork-free, leaves the input alone', () => {
    const chosen: HealthGoalTag[] = ['heart_healthy', 'pork_free', 'high_fiber'];

    expect(withoutBlockedGoals(chosen, 'yes')).toEqual(['pork_free']);
    expect(withoutBlockedGoals(chosen, 'no')).toEqual(chosen);
    expect(chosen).toEqual(['heart_healthy', 'pork_free', 'high_fiber']);
  });

  test('the question names every situation from the research (HEALTH_GUIDELINES.md §9.1)', () => {
    for (const situation of [
      'însărcinată',
      'alăptezi',
      'rinichi',
      'insulină',
      'sulfoniluree',
      'anticoagulante',
      'IMAO',
      'tulburare de alimentație',
    ]) {
      expect(HEALTH_SAFETY_QUESTION_RO).toContain(situation);
    }
  });
});
