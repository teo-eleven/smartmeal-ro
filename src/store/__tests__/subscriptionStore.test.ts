import { useSubscriptionStore } from '../subscriptionStore';
import { subscriptionService } from '../../services/subscription';
import { NOT_SUBSCRIBED } from '../../services/subscriptionParse';

jest.mock('../../services/subscription', () => ({
  subscriptionService: {
    status: jest.fn(),
    purchase: jest.fn(),
    restore: jest.fn(),
    identify: jest.fn(async () => undefined),
  },
}));

const service = subscriptionService as unknown as Record<string, jest.Mock>;
const ACTIVE = { ...NOT_SUBSCRIBED, isActive: true, isTrial: true };

beforeEach(() => {
  jest.clearAllMocks();
  useSubscriptionStore.setState({ status: NOT_SUBSCRIBED, isChecked: false });
});

/**
 * Until the subscription has been read, the app shows neither the plan nor the paywall: a
 * paying person must never see a flash of "subscribe" on every start.
 */
describe('starea abonamentului în aplicație', () => {
  test('pornește „necitită”', () => {
    expect(useSubscriptionStore.getState().isChecked).toBe(false);
  });

  test('după citire știe dacă ai abonament', async () => {
    service.status.mockResolvedValue(ACTIVE);

    await useSubscriptionStore.getState().refresh();

    expect(useSubscriptionStore.getState()).toEqual(
      expect.objectContaining({ isChecked: true, status: ACTIVE })
    );
  });

  test('o plată reușită deschide aplicația pe loc', async () => {
    service.purchase.mockResolvedValue({ status: ACTIVE, cancelled: false, error: null });

    const result = await useSubscriptionStore.getState().purchase('$rc_monthly');

    expect(result.error).toBeNull();
    expect(useSubscriptionStore.getState().status.isActive).toBe(true);
  });

  test('o plată anulată nu schimbă nimic', async () => {
    service.purchase.mockResolvedValue({ status: NOT_SUBSCRIBED, cancelled: true, error: null });

    const result = await useSubscriptionStore.getState().purchase('$rc_monthly');

    expect(result.cancelled).toBe(true);
    expect(useSubscriptionStore.getState().status.isActive).toBe(false);
  });

  test('restaurarea deschide aplicația dacă găsește abonamentul', async () => {
    service.restore.mockResolvedValue({ status: ACTIVE, cancelled: false, error: null });

    await useSubscriptionStore.getState().restore();

    expect(useSubscriptionStore.getState().status.isActive).toBe(true);
  });

  /** Signing in to another account must not leave the previous account's subscription open. */
  test('schimbarea contului recitește abonamentul pentru noul cont', async () => {
    service.status.mockResolvedValue(NOT_SUBSCRIBED);
    useSubscriptionStore.setState({ status: ACTIVE, isChecked: true });

    await useSubscriptionStore.getState().switchAccount('uuid-2');

    expect(service.identify).toHaveBeenCalledWith('uuid-2');
    expect(useSubscriptionStore.getState().status.isActive).toBe(false);
  });
});

/**
 * The 2026-10-21 audit (F6): one failed read from the payments SDK showed a paying person
 * the paywall.
 */
describe('o citire eșuată nu ascunde un abonament plătit', () => {
  test('un abonament activ rămâne activ dacă o citire pică', async () => {
    useSubscriptionStore.setState({
      status: { ...ACTIVE, expiresAt: '2099-01-01T00:00:00Z' },
      isChecked: true,
    });
    service.status.mockResolvedValue(null);

    await useSubscriptionStore.getState().refresh();

    expect(useSubscriptionStore.getState().status.isActive).toBe(true);
  });

  test('dar nu dincolo de data la care expiră', async () => {
    useSubscriptionStore.setState({
      status: { ...ACTIVE, expiresAt: '2020-01-01T00:00:00Z' },
      isChecked: true,
    });
    service.status.mockResolvedValue(null);

    await useSubscriptionStore.getState().refresh();

    expect(useSubscriptionStore.getState().status.isActive).toBe(false);
  });

  test('la pornire, o primă citire eșuată se reîncearcă înainte de paywall', async () => {
    jest.useFakeTimers();
    service.status.mockResolvedValueOnce(null).mockResolvedValueOnce(ACTIVE);

    const done = useSubscriptionStore.getState().refresh();
    await jest.advanceTimersByTimeAsync(2500);
    await done;

    expect(service.status).toHaveBeenCalledTimes(2);
    expect(useSubscriptionStore.getState()).toEqual(
      expect.objectContaining({ isChecked: true, status: ACTIVE })
    );
    jest.useRealTimers();
  });

  test('două eșecuri la pornire: fără abonament, dar aplicația nu rămâne blocată', async () => {
    jest.useFakeTimers();
    service.status.mockResolvedValue(null);

    const done = useSubscriptionStore.getState().refresh();
    await jest.advanceTimersByTimeAsync(2500);
    await done;

    expect(useSubscriptionStore.getState()).toEqual(
      expect.objectContaining({ isChecked: true, status: NOT_SUBSCRIBED })
    );
    jest.useRealTimers();
  });
});
