import { getStoreBadgeBg, getStoreSignatureBadge } from '../storeBadge';
import { SUPERMARKETS } from '../../data/supermarkets';
import { SupermarketId } from '../../types';

describe('culoarea badge-ului de magazin', () => {
  const fallback = getStoreBadgeBg(undefined);

  test.each(Object.keys(SUPERMARKETS) as SupermarketId[])('%s are o culoare proprie', (store) => {
    expect(getStoreBadgeBg(store)).not.toBe(fallback);
  });
});

describe('badge-ul „Favorit <magazin>”', () => {
  const lidlSignature = { storeBadgeLabel: '🛒 Favorit Lidl', storeSignature: 'lidl' as const };

  test('apare când rețeta e semnătura magazinului ales', () => {
    expect(getStoreSignatureBadge(lidlSignature, 'lidl')?.label).toBe('🛒 Favorit Lidl');
  });

  test('nu apare pe planul altui magazin', () => {
    expect(getStoreSignatureBadge(lidlSignature, 'kaufland')).toBeNull();
  });

  test('nu apare pe o rețetă fără semnătură', () => {
    expect(
      getStoreSignatureBadge({ storeBadgeLabel: undefined, storeSignature: undefined }, 'lidl')
    ).toBeNull();
  });
});
