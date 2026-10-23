import { storageService } from '../services/storage';
import { cancelNoteUploads } from './recipeNotesSync';
import { DEFAULT_REMINDERS } from '../types';
import { StoreApi } from 'zustand';
import { AppState } from './appState';
import { DEFAULT_PREFERENCES } from './defaults';

type SetState = StoreApi<AppState>['setState'];
type GetState = () => AppState;

/**
 * What belongs to an account on this phone, and wiping it.
 *
 * The 2026-10-21 audit (F4): signing out left the previous account's plan, saved plans,
 * notes and declared allergies on the phone for whoever opened the app next.
 */
export function createAccountActions(set: SetState, get: GetState) {
  return {
    dataOwnerEmail: null as string | null,
    lastSyncedPlan: null,
    cloudPlanVersion: null as string | null,
    cloudConflictVersion: null as string | null,

    /** True when the plan on screen differs from the one last sent to or taken from the cloud. */
    hasUnsyncedPlan: () => {
      const { currentPlan, lastSyncedPlan } = get();
      return Boolean(currentPlan) && currentPlan !== lastSyncedPlan;
    },

    clearLocalAccountData: () => {
      cancelNoteUploads();
      void storageService.clearAccountData();
      set({
        preferences: { ...DEFAULT_PREFERENCES },
        currentPlan: null,
        groceryItems: [],
        savedPlans: [],
        recipeNotes: {},
        reminders: { ...DEFAULT_REMINDERS },
        lastDiscardedPlan: null,
        pendingCloudPlan: null,
        confirmRequest: null,
        lastSyncedPlan: null,
        lastSyncedAt: null,
        cloudPlanVersion: null,
        cloudConflictVersion: null,
        dataOwnerEmail: null,
        activeView: 'onboarding',
        currentStep: 1,
        maxVisitedStep: 1,
      });
    },
  };
}
