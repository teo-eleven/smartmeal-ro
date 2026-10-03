import { localAuthSimulation } from './localAuthSimulation';
import { localDeviceSimulation } from './localDeviceSimulation';
import { secureSessionStore } from './secureSessionStore';
import { currentOs } from './platformOs';
import { signedInContext } from './authContext';
import { warnSafely } from './authErrors';
import { describeDevice, devicePlatform, DevicePlatform } from '../utils/deviceLabel';
import { cleanVisibleText, cutToCharacters } from '../utils/displayName';

/**
 * The devices signed in to the account, for Cont → Dispozitive (migration 0007).
 *
 * Each install keeps a random id in the keychain and records itself, with the session it
 * holds, through register_device. Signing another device out goes through revoke_device,
 * which ends that session on the server. The device itself finds out the next time it checks
 * in: register_device refuses a session that has ended (SM001), and the app then signs out.
 * The local simulation follows the same rules; see localDeviceSimulation.
 */
export interface DeviceInfo {
  deviceId: string;
  name: string;
  platform: DevicePlatform;
  lastSeenAt: string;
  isCurrent: boolean;
}

export type RegisterOutcome = 'ok' | 'revoked' | 'skipped';

/** The SQLSTATEs migration 0007 raises; matched by code, never by wording. */
export const DEVICE_ERRORS = {
  sessionEnded: 'SM001',
  noSuchDevice: 'SM002',
  isCurrentDevice: 'SM003',
} as const;

const DEVICE_ID_KEY = 'smartmeal.device_id';
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const NAME_MAX = 60;
const LIST_FAILED = 'Nu am putut încărca dispozitivele. Încearcă din nou.';
const REVOKE_FAILED = 'Nu am putut deconecta dispozitivul. Încearcă din nou.';
const IS_CURRENT = 'Pentru dispozitivul ăsta folosește „Deconectare”.';
const ALREADY_GONE = 'Dispozitivul a fost deja deconectat.';

/** An identifier, not a secret: Math.random is enough where the platform has no crypto. */
function newUuid(): string {
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Shared while in flight: at first start the device is registered and listed at once, and
 * two callers each finding no id would each make one, leaving one of them with an id that
 * was never saved.
 */
let deviceIdInFlight: Promise<string> | null = null;

async function loadOrCreateDeviceId(): Promise<string> {
  const stored = await secureSessionStore.getItem(DEVICE_ID_KEY);
  if (stored && UUID_V4.test(stored)) return stored;
  const created = newUuid();
  await secureSessionStore.setItem(DEVICE_ID_KEY, created);
  return created;
}

export function getDeviceId(): Promise<string> {
  if (!deviceIdInFlight) {
    deviceIdInFlight = loadOrCreateDeviceId().finally(() => {
      deviceIdInFlight = null;
    });
  }
  return deviceIdInFlight;
}

function thisDevice(): { name: string; platform: DevicePlatform } {
  const os = currentOs();
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
  return { name: describeDevice(os, userAgent), platform: devicePlatform(os) };
}

/**
 * Records this device and refreshes its "last seen". 'revoked' means the account signed it
 * out from elsewhere and the caller must sign out here too; any other failure is 'skipped',
 * because a device list that could not be updated is no reason to stop somebody cooking.
 */
export async function registerThisDevice(): Promise<RegisterOutcome> {
  try {
    const context = await signedInContext();
    if (!context) return 'skipped';
    const deviceId = await getDeviceId();
    const { name, platform } = thisDevice();

    if (context.kind === 'simulation') {
      const sessionId = (await localAuthSimulation.currentSessionId()) ?? '';
      const outcome = await localDeviceSimulation.register(context.email, {
        deviceId,
        name,
        platform,
        sessionId,
      });
      return outcome === 'ok' ? 'ok' : 'revoked';
    }

    const { error } = await context.client.rpc('register_device', {
      p_device_id: deviceId,
      p_name: name,
      p_platform: platform,
    });
    if (!error) return 'ok';
    if (error.code === DEVICE_ERRORS.sessionEnded) return 'revoked';
    warnSafely('Dispozitivul nu a putut fi înregistrat.', error);
    return 'skipped';
  } catch (e) {
    warnSafely('Dispozitivul nu a putut fi înregistrat.', e);
    return 'skipped';
  }
}

/** One parser for the server's rows and the simulation's, which share the table's shape. */
export function parseDeviceRow(row: unknown, currentId: string): DeviceInfo | null {
  if (typeof row !== 'object' || row === null) return null;
  const r = row as Record<string, unknown>;
  if (typeof r.device_id !== 'string' || typeof r.device_name !== 'string') return null;
  if (typeof r.last_seen_at !== 'string' || Number.isNaN(Date.parse(r.last_seen_at))) return null;
  if (r.revoked_at) return null;
  // Written by whichever device holds a session, so it is cleaned like a typed name: a
  // direction override or an invisible character could make one device pass for another.
  const name = cutToCharacters(cleanVisibleText(r.device_name), NAME_MAX);
  return {
    deviceId: r.device_id,
    name: name || 'Dispozitiv',
    platform: devicePlatform(typeof r.platform === 'string' ? r.platform : undefined),
    lastSeenAt: r.last_seen_at,
    isCurrent: r.device_id === currentId,
  };
}

/**
 * This device first, then the others by when they were last used. By time, not by text:
 * PostgREST writes timestamps with varying fractions and offsets, which do not sort as text.
 */
function ordered(devices: DeviceInfo[]): DeviceInfo[] {
  return [...devices].sort(
    (a, b) =>
      Number(b.isCurrent) - Number(a.isCurrent) ||
      Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt)
  );
}

async function fetchRows(): Promise<unknown[] | null> {
  const context = await signedInContext();
  if (!context) return [];
  if (context.kind === 'simulation') return localDeviceSimulation.list(context.email);

  const { data, error } = await context.client
    .from('user_devices')
    .select('device_id, device_name, platform, last_seen_at, revoked_at')
    .is('revoked_at', null);
  if (error || !Array.isArray(data)) {
    warnSafely('Dispozitivele nu au putut fi citite.', error);
    return null;
  }
  return data;
}

export async function listDevices(): Promise<{ devices: DeviceInfo[]; error: string | null }> {
  try {
    const [rows, currentId] = await Promise.all([fetchRows(), getDeviceId()]);
    if (!rows) return { devices: [], error: LIST_FAILED };
    const devices = rows
      .map((row) => parseDeviceRow(row, currentId))
      .filter((d): d is DeviceInfo => d !== null);
    return { devices: ordered(devices), error: null };
  } catch (e) {
    warnSafely('Dispozitivele nu au putut fi citite.', e);
    return { devices: [], error: LIST_FAILED };
  }
}

export async function revokeDevice(
  deviceId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (deviceId === (await getDeviceId())) return { success: false, error: IS_CURRENT };
    const context = await signedInContext();
    if (!context) return { success: false, error: REVOKE_FAILED };

    if (context.kind === 'simulation') {
      const done = await localDeviceSimulation.revoke(context.email, deviceId);
      return done ? { success: true, error: null } : { success: false, error: ALREADY_GONE };
    }

    const { error } = await context.client.rpc('revoke_device', { p_device_id: deviceId });
    if (!error) return { success: true, error: null };
    if (error.code === DEVICE_ERRORS.noSuchDevice) return { success: false, error: ALREADY_GONE };
    if (error.code === DEVICE_ERRORS.isCurrentDevice) return { success: false, error: IS_CURRENT };
    warnSafely('Dispozitivul nu a putut fi deconectat.', error);
    return { success: false, error: REVOKE_FAILED };
  } catch (e) {
    warnSafely('Dispozitivul nu a putut fi deconectat.', e);
    return { success: false, error: REVOKE_FAILED };
  }
}
