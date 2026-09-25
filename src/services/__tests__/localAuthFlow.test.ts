import AsyncStorage from '@react-native-async-storage/async-storage';
import { cloudSyncService } from '../supabase';
import { localAuthSimulation } from '../localAuthSimulation';

/**
 * Drives the real service rather than a mock of it.
 *
 * The AuthModal tests stub `cloudSyncService`, which is right for checking what the screen
 * does — but it meant the screen could call the service wrongly and every test still passed.
 * It did: the reset flow never passed the address the simulation needs, so changing a
 * password always failed on a laptop and nothing said so.
 */
describe('parcursul de cont, prin serviciul real', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('simularea e activă fără un proiect configurat', () => {
    expect(localAuthSimulation.isActive()).toBe(true);
  });

  test('cont nou, deconectare, reconectare', async () => {
    const created = await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde');
    expect(created.error).toBeNull();
    expect(await cloudSyncService.currentEmail()).toBe('a@b.ro');

    await cloudSyncService.signOut();
    expect(await cloudSyncService.currentEmail()).toBeNull();

    const back = await cloudSyncService.signInWithEmail('a@b.ro', 'Muntele7Verde');
    expect(back.user?.email).toBe('a@b.ro');
  });

  test('resetarea parolei chiar schimbă parola', async () => {
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde');
    await cloudSyncService.signOut();

    const asked = await cloudSyncService.requestPasswordReset('a@b.ro');
    expect(asked.success).toBe(true);

    const verified = await cloudSyncService.verifyPasswordResetCode(
      'a@b.ro',
      localAuthSimulation.SIMULATED_RESET_CODE
    );
    expect(verified.success).toBe(true);

    const changed = await cloudSyncService.updatePassword('AltaParola99', 'a@b.ro');
    expect(changed.error).toBeNull();
    expect(changed.success).toBe(true);

    // The old one stops working and the new one starts.
    await cloudSyncService.signOut();
    expect((await cloudSyncService.signInWithEmail('a@b.ro', 'Muntele7Verde')).user).toBeNull();
    expect((await cloudSyncService.signInWithEmail('a@b.ro', 'AltaParola99')).user?.email).toBe(
      'a@b.ro'
    );
  });

  test('un cod greșit nu schimbă nimic', async () => {
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde');

    const verified = await cloudSyncService.verifyPasswordResetCode('a@b.ro', '000000');

    expect(verified.success).toBe(false);
  });

  test('resetarea pe o adresă fără cont este refuzată', async () => {
    const changed = await cloudSyncService.updatePassword('AltaParola99', 'nimeni@b.ro');

    expect(changed.success).toBe(false);
  });

  test('ștergerea contului îl face de neconectat', async () => {
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde');

    const deleted = await cloudSyncService.deleteAccount();

    expect(deleted.success).toBe(true);
    expect(await cloudSyncService.currentEmail()).toBeNull();
    expect((await cloudSyncService.signInWithEmail('a@b.ro', 'Muntele7Verde')).user).toBeNull();
  });
});
