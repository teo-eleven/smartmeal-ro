import { DISPLAY_NAME_MAX, normalizeDisplayName } from '../displayName';

/** The name typed at sign-up and in Cont, checked the same way the database checks it. */
describe('numele afișat', () => {
  test('spațiile de la capete și cele duble dispar', () => {
    expect(normalizeDisplayName('  Ana   Maria  ')).toEqual({ name: 'Ana Maria', error: null });
  });

  test('diacriticele și cratima rămân', () => {
    expect(normalizeDisplayName('Ștefan-Ionuț')).toEqual({ name: 'Ștefan-Ionuț', error: null });
  });

  test('un nume gol cere să fie completat', () => {
    expect(normalizeDisplayName('   ')).toEqual({ name: null, error: 'Scrie cum te numești.' });
  });

  test('un rând nou între cuvinte devine spațiu, nu le lipește', () => {
    expect(normalizeDisplayName('Ana\nPop\tIon')).toEqual({ name: 'Ana Pop Ion', error: null });
  });

  test('caracterele invizibile și cele care întorc textul sunt scoase', () => {
    expect(normalizeDisplayName('A\u200bna \u202ePop\u202c')).toEqual({
      name: 'Ana Pop',
      error: null,
    });
  });

  test('un nume făcut doar din caractere invizibile e gol', () => {
    expect(normalizeDisplayName('\u200b\u200b').error).toBe('Scrie cum te numești.');
  });

  test('un emoji se numără ca un caracter, ca în baza de date', () => {
    const name = '😀'.repeat(DISPLAY_NAME_MAX);

    expect(normalizeDisplayName(name).name).toBe(name);
  });

  test('caracterele de control sunt scoase, nu păstrate în baza de date', () => {
    expect(normalizeDisplayName('Ana\u0000\u0007 Pop')).toEqual({ name: 'Ana Pop', error: null });
  });

  test(`un nume de peste ${DISPLAY_NAME_MAX} de caractere e refuzat, nu tăiat pe ascuns`, () => {
    const result = normalizeDisplayName('a'.repeat(DISPLAY_NAME_MAX + 1));

    expect(result.name).toBeNull();
    expect(result.error).toMatch(String(DISPLAY_NAME_MAX));
  });

  test(`exact ${DISPLAY_NAME_MAX} de caractere trece`, () => {
    expect(normalizeDisplayName('a'.repeat(DISPLAY_NAME_MAX)).name).toHaveLength(DISPLAY_NAME_MAX);
  });

  test('orice nu e text e tratat ca lipsă', () => {
    expect(normalizeDisplayName(42).error).toBe('Scrie cum te numești.');
    expect(normalizeDisplayName(undefined).error).toBe('Scrie cum te numești.');
  });
});
