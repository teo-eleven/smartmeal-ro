import { useAppStore } from '../useAppStore';
import { asSubscriber } from '../../__tests__/helpers/subscriber';
import { storageService } from '../../services/storage';

/**
 * S12 from the 2026-10-21 audit: "Bifează tot" looped toggleGroceryItem, one store write and
 * one full plan + list save per item. One action, one write.
 */

const store = () => useAppStore.getState();

beforeEach(() => {
  asSubscriber();
  store().quickStart();
});

afterEach(() => jest.restoreAllMocks());

describe('„Bifează tot” și „Deselectează”', () => {
  test('bifează toate produsele de cumpărat dintr-o singură scriere', () => {
    const save = jest.spyOn(storageService, 'savePlanAndGrocery');

    store().setAllPurchased(true);

    expect(
      store()
        .groceryItems.filter((i) => !i.isFromPantry)
        .every((i) => i.isPurchased)
    ).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
  });

  test('debifează tot, dar lasă neatinse produsele pe care le ai deja acasă', () => {
    store().setAllPurchased(true);
    const fromPantry = store()
      .groceryItems.filter((i) => i.isFromPantry)
      .map((i) => i.isPurchased);

    store().setAllPurchased(false);

    expect(
      store()
        .groceryItems.filter((i) => !i.isFromPantry)
        .some((i) => i.isPurchased)
    ).toBe(false);
    expect(
      store()
        .groceryItems.filter((i) => i.isFromPantry)
        .map((i) => i.isPurchased)
    ).toEqual(fromPantry);
  });
});
