import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ReminderSettingsPanel } from '../ReminderSettingsPanel';
import { DEFAULT_REMINDERS, ReminderSettings } from '../../types';

function show(overrides: Partial<ReminderSettings> = {}, hasAccount = true) {
  const onChange = jest.fn();
  render(
    <ReminderSettingsPanel
      reminders={{ ...DEFAULT_REMINDERS, ...overrides }}
      onChange={onChange}
      hasAccount={hasAccount}
      isDark={false}
    />
  );
  return onChange;
}

/**
 * The on-device reminders work for anyone. The email ones are sent from the server, so
 * offering them without an account would be a switch that quietly does nothing.
 */
describe('panoul de mementouri', () => {
  test('mementourile de pe telefon sunt oferite și fără cont', () => {
    show({}, false);

    expect(screen.getByLabelText('Memento pentru gătit')).toBeTruthy();
    expect(screen.getByLabelText('Memento pentru cumpărături')).toBeTruthy();
  });

  test('cele pe email apar doar cu cont', () => {
    show({}, false);
    expect(screen.queryByLabelText('Mementouri pe email')).toBeNull();

    screen.unmount();
    show({}, true);
    expect(screen.getByLabelText('Mementouri pe email')).toBeTruthy();
  });

  test('orele apar abia după ce pornești mementoul', () => {
    show({ cookingEnabled: false });
    expect(screen.queryByLabelText('Gătesc la ora 17:30')).toBeNull();

    screen.unmount();
    show({ cookingEnabled: true });
    expect(screen.getByLabelText('Gătesc la ora 17:30')).toBeTruthy();
  });

  test('alegerea unei ore o raportează în sus', () => {
    const onChange = show({ cookingEnabled: true });

    fireEvent.press(screen.getByLabelText('Gătesc la ora 18:30'));

    expect(onChange).toHaveBeenCalledWith({ cookingTime: '18:30' });
  });

  test('ziua de cumpărături se poate schimba', () => {
    const onChange = show({ shoppingEnabled: true });

    fireEvent.press(screen.getByLabelText('Cumpărături Mi'));

    expect(onChange).toHaveBeenCalledWith({ shoppingWeekday: 2 });
  });

  test('frecvența emailului nu coboară sub două zile', () => {
    show({ emailEnabled: true });

    expect(screen.getByLabelText('Email la 2 zile')).toBeTruthy();
    expect(screen.getByLabelText('Email la 3 zile')).toBeTruthy();
    expect(screen.queryByLabelText('Email la 1 zile')).toBeNull();
  });

  test('schimbarea frecvenței o raportează în sus', () => {
    const onChange = show({ emailEnabled: true });

    fireEvent.press(screen.getByLabelText('Email la 2 zile'));

    expect(onChange).toHaveBeenCalledWith({ emailFrequencyDays: 2 });
  });
});
