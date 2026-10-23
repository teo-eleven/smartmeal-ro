import { aggregateGroceryList } from '../engine/groceryAggregator';
import { checkPlanFeasibility } from '../engine/plannerEngine';
import { describeFailure } from '../services/authErrors';
import { checkReauth } from '../services/reauth';
import { reminderScheduler } from '../services/reminderScheduler';
import { storageService } from '../services/storage';
import { cloudSyncService } from '../services/supabase';
import { ReminderSettings, UserPreferences } from '../types';
import {
  parseReminderSettings,
  parseUserPreferences,
  wasDietRepaired,
  wasHealthGoalsRepaired,
} from '../utils/preferencesValidation';
import {
  collectMealsFromDays,
  getActiveExtraProductIds,
  getActiveExtraProducts,
  mergePurchased,
} from './cart';
import {
  PreferenceRepairs,
  buildPreferenceRepairNotice,
  hasRepairs,
} from './preferenceRepairNotice';

import { StoreApi } from 'zustand';
import { AppState, PendingCloudPlan, SystemNotice, ActiveView } from './appState';
import { DEFAULT_PREFERENCES } from './defaults';
import {
  buildRestoreNotice,
  makePlanSafeForPreferences,
  rebuildDayShape,
  sanitizeAllergens,
} from './planSafety';
import { applyCloudPlan, syncUnavailableNotice } from './storeTransforms';

type SetState = StoreApi<AppState>['setState'];
type GetState = () => AppState;

/** Launch, account, reminders and cloud sync. */
export function createSessionActions(set: SetState, get: GetState) {
  return {
    hydrateStorage: async () => {
      try {
        const rawStoredPrefs = await storageService.loadPreferences();
        const { plan, items } = await storageService.loadPlanAndGrocery();
        const savedPlans = await storageService.loadSavedPlans();
        const storedReminders = parseReminderSettings(await storageService.loadReminders());

        // Read the session before anything renders, so the gate never flashes in front of
        // somebody who signed in three weeks ago and is still within their thirty days.
        const signedInEmail = await cloudSyncService.currentEmail();
        // checkReauth does not throw; if it ever did, the safe answer is the lock.
        const isLocked = signedInEmail
          ? await checkReauth(signedInEmail).then(
              (verdict) => verdict === 'due',
              () => true
            )
          : false;

        // Storage is untrusted, and on web it is localStorage: editable by hand, by another
        // tab, or by an extension. Everything is whitelisted against its catalog before any of
        // it is believed, so a `dietTypes` that is a string, a negative household or a
        // non-numeric cupboard amount cannot reach the planner.
        let storedPrefs: UserPreferences | null =
          rawStoredPrefs === null || rawStoredPrefs === undefined
            ? null
            : parseUserPreferences(rawStoredPrefs, DEFAULT_PREFERENCES);
        let repairedPrefsNotice: SystemNotice | null = null;
        let protectionsUnreadable = false;

        if (storedPrefs) {
          const repairs: string[] = [];

          // Storage is untrusted. An unreadable allergen list must not cost the user the rest
          // of their settings, and must never be silently treated as "no allergies".
          // parseUserPreferences already dropped anything unrecognisable; this only asks
          // whether it had to, so the user can be told their list changed under them.
          const { wasRepaired } = sanitizeAllergens(
            (rawStoredPrefs as { avoidedAllergens?: unknown })?.avoidedAllergens
          );
          const allergensWereRepaired = wasRepaired;
          // A diet that could not be read falls back quietly, which can mean a vegan reading as
          // omnivore; that has to be said out loud, exactly like an unreadable allergen list.
          const dietWasRepaired = wasDietRepaired(rawStoredPrefs);

          if (!checkPlanFeasibility(storedPrefs).isFeasible) {
            storedPrefs = {
              ...storedPrefs,
              cookingDays:
                storedPrefs.cookingDays && storedPrefs.cookingDays.length > 0
                  ? storedPrefs.cookingDays
                  : DEFAULT_PREFERENCES.cookingDays,
              peopleCount:
                storedPrefs.peopleCount >= 1
                  ? storedPrefs.peopleCount
                  : DEFAULT_PREFERENCES.peopleCount,
              budgetRon:
                storedPrefs.budgetRon > 0 ? storedPrefs.budgetRon : DEFAULT_PREFERENCES.budgetRon,
            };

            // Appliances are reset only if they are what actually blocks the catalog, and the
            // check is repeated afterwards so the notice cannot claim a repair that did not work.
            if (!checkPlanFeasibility(storedPrefs).isFeasible) {
              storedPrefs = { ...storedPrefs, appliances: DEFAULT_PREFERENCES.appliances };
              repairs.push('aparatele de bucătărie');
            }

            if (!checkPlanFeasibility(storedPrefs).isFeasible) {
              storedPrefs = { ...storedPrefs, supermarketId: DEFAULT_PREFERENCES.supermarketId };
              repairs.push('magazinul');
            }
          }

          const repairSummary: PreferenceRepairs = {
            allergensRepaired: allergensWereRepaired,
            dietRepaired: dietWasRepaired,
            healthGoalsRepaired: wasHealthGoalsRepaired(rawStoredPrefs),
            resetSettings: repairs,
            stillInfeasible: false,
            planDropped: false,
          };
          // A plan checked against a diet or health goals that could not be read was checked
          // against the wrong rules: a vegan read as omnivore keeps every meat dish. It goes.
          protectionsUnreadable = repairSummary.dietRepaired || repairSummary.healthGoalsRepaired;

          if (hasRepairs(repairSummary)) {
            void storageService.savePreferences(storedPrefs);
            repairedPrefsNotice = buildPreferenceRepairNotice({
              ...repairSummary,
              stillInfeasible: !checkPlanFeasibility(storedPrefs).isFeasible,
              planDropped: protectionsUnreadable && plan !== null,
            });
          }
        }

        let sanitizedPlan = protectionsUnreadable ? null : plan;
        let hydratedItems = protectionsUnreadable ? [] : items;
        let planSafetyNotice: SystemNotice | null = null;
        if (protectionsUnreadable && plan) {
          void storageService.savePlanAndGrocery(null, []);
        }

        try {
          if (sanitizedPlan) {
            // Older builds produced `snack` meals the board no longer shows. Dropping them left
            // the day's headline dish dangling and the cart still holding their money, because
            // nothing was rebuilt afterwards.
            const snacksRemoved = sanitizedPlan.days.some((d) =>
              d.meals.some((m) => m.slot === 'snack')
            );
            sanitizedPlan = {
              ...sanitizedPlan,
              days: sanitizedPlan.days.map((d) => ({
                ...d,
                meals: d.meals.filter((m) => m.slot !== 'snack'),
              })),
            };

            // Reopening the app is the first door a meal comes through, and the plan beside the
            // preferences can be arbitrarily stale -- or, on web, edited by hand in localStorage.
            // Restoring an archived plan was already re-checked here; this path was not.
            const effectivePrefs = storedPrefs ?? DEFAULT_PREFERENCES;
            const {
              days: safeDays,
              replacedCount,
              offendingAllergens,
            } = makePlanSafeForPreferences(sanitizedPlan.days, effectivePrefs);
            if (safeDays.length === 0) {
              throw new Error('No day of the stored plan is safe under the current preferences');
            }

            // The checked days are always the ones kept, not only when something was replaced.
            // Guarding this on `replacedCount > 0` meant a plan whose recipe ids were all valid
            // kept whatever body storage had attached to them, and a plan that only lost its
            // snacks kept a dangling headline dish and their money in the cart.
            const aggregated = aggregateGroceryList(
              collectMealsFromDays(safeDays),
              effectivePrefs.supermarketId,
              effectivePrefs.excludePantryStaples,
              getActiveExtraProductIds(effectivePrefs),
              effectivePrefs.pantryInventory || [],
              effectivePrefs.pantryStock || {}
            );
            const cartItems = mergePurchased(items, aggregated.items);

            sanitizedPlan = {
              ...sanitizedPlan,
              days: safeDays.map((day) => ({ ...day, ...rebuildDayShape(day.meals, day) })),
              totalRecipeCostRon: aggregated.totalRecipePortionCostRon,
              totalCartCostRon: aggregated.totalCartCostRon,
              extraProducts: getActiveExtraProducts(effectivePrefs),
            };
            hydratedItems = cartItems;

            if (replacedCount > 0 || snacksRemoved) {
              void storageService.savePlanAndGrocery(sanitizedPlan, cartItems);
            }

            if (replacedCount > 0) {
              planSafetyNotice = {
                id: Date.now().toString(),
                title: 'Plan adaptat la setările tale',
                message: buildRestoreNotice(replacedCount, offendingAllergens),
                type: 'warning',
              };
            }
          }
        } catch (planError) {
          // A plan that cannot be read must not cost the user their preferences or their plan
          // library, which were both read successfully a moment ago. Drop the plan, keep the
          // rest, and say so rather than starting over in silence.
          console.warn('[useAppStore] Stored plan unusable, starting without it:', planError);
          sanitizedPlan = null;
          hydratedItems = [];
          planSafetyNotice = {
            id: Date.now().toString(),
            title: 'Planul salvat nu a putut fi citit',
            message:
              'Setările și planurile tale salvate sunt intacte, dar meniul curent s-a pierdut. Generează-l din nou când vrei.',
            type: 'warning',
          };
        }

        const urlParams =
          typeof window !== 'undefined' && window.location
            ? new URLSearchParams(window.location.search)
            : null;
        const onboardingParam = urlParams ? urlParams.get('onboarding') : null;
        const forceOnboarding = Boolean(
          urlParams &&
          urlParams.has('onboarding') &&
          onboardingParam !== '0' &&
          onboardingParam !== 'false'
        );
        const viewParam = urlParams?.get('view');
        const targetView =
          viewParam === 'meals' || viewParam === 'grocery' ? (viewParam as ActiveView) : null;
        const stepParam = urlParams?.get('step');
        const targetStep = stepParam ? parseInt(stepParam, 10) : 1;

        set((state) => ({
          isHydrated: true,
          preferences: storedPrefs
            ? {
                ...storedPrefs,
                mealSlots: (storedPrefs.mealSlots || ['dinner']).filter((s) => s !== 'snack'),
              }
            : state.preferences,
          currentPlan: sanitizedPlan || state.currentPlan,
          groceryItems: hydratedItems.length > 0 ? hydratedItems : state.groceryItems,
          activeView:
            targetView ||
            (forceOnboarding ? 'onboarding' : sanitizedPlan ? 'meals' : state.activeView),
          currentStep: forceOnboarding && !isNaN(targetStep) ? targetStep : state.currentStep,
          maxVisitedStep:
            forceOnboarding && !isNaN(targetStep)
              ? Math.max(state.maxVisitedStep, targetStep)
              : state.maxVisitedStep,
          reminders: storedReminders,
          userEmail: signedInEmail ?? state.userEmail,
          // Not signed in means the gate, on every start. "Without an account" is chosen per
          // session and never stored: remembering it hid the sign-in screen for good after one
          // tap, and a refresh then went straight into the planner.
          authStatus: signedInEmail ? (isLocked ? 'locked' : 'signedIn') : 'checking',
          activeNotice:
            (repairedPrefsNotice?.type === 'warning' ? repairedPrefsNotice : null) ??
            planSafetyNotice ??
            repairedPrefsNotice ??
            state.activeNotice,
          savedPlans,
        }));
      } catch (e) {
        // Whatever went wrong, the user must not be told nothing: starting silently on the
        // defaults means an unrestricted omnivore with no allergies, which looks like a
        // working app right up until it puts an allergen on the board.
        console.warn('[useAppStore] Hydration error:', e);
        set({
          isHydrated: true,
          activeNotice: {
            id: Date.now().toString(),
            title: 'Setările nu au putut fi citite',
            message:
              'Nu am reușit să îți încarc setările salvate, inclusiv dieta și alergiile. Verifică-le din Filtre înainte să gătești ceva.',
            type: 'error',
          },
        });
      }
    },

    /**
     * System, then light, then dark. Following the phone is the right default, but a kitchen
     * at night and a kitchen at noon are not the same room.
     */
    /**
     * Changes a reminder choice, then rebuilds the schedule from it.
     *
     * The notifications live on the device; this only records the intention and asks the
     * scheduler to catch up. Saving to the account happens alongside, so a second phone
     * behaves the same -- but a signed-out user still gets their reminders.
     */
    updateReminders: (patch: Partial<ReminderSettings>) => {
      const next: ReminderSettings = { ...get().reminders, ...patch };
      set({ reminders: next });

      void storageService.saveReminders(next);
      void reminderScheduler.reschedule(next, get().currentPlan);

      const email = get().userEmail;
      if (email) {
        void (async () => {
          const user = await cloudSyncService.getCurrentUser();
          if (user) void cloudSyncService.saveReminders(user.id, next);
        })();
      }
    },

    /** Pulls the choices stored against the account, which is what a second phone starts from. */
    loadRemindersFromCloud: async () => {
      if (!get().userEmail) return;
      try {
        const user = await cloudSyncService.getCurrentUser();
        if (!user) return;

        const remote = await cloudSyncService.loadReminders(user.id);
        if (!remote) return;

        set({ reminders: remote });
        void storageService.saveReminders(remote);
        void reminderScheduler.reschedule(remote, get().currentPlan);
      } catch (e) {
        console.warn('[useAppStore] Could not read the reminder settings:', e);
      }
    },

    continueAsGuest: async () => {
      // From the monthly lock, "without an account" means without this one: the session is
      // ended rather than left open behind a guest screen, which would be a way round the lock.
      // Awaited, so a quick sign-in afterwards cannot be undone by this sign-out landing late.
      if (get().authStatus === 'locked') {
        await cloudSyncService.signOut();
        get().setUserEmail(null);
        return;
      }
      set({ authStatus: 'guest' });
    },

    unlock: async () => {
      const { authStatus, userEmail } = get();
      if (authStatus !== 'locked' || !userEmail) return;
      const verdict = await checkReauth(userEmail);
      // Still the same locked account once the keychain has answered.
      if (verdict === 'ok' && get().authStatus === 'locked' && get().userEmail === userEmail) {
        set({ authStatus: 'signedIn' });
      }
    },

    recheckLock: async () => {
      const { authStatus, userEmail } = get();
      if (authStatus !== 'signedIn' || !userEmail) return;
      const verdict = await checkReauth(userEmail);
      if (verdict === 'due' && get().authStatus === 'signedIn' && get().userEmail === userEmail) {
        set({ authStatus: 'locked' });
      }
    },

    signOutToLogin: async () => {
      try {
        await cloudSyncService.signOut();
      } finally {
        // One step, never through 'guest', which would show the plan for an instant; and
        // whatever the sign-out did, this device stops showing the account.
        set({ userEmail: null, authStatus: 'checking' });
        void reminderScheduler.cancelAll();
      }
    },

    setUserEmail: (email: string | null) => {
      // At the lock, a sign-in does not open the app by itself: unlock checks that it was
      // recorded as a verification. Anything else calling this with an address cannot be a
      // way past the lock.
      if (email && get().authStatus === 'locked') {
        set({ userEmail: email });
        void get().unlock();
      } else {
        set({ userEmail: email, authStatus: email ? 'signedIn' : 'guest' });
      }

      if (email) {
        // A second phone starts from what the account already knows.
        void get().loadRemindersFromCloud();
      } else {
        // Signing out must not leave the previous account's nudges firing on this phone.
        void reminderScheduler.cancelAll();
      }
    },

    syncWithCloud: async () => {
      const { userEmail, currentPlan, groceryItems, preferences, authStatus, isSyncing } = get();
      // Not from behind the monthly lock: the account has not been verified yet. Not twice at
      // once either: two quick taps used to send the plan twice and overwrite each other's flags.
      if (!userEmail || authStatus === 'locked' || isSyncing) return;
      if (!cloudSyncService.isConfigured()) {
        set({ activeNotice: syncUnavailableNotice() });
        return;
      }

      set({ isSyncing: true });
      try {
        // The row is keyed by the authenticated user's id, not their email: user_id is a uuid
        // referencing auth.users, and row-level security compares it against auth.uid().
        const user = await cloudSyncService.getCurrentUser();
        if (!user) {
          set({
            activeNotice: {
              id: Date.now().toString(),
              title: 'Sesiune expirată',
              message: 'Autentifică-te din nou pentru a sincroniza planul în cloud.',
              type: 'warning',
            },
          });
          return;
        }

        const res = await cloudSyncService.saveMealPlan(
          user.id,
          currentPlan,
          groceryItems,
          preferences
        );
        if (res.success) {
          set({ lastSyncedAt: new Date().toLocaleTimeString('ro-RO') });
        } else {
          set({
            activeNotice: {
              id: Date.now().toString(),
              title: 'Sincronizare eșuată',
              message: res.error || 'Planul nu a putut fi salvat în cloud. Rămâne salvat local.',
              type: 'error',
            },
          });
        }
      } catch (e: unknown) {
        // A rejected call used to escape this action entirely, surfacing as an unhandled
        // rejection with nothing shown to the user.
        const message = describeFailure(e, 'Eroare neașteptată la sincronizare.');
        set({
          activeNotice: {
            id: Date.now().toString(),
            title: 'Sincronizare eșuată',
            message: `${message} Planul rămâne salvat local.`,
            type: 'error',
          },
        });
      } finally {
        set({ isSyncing: false });
      }
    },

    /**
     * Brings down the plan another device saved. Nothing local is overwritten without the
     * user saying so -- the fetched plan waits in `pendingCloudPlan` until they confirm.
     */
    syncFromCloud: async () => {
      const { userEmail, authStatus, isSyncing } = get();
      if (!userEmail || authStatus === 'locked' || isSyncing) return;
      if (!cloudSyncService.isConfigured()) {
        set({ activeNotice: syncUnavailableNotice() });
        return;
      }

      set({ isSyncing: true });
      try {
        const user = await cloudSyncService.getCurrentUser();
        if (!user) {
          set({
            activeNotice: {
              id: Date.now().toString(),
              title: 'Sesiune expirată',
              message: 'Autentifică-te din nou pentru a aduce planul din cloud.',
              type: 'warning',
            },
          });
          return;
        }

        const result = await cloudSyncService.loadMealPlan(user.id);

        if (result.error) {
          set({
            activeNotice: {
              id: Date.now().toString(),
              title: 'Descărcare eșuată',
              message: `${result.error} Planul tău local a rămas neatins.`,
              type: 'error',
            },
          });
          return;
        }

        if (!result.plan) {
          set({
            activeNotice: {
              id: Date.now().toString(),
              title: 'Nimic salvat în cloud',
              message:
                'Nu există încă un plan salvat pe acest cont. Apasă „Sincronizează acum" ca să îl urci pe cel de aici.',
              type: 'info',
            },
          });
          return;
        }

        const pending: PendingCloudPlan = {
          plan: result.plan,
          preferences: result.preferences,
          updatedAt: result.updatedAt,
        };

        // With nothing local to lose, there is nothing to ask about.
        if (!get().currentPlan) {
          set((state) => applyCloudPlan(state, pending));
          return;
        }

        set({ pendingCloudPlan: pending, confirmRequest: 'apply_cloud_plan' });
      } catch (e: unknown) {
        const message = describeFailure(e, 'Eroare neașteptată la descărcare.');
        set({
          activeNotice: {
            id: Date.now().toString(),
            title: 'Descărcare eșuată',
            message: `${message} Planul tău local a rămas neatins.`,
            type: 'error',
          },
        });
      } finally {
        set({ isSyncing: false });
      }
    },
  } satisfies Partial<AppState>;
}
