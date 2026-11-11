import * as platformHealth from '../../utils/platformHealth';
import { buildPreferenceRepairNotice, PreferenceRepairs } from '../preferenceRepairNotice';

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
