import { currentOs } from '../services/platformOs';

/**
 * The store the subscription is paid through, as the text names it after „contul tău” /
 * „contului tău”. Each store wants no mention of the other platform (APP-6, AS-29), so iOS
 * names only Apple and Android only Google Play; web and tests stay neutral („de magazin”).
 */
export function storeAccountName(): string {
  const os = currentOs();
  if (os === 'ios') return 'Apple';
  if (os === 'android') return 'Google Play';
  return 'de magazin';
}

/** What an iOS-only message calls the device. Written here so no screen names a platform. */
export const IOS_DEVICE_NAME = 'iPhone';
