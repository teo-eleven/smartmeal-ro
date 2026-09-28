/**
 * Reads RevenueCat's answers into the app's own shapes.
 *
 * Whether the app opens depends on these, and they come from outside: from the SDK's cache
 * on a device the user controls, or from the network. So nothing is cast. Each field is read
 * and checked, and anything unexpected reads as "not subscribed", never as a free pass.
 *
 * No react-native import, so this runs in the Node test project.
 */

/** The entitlement configured in RevenueCat that the monthly subscription grants. */
export const ENTITLEMENT_ID = 'premium';

export interface SubscriptionStatus {
  isActive: boolean;
  isTrial: boolean;
  expiresAt: string | null;
  willRenew: boolean;
  /** Where the person manages or cancels it: the store's own page. */
  managementUrl: string | null;
}

export interface SubscriptionOffer {
  packageId: string;
  /** Exactly as the store formats it for this person, currency included. */
  priceString: string;
  /** Null when the store offers no free trial; the screen then promises none. */
  trialDays: number | null;
}

export const NOT_SUBSCRIBED: SubscriptionStatus = {
  isActive: false,
  isTrial: false,
  expiresAt: null,
  willRenew: false,
  managementUrl: null,
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function httpsOrNull(value: unknown): string | null {
  return typeof value === 'string' && /^https:\/\//i.test(value) ? value : null;
}

export function parseStatus(customerInfo: unknown): SubscriptionStatus {
  if (!isObject(customerInfo) || !isObject(customerInfo.entitlements)) return NOT_SUBSCRIBED;
  const active = customerInfo.entitlements.active;
  if (!isObject(active)) return NOT_SUBSCRIBED;

  const entitlement = active[ENTITLEMENT_ID];
  // Exactly true: a string or a number from a tampered cache opens nothing.
  if (!isObject(entitlement) || entitlement.isActive !== true) return NOT_SUBSCRIBED;

  return {
    isActive: true,
    isTrial: entitlement.periodType === 'TRIAL',
    expiresAt: typeof entitlement.expirationDate === 'string' ? entitlement.expirationDate : null,
    willRenew: entitlement.willRenew === true,
    managementUrl: httpsOrNull(customerInfo.managementURL),
  };
}

const DAYS_PER_UNIT: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

function toDays(unit: unknown, count: unknown): number | null {
  const perUnit = typeof unit === 'string' ? DAYS_PER_UNIT[unit] : undefined;
  if (!perUnit || typeof count !== 'number' || !Number.isInteger(count) || count <= 0) return null;
  return perUnit * count;
}

/**
 * The free trial, from whichever form the store uses: Apple as an introductory price of 0,
 * Google as a free phase of the default subscription option.
 */
function readTrialDays(product: Record<string, unknown>): number | null {
  const intro = product.introPrice;
  if (isObject(intro) && intro.price === 0) {
    return toDays(intro.periodUnit, intro.periodNumberOfUnits);
  }

  const option = product.defaultOption;
  if (isObject(option) && isObject(option.freePhase) && isObject(option.freePhase.billingPeriod)) {
    const period = option.freePhase.billingPeriod;
    return toDays(period.unit, period.value);
  }
  return null;
}

export function parseOffer(offerings: unknown): SubscriptionOffer | null {
  if (!isObject(offerings) || !isObject(offerings.current)) return null;
  const monthly = offerings.current.monthly;
  if (!isObject(monthly) || !isObject(monthly.product)) return null;

  const product = monthly.product;
  const priceString = typeof product.priceString === 'string' ? product.priceString.trim() : '';
  const packageId = typeof monthly.identifier === 'string' ? monthly.identifier : '';
  // No price, no offer: the screen must never ask for money without saying how much.
  if (!priceString || !packageId) return null;

  return { packageId, priceString, trialDays: readTrialDays(product) };
}
