import { undoBannerCopy } from '../undoBannerCopy';

describe('textul bannerului de Undo', () => {
  test('după un reset spune că planul a fost șters', () => {
    expect(undoBannerCopy('reset').message).toMatch(/șters/);
  });

  test('după o restaurare nu pretinde că planul a fost șters', () => {
    const copy = undoBannerCopy('restore');

    expect(copy.message).not.toMatch(/șters/);
    expect(copy.message).toMatch(/salvat/);
  });

  test('după o descărcare din cloud spune de unde a venit planul nou', () => {
    expect(undoBannerCopy('cloud').message).toMatch(/cloud/);
  });

  test('fără motiv cunoscut folosește textul de reset', () => {
    expect(undoBannerCopy(undefined)).toEqual(undoBannerCopy('reset'));
  });
});
