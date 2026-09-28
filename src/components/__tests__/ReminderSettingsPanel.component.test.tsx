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

/**
 * On the web the phone reminders cannot ring. Showing them as working switches promised a
 * reminder that would never come; the email one is sent by the server and works anywhere.
 */
describe('panoul de mementouri pe web', () => {
  const scheduler = jest.requireActual('../../services/reminderScheduler').reminderScheduler;
  let spy: jest.SpyInstance;
  beforeEach(() => {
    spy = jest.spyOn(scheduler, 'isSupported').mockReturnValue(false);
  });
  afterEach(() => spy.mockRestore());

  test('spune că mementourile de pe telefon sună doar în aplicația de telefon', () => {
    show();

    expect(screen.getByText(/doar în aplicația de pe telefon/i)).toBeTruthy();
  });

  test('cele de pe telefon sunt dezactivate, iar apăsarea nu schimbă nimic', () => {
    const onChange = show();

    const cooking = screen.getByLabelText('Memento pentru gătit');
    expect(cooking.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(cooking);

    expect(onChange).not.toHaveBeenCalled();
  });

  test('cel pe email rămâne disponibil', () => {
    const onChange = show();

    fireEvent.press(screen.getByLabelText('Mementouri pe email'));

    expect(onChange).toHaveBeenCalledWith({ emailEnabled: true });
  });
});

