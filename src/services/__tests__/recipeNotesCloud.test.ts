import { recipeNotesCloud } from '../recipeNotesCloud';
import { signedInContext } from '../authContext';

jest.mock('../authContext', () => ({ signedInContext: jest.fn() }));

const context = signedInContext as jest.Mock;
const upsert = jest.fn();
const deleteEq2 = jest.fn();
const del = jest.fn(() => ({ eq: jest.fn(() => ({ eq: deleteEq2 })) }));
const selectEq = jest.fn();
const from = jest.fn(() => ({
  upsert,
  delete: del,
  select: jest.fn(() => ({ eq: selectEq })),
}));

beforeEach(() => {
  jest.clearAllMocks();
  context.mockResolvedValue({ kind: 'cloud', client: { from }, user: { id: 'u1' } });
});

describe('notițele în cloud', () => {
  test('o notiță se scrie pe utilizator și rețetă', async () => {
    upsert.mockResolvedValue({ error: null });

    const result = await recipeNotesCloud.save('ciorba', 'mai mult leuștean');

    expect(from).toHaveBeenCalledWith('user_recipe_notes');
    expect(upsert).toHaveBeenCalledWith(
      { user_id: 'u1', recipe_id: 'ciorba', note: 'mai mult leuștean' },
      { onConflict: 'user_id,recipe_id' }
    );
    expect(result).toEqual({ success: true, error: null });
  });

  test('o notiță golită se șterge, nu se scrie goală', async () => {
    deleteEq2.mockResolvedValue({ error: null });

    await recipeNotesCloud.save('ciorba', '   ');

    expect(upsert).not.toHaveBeenCalled();
    expect(del).toHaveBeenCalled();
  });

  test('citirea aduce notițele validate, ca un dicționar pe rețetă', async () => {
    selectEq.mockResolvedValue({
      data: [
        { recipe_id: 'ciorba', note: 'leuștean' },
        { recipe_id: 'sarmale', note: 42 },
        { recipe_id: 'papanasi', note: 'smântână' },
      ],
      error: null,
    });

    expect(await recipeNotesCloud.load()).toEqual({
      notes: { ciorba: 'leuștean', papanasi: 'smântână' },
      error: null,
    });
  });

  test('fără cont nu face nimic și nu dă eroare', async () => {
    context.mockResolvedValue(null);

    expect(await recipeNotesCloud.load()).toEqual({ notes: {}, error: null });
    expect((await recipeNotesCloud.save('ciorba', 'x')).success).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });

  test('o eroare a serverului vine în română, fără detaliile lui', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    selectEq.mockResolvedValue({ data: null, error: { message: 'relation does not exist' } });

    const result = await recipeNotesCloud.load();

    expect(result.notes).toEqual({});
    expect(result.error).toMatch(/notițele/);
    expect(result.error).not.toMatch(/relation/);
    warn.mockRestore();
  });
});
