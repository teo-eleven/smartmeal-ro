import { create } from 'zustand';
import { PurchaseResult, subscriptionService } from '../services/subscription';
import { NOT_SUBSCRIBED, SubscriptionStatus } from '../services/subscriptionParse';

/**
 * Whether the monthly subscription is active, for the gate in App.tsx.
 *
 * Kept out of useAppStore, which is already far past the size it should be: this state has
 * nothing to do with the plan, and the plan has nothing to do with it.
 */
interface SubscriptionState {
  status: SubscriptionStatus;
  /**
   * False until the first read. The gate shows neither the plan nor the paywall until then,
   * so a paying person never sees a flash of "subscribe" on start.
   */
  isChecked: boolean;
  refresh: () => Promise<void>;
  purchase: (packageId: string) => Promise<PurchaseResult>;
  restore: () => Promise<PurchaseResult>;
  /** Links the subscription to the signed-in account (or none) and reads it again. */
  switchAccount: (userId: string | null) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  status: NOT_SUBSCRIBED,
  isChecked: false,

  refresh: async () => {
    const status = await subscriptionService.status();
    set({ status, isChecked: true });
  },

  purchase: async (packageId) => {
    const result = await subscriptionService.purchase(packageId);
    if (!result.cancelled) set({ status: result.status, isChecked: true });
    return result;
  },

  restore: async () => {
    const result = await subscriptionService.restore();
    set({ status: result.status, isChecked: true });
    return result;
  },

  switchAccount: async (userId) => {
    await subscriptionService.identify(userId);
    await get().refresh();
  },
}));
