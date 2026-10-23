import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../useAppStore';
import { cloudSyncService } from '../../services/supabase';
import { asSubscriber } from '../../__tests__/helpers/subscriber';

jest.mock('../../services/supabase', () => ({
  cloudSyncService: {
    isConfigured: jest.fn(() => true),
    getCurrentUser: jest.fn(),
    // Sync asks the server first (F1); in these tests it answers like getCurrentUser.
    verifyUser: jest.fn(async function (this: { getCurrentUser: () => Promise<unknown> }) {
      const user = await this.getCurrentUser();
      return { user, reason: user ? 'ok' : 'signed_out' };
    }),
    saveMealPlan: jest.fn(),
    loadMealPlan: jest.fn(),
    loadReminders: jest.fn(async () => null),
    currentEmail: jest.fn(async () => null),
    signOut: jest.fn(async () => undefined),
  },
}));

/**
 * The 2026-10-21 audit (F4): signing out left the previous account's plan, saved plans,
 * notes and allergies on the phone, and the next person to open the app saw them.
 */
const store = () => useAppStore.getState();
const flush = () => new Promise((resolve) => setImmediate(resolve));

async function signedInWithData(email = 'ana@b.ro') {
  await AsyncStorage.clear();
  asSubscriber();
  store().setUserEmail(email);
  store().quickStart();
  store().toggleAvoidedAllergen('oua');
  store().saveCurrentPlan('Săptămâna mea');
  store().setRecipeNote('ciorba', 'mai mult leuștean');
  await flush();
}

describe('deconectarea golește telefonul', () => {
  test('planul, lista, planurile salvate, notițele și alergiile dispar din aplicație', async () => {
    await signedInWithData();

    store().setUserEmail(null);

    expect(store().currentPlan).toBeNull();
    expect(store().groceryItems).toEqual([]);
    expect(store().savedPlans).toEqual([]);
    expect(store().recipeNotes).toEqual({});
    expect(store().preferences.avoidedAllergens).toEqual([]);
  });

  test('și din stocarea telefonului, deci nu revin la repornire', async () => {
    await signedInWithData();

    store().setUserEmail(null);
    await flush();
    await store().hydrateStorage();

    expect(store().currentPlan).toBeNull();
    expect(store().savedPlans).toEqual([]);
    expect(store().recipeNotes).toEqual({});
  });

  test('o sesiune expirată singură păstrează datele: omul nu a ales să plece', async () => {
    await signedInWithData();
    const plan = store().currentPlan;

    store().setUserEmail(null, { keepLocalData: true });

    expect(store().currentPlan).toBe(plan);
  });

  test('alt cont conectat după o sesiune expirată nu vede datele celui dinainte', async () => {
    await signedInWithData('ana@b.ro');
    store().setUserEmail(null, { keepLocalData: true });

    store().setUserEmail('mihai@b.ro');

    expect(store().currentPlan).toBeNull();
    expect(store().recipeNotes).toEqual({});
  });

  test('același cont conectat din nou își regăsește planul', async () => {
    await signedInWithData('ana@b.ro');
    const plan = store().currentPlan;
    store().setUserEmail(null, { keepLocalData: true });

    store().setUserEmail('ana@b.ro');

    expect(store().currentPlan).toBe(plan);
  });

  test('un plan făcut fără cont rămâne când te conectezi prima dată', async () => {
    await AsyncStorage.clear();
    asSubscriber();
    useAppStore.setState({ userEmail: null, dataOwnerEmail: null });
    store().quickStart();
    const plan = store().currentPlan;

    store().setUserEmail('ana@b.ro');

    expect(store().currentPlan).toBe(plan);
  });
});

describe('știm dacă planul de pe telefon e urcat în cloud', () => {
  test('un plan nou nu e urcat', async () => {
    await signedInWithData();

    expect(store().hasUnsyncedPlan()).toBe(true);
  });

  test('după sincronizare e urcat, iar o editare îl face din nou neurcat', async () => {
    await signedInWithData();
    (cloudSyncService.getCurrentUser as jest.Mock).mockResolvedValue({ id: 'u1' });
    (cloudSyncService.saveMealPlan as jest.Mock).mockResolvedValue({
      status: 'saved',
      updatedAt: '2026-10-23T10:00:00Z',
      error: null,
    });

    await store().syncWithCloud();
    expect(store().hasUnsyncedPlan()).toBe(false);

    const day = store().currentPlan!.days[0];
    store().setMealServings(day.dayOfWeek, day.meals[0].id, day.meals[0].servings + 1);
    expect(store().hasUnsyncedPlan()).toBe(true);
  });
});
