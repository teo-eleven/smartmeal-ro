import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { warnSafely } from '../services/authErrors';

/**
 * Whether the iPhone health-goals message (A.9) was already acknowledged on this phone. A
 * device flag under its own key: not part of the preferences, so cloud sync never sees it.
 */
export const IOS_GOALS_NOTICE_STORAGE_KEY = '@smartmeal_ios_goals_notice_seen';

const SEEN_VALUE = '1';
/**
 * Written when the flag could not be removed (account change on a failing disk). Anything but
 * SEEN_VALUE reads back as "not seen", so this overwrites the old flag without the delete working.
 */
const NOT_SEEN_MARKER = '0';
const WARN_READ_FAILED_RO = 'Nu s-a putut citi dacă mesajul despre obiective a fost văzut.';
const WARN_RESET_FAILED_RO = 'Nu s-a putut șterge faptul că mesajul despre obiective a fost văzut.';
const WARN_SAVE_FAILED_RO = 'Nu s-a putut salva că mesajul despre obiective a fost văzut.';

/** unknown: not read yet. unseen: show it. seen: acknowledged (or unreadable: stay silent). */
type NoticeStatus = 'unknown' | 'unseen' | 'seen';

interface IosGoalsNoticeState {
  status: NoticeStatus;
  load: () => Promise<void>;
  acknowledge: () => Promise<void>;
  /** The flag belongs to one person: it goes with their account, the next one sees the message. */
  reset: () => Promise<void>;
}

let inFlightLoad: Promise<void> | null = null;
/** A read that started before a reset must not bring the old person's flag back. */
let resetVersion = 0;

/**
 * A flag that cannot be read counts as seen: better silent than the same message at every
 * launch. A save that fails only means it may show again next launch.
 */
async function readStatus(): Promise<NoticeStatus> {
  try {
    const raw = await AsyncStorage.getItem(IOS_GOALS_NOTICE_STORAGE_KEY);
    return raw === SEEN_VALUE ? 'seen' : 'unseen';
  } catch (e) {
    warnSafely(WARN_READ_FAILED_RO, e);
    return 'seen';
  }
}

export const useIosGoalsNoticeStore = create<IosGoalsNoticeState>((set, get) => ({
  status: 'unknown',

  load: () => {
    if (get().status !== 'unknown') return Promise.resolve();
    if (inFlightLoad) return inFlightLoad;
    const versionAtStart = resetVersion;
    inFlightLoad = readStatus()
      .then((status) => {
        if (resetVersion !== versionAtStart) return;
        // An acknowledgement made while reading wins over the stale read.
        if (get().status === 'unknown') set({ status });
      })
      .finally(() => {
        inFlightLoad = null;
      });
    return inFlightLoad;
  },

  acknowledge: async () => {
    set({ status: 'seen' });
    try {
      await AsyncStorage.setItem(IOS_GOALS_NOTICE_STORAGE_KEY, SEEN_VALUE);
    } catch (e) {
      warnSafely(WARN_SAVE_FAILED_RO, e);
    }
  },

  reset: async () => {
    resetVersion += 1;
    set({ status: 'unknown' });
    try {
      await AsyncStorage.removeItem(IOS_GOALS_NOTICE_STORAGE_KEY);
    } catch (e) {
      warnSafely(WARN_RESET_FAILED_RO, e);
      try {
        await AsyncStorage.setItem(IOS_GOALS_NOTICE_STORAGE_KEY, NOT_SEEN_MARKER);
      } catch (e2) {
        warnSafely(WARN_RESET_FAILED_RO, e2);
      }
    }
  },
}));
