import AsyncStorage from '@react-native-async-storage/async-storage';
import { cloudSyncService } from '../supabase';
import { localAuthSimulation } from '../localAuthSimulation';
import { requestLoginCode, verifyLoginCode, LOGIN_CODE_INVALID } from '../authCode';
import { getDisplayName, updateDisplayName } from '../profile';
import { getDeviceId, listDevices, registerThisDevice, revokeDevice } from '../devices';

const CONSENT = { isAtLeast16: true, healthDataConsent: true };

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
    const created = await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde', CONSENT);
    expect(created.error).toBeNull();
    expect(await cloudSyncService.currentEmail()).toBe('a@b.ro');

    await cloudSyncService.signOut();
    expect(await cloudSyncService.currentEmail()).toBeNull();

    const back = await cloudSyncService.signInWithEmail('a@b.ro', 'Muntele7Verde');
    expect(back.user?.email).toBe('a@b.ro');
  });

  test('resetarea parolei chiar schimbă parola', async () => {
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde', CONSENT);
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
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde', CONSENT);

    const verified = await cloudSyncService.verifyPasswordResetCode('a@b.ro', '000000');

    expect(verified.success).toBe(false);
  });

  test('resetarea pe o adresă fără cont este refuzată', async () => {
    const changed = await cloudSyncService.updatePassword('AltaParola99', 'nimeni@b.ro');

    expect(changed.success).toBe(false);
  });

  test('ștergerea contului îl face de neconectat', async () => {
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde', CONSENT);

    const deleted = await cloudSyncService.deleteAccount();

    expect(deleted.success).toBe(true);
    expect(await cloudSyncService.currentEmail()).toBeNull();
    expect((await cloudSyncService.signInWithEmail('a@b.ro', 'Muntele7Verde')).user).toBeNull();
  });
});

describe('numele, codul pe email și dispozitivele, prin serviciile reale', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('numele dat la înregistrare se citește înapoi', async () => {
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde', CONSENT, '  Ana  Pop ');

    expect(await getDisplayName()).toBe('Ana Pop');
  });

  test('numele se poate schimba din Cont', async () => {
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde', CONSENT, 'Ana');

    const changed = await updateDisplayName('Ana Maria');

    expect(changed).toEqual({ name: 'Ana Maria', error: null });
    expect(await getDisplayName()).toBe('Ana Maria');
  });

  test('un nume gol nu se salvează', async () => {
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde', CONSENT, 'Ana');

    const changed = await updateDisplayName('   ');

    expect(changed.error).toBe('Scrie cum te numești.');
    expect(await getDisplayName()).toBe('Ana');
  });

  test('fără cont conectat nu există nume', async () => {
    expect(await getDisplayName()).toBeNull();
    expect((await updateDisplayName('Ana')).error).toBeTruthy();
  });

  test('conectarea cu cod pe email', async () => {
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde', CONSENT);
    await cloudSyncService.signOut();

    expect(await requestLoginCode('a@b.ro')).toEqual({ success: true, error: null });
    const signedIn = await verifyLoginCode('a@b.ro', localAuthSimulation.SIMULATED_LOGIN_CODE);

    expect(signedIn).toEqual({ email: 'a@b.ro', error: null });
    expect(await cloudSyncService.currentEmail()).toBe('a@b.ro');
  });

  test('un cod greșit nu conectează', async () => {
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde', CONSENT);
    await cloudSyncService.signOut();

    const result = await verifyLoginCode('a@b.ro', '000000');

    expect(result).toEqual({ email: null, error: LOGIN_CODE_INVALID });
    expect(await cloudSyncService.currentEmail()).toBeNull();
  });

  /**
   * Same answers as for an account that exists, at both steps: otherwise the code form
   * would tell anyone which addresses have accounts.
   */
  test('o adresă fără cont primește aceleași răspunsuri ca un cod greșit', async () => {
    expect(await requestLoginCode('nimeni@b.ro')).toEqual({ success: true, error: null });

    const result = await verifyLoginCode('nimeni@b.ro', localAuthSimulation.SIMULATED_LOGIN_CODE);

    expect(result).toEqual({ email: null, error: LOGIN_CODE_INVALID });
  });

  test('id-ul dispozitivului e un UUID și rămâne același', async () => {
    const first = await getDeviceId();

    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(await getDeviceId()).toBe(first);
  });

  test('fără cont, dispozitivul nu se înregistrează', async () => {
    expect(await registerThisDevice()).toBe('skipped');
  });

  test('lista arată dispozitivul ăsta primul și unul simulat', async () => {
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde', CONSENT);

    expect(await registerThisDevice()).toBe('ok');
    const { devices, error } = await listDevices();

    expect(error).toBeNull();
    expect(devices).toHaveLength(2);
    expect(devices[0]).toMatchObject({ deviceId: await getDeviceId(), isCurrent: true });
    expect(devices[1]).toMatchObject({ isCurrent: false, platform: 'web' });
  });

  test('alt dispozitiv se poate deconecta și dispare din listă', async () => {
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde', CONSENT);
    await registerThisDevice();
    const other = (await listDevices()).devices.find((d) => !d.isCurrent);

    const revoked = await revokeDevice(other!.deviceId);

    expect(revoked).toEqual({ success: true, error: null });
    expect((await listDevices()).devices.map((d) => d.isCurrent)).toEqual([true]);
  });

  test('dispozitivul ăsta nu se deconectează din listă', async () => {
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde', CONSENT);
    await registerThisDevice();

    const revoked = await revokeDevice(await getDeviceId());

    expect(revoked.success).toBe(false);
    expect(revoked.error).toMatch(/Deconectare/);
  });

  test('conturile au liste separate', async () => {
    await cloudSyncService.signUpWithEmail('a@b.ro', 'Muntele7Verde', CONSENT);
    await registerThisDevice();
    await cloudSyncService.signOut();
    await cloudSyncService.signUpWithEmail('c@d.ro', 'Muntele7Verde', CONSENT);

    expect((await listDevices()).devices).toHaveLength(0);
  });
});
