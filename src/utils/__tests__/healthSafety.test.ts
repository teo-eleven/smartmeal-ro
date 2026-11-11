import {
  effectivePreferences,
  HEALTH_SAFETY_QUESTION_RO,
  isGoalBlocked,
  needsSafetyQuestion,
  withoutBlockedGoals,
} from '../healthSafety';
import { HEALTH_GOALS_CATALOG, isHealthGoal } from '../../data/healthTags';
import { HealthGoalTag } from '../../types';
import * as platformHealth from '../platformHealth';

const MEDICAL_GOALS = HEALTH_GOALS_CATALOG.map((g) => g.id).filter(isHealthGoal);

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

describe('effectivePreferences: health goals apply only after a "no" (A.7e-2)', () => {
  const prefs = {
    peopleCount: 2,
    healthGoalTags: ['heart_healthy', 'pork_free', 'high_fiber'] as HealthGoalTag[],
  };

  test('with no answer yet, goals are not applied but pork-free is', () => {
    expect(effectivePreferences(prefs, null).healthGoalTags).toEqual(['pork_free']);
  });

  test('with "yes", goals are not applied but pork-free is', () => {
    expect(effectivePreferences(prefs, 'yes').healthGoalTags).toEqual(['pork_free']);
  });

  test('with "no", everything applies and the same object comes back', () => {
    expect(effectivePreferences(prefs, 'no')).toBe(prefs);
  });

  test('never mutates the input and keeps the other fields', () => {
    const result = effectivePreferences(prefs, null);
    expect(prefs.healthGoalTags).toEqual(['heart_healthy', 'pork_free', 'high_fiber']);
    expect(result.peopleCount).toBe(2);
    expect(result).not.toBe(prefs);
  });

  test('preferences without goals are returned as they are', () => {
    const bare = { peopleCount: 1, healthGoalTags: [] as HealthGoalTag[] };
    expect(effectivePreferences(bare, null)).toBe(bare);
  });
});

describe('effectivePreferences on iOS: health goals are never applied (A.8)', () => {
  const prefs = {
    peopleCount: 2,
    healthGoalTags: ['heart_healthy', 'pork_free', 'high_fiber'] as HealthGoalTag[],
  };
  beforeEach(() => jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(false));
  afterEach(() => jest.restoreAllMocks());

  test.each([null, 'yes', 'no'] as const)('with answer %s only pork-free applies', (answer) => {
    expect(effectivePreferences(prefs, answer).healthGoalTags).toEqual(['pork_free']);
  });

  test('keeps the stored goals untouched: only the copy the planner sees loses them', () => {
    const result = effectivePreferences(prefs, 'no');
    expect(result).not.toBe(prefs);
    expect(prefs.healthGoalTags).toEqual(['heart_healthy', 'pork_free', 'high_fiber']);
  });

  test('pork-free alone comes back as the same object', () => {
    const porkOnly = { peopleCount: 1, healthGoalTags: ['pork_free'] as HealthGoalTag[] };
    expect(effectivePreferences(porkOnly, 'no')).toBe(porkOnly);
  });
});
