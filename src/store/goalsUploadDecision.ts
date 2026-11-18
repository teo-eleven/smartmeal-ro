import { warnSafely } from '../services/authErrors';
import { cloudSyncService } from '../services/supabase';
import { UserPreferences } from '../types';
import {
  GoalsConsentState,
  GoalsUpload,
  decideGoalsUpload,
  healthGoalsOf,
} from '../utils/goalsSyncPolicy';
import { areHealthGoalsAvailable } from '../utils/platformHealth';
import { GoalsConsentRequest, useGoalsSyncConsentStore } from './goalsSyncConsentStore';

const WARN_CONSENT_UNREADABLE_RO = 'Nu s-a putut citi acordul pentru obiective; rămân pe telefon.';

/**
 * Reads the account's consent only when there are goals to send. A read that fails counts as
 * unreadable, which keeps the goals on the phone: a failure must never open the gate.
 */
async function readGoalsConsent(userId: string): Promise<GoalsConsentState> {
  try {
    const consent = await cloudSyncService.loadConsent(userId);
    if (!consent || !consent.health_data_consent) return 'unreadable';
    return consent.goals_included ? 'granted' : 'not-granted';
  } catch (e) {
    warnSafely(WARN_CONSENT_UNREADABLE_RO, e);
    return 'unreadable';
  }
}

/**
 * What the upload about to happen may do with the health goals. When the answer is 'ask',
 * the question has been put to the person (the dialog shows it) and nothing may be uploaded
 * now; the answer carries on through `onSettled`.
 */
export async function resolveGoalsUpload(
  userId: string,
  preferences: UserPreferences,
  onSettled: GoalsConsentRequest['onSettled']
): Promise<GoalsUpload> {
  const isAvailable = areHealthGoalsAvailable();
  const goals = healthGoalsOf(preferences.healthGoalTags);
  if (!isAvailable || goals.length === 0) {
    return decideGoalsUpload({
      areGoalsAvailable: isAvailable,
      goals,
      consent: 'unreadable',
      declinedGoals: [],
    });
  }

  const choices = useGoalsSyncConsentStore.getState();
  await choices.load();
  const decision = decideGoalsUpload({
    areGoalsAvailable: isAvailable,
    goals,
    consent: await readGoalsConsent(userId),
    declinedGoals: choices.declinedGoalsFor(userId),
  });
  if (decision === 'ask') choices.ask({ userId, goals, onSettled });
  return decision;
}
