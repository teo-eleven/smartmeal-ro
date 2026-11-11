import { cloudSyncService } from '../supabase';

/**
 * The service is three method objects spread into one. A method that reached its siblings
 * through `this` worked only when called as `cloudSyncService.x()`; handed on as a callback
 * (an onPress, a destructuring) it threw "cannot read properties of undefined".
 */
describe('service methods called on their own', () => {
  test('currentEmail works without its object', async () => {
    const { currentEmail } = cloudSyncService;
    await expect(currentEmail()).resolves.not.toThrow();
  });

  test('deleteAccount works without its object', async () => {
    const { deleteAccount } = cloudSyncService;
    const result = await deleteAccount();
    expect(result).toEqual(expect.objectContaining({ success: expect.any(Boolean) }));
  });
});
