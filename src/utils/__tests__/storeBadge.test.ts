import { getStoreBadgeBg } from '../storeBadge';
import { SUPERMARKETS } from '../../data/supermarkets';
import { SupermarketId } from '../../types';

describe('culoarea badge-ului de magazin', () => {
  const fallback = getStoreBadgeBg(undefined);

  test.each(Object.keys(SUPERMARKETS) as SupermarketId[])('%s are o culoare proprie', (store) => {
    expect(getStoreBadgeBg(store)).not.toBe(fallback);
  });
});
