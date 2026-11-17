import { HealthGoalTag } from '../../types';
import { decideGoalsUpload, keepCloudHealthGoals, withoutHealthGoals } from '../goalsSyncPolicy';

const base = {
  areGoalsAvailable: true,
  goals: ['heart_healthy', 'pork_free'] as HealthGoalTag[],
  consent: 'not-granted' as const,
  declinedGoals: [] as HealthGoalTag[],
};

describe('decideGoalsUpload', () => {
  test('keeps the cloud goals untouched where goals are unavailable (iOS), whatever the consent', () => {
    expect(decideGoalsUpload({ ...base, areGoalsAvailable: false, consent: 'granted' })).toBe(
      'keep-cloud'
    );
  });

  test('sends when the account agreed to goals', () => {
    expect(decideGoalsUpload({ ...base, consent: 'granted' })).toBe('send');
  });

  test('asks when the account has not agreed and nothing was declined', () => {
    expect(decideGoalsUpload(base)).toBe('ask');
  });

  test('does not ask about pork-free alone, it is not a health goal', () => {
    expect(decideGoalsUpload({ ...base, goals: ['pork_free'] })).toBe('send');
    expect(decideGoalsUpload({ ...base, goals: undefined })).toBe('send');
  });

  test('keeps the goals on the phone once every ticked goal was declined', () => {
    expect(decideGoalsUpload({ ...base, declinedGoals: ['heart_healthy'] })).toBe('strip');
  });

  test('asks again when a goal not yet declined is ticked', () => {
    const goals: HealthGoalTag[] = ['heart_healthy', 'high_fiber'];
    expect(decideGoalsUpload({ ...base, goals, declinedGoals: ['heart_healthy'] })).toBe('ask');
  });

  test('strips without asking when the consent record is missing or unreadable', () => {
    expect(decideGoalsUpload({ ...base, consent: 'unreadable' })).toBe('strip');
  });
});

describe('withoutHealthGoals', () => {
  test('keeps pork-free and drops the rest, without touching the input', () => {
    const tags: HealthGoalTag[] = ['heart_healthy', 'pork_free'];
    expect(withoutHealthGoals(tags)).toEqual(['pork_free']);
    expect(tags).toEqual(['heart_healthy', 'pork_free']);
    expect(withoutHealthGoals(undefined)).toEqual([]);
  });
});

describe('keepCloudHealthGoals', () => {
  test('sends the cloud goals back exactly, in the cloud order', () => {
    expect(
      keepCloudHealthGoals(['pork_free'], ['pork_free', 'heart_healthy', 'high_fiber'])
    ).toEqual(['pork_free', 'heart_healthy', 'high_fiber']);
  });

  test('follows the phone for pork-free: dropped there is dropped in the account', () => {
    expect(keepCloudHealthGoals([], ['heart_healthy', 'pork_free'])).toEqual(['heart_healthy']);
  });

  test('adds a pork-free the account did not have, never a local health goal', () => {
    expect(keepCloudHealthGoals(['pork_free', 'high_fiber'], ['heart_healthy'])).toEqual([
      'heart_healthy',
      'pork_free',
    ]);
  });
});
