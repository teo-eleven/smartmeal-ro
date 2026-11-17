import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { cloudSyncService } from '../services/supabase';
import { warnSafely } from '../services/authErrors';
import { HealthGoalTag } from '../types';

/**
 * The "sync your health goals too?" question (2026-11-17 review, M2).
 *
 * The answer "only on this device" is remembered here, per account, under its own key: it is
 * not part of the preferences, so cloud sync never sees it. It lists the goals that were
 * declined, so a goal ticked later is a new question and the same goals are never asked twice.
 */
export const GOALS_SYNC_CHOICE_STORAGE_KEY = '@smartmeal_goals_sync_choice';

const WARN_READ_FAILED_RO = 'Nu s-a putut citi alegerea despre sincronizarea obiectivelor.';
const WARN_SAVE_FAILED_RO = 'Nu s-a putut salva alegerea despre sincronizarea obiectivelor.';
const WARN_RESET_FAILED_RO = 'Nu s-a putut șterge alegerea despre sincronizarea obiectivelor.';
/** Written when the key could not be removed: reads back as no choice at all. */
const NO_CHOICE_MARKER = '';

interface DeclinedChoice {
  userId: string;
  goals: HealthGoalTag[];
}

/** What the sync was doing when it stopped to ask, so the answer can carry on from there. */
export interface GoalsConsentRequest {
  userId: string;
  goals: HealthGoalTag[];
  /** Called once the question is settled: 'retry' sends the upload again, 'failed' reports it. */
  onSettled: (outcome: 'retry' | 'failed') => Promise<void>;
}

export type GoalsConsentAnswer = 'yes' | 'no';

interface GoalsSyncConsentState {
  declined: DeclinedChoice | null;
  isLoaded: boolean;
  request: GoalsConsentRequest | null;
  load: () => Promise<void>;
  declinedGoalsFor: (userId: string) => HealthGoalTag[];
  ask: (request: GoalsConsentRequest) => void;
  /** The window was closed without an answer: nothing is decided, the next upload asks again. */
  dismiss: () => void;
  answer: (answer: GoalsConsentAnswer) => Promise<void>;
  /** The choice belongs to one account: it goes with it, and so does an open question. */
  reset: () => Promise<void>;
}

function parseChoice(raw: string | null): DeclinedChoice | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const { userId, goals } = value as { userId?: unknown; goals?: unknown };
    if (typeof userId !== 'string' || !Array.isArray(goals)) return null;
    return { userId, goals: goals.filter((g): g is HealthGoalTag => typeof g === 'string') };
  } catch {
    return null;
  }
}

let inFlightLoad: Promise<void> | null = null;
/** A read that started before a reset or a write must not bring an older choice back. */
let writeVersion = 0;

async function readChoice(): Promise<DeclinedChoice | null> {
  try {
    return parseChoice(await AsyncStorage.getItem(GOALS_SYNC_CHOICE_STORAGE_KEY));
  } catch (e) {
    warnSafely(WARN_READ_FAILED_RO, e);
    return null;
  }
}

async function saveChoice(choice: DeclinedChoice): Promise<void> {
  try {
    await AsyncStorage.setItem(GOALS_SYNC_CHOICE_STORAGE_KEY, JSON.stringify(choice));
  } catch (e) {
    warnSafely(WARN_SAVE_FAILED_RO, e);
  }
}

export const useGoalsSyncConsentStore = create<GoalsSyncConsentState>((set, get) => ({
  declined: null,
  isLoaded: false,
  request: null,

  load: () => {
    if (get().isLoaded) return Promise.resolve();
    if (inFlightLoad) return inFlightLoad;
    const versionAtStart = writeVersion;
    inFlightLoad = readChoice()
      .then((declined) => {
        set(writeVersion === versionAtStart ? { declined, isLoaded: true } : { isLoaded: true });
      })
      .finally(() => {
        inFlightLoad = null;
      });
    return inFlightLoad;
  },

  declinedGoalsFor: (userId) => {
    const { declined } = get();
    return declined?.userId === userId ? declined.goals : [];
  },

  ask: (request) => set({ request }),

  dismiss: () => set({ request: null }),

  answer: async (answer) => {
    const request = get().request;
    // Taken before the first await, so a second tap on the same button does nothing.
    if (!request) return;
    set({ request: null });

    if (answer === 'no') {
      writeVersion += 1;
      const previous = get().declinedGoalsFor(request.userId);
      const goals = [...new Set([...previous, ...request.goals])];
      const declined = { userId: request.userId, goals };
      set({ declined, isLoaded: true });
      await saveChoice(declined);
      await request.onSettled('retry');
      return;
    }

    const isGranted = await cloudSyncService.grantGoalsConsent();
    await request.onSettled(isGranted ? 'retry' : 'failed');
  },

  reset: async () => {
    writeVersion += 1;
    set({ declined: null, request: null });
    try {
      await AsyncStorage.removeItem(GOALS_SYNC_CHOICE_STORAGE_KEY);
    } catch (e) {
      warnSafely(WARN_RESET_FAILED_RO, e);
      try {
        await AsyncStorage.setItem(GOALS_SYNC_CHOICE_STORAGE_KEY, NO_CHOICE_MARKER);
      } catch (e2) {
        warnSafely(WARN_RESET_FAILED_RO, e2);
      }
    }
  },
}));
