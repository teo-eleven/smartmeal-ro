import React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { useFonts } from 'expo-font';
import { titleFont } from '../typography';
import { TITLE_FONT_FILES, TITLE_FONT_TIMEOUT_MS, useTitleFont } from '../useTitleFont';

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));
const mockUseFonts = useFonts as jest.MockedFunction<typeof useFonts>;

function Probe() {
  return <Text>{useTitleFont() ? 'gata' : 'se încarcă'}</Text>;
}

describe('fontul titlurilor', () => {
  test('titlurile cer exact fontul care se încarcă', () => {
    expect(Object.keys(TITLE_FONT_FILES)).toEqual([titleFont.fontFamily]);
  });

  test('greutatea vine din fișierul Bold, nu dintr-un bold simulat peste el', () => {
    expect(titleFont.fontWeight).toBe('normal');
  });
});

describe('încărcarea fontului', () => {
  afterEach(() => jest.restoreAllMocks());

  test('aplicația așteaptă fontul cât se încarcă', () => {
    mockUseFonts.mockReturnValue([false, null]);
    render(<Probe />);
    expect(screen.getByText('se încarcă')).toBeTruthy();
  });

  test('pornește când fontul e încărcat', () => {
    mockUseFonts.mockReturnValue([true, null]);
    render(<Probe />);
    expect(screen.getByText('gata')).toBeTruthy();
  });

  test('un font care se blochează la încărcare nu ține aplicația pe loc', () => {
    jest.useFakeTimers();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockUseFonts.mockReturnValue([false, null]);
    render(<Probe />);
    expect(screen.getByText('se încarcă')).toBeTruthy();

    act(() => jest.advanceTimersByTime(TITLE_FONT_TIMEOUT_MS));

    expect(screen.getByText('gata')).toBeTruthy();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[SmartMeal]'));
    jest.useRealTimers();
  });

  test('un font care nu se încarcă nu blochează aplicația și e raportat', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const failure = new Error('font lipsă');
    mockUseFonts.mockReturnValue([false, failure]);

    render(<Probe />);

    expect(screen.getByText('gata')).toBeTruthy();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[SmartMeal]'), failure);
  });
});
