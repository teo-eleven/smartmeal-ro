import { getHouseholdEquivalent, formatIngredientWithHousehold } from '../householdUnits';

describe('Household Unit Equivalents (Echivalențe Casnice)', () => {
  test('formats garlic cloves correctly', () => {
    expect(getHouseholdEquivalent('usturoi', 5, 'g')).toBe('1 cățel');
    expect(getHouseholdEquivalent('usturoi', 15, 'g')).toBe('aprox. 3 căței');
  });

  test('formats liquids and sauces in cups and tablespoons', () => {
    expect(getHouseholdEquivalent('sos_rosii', 200, 'g')).toBe('aprox. 1 cană');
    expect(getHouseholdEquivalent('lapte_15', 250, 'ml')).toBe('aprox. 1 cană');
    expect(getHouseholdEquivalent('smantana', 45, 'g')).toBe('aprox. 3 linguri');
  });

  test('formats oils and butter in tablespoons and teaspoons', () => {
    expect(getHouseholdEquivalent('ulei_masline', 15, 'ml')).toBe('aprox. 1 lingură');
    expect(getHouseholdEquivalent('unt_82', 30, 'g')).toBe('aprox. 2 linguri');
    expect(getHouseholdEquivalent('miere', 5, 'g')).toBe('aprox. 1 linguriță');
  });

  test('formats produce in pieces or packs', () => {
    expect(getHouseholdEquivalent('ceapa_galbena', 130, 'g')).toBe('1 buc. medie');
    expect(getHouseholdEquivalent('avocado', 260, 'g')).toBe('2 bucăți');
    expect(getHouseholdEquivalent('ciuperci_champignon', 250, 'g')).toBe('1 caserolă');
    expect(getHouseholdEquivalent('ciuperci_champignon', 125, 'g')).toBe('aprox. 1/2 caserolă');
  });

  test('formatIngredientWithHousehold returns full string with parenthesized equivalent', () => {
    expect(formatIngredientWithHousehold('sos_rosii', 200, 'g')).toBe('200 g (aprox. 1 cană)');
    expect(formatIngredientWithHousehold('oua', 2, 'buc')).toBe('2 buc');
  });
});
