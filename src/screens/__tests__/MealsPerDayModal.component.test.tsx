import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MealsPerDayModal } from '../MealsPerDayModal';
import { useAppStore } from '../../store/useAppStore';
import { asSubscriber } from '../../__tests__/helpers/subscriber';

const store = () => useAppStore.getState();

function show(initialCount: 1 | 2 | 3 = 2) {
  const onClose = jest.fn();
  render(<MealsPerDayModal visible initialCount={initialCount} onClose={onClose} isDark />);
  return onClose;
}

beforeEach(() => {
  asSubscriber();
  store().quickStart();
});

describe('mesele pe zile', () => {
  test('un preset aplicat tuturor zilelor ajunge în preferințe la confirmare', () => {
    const onClose = show(1);

    fireEvent.press(screen.getByLabelText('Doar Prânz'));
    fireEvent.press(screen.getByLabelText('Aplică Mesele Selectate și Reîncarcă Meniul'));

    const daily = store().preferences.dailyMealSlots ?? {};
    const days = store().currentPlan!.days.map((d) => d.dayOfWeek);
    days.forEach((day) => expect(daily[day]).toEqual(['lunch']));
    expect(onClose).toHaveBeenCalled();
  });

  test('cu două mese pe zi, presetul de două mese se aplică tuturor zilelor', () => {
    show(2);

    fireEvent.press(screen.getByLabelText('Mic Dejun + Cină'));
    fireEvent.press(screen.getByLabelText('Aplică Mesele Selectate și Reîncarcă Meniul'));

    Object.values(store().preferences.dailyMealSlots ?? {}).forEach((slots) =>
      expect(slots).toEqual(['breakfast', 'dinner'])
    );
  });

  test('„Închide” nu schimbă nimic', () => {
    const before = store().preferences.dailyMealSlots;
    const onClose = show(2);

    fireEvent.press(screen.getByLabelText('Prânz + Cină'));
    fireEvent.press(screen.getByLabelText('Închide'));

    expect(onClose).toHaveBeenCalled();
    expect(store().preferences.dailyMealSlots).toEqual(before);
  });

  test('confirmarea reface meniul cu atâtea mese pe zi câte s-au ales', () => {
    show(1);

    fireEvent.press(screen.getByLabelText('Doar Cină'));
    fireEvent.press(screen.getByLabelText('Aplică Mesele Selectate și Reîncarcă Meniul'));

    store().currentPlan!.days.forEach((day) =>
      expect(day.meals.filter((m) => m.slot !== 'snack' && m.slot !== 'dessert')).toHaveLength(1)
    );
  });
});
