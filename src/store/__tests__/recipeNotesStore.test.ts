import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../useAppStore';
import { storageService } from '../../services/storage';

const store = () => useAppStore.getState();

beforeEach(async () => {
  await AsyncStorage.clear();
  useAppStore.setState({ recipeNotes: {} });
});

describe('notițele la rețete', () => {
  test('se păstrează separat pe fiecare rețetă', () => {
    store().setRecipeNote('ciorba', 'mai mult leuștean');
    store().setRecipeNote('papanasi', 'smântână grasă');

    expect(store().recipeNotes).toEqual({
      ciorba: 'mai mult leuștean',
      papanasi: 'smântână grasă',
    });
  });

  test('se scriu pe telefon și revin după repornire', async () => {
    store().setRecipeNote('ciorba', 'mai mult leuștean');
    await new Promise((resolve) => setImmediate(resolve));
    useAppStore.setState({ recipeNotes: {} });

    await store().hydrateStorage();

    expect(store().recipeNotes).toEqual({ ciorba: 'mai mult leuștean' });
  });

  test('o notiță stricată în stocare nu oprește pornirea', async () => {
    await AsyncStorage.setItem('@smartmeal_recipe_notes', '{nu e json');

    await store().hydrateStorage();

    expect(store().recipeNotes).toEqual({});
    expect(store().isHydrated).toBe(true);
  });

  test('stocarea primește notițele ca text curat', async () => {
    store().setRecipeNote('ciorba', 'leuștean');
    await new Promise((resolve) => setImmediate(resolve));

    expect(await storageService.loadRecipeNotes()).toEqual({ ciorba: 'leuștean' });
  });
});
