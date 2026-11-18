import { formatRon, formatRonAuto } from '../formatRon';

describe('formatRon: two decimals with a comma, the way a Romanian writes a price', () => {
  test.each([
    [7.9, '7,90'],
    [15.8, '15,80'],
    [0, '0,00'],
    [3, '3,00'],
    [1234.5, '1234,50'],
    [0.005, '0,01'],
    [2.675, '2,68'],
  ])('%s is %s', (value, expected) => {
    expect(formatRon(value)).toBe(expected);
  });

  test('a negative amount keeps its sign', () => {
    expect(formatRon(-2.5)).toBe('-2,50');
  });

  test.each([[NaN], [Infinity], [-Infinity]])('%s falls back to 0,00, never "NaN"', (value) => {
    expect(formatRon(value)).toBe('0,00');
  });
});

describe('formatRonAuto: a whole amount stays whole, a fractional one gets its decimals', () => {
  test.each([
    [420, '420'],
    [0, '0'],
    [7.9, '7,90'],
    [15.8, '15,80'],
    [12.004, '12'],
    [-3, '-3'],
    [-3.5, '-3,50'],
  ])('%s is %s', (value, expected) => {
    expect(formatRonAuto(value)).toBe(expected);
  });

  test('a value that is not a number reads 0', () => {
    expect(formatRonAuto(NaN)).toBe('0');
  });
});
