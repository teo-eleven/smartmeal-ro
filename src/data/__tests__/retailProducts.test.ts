import { RETAIL_PRODUCTS, RETAIL_PRODUCTS_MAP } from '../retailProducts';
import { useAppStore } from '../../store/useAppStore';

/**
 * Two things decide whether a drink is "alcohol": the category it is drawn under, which the
 * 18+ switch hides, and the `isAlcoholic` flag, which the switch uses to clear the cart.
 * When they disagree, turning the switch off hides a product without removing it, and the
 * cart keeps something the user can no longer see to untick. A 0.0% beer did exactly that.
 */
describe('secțiunea de alcool', () => {
  test('categoria și marcajul spun același lucru pentru fiecare produs', () => {
    const disagreeing = RETAIL_PRODUCTS.filter(
      (p) => (p.category === 'drink_alcoholic') !== Boolean(p.isAlcoholic)
    );

    expect(disagreeing.map((p) => p.id)).toEqual([]);
  });

  test('închiderea secțiunii nu lasă în coș nimic din ea', () => {
    const hiddenIds = RETAIL_PRODUCTS.filter((p) => p.category === 'drink_alcoholic').map(
      (p) => p.id
    );
    useAppStore.getState().setIncludeAlcohol(true);
    hiddenIds.forEach((id) => useAppStore.getState().toggleDrinkProduct(id));

    useAppStore.getState().setIncludeAlcohol(false);

    const stillSelected = (useAppStore.getState().preferences.selectedDrinkIds || []).filter(
      (id) => RETAIL_PRODUCTS_MAP[id]?.category === 'drink_alcoholic'
    );
    expect(stillSelected).toEqual([]);
  });
});
