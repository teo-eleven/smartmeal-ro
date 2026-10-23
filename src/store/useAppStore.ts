import { create } from 'zustand';
import { DEFAULT_REMINDERS } from '../types';
import { nextNotice, withNoticeQueue } from './noticeQueue';

import { AppState, ConfirmActionId } from './appState';
import { DEFAULT_PREFERENCES, DEFAULT_RELOAD_MS } from './defaults';
import { createGroceryActions } from './storeGrocery';
import { applyCloudPlan } from './storeTransforms';
import { createLeftoversActions } from './storeLeftovers';
import { createMealsActions } from './storeMeals';
import { createPlanActions } from './storePlan';
import { createPreferencesActions } from './storePreferences';
import { createSessionActions } from './storeSession';

export type {
  ActiveView,
  AppState,
  ConfirmActionId,
  DiscardedPlan,
  PendingCloudPlan,
  SystemNotice,
} from './appState';
export { pickStoreCompatibleReplacement, sanitizeAllergens } from './planSafety';

export const useAppStore = create<AppState>((rawSet, get) => {
  // Every notice an action raises waits its turn instead of replacing the one on screen.
  const set = withNoticeQueue<AppState>(rawSet, get);

  /**
   * Runs a reload task and turns a failure into a notice. Every caller fires and forgets, so a
   * throw here was an unhandled rejection and the overlay vanished with no explanation.
   */
  const runReloadTask = async (task?: () => void | Promise<void>) => {
    if (!task) return;
    try {
      await task();
    } catch (error) {
      console.warn('[useAppStore] Reload task failed:', error);
      set({
        activeNotice: {
          id: Date.now().toString(),
          title: 'Nu am putut actualiza meniul',
          message:
            'Ceva n-a mers la reîncărcare. Meniul de dinainte a rămas neschimbat; încearcă din nou.',
          type: 'error',
        },
      });
    }
  };
  return {
    currentStep: 1,
    maxVisitedStep: 1,
    totalSteps: 8,
    activeView: 'onboarding',
    isHydrated: false,
    reminders: { ...DEFAULT_REMINDERS },
    userEmail: null,
    authStatus: 'checking',
    isSyncing: false,
    lastSyncedAt: null,
    isReloading: false,
    reloadConfig: null,
    triggerReload: async (opts, task) => {
      // One overlay at a time, but every task runs: a budget change made during a
      // pull-to-refresh used to be dropped silently.
      if (get().isReloading) {
        await runReloadTask(task);
        return;
      }
      const durationMs = opts?.durationMs ?? DEFAULT_RELOAD_MS;
      set({
        isReloading: true,
        reloadConfig: {
          title: opts?.title || 'Se reîncarcă datele...',
          subtitle: opts?.subtitle || 'Actualizăm planul de mese și ingredientele...',
          icon: opts?.icon || '🔄',
          steps: opts?.steps,
        },
      });
      const startTime = Date.now();
      try {
        await runReloadTask(task);
      } finally {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, durationMs - elapsed);
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }
        set({ isReloading: false, reloadConfig: null });
      }
    },
    preferences: { ...DEFAULT_PREFERENCES },
    currentPlan: null,
    groceryItems: [],
    savedPlans: [],
    lastDiscardedPlan: null,

    // Pending confirmation for a destructive action
    confirmRequest: null,
    pendingCloudPlan: null,
    requestConfirm: (action: ConfirmActionId) => set({ confirmRequest: action }),
    cancelConfirm: () => set({ confirmRequest: null, pendingCloudPlan: null }),
    confirmPending: () => {
      const pending = get().confirmRequest;
      if (!pending) return;
      set({ confirmRequest: null });
      if (pending === 'reset_onboarding') {
        get().resetOnboarding();
        return;
      }
      if (pending === 'apply_cloud_plan') {
        set((state) =>
          state.pendingCloudPlan
            ? applyCloudPlan(state, state.pendingCloudPlan)
            : { confirmRequest: null }
        );
      }
    },

    // System Informative Notice
    activeNotice: null,
    showNotice: (
      title: string,
      message: string,
      type: 'info' | 'warning' | 'error' | 'success' = 'info'
    ) => set({ activeNotice: { id: Date.now().toString(), title, message, type } }),
    noticeQueue: [],
    // Raw set on purpose: showing the next queued notice must not queue it behind itself.
    clearNotice: () => rawSet((state) => nextNotice(state)),

    nextStep: () =>
      set((state) => {
        const next = Math.min(state.totalSteps, state.currentStep + 1);
        return {
          currentStep: next,
          maxVisitedStep: Math.max(state.maxVisitedStep || 1, next),
        };
      }),

    prevStep: () =>
      set((state) => ({
        currentStep: Math.max(1, state.currentStep - 1),
      })),

    goToStep: (step: number) =>
      set((state) => {
        const next = Math.max(1, Math.min(state.totalSteps, step));
        return {
          currentStep: next,
          maxVisitedStep: Math.max(state.maxVisitedStep || 1, next),
        };
      }),

    dismissUndo: () => set({ lastDiscardedPlan: null }),

    setActiveView: (view) => set(() => ({ activeView: view })),
    ...createSessionActions(set, get),
    ...createPreferencesActions(set, get),
    ...createLeftoversActions(set, get),
    ...createMealsActions(set, get),
    ...createGroceryActions(set, get),
    ...createPlanActions(set, get),
  };
});

declare global {
  interface Window {
    /** Exposed for debugging from the browser console; not used by the app itself. */
    __SMARTMEAL_STORE__?: typeof useAppStore;
  }
}

// Debug hook only. Without the __DEV__ guard this shipped in the release bundle, where any
// script on the page could read the user's allergies -- health data -- and switch them off.
// React Native defines global.window, so the typeof check alone does not keep it out of a
// native release either.
const isDevBuild = typeof __DEV__ !== 'undefined' && __DEV__;

if (isDevBuild && typeof window !== 'undefined') {
  window.__SMARTMEAL_STORE__ = useAppStore;
}
