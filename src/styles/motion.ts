import { Platform } from 'react-native';

/**
 * The native driver does not exist on react-native-web: passing true there logs a warning
 * on every animation and falls back to JS anyway.
 */
export const USE_NATIVE_DRIVER = Platform.OS !== 'web';
