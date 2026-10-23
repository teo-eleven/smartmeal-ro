import { useAppStore } from '../useAppStore';
import { asSubscriber } from '../../__tests__/helpers/subscriber';

/**
 * S9 from the 2026-10-21 audit: one notice slot, so a later message replaced an earlier one,
 * including the safety warnings raised on launch (an unreadable allergy list). Notices now
 * queue: the one on screen stays until dismissed, and the next one follows.
 */

const store = () => useAppStore.getState();

beforeEach(() => {
  asSubscriber();
  store().quickStart();
  useAppStore.setState({ activeNotice: null, noticeQueue: [] });
});

describe('notificările stau la coadă', () => {
  test('o notificare nouă nu o înlocuiește pe cea afișată', () => {
    store().showNotice('Verifică-ți alergiile', 'Lista nu a putut fi citită.', 'warning');

    store().showNotice('Plan regenerat', 'Ai un meniu nou.', 'info');

    expect(store().activeNotice?.title).toBe('Verifică-ți alergiile');
  });

  test('închiderea o afișează pe următoarea, în ordinea sosirii', () => {
    store().showNotice('Prima', 'unu', 'warning');
    store().showNotice('A doua', 'doi', 'info');
    store().showNotice('A treia', 'trei', 'info');

    store().clearNotice();
    expect(store().activeNotice?.title).toBe('A doua');
    store().clearNotice();
    expect(store().activeNotice?.title).toBe('A treia');
    store().clearNotice();
    expect(store().activeNotice).toBeNull();
  });

  test('aceeași notificare repetată nu se adaugă de două ori', () => {
    store().showNotice('Prima', 'unu', 'warning');
    store().showNotice('A doua', 'doi', 'info');
    store().showNotice('A doua', 'doi', 'info');

    store().clearNotice();
    store().clearNotice();
    expect(store().activeNotice).toBeNull();
  });

  test('și notificările ridicate de acțiuni (nu doar showNotice) stau la coadă', () => {
    store().showNotice('Verifică-ți alergiile', 'Lista nu a putut fi citită.', 'warning');
    const day = store().currentPlan!.days[0];

    store().cookDoubleFor(day.dayOfWeek, day.meals[0].id);

    expect(store().activeNotice?.title).toBe('Verifică-ți alergiile');
    store().clearNotice();
    expect(store().activeNotice).not.toBeNull();
  });
});
