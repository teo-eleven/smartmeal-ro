import { useSubscriptionStore } from '../../store/subscriptionStore';
import { NOT_SUBSCRIBED } from '../../services/subscriptionParse';

/**
 * Puts the app in the state of someone with an active subscription, for tests about what
 * lies past the paywall. The gate itself is tested in paywallGate.component.test.tsx.
 */
export function asSubscriber(): void {
  useSubscriptionStore.setState({
    status: { ...NOT_SUBSCRIBED, isActive: true, willRenew: true },
    isChecked: true,
  });
}
