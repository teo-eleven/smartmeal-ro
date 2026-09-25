import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PantryInventoryModal, PANTRY_STAPLES_LIST } from '../PantryInventoryModal';
import { useAppStore } from '../../store/useAppStore';
import { INGREDIENTS } from '../../data/ingredients';
import { UserPreferences } from '../../types';

const PREFS: UserPreferences = {
  supermarketId: 'lidl', peopleCount: 2, cookingDays: ['monday', 'tuesday'], budgetRon: 900,
  moodTags: ['speedy'], dietType: 'omnivore', dietTypes: ['omnivore'],
  appliances: ['hob', 'oven', 'air_fryer'], excludePantryStaples: true,
  pantryInventory: [], avoidedAllergens: [], mealSlots: ['dinner'], foodTier: 'medium',
  selectedSnackIds: [], selectedDrinkIds: [], includeAlcohol: false,
};

function seed(pantry: string[] = []) {
  useAppStore.setState({
    preferences: { ...PREFS, pantryInventory: pantry },
    currentPlan: null,
    groceryItems: [],
  });
}

function show() {
  render(<PantryInventoryModal visible onClose={jest.fn()} isDark={false} />);
}

describe('cămara', () => {
  beforeEach(() => seed());

  /**
   * The savings figure is only meaningful if each staple resolves to a real ingredient.
   * An id that has drifted away from the catalogue falls back to a flat 6 lei, which looks
   * like a real number and is not one.
   */
  test('fiecare aliment din listă există în catalogul de ingrediente', () => {
    const missing = PANTRY_STAPLES_LIST.filter((s) => !INGREDIENTS[s.id]);

    expect(missing.map((s) => s.id)).toEqual([]);
  });

  test('bifarea unui aliment îl scrie în preferințe', () => {
    show();

    fireEvent.press(screen.getByText('Cartofi'));

    expect(useAppStore.getState().preferences.pantryInventory).toContain('cartofi_albi');
  });

  test('a doua apăsare îl scoate înapoi', () => {
    seed(['cartofi_albi']);
    show();

    fireEvent.press(screen.getByText('Cartofi'));

    expect(useAppStore.getState().preferences.pantryInventory).not.toContain('cartofi_albi');
  });

  test('„bifează tot" pune exact lista, nu mai mult', () => {
    show();

    fireEvent.press(screen.getByText(/Am cămara plină/));

    expect(useAppStore.getState().preferences.pantryInventory).toEqual(
      PANTRY_STAPLES_LIST.map((s) => s.id)
    );
  });

  test('„deselectează tot" golește lista', () => {
    seed(['cartofi_albi', 'sare_fina']);
    show();

    fireEvent.press(screen.getByText(/Deselectează tot/));

    expect(useAppStore.getState().preferences.pantryInventory).toEqual([]);
  });

  test('fără nimic bifat nu promite nicio economie', () => {
    show();

    expect(screen.getByText('Nu ai bifat ingrediente din cămară')).toBeTruthy();
    expect(screen.queryByText(/Economie estimată/)).toBeNull();
  });

  test('cu ingrediente bifate arată câte sunt și o economie pozitivă', () => {
    seed(['cartofi_albi', 'sare_fina']);
    show();

    expect(screen.getByText('Ai bifat 2 ingrediente pe care le ai deja acasă')).toBeTruthy();
    expect(screen.getByText(/Economie estimată/)).toBeTruthy();
  });

  test('economia se calculează pe prețurile lanțului ales', () => {
    const ids = ['cartofi_albi', 'sare_fina'];
    const expected = Math.round(
      ids.reduce((sum, id) => sum + INGREDIENTS[id].typicalPriceRon.lidl, 0)
    );
    seed(ids);
    show();

    expect(screen.getByText(`~${expected} LEI`)).toBeTruthy();
  });

  test('închiderea e oferită și sus, și jos', () => {
    const onClose = jest.fn();
    render(<PantryInventoryModal visible onClose={onClose} isDark={false} />);

    fireEvent.press(screen.getByText(/Salvează & Actualizează/));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText(/✕ Închide/));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
  /**
   * The point of the screen. Ten of the nineteen ids used to be spelled differently from the
   * catalogue, so ticking "eggs" changed a highlight and nothing else; the item stayed on the
   * list and stayed paid for. The id test above guards the spelling, this one guards the
   * effect.
   */
  test('bifarea unui ingredient îl scoate din coș', () => {
    seed();
    useAppStore.getState().generatePlan();
    const onList = useAppStore
      .getState()
      .groceryItems.map((item) => item.ingredientId)
      .filter((id) => PANTRY_STAPLES_LIST.some((s) => s.id === id));
    expect(onList.length).toBeGreaterThan(0);

    useAppStore.getState().setPantryInventory([onList[0]]);

    const after = useAppStore.getState().groceryItems.find((i) => i.ingredientId === onList[0]);
    expect(after?.isFromPantry ?? false).toBe(true);
  });
});
