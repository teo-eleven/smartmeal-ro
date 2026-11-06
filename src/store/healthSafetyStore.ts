import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { warnSafely } from '../services/authErrors';
import { HealthSafetyAnswer } from '../utils/healthSafety';

/**
 * The answer to the health safety question. It is health data (GDPR art. 9), so it lives only
 * on this phone, under its own key: it is not part of the preferences, so cloud sync never
 * sees it. Kept out of useAppStore, like the auth session and subscription stores.
 */
export const HEALTH_SAFETY_STORAGE_KEY = '@smartmeal_health_safety_answer';

interface HealthSafetyState {
  answer: HealthSafetyAnswer;
  /** The stored answer has been read (or failed to read); until then nothing is decided. */
  isLoaded: boolean;
  load: () => Promise<void>;
  setAnswer: (answer: 'yes' | 'no') => Promise<void>;
  reset: () => Promise<void>;
}

const WARN_READ_FAILED_RO = 'Răspunsul la întrebarea de siguranță nu a putut fi citit.';
const WARN_SAVE_FAILED_RO = 'Răspunsul la întrebarea de siguranță nu a putut fi salvat.';
const WARN_DELETE_FAILED_RO = 'Răspunsul la întrebarea de siguranță nu a putut fi șters.';

/** Anything but a plain yes/no read back from storage counts as no answer: ask again. */
function parseAnswer(raw: string | null): HealthSafetyAnswer {
  return raw === 'yes' || raw === 'no' ? raw : null;
}

/**
 * Two hook instances can ask for the answer at once (onboarding and the filters), and a read
 * that started before a newer write must not overwrite it. Every write bumps the version; a
 * read that finds the version changed throws its result away.
 */
let writeVersion = 0;
let inFlightLoad: Promise<void> | null = null;

async function readStoredAnswer(): Promise<HealthSafetyAnswer> {
  try {
    return parseAnswer(await AsyncStorage.getItem(HEALTH_SAFETY_STORAGE_KEY));
  } catch (e) {
    warnSafely(WARN_READ_FAILED_RO, e);
    return null;
  }
}

export const useHealthSafetyStore = create<HealthSafetyState>((set) => ({
  answer: null,
  isLoaded: false,

  load: () => {
    if (inFlightLoad) return inFlightLoad;
    const versionAtStart = writeVersion;
    inFlightLoad = readStoredAnswer()
      .then((stored) => {
        const isStale = writeVersion !== versionAtStart;
        set(isStale ? { isLoaded: true } : { answer: stored, isLoaded: true });
      })
      .finally(() => {
        inFlightLoad = null;
      });
    return inFlightLoad;
  },

  setAnswer: async (answer) => {
    writeVersion += 1;
    // In memory first: if saving fails, a "yes" still blocks the goals for this session.
    set({ answer, isLoaded: true });
    try {
      await AsyncStorage.setItem(HEALTH_SAFETY_STORAGE_KEY, answer);
    } catch (e) {
      warnSafely(WARN_SAVE_FAILED_RO, e);
    }
  },

  reset: async () => {
    writeVersion += 1;
    set({ answer: null });
    try {
      await AsyncStorage.removeItem(HEALTH_SAFETY_STORAGE_KEY);
    } catch (e) {
      warnSafely(WARN_DELETE_FAILED_RO, e);
    }
  },
}));
