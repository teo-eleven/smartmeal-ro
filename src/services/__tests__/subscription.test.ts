import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import { ENTITLEMENT_ID } from '../subscriptionParse';

const mockEnv = {
  appEnv: 'development' as 'development' | 'staging' | 'production',
  revenueCatIosKey: null as string | null,
  revenueCatAndroidKey: null as string | null,
};
jest.mock('../../../config/env', () => ({
  get env() {
    return mockEnv;
  },
}));

let mockOs = 'ios';
jest.mock('../platformOs', () => ({ currentOs: () => mockOs }));

// Imported after the mocks so the service reads them.
import { subscriptionService, SIMULATED_TRIAL_DAYS } from '../subscription';

const P = Purchases as unknown as Record<string, jest.Mock>;
const ACTIVE = {
  entitlements: {
    active: { [ENTITLEMENT_ID]: { isActive: true, periodType: 'NORMAL', willRenew: true } },
  },
  managementURL: null,
};
const OFFERINGS = {
  current: {
    monthly: {
      identifier: '$rc_monthly',
      product: {
        priceString: '9,99 €',
        introPrice: { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 7, cycles: 1 },
      },
    },
  },
};

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  subscriptionService.resetForTests();
  mockEnv.appEnv = 'development';
  mockEnv.revenueCatIosKey = null;
  mockEnv.revenueCatAndroidKey = null;
  mockOs = 'ios';
});

/**
 * Without RevenueCat keys, on a laptop, the subscription is simulated so the paywall can be
 * walked through. The same rule as the account simulation: never in production.
 */
describe('abonamentul simulat', () => {
  test('pornește fără chei, în dezvoltare', () => {
    expect(subscriptionService.mode()).toBe('simulation');
  });

  test('nu pornește niciodată în producție', () => {
    mockEnv.appEnv = 'production';
    expect(subscriptionService.mode()).toBe('unavailable');
  });

  test('la început nu ai abonament', async () => {
    expect((await subscriptionService.status()).isActive).toBe(false);
  });

  test('oferta simulată: 9,99 €, cu probă de 7 zile', async () => {
    const offer = await subscriptionService.offer();
    expect(offer).toEqual({ packageId: 'sim_monthly', priceString: '9,99 €', trialDays: SIMULATED_TRIAL_DAYS });
  });

  test('„cumpărarea” pornește proba, iar aplicația se deschide', async () => {
    const result = await subscriptionService.purchase('sim_monthly');

    expect(result.status.isActive).toBe(true);
    expect(result.status.isTrial).toBe(true);
    expect((await subscriptionService.status()).isActive).toBe(true);
  });

  test('după 7 zile proba devine abonament plătit, tot activ', async () => {
    await subscriptionService.purchase('sim_monthly');
    const later = Date.now() + (SIMULATED_TRIAL_DAYS + 1) * 24 * 3600 * 1000;
    jest.spyOn(Date, 'now').mockReturnValue(later);

    const status = await subscriptionService.status();

    expect(status.isActive).toBe(true);
    expect(status.isTrial).toBe(false);
    (Date.now as jest.Mock).mockRestore();
  });
});

describe('abonamentul prin magazin', () => {
  beforeEach(() => {
    mockEnv.revenueCatIosKey = 'appl_test';
    mockEnv.revenueCatAndroidKey = 'goog_test';
  });

  test('folosește cheia platformei pe care rulează', async () => {
    mockOs = 'android';
    await subscriptionService.status();

    expect(P.configure).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'goog_test' }));
  });

  test('starea vine din RevenueCat și e validată', async () => {
    P.getCustomerInfo.mockResolvedValue(ACTIVE);

    expect((await subscriptionService.status()).isActive).toBe(true);
  });

  test('prețul și proba vin din magazin', async () => {
    P.getOfferings.mockResolvedValue(OFFERINGS);

    expect(await subscriptionService.offer()).toEqual({
      packageId: '$rc_monthly',
      priceString: '9,99 €',
      trialDays: 7,
    });
  });

  test('o plată reușită deschide aplicația', async () => {
    P.getOfferings.mockResolvedValue(OFFERINGS);
    P.purchasePackage.mockResolvedValue({ customerInfo: ACTIVE });

    const result = await subscriptionService.purchase('$rc_monthly');

    expect(result).toEqual(expect.objectContaining({ cancelled: false, error: null }));
    expect(result.status.isActive).toBe(true);
  });

  /** Changing one's mind is not an error, and must not be shown as one. */
  test('renunțarea la plată nu e o eroare', async () => {
    P.getOfferings.mockResolvedValue(OFFERINGS);
    P.purchasePackage.mockRejectedValue({ code: '1', userCancelled: true });

    const result = await subscriptionService.purchase('$rc_monthly');

    expect(result.cancelled).toBe(true);
    expect(result.error).toBeNull();
  });

  test('o plată în așteptare spune ce urmează', async () => {
    P.getOfferings.mockResolvedValue(OFFERINGS);
    P.purchasePackage.mockRejectedValue({ code: '20' });

    const result = await subscriptionService.purchase('$rc_monthly');

    expect(result.error).toMatch(/în așteptare/i);
  });

  test('„deja cumpărat” restaurează în loc să dea eroare', async () => {
    P.getOfferings.mockResolvedValue(OFFERINGS);
    P.purchasePackage.mockRejectedValue({ code: '6' });
    P.restorePurchases.mockResolvedValue(ACTIVE);

    const result = await subscriptionService.purchase('$rc_monthly');

    expect(P.restorePurchases).toHaveBeenCalled();
    expect(result.status.isActive).toBe(true);
    expect(result.error).toBeNull();
  });

  test('fără rețea: mesaj în română, nu textul SDK-ului', async () => {
    P.getOfferings.mockResolvedValue(OFFERINGS);
    P.purchasePackage.mockRejectedValue({ code: '10', message: 'The operation couldn’t be completed' });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await subscriptionService.purchase('$rc_monthly');

    expect(result.error).toMatch(/Verifică conexiunea/);
    expect(result.error).not.toMatch(/operation/);
    warn.mockRestore();
  });

  test('restaurarea recuperează un abonament de pe alt telefon', async () => {
    P.restorePurchases.mockResolvedValue(ACTIVE);

    const result = await subscriptionService.restore();

    expect(result.status.isActive).toBe(true);
  });

  /** Tied to the account, so the subscription follows it to a second phone. */
  test('se leagă de cont la conectare și se desparte la deconectare', async () => {
    await subscriptionService.identify('uuid-1');
    expect(P.logIn).toHaveBeenCalledWith('uuid-1');

    await subscriptionService.identify(null);
    expect(P.logOut).toHaveBeenCalled();
  });

  test('o eroare la citire înseamnă „fără abonament”, nu o excepție', async () => {
    P.getCustomerInfo.mockRejectedValue(new Error('boom'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect((await subscriptionService.status()).isActive).toBe(false);
    warn.mockRestore();
  });
});
