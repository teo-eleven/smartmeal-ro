import { MAX_NOTE_LENGTH, parseRecipeNotes, withRecipeNote } from '../recipeNotes';

/**
 * The 2026-10-21 audit: the notes box kept its text in component state, so it was lost on
 * close and the note written for one recipe showed up on the next one opened.
 */
describe('notițele salvate, citite din stocare', () => {
  test('păstrează notițele text, pe rețetă', () => {
    expect(parseRecipeNotes({ ciorba: 'mai mult leuștean' })).toEqual({
      ciorba: 'mai mult leuștean',
    });
  });

  test('ce nu e obiect devine o listă goală', () => {
    [null, undefined, 42, 'text', ['a']].forEach((raw) => {
      expect(parseRecipeNotes(raw)).toEqual({});
    });
  });

  test('aruncă valorile care nu sunt text și notițele goale', () => {
    expect(parseRecipeNotes({ a: 3, b: '   ', c: { x: 1 }, d: 'ok' })).toEqual({ d: 'ok' });
  });

  test('taie o notiță prea lungă la limita admisă', () => {
    const parsed = parseRecipeNotes({ a: 'x'.repeat(MAX_NOTE_LENGTH + 50) });

    expect(parsed.a).toHaveLength(MAX_NOTE_LENGTH);
  });
});

describe('scrierea unei notițe', () => {
  test('adaugă notița fără să schimbe obiectul vechi', () => {
    const before = { a: 'unu' };

    const after = withRecipeNote(before, 'b', 'doi');

    expect(after).toEqual({ a: 'unu', b: 'doi' });
    expect(before).toEqual({ a: 'unu' });
  });

  test('o notiță golită dispare din listă', () => {
    expect(withRecipeNote({ a: 'unu', b: 'doi' }, 'a', '  ')).toEqual({ b: 'doi' });
  });

  test('o notiță prea lungă se taie la limită', () => {
    expect(withRecipeNote({}, 'a', 'x'.repeat(MAX_NOTE_LENGTH + 1)).a).toHaveLength(
      MAX_NOTE_LENGTH
    );
  });
});
