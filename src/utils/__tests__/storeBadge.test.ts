import { getStoreSignatureBadge } from '../storeBadge';

describe('badge-ul „Favorit <magazin>”', () => {
  const lidlSignature = { storeBadgeLabel: '🛒 Favorit Lidl', storeSignature: 'lidl' as const };

  test('apare când rețeta e semnătura magazinului ales', () => {
    expect(getStoreSignatureBadge(lidlSignature, 'lidl')).toEqual({ label: '🛒 Favorit Lidl' });
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
