import { createClient } from '@supabase/supabase-js';
import { DEFAULT_PREFERENCES } from '../../store/defaults';
import {
  assertLocalDatabaseIsUp,
  deleteUsers,
  makePlan,
  newDevice,
  signInOnDevice,
  signUpOnDevice,
  uniqueEmail,
} from './syncHarness';

/**
 * The account and the weekly plan against a real Supabase (the local test database): the
 * same app code as on a phone, with two "devices" signed in to one account.
 */
const createdUsers: string[] = [];

beforeAll(async () => {
  await assertLocalDatabaseIsUp();
});

afterAll(async () => {
  await deleteUsers(createdUsers);
});

describe('a new account', () => {
  test('records the consent and the display name on the server', async () => {
    const phone = newDevice();
    const userId = await signUpOnDevice(phone, uniqueEmail('signup'));
    createdUsers.push(userId);

    const consent = await phone.loadConsent(userId);
    expect(consent).toMatchObject({ age_confirmed_16: true, health_data_consent: true });
    expect(consent?.privacy_policy_version).toBeTruthy();
    expect(consent?.consented_at).toBeTruthy();
  });
});

describe('the weekly plan across two devices', () => {
  test('a plan saved on the phone opens unchanged on the laptop', async () => {
    const email = uniqueEmail('two-devices');
    const phone = newDevice();
    const userId = await signUpOnDevice(phone, email);
    createdUsers.push(userId);
    const plan = makePlan();

    const saved = await phone.saveMealPlan({ plan, groceryItems: [], expectedUpdatedAt: null });
    expect(saved).toMatchObject({ status: 'saved', error: null });

    const laptop = newDevice();
    await signInOnDevice(laptop, email);
    const loaded = await laptop.loadMealPlan(userId);
    expect(loaded.error).toBeNull();
    expect(loaded.plan).toEqual(plan);
    expect(loaded.updatedAt).toBe(saved.updatedAt);
  });

  test("another account and a visitor without one cannot read someone's plan", async () => {
    const owner = newDevice();
    const ownerId = await signUpOnDevice(owner, uniqueEmail('owner'));
    createdUsers.push(ownerId);
    await owner.saveMealPlan({ plan: makePlan(), groceryItems: [], expectedUpdatedAt: null });

    const stranger = newDevice();
    createdUsers.push(await signUpOnDevice(stranger, uniqueEmail('stranger')));
    const seenByStranger = await stranger.loadMealPlan(ownerId);
    // Empty because the row is hidden from them, not because the read failed.
    expect(seenByStranger).toMatchObject({ plan: null, error: null });

    const visitor = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL as string,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string,
      { auth: { persistSession: false } }
    );
    const { data } = await visitor.from('user_meal_plans').select('user_id');
    expect(data ?? []).toEqual([]);
  });
});

describe('two devices saving at once (migration 0009)', () => {
  test('the slower device gets a conflict instead of overwriting the newer plan', async () => {
    const email = uniqueEmail('conflict');
    const phone = newDevice();
    const userId = await signUpOnDevice(phone, email);
    createdUsers.push(userId);
    const laptop = newDevice();
    await signInOnDevice(laptop, email);

    const first = await phone.saveMealPlan({
      plan: makePlan(),
      groceryItems: [],
      expectedUpdatedAt: null,
    });
    const laptopSaw = (await laptop.loadMealPlan(userId)).updatedAt;
    expect(laptopSaw).toBe(first.updatedAt);

    const phonePlan = makePlan({ ...DEFAULT_PREFERENCES, peopleCount: 3 });
    const second = await phone.saveMealPlan({
      plan: phonePlan,
      groceryItems: [],
      expectedUpdatedAt: first.updatedAt,
    });
    expect(second.status).toBe('saved');

    const late = await laptop.saveMealPlan({
      plan: makePlan(),
      groceryItems: [],
      expectedUpdatedAt: laptopSaw,
    });
    expect(late).toMatchObject({ status: 'conflict', updatedAt: second.updatedAt });
    expect((await laptop.loadMealPlan(userId)).plan).toEqual(phonePlan);

    // Once the laptop has seen the newer version it may replace it, on purpose.
    const retry = await laptop.saveMealPlan({
      plan: makePlan(),
      groceryItems: [],
      expectedUpdatedAt: second.updatedAt,
    });
    expect(retry.status).toBe('saved');
  });

  test('a device that never saw the cloud plan cannot overwrite it', async () => {
    const email = uniqueEmail('fresh-device');
    const phone = newDevice();
    const userId = await signUpOnDevice(phone, email);
    createdUsers.push(userId);
    const existing = makePlan();
    await phone.saveMealPlan({ plan: existing, groceryItems: [], expectedUpdatedAt: null });

    const newPhone = newDevice();
    await signInOnDevice(newPhone, email);
    const blind = await newPhone.saveMealPlan({
      plan: makePlan(),
      groceryItems: [],
      expectedUpdatedAt: null,
    });
    expect(blind.status).toBe('conflict');
    expect((await newPhone.loadMealPlan(userId)).plan).toEqual(existing);
  });
});
