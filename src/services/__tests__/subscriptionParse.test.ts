import { ENTITLEMENT_ID, parseOffer, parseStatus } from '../subscriptionParse';

const FUTURE = '2099-01-01T00:00:00Z';

function customerInfo(entitlement: Record<string, unknown> | null, managementURL: unknown = null) {
  return {
    entitlements: { active: entitlement ? { [ENTITLEMENT_ID]: entitlement } : {} },
    managementURL,
  };
}

/**
 * What RevenueCat says about a person's subscription decides whether the app opens. It is
 * data from outside, so it is read field by field, and anything unexpected reads as "not
 * subscribed" rather than as a free pass.
 */
describe('starea abonamentului', () => {
  test('un abonament activ deschide aplicația', () => {
    const status = parseStatus(
      customerInfo({
        isActive: true,
        periodType: 'NORMAL',
        expirationDate: FUTURE,
        willRenew: true,
      })
    );

    expect(status).toEqual({
      isActive: true,
      isTrial: false,
      expiresAt: FUTURE,
      willRenew: true,
      managementUrl: null,
    });
  });

  test('perioada de probă e activă, și e recunoscută ca probă', () => {
    const status = parseStatus(
      customerInfo({ isActive: true, periodType: 'TRIAL', expirationDate: FUTURE, willRenew: true })
    );

    expect(status.isActive).toBe(true);
    expect(status.isTrial).toBe(true);
  });

  test('fără dreptul „premium”, aplicația rămâne închisă', () => {
    expect(parseStatus(customerInfo(null)).isActive).toBe(false);
  });

  test('un drept marcat inactiv nu deschide nimic', () => {
    expect(parseStatus(customerInfo({ isActive: false })).isActive).toBe(false);
  });

  /** "Truthy" is not "true": a string or a number from a tampered cache opens nothing. */
  test('isActive trebuie să fie exact true', () => {
    expect(parseStatus(customerInfo({ isActive: 'true' })).isActive).toBe(false);
    expect(parseStatus(customerInfo({ isActive: 1 })).isActive).toBe(false);
  });

  test('un răspuns stricat înseamnă „fără abonament”, nu o excepție', () => {
    expect(parseStatus(null).isActive).toBe(false);
    expect(parseStatus('ceva').isActive).toBe(false);
    expect(parseStatus({ entitlements: 'nu' }).isActive).toBe(false);
  });

  test('adresa de gestionare e păstrată doar dacă e https', () => {
    const info = customerInfo(
      { isActive: true, willRenew: true },
      'https://apps.apple.com/account/subscriptions'
    );
    expect(parseStatus(info).managementUrl).toBe('https://apps.apple.com/account/subscriptions');
    expect(
      parseStatus(customerInfo({ isActive: true }, 'javascript:alert(1)')).managementUrl
    ).toBeNull();
  });
});

function offerings(product: Record<string, unknown>) {
  return { current: { monthly: { identifier: '$rc_monthly', product } } };
}

describe('oferta de pe ecranul de plată', () => {
  test('prețul vine din magazin, așa cum îl afișează magazinul', () => {
    const offer = parseOffer(
      offerings({ priceString: '9,99 €', introPrice: null, defaultOption: null })
    );

    expect(offer?.priceString).toBe('9,99 €');
    expect(offer?.packageId).toBe('$rc_monthly');
  });

  test('iOS: proba gratuită vine ca preț introductiv de 0', () => {
    const offer = parseOffer(
      offerings({
        priceString: '9,99 €',
        introPrice: { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 7, cycles: 1 },
        defaultOption: null,
      })
    );

    expect(offer?.trialDays).toBe(7);
  });

  test('Android: proba gratuită vine ca fază gratuită', () => {
    const offer = parseOffer(
      offerings({
        priceString: '9,99 €',
        introPrice: null,
        defaultOption: { freePhase: { billingPeriod: { unit: 'WEEK', value: 1 } } },
      })
    );

    expect(offer?.trialDays).toBe(7);
  });

  /** A trial is promised on screen only when the store actually offers one. */
  test('fără probă în magazin, nu promite probă', () => {
    const offer = parseOffer(
      offerings({
        priceString: '9,99 €',
        introPrice: { price: 4.99, periodUnit: 'MONTH', periodNumberOfUnits: 1, cycles: 1 },
        defaultOption: null,
      })
    );

    expect(offer?.trialDays).toBeNull();
  });

  test('fără ofertă configurată, nu inventează una', () => {
    expect(parseOffer({ current: null })).toBeNull();
    expect(parseOffer({ current: { monthly: null } })).toBeNull();
    expect(parseOffer(null)).toBeNull();
    expect(parseOffer(offerings({ priceString: '' }))).toBeNull();
  });
});
