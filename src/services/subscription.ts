import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { PURCHASES_ERROR_CODE } from 'react-native-purchases';
import { env } from '../../config/env';
import { describeFailure } from './authErrors';
import { currentOs } from './platformOs';
import {
  NOT_SUBSCRIBED,
  parseOffer,
  parseStatus,
  SubscriptionOffer,
  SubscriptionStatus,
} from './subscriptionParse';

/**
 * The monthly subscription, through RevenueCat, which speaks to the App Store and Google Play.
 *
 * Both stores require their own billing for a subscription that unlocks an app (Apple 3.1.1,
 * Google Play Payments policy), so there is no card form here. RevenueCat validates the
 * receipts on its servers; the app only asks it whether the "premium" entitlement is active,
 * and reads the answer through subscriptionParse, never trusting its shape.
 *
 * Three modes:
 *  - store: a RevenueCat key exists for this platform;
 *  - simulation: no key and not a production build, so the paywall can be walked through on
 *    a laptop, the same rule as the local account simulation;
 *  - unavailable: a production build with no key for this platform (the web): nothing can be
 *    bought here, and the screen says so.
 */

export const SIMULATED_TRIAL_DAYS = 7;
const SIMULATED_PACKAGE = 'sim_monthly';
const SIMULATION_KEY = '@smartmeal_sim_subscription';
const DAY_MS = 24 * 60 * 60 * 1000;

export type SubscriptionMode = 'store' | 'simulation' | 'unavailable';

export interface PurchaseResult {
  status: SubscriptionStatus;
  /** The person closed the store's sheet. Not an error, and never shown as one. */
  cancelled: boolean;
  error: string | null;
}

let configured = false;

/**
 * Picks this platform's key. The platform comes from platformOs rather than Platform, which
 * would drag react-native into the Node test project; secureSessionStore avoids it too.
 */
function platformKey(): string | null {
  const os = currentOs();
  if (os === 'ios') return env.revenueCatIosKey;
  if (os === 'android') return env.revenueCatAndroidKey;
  return null;
}

function ensureConfigured(): void {
  if (configured) return;
  const apiKey = platformKey();
  if (!apiKey) return;
  Purchases.configure({ apiKey });
  configured = true;
}

async function simulatedStatus(): Promise<SubscriptionStatus> {
  const raw = await AsyncStorage.getItem(SIMULATION_KEY);
  const started = raw ? Date.parse(raw) : NaN;
  if (!Number.isFinite(started)) return NOT_SUBSCRIBED;

  const trialEnds = started + SIMULATED_TRIAL_DAYS * DAY_MS;
  return {
    isActive: true,
    isTrial: Date.now() < trialEnds,
    expiresAt: null,
    willRenew: true,
    managementUrl: null,
  };
}

function errorCode(e: unknown): string | null {
  return typeof e === 'object' && e !== null && 'code' in e
    ? String((e as { code: unknown }).code)
    : null;
}

function wasCancelled(e: unknown): boolean {
  return (
    errorCode(e) === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
    (typeof e === 'object' &&
      e !== null &&
      (e as { userCancelled?: unknown }).userCancelled === true)
  );
}

const UNAVAILABLE = 'Abonamentul se face din aplicația de pe telefon (iPhone sau Android).';

export const subscriptionService = {
  mode(): SubscriptionMode {
    if (platformKey()) return 'store';
    // NODE_ENV as well, like the account simulation: a release bundle is always built as
    // 'production', so one that forgot EXPO_PUBLIC_APP_ENV still cannot simulate a payment.
    const isDevBuild = env.appEnv !== 'production' && process.env.NODE_ENV !== 'production';
    return isDevBuild ? 'simulation' : 'unavailable';
  },

  /** Null when the store could not be read: unknown, which is not the same as unsubscribed. */
  async status(): Promise<SubscriptionStatus | null> {
    const mode = this.mode();
    if (mode === 'simulation') return simulatedStatus();
    if (mode === 'unavailable') return NOT_SUBSCRIBED;

    try {
      ensureConfigured();
      return parseStatus(await Purchases.getCustomerInfo());
    } catch (e) {
      // The SDK serves a cached answer offline, so this is a real failure; but one failed read
      // must not lock a paying person out. The store decides what to keep (F6).
      console.warn('[subscription] Could not read the subscription:', e);
      return null;
    }
  },

  async offer(): Promise<SubscriptionOffer | null> {
    const mode = this.mode();
    if (mode === 'simulation') {
      return {
        packageId: SIMULATED_PACKAGE,
        priceString: '9,99 €',
        trialDays: SIMULATED_TRIAL_DAYS,
      };
    }
    if (mode === 'unavailable') return null;

    try {
      ensureConfigured();
      return parseOffer(await Purchases.getOfferings());
    } catch (e) {
      console.warn('[subscription] Could not read the offer:', e);
      return null;
    }
  },

  async purchase(packageId: string): Promise<PurchaseResult> {
    const mode = this.mode();
    if (mode === 'unavailable')
      return { status: NOT_SUBSCRIBED, cancelled: false, error: UNAVAILABLE };
    if (mode === 'simulation') {
      await AsyncStorage.setItem(SIMULATION_KEY, new Date(Date.now()).toISOString());
      return { status: await simulatedStatus(), cancelled: false, error: null };
    }

    try {
      ensureConfigured();
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.monthly;
      if (!pkg || pkg.identifier !== packageId) {
        return {
          status: NOT_SUBSCRIBED,
          cancelled: false,
          error: 'Oferta s-a schimbat între timp. Închide și deschide din nou ecranul.',
        };
      }
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return { status: parseStatus(customerInfo), cancelled: false, error: null };
    } catch (e) {
      if (wasCancelled(e)) return { status: NOT_SUBSCRIBED, cancelled: true, error: null };

      const code = errorCode(e);
      if (code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
        // Paid already, on this store account: bring it back rather than refuse.
        return this.restore();
      }
      if (code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
        return {
          status: NOT_SUBSCRIBED,
          cancelled: false,
          error:
            'Plata e în așteptare, de exemplu până o aprobă un părinte. Aplicația se deschide când se confirmă.',
        };
      }
      return {
        status: NOT_SUBSCRIBED,
        cancelled: false,
        error: describeFailure(e, 'Plata nu s-a putut face.'),
      };
    }
  },

  async restore(): Promise<PurchaseResult> {
    const mode = this.mode();
    if (mode === 'simulation')
      return { status: await simulatedStatus(), cancelled: false, error: null };
    if (mode === 'unavailable')
      return { status: NOT_SUBSCRIBED, cancelled: false, error: UNAVAILABLE };

    try {
      ensureConfigured();
      const status = parseStatus(await Purchases.restorePurchases());
      return {
        status,
        cancelled: false,
        error: status.isActive ? null : 'Nu am găsit un abonament activ pe acest cont de magazin.',
      };
    } catch (e) {
      return {
        status: NOT_SUBSCRIBED,
        cancelled: false,
        error: describeFailure(e, 'Cumpărăturile nu au putut fi restaurate.'),
      };
    }
  },

  /**
   * Ties the subscription to the account (the Supabase user id), so it follows the person
   * to a second phone. A subscription bought before signing in is carried over by RevenueCat.
   */
  async identify(userId: string | null): Promise<void> {
    if (this.mode() !== 'store') return;
    try {
      ensureConfigured();
      if (userId) await Purchases.logIn(userId);
      else await Purchases.logOut();
    } catch (e) {
      console.warn('[subscription] Could not link the subscription to the account:', e);
    }
  },

  /** Tests only: forget that the SDK was configured. */
  resetForTests(): void {
    configured = false;
  },
};
