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

/** Anything but a plain yes/no read back from storage counts as no answer: ask again. */
function parseAnswer(raw: string | null): HealthSafetyAnswer {
  return raw === 'yes' || raw === 'no' ? raw : null;
}

export const useHealthSafetyStore = create<HealthSafetyState>((set) => ({
  answer: null,
  isLoaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(HEALTH_SAFETY_STORAGE_KEY);
      set({ answer: parseAnswer(raw), isLoaded: true });
    } catch (e) {
      warnSafely('Răspunsul la întrebarea de siguranță nu a putut fi citit.', e);
      set({ answer: null, isLoaded: true });
    }
  },

  setAnswer: async (answer) => {
    // In memory first: if saving fails, a "yes" still blocks the goals for this session.
    set({ answer, isLoaded: true });
    try {
      await AsyncStorage.setItem(HEALTH_SAFETY_STORAGE_KEY, answer);
    } catch (e) {
      warnSafely('Răspunsul la întrebarea de siguranță nu a putut fi salvat.', e);
    }
  },

  reset: async () => {
    set({ answer: null });
    try {
      await AsyncStorage.removeItem(HEALTH_SAFETY_STORAGE_KEY);
    } catch (e) {
      warnSafely('Răspunsul la întrebarea de siguranță nu a putut fi șters.', e);
    }
  },
}));
