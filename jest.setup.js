/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// expo-secure-store reaches for a native module that does not exist under Jest. The real
// keychain behaviour is covered directly in secureSessionStore.test.ts, which supplies its
// own mock; this one only keeps the module importable everywhere else.
jest.mock('expo-secure-store', () => {
  const vault = {};
  return {
    getItemAsync: async (key) => (key in vault ? vault[key] : null),
    setItemAsync: async (key, value) => {
      vault[key] = value;
    },
    deleteItemAsync: async (key) => {
      delete vault[key];
    },
  };
});

// expo-notifications reaches for a native module that does not exist under Jest. The
// scheduling logic is covered directly in reminderScheduler.test.ts, which supplies its own
// mock; this one only keeps the module importable everywhere else.
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { WEEKLY: 'weekly' },
  getPermissionsAsync: async () => ({ granted: true, canAskAgain: true }),
  requestPermissionsAsync: async () => ({ granted: true }),
  getAllScheduledNotificationsAsync: async () => [],
  scheduleNotificationAsync: async () => 'stub-id',
  cancelScheduledNotificationAsync: async () => undefined,
}));

// RevenueCat's SDK is native code. Each test sets the answers it needs on this object.
jest.mock('react-native-purchases', () => {
  const empty = { entitlements: { active: {} }, managementURL: null };
  const Purchases = {
    configure: jest.fn(),
    isConfigured: jest.fn(async () => true),
    getCustomerInfo: jest.fn(async () => empty),
    getOfferings: jest.fn(async () => ({ current: null })),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(async () => empty),
    logIn: jest.fn(async () => ({ customerInfo: empty, created: false })),
    logOut: jest.fn(async () => empty),
  };
  const PURCHASES_ERROR_CODE = {
    PURCHASE_CANCELLED_ERROR: '1',
    PRODUCT_ALREADY_PURCHASED_ERROR: '6',
    NETWORK_ERROR: '10',
    PAYMENT_PENDING_ERROR: '20',
  };
  return { __esModule: true, default: Purchases, PURCHASES_ERROR_CODE };
});
