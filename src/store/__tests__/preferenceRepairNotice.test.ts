import * as platformHealth from '../../utils/platformHealth';
import { buildPreferenceRepairNotice, hasRepairs, PreferenceRepairs } from '../preferenceRepairNotice';

const HEALTH_GOALS_UNREADABLE: PreferenceRepairs = {
  allergensRepaired: false,
  dietRepaired: false,
  healthGoalsRepaired: true,
  resetSettings: [],
  stillInfeasible: false,
  planDropped: false,
};

describe('notice for unreadable health goals (A.8c-1)', () => {
  afterEach(() => jest.restoreAllMocks());

  test('on Android and web it names the health goals, as before', () => {
    const notice = buildPreferenceRepairNotice(HEALTH_GOALS_UNREADABLE);

    expect(notice.title).toBe('Verifică-ți obiectivele de sănătate');
    expect(notice.message).toContain('obiectivele tale de sănătate, inclusiv „Fără porc”');
    expect(notice.type).toBe('warning');
  });

  test('on iOS it has no health wording and still points to pork-free in Filtre', () => {
    jest.spyOn(platformHealth, 'areHealthGoalsAvailable').mockReturnValue(false);

    const notice = buildPreferenceRepairNotice(HEALTH_GOALS_UNREADABLE);

    expect(notice.title).toBe('Verifică-ți preferințele');
    expect(notice.message).toBe(
      'Nu am putut citi complet preferințele tale salvate, inclusiv „Fără porc”. Verifică-le din Filtre înainte să gătești.'
    );
    expect(`${notice.title} ${notice.message}`).not.toMatch(/sănătate/i);
    expect(notice.type).toBe('warning');
  });
});

const NOTHING_REPAIRED: PreferenceRepairs = {
  allergensRepaired: false,
  dietRepaired: false,
  healthGoalsRepaired: false,
  resetSettings: [],
  stillInfeasible: false,
  planDropped: false,
};
const repairs = (change: Partial<PreferenceRepairs>): PreferenceRepairs => ({
  ...NOTHING_REPAIRED,
  ...change,
});

describe('hasRepairs', () => {
  test('is false when nothing was repaired, even if only the plan was dropped', () => {
    expect(hasRepairs(NOTHING_REPAIRED)).toBe(false);
    expect(hasRepairs(repairs({ planDropped: true }))).toBe(false);
  });

  test.each([
    ['allergens', { allergensRepaired: true }],
    ['the diet', { dietRepaired: true }],
    ['health goals', { healthGoalsRepaired: true }],
    ['reset settings', { resetSettings: ['magazinul'] }],
  ])('is true when %s were repaired', (_label, change) => {
    expect(hasRepairs(repairs(change))).toBe(true);
  });
});

describe('the notice title and tone follow the most serious repair', () => {
  test('allergens come before the diet', () => {
    const notice = buildPreferenceRepairNotice(repairs({ allergensRepaired: true, dietRepaired: true }));

    expect(notice.title).toBe('Verifică-ți alergiile');
    expect(notice.type).toBe('warning');
  });

  test('a repaired diet is named, with its own sentence', () => {
    const notice = buildPreferenceRepairNotice(repairs({ dietRepaired: true }));

    expect(notice.title).toBe('Verifică-ți dieta');
    expect(notice.message).toContain('Nu am putut citi complet dieta ta salvată');
    expect(notice.type).toBe('warning');
  });

  test('allergens get their own sentence', () => {
    const notice = buildPreferenceRepairNotice(repairs({ allergensRepaired: true }));

    expect(notice.message).toContain('Lista ta de alergii nu a putut fi citită complet');
  });

  test('settings reset to a feasible plan are a calm "restored" info notice', () => {
    const notice = buildPreferenceRepairNotice(repairs({ resetSettings: ['magazinul', 'bugetul'] }));

    expect(notice.title).toBe('Setări restaurate');
    expect(notice.type).toBe('info');
    expect(notice.message).toContain('am restaurat magazinul și bugetul');
    expect(notice.message).not.toContain('tot nu permite');
  });

  test('settings that still allow no plan are a warning that says so', () => {
    const notice = buildPreferenceRepairNotice(
      repairs({ resetSettings: ['dieta'], stillInfeasible: true })
    );

    expect(notice.title).toBe('Setări incomplete');
    expect(notice.type).toBe('warning');
    expect(notice.message).toContain('Am restaurat dieta, dar combinația de dietă și alergii tot nu permite niciun plan');
  });

  test('a dropped plan adds its sentence after the others', () => {
    const notice = buildPreferenceRepairNotice(repairs({ dietRepaired: true, planDropped: true }));

    expect(notice.message).toMatch(/dieta ta salvată.*Meniul salvat a fost scos/);
  });

  test('several repairs are joined into one message with single spaces', () => {
    const notice = buildPreferenceRepairNotice(
      repairs({ allergensRepaired: true, dietRepaired: true, planDropped: true })
    );

    expect(notice.message).not.toMatch(/ {2}/);
    expect(notice.message.split('. ').length).toBeGreaterThanOrEqual(3);
  });

  test('every notice carries a non-empty id', () => {
    expect(buildPreferenceRepairNotice(repairs({ dietRepaired: true })).id).toMatch(/^\d+$/);
  });
});
