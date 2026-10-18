/**
 * What the device list in Cont calls this phone or browser, and the platform recorded with it.
 *
 * Deliberately coarse: enough for a person to tell their laptop from their phone, without a
 * device-information module or anything that identifies the hardware.
 */
export type DevicePlatform = 'ios' | 'android' | 'web';

export function devicePlatform(os: string | undefined): DevicePlatform {
  return os === 'ios' || os === 'android' ? os : 'web';
}

/** Order matters: Edge and Opera also say "Chrome", and Chrome also says "Safari". */
const BROWSERS: ReadonlyArray<[RegExp, string]> = [
  [/Edg(A|iOS)?\//, 'Edge'],
  [/OPR\//, 'Opera'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/Chrome\/|CriOS\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

/** iPhone and Android before Mac and Linux, which their user agents also mention. */
const SYSTEMS: ReadonlyArray<[RegExp, string]> = [
  [/iPhone/, 'iPhone'],
  [/iPad/, 'iPad'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/Macintosh|Mac OS X/, 'Mac'],
  [/Linux|X11/, 'Linux'],
];

function firstMatch(text: string, table: ReadonlyArray<[RegExp, string]>): string | null {
  const hit = table.find(([pattern]) => pattern.test(text));
  return hit ? hit[1] : null;
}

export function describeDevice(os: string | undefined, userAgent?: string): string {
  if (os === 'ios') return 'iPhone';
  if (os === 'android') return 'Telefon Android';

  const browser = userAgent ? firstMatch(userAgent, BROWSERS) : null;
  if (!browser) return 'Browser';
  const system = firstMatch(userAgent ?? '', SYSTEMS);
  return system ? `${browser} pe ${system}` : browser;
}

const HOUR_MS = 60 * 60 * 1000;

function startOfDay(time: number): number {
  const day = new Date(time);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
}

/** "Ultima activitate" in the device list: chiar acum, azi, ieri, or the date. */
export function describeLastSeen(iso: string, now: number = Date.now()): string {
  const seen = Date.parse(iso);
  if (Number.isNaN(seen)) return 'necunoscut';
  if (now - seen < HOUR_MS) return 'chiar acum';
  const today = startOfDay(now);
  if (seen >= today) return 'azi';
  if (seen >= startOfDay(today - 1)) return 'ieri';
  const date = new Date(seen);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}
