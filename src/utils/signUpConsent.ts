import { SignUpConsent } from '../types';

/**
 * Why an account cannot be opened yet, or null when it can.
 *
 * Shared by the sign-up screen and the service, so the check that stops the button and the
 * check that stops the request cannot drift apart or say different things.
 */
export function describeMissingConsent(consent: SignUpConsent | undefined): string | null {
  if (!consent?.isAtLeast16) {
    return 'Ca să-ți faci cont trebuie să ai cel puțin 16 ani.';
  }
  if (!consent.healthDataConsent) {
    return 'Ca să-ți faci cont avem nevoie de acordul pentru alergii și dietă: sunt date de sănătate.';
  }
  return null;
}
