/**
 * An amount in lei as a Romanian writes it: two decimals, a comma, no unit ("7,90").
 * Fixed rather than Intl, so every device and the tests print the same thing. A value that is
 * not a finite number prints as zero, never as "NaN".
 */
const CENTS = 100;

export function formatRon(amount: number): string {
  if (!Number.isFinite(amount)) return '0,00';
  const sign = amount < 0 ? '-' : '';
  // EPSILON nudges halves such as 2.675, which binary floats store just below, upwards.
  const cents = Math.round((Math.abs(amount) + Number.EPSILON) * CENTS);
  const whole = Math.floor(cents / CENTS);
  const fraction = String(cents % CENTS).padStart(2, '0');
  return `${cents === 0 ? '' : sign}${whole},${fraction}`;
}

/**
 * For totals that are mostly whole lei: "420 lei" stays "420", "7.9" becomes "7,90". Keeps a
 * round budget from growing a pointless ",00" while no fractional amount shows a dot.
 */
export function formatRonAuto(amount: number): string {
  const text = formatRon(amount);
  return text.endsWith(',00') ? text.slice(0, -3).replace(/^-0$/, '0') : text;
}
