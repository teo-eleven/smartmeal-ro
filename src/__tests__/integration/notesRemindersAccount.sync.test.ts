import {
  adminClient,
  assertLocalDatabaseIsUp,
  deleteUsers,
  makePlan,
  newDeviceKit,
  signInOnDevice,
  signUpOnDevice,
  TEST_PASSWORD,
  uniqueEmail,
} from './syncHarness';

/**
 * Recipe notes, reminders, signing out and deleting the account, against the local test
 * database and its edge functions, with the app's own services on two "devices".
 */
const createdUsers: string[] = [];
const RECIPE = 'pui_airfryer_cartofi';
const MAX_NOTE_LENGTH = 2000;

beforeAll(async () => {
  await assertLocalDatabaseIsUp();
});

afterAll(async () => {
  // Accounts a test already deleted are gone; only the rest need removing.
  const { data } = await adminClient().auth.admin.listUsers();
  const remaining = new Set((data?.users ?? []).map((user) => user.id));
  await deleteUsers(createdUsers.filter((id) => remaining.has(id)));
});

async function accountOnTwoDevices(label: string) {
  const email = uniqueEmail(label);
  const phone = newDeviceKit();
  const userId = await signUpOnDevice(phone.sync, email);
  createdUsers.push(userId);
  const laptop = newDeviceKit();
  await signInOnDevice(laptop.sync, email);
  return { email, userId, phone, laptop };
}

describe('recipe notes (migration 0010)', () => {
  test('a note follows the account to the other device, and so do its edit and removal', async () => {
    const { phone, laptop } = await accountOnTwoDevices('notes');

    expect(await phone.notes.save(RECIPE, 'Mai puțin ulei')).toEqual({
      success: true,
      error: null,
    });
    expect((await laptop.notes.load()).notes[RECIPE]).toBe('Mai puțin ulei');

    await laptop.notes.save(RECIPE, 'Mai puțin ulei, mai mult usturoi');
    expect((await phone.notes.load()).notes[RECIPE]).toBe('Mai puțin ulei, mai mult usturoi');

    await phone.notes.save(RECIPE, '   ');
    expect((await laptop.notes.load()).notes[RECIPE]).toBeUndefined();
  });

  test('the server refuses a note longer than the app allows', async () => {
    const { phone } = await accountOnTwoDevices('long-note');
    const result = await phone.notes.save(RECIPE, 'a'.repeat(MAX_NOTE_LENGTH + 1));
    expect(result.success).toBe(false);
  });
});

describe('reminders', () => {
  test('settings saved on one device are read on the other', async () => {
    const { userId, phone, laptop } = await accountOnTwoDevices('reminders');
    await phone.sync.saveReminders(userId, { cookingEnabled: true, cookingTime: '18:15' });

    expect(await laptop.sync.loadReminders(userId)).toMatchObject({
      cookingEnabled: true,
      cookingTime: '18:15',
    });
  });

  test('an unsubscribe by email link survives the app saving another reminder field', async () => {
    const { userId, phone } = await accountOnTwoDevices('unsubscribe');
    await phone.sync.saveReminders(userId, { emailEnabled: true });
    // What unsubscribe-reminders does when the link in an email is opened.
    const { error } = await adminClient()
      .from('user_reminders')
      .update({ email_enabled: false })
      .eq('user_id', userId);
    expect(error).toBeNull();

    await phone.sync.saveReminders(userId, { cookingTime: '19:00' });

    expect(await phone.sync.loadReminders(userId)).toMatchObject({
      emailEnabled: false,
      cookingTime: '19:00',
    });
  });
});

describe('signing out', () => {
  test('signs out only this device; the other keeps its access', async () => {
    const { userId, phone, laptop } = await accountOnTwoDevices('sign-out');
    const plan = makePlan();
    await phone.sync.saveMealPlan({ plan, groceryItems: [], expectedUpdatedAt: null });

    await phone.sync.signOut();

    expect(await phone.sync.currentEmail()).toBeNull();
    expect((await phone.sync.loadMealPlan(userId)).plan).toBeNull();
    expect((await laptop.sync.loadMealPlan(userId)).plan).toEqual(plan);
  });
});

describe('deleting the account (edge function delete-account)', () => {
  test('a wrong password deletes nothing', async () => {
    const { userId, phone } = await accountOnTwoDevices('delete-wrong');
    await phone.sync.saveMealPlan({ plan: makePlan(), groceryItems: [], expectedUpdatedAt: null });

    const result = await phone.sync.deleteAccount('parola-gresita');

    expect(result.success).toBe(false);
    const { data } = await adminClient().auth.admin.getUserById(userId);
    expect(data.user?.id).toBe(userId);
  });

  test('removes the account and everything stored against it', async () => {
    const { email, userId, phone } = await accountOnTwoDevices('delete');
    await phone.sync.saveMealPlan({ plan: makePlan(), groceryItems: [], expectedUpdatedAt: null });
    await phone.notes.save(RECIPE, 'Notiță de șters');
    await phone.sync.saveReminders(userId, { cookingEnabled: true });

    const result = await phone.sync.deleteAccount(TEST_PASSWORD);
    expect(result).toEqual({ success: true, error: null });

    const admin = adminClient();
    const { data: gone } = await admin.auth.admin.getUserById(userId);
    expect(gone.user).toBeNull();
    for (const table of [
      'user_meal_plans',
      'user_recipe_notes',
      'user_reminders',
      'user_consents',
      'profiles',
    ]) {
      const { count, error } = await admin
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      // A failed query also has no count; it must not pass for "nothing left".
      expect({ table, error, count }).toEqual({ table, error: null, count: 0 });
    }

    const again = newDeviceKit();
    const signIn = await again.sync.signInWithEmail(email, TEST_PASSWORD);
    expect(signIn.error).toBeTruthy();
  });
});
