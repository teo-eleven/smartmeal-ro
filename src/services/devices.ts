import { cloudSyncService, getSupabaseClient } from './supabase';
import { localAuthSimulation } from './localAuthSimulation';
import { localDeviceSimulation } from './localDeviceSimulation';
import { secureSessionStore } from './secureSessionStore';
import { currentOs } from './platformOs';
import { describeDevice, devicePlatform, DevicePlatform } from '../utils/deviceLabel';

/**
 * The devices signed in to the account, for Cont → Dispozitive (migration 0007).
 *
 * Each install keeps a random id in the keychain and records itself, with the session it
 * holds, through register_device. Signing another device out goes through revoke_device,
 * which ends that session on the server. The device itself finds out the next time it checks
 * in: register_device refuses a session that has ended, and the app then signs it out.
 */
export interface DeviceInfo {
  deviceId: string;
  name: string;
  platform: DevicePlatform;
  lastSeenAt: string;
  isCurrent: boolean;
}

export type RegisterOutcome = 'ok' | 'revoked' | 'skipped';

const DEVICE_ID_KEY = 'smartmeal.device_id';
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
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

export async function getDeviceId(): Promise<string> {
  const stored = await secureSessionStore.getItem(DEVICE_ID_KEY);
  if (stored && UUID_V4.test(stored)) return stored;
  const created = newUuid();
  await secureSessionStore.setItem(DEVICE_ID_KEY, created);
  return created;
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
  const deviceId = await getDeviceId();
  const { name, platform } = thisDevice();

  if (localAuthSimulation.isActive()) {
    const email = await localAuthSimulation.currentEmail();
    if (!email) return 'skipped';
    await localDeviceSimulation.register(email, { deviceId, name, platform });
    return 'ok';
  }

  const client = getSupabaseClient();
  if (!client || !(await cloudSyncService.getCurrentUser())) return 'skipped';

  try {
    const { error } = await client.rpc('register_device', {
      p_device_id: deviceId,
      p_name: name,
      p_platform: platform,
    });
    if (!error) return 'ok';
    if (error.message === 'session ended') return 'revoked';
    console.warn('[SmartMeal] Dispozitivul nu a putut fi înregistrat.', error);
    return 'skipped';
  } catch (e) {
    console.warn('[SmartMeal] Dispozitivul nu a putut fi înregistrat.', e);
    return 'skipped';
  }
}

function parseRow(row: unknown, currentId: string): DeviceInfo | null {
  if (typeof row !== 'object' || row === null) return null;
  const r = row as Record<string, unknown>;
  if (typeof r.device_id !== 'string' || typeof r.device_name !== 'string') return null;
  if (typeof r.last_seen_at !== 'string' || r.revoked_at) return null;
  return {
    deviceId: r.device_id,
    name: r.device_name,
    platform: devicePlatform(typeof r.platform === 'string' ? r.platform : undefined),
    lastSeenAt: r.last_seen_at,
    isCurrent: r.device_id === currentId,
  };
}

/** This device first, then the others by when they were last used. */
function ordered(devices: DeviceInfo[]): DeviceInfo[] {
  return [...devices].sort(
    (a, b) => Number(b.isCurrent) - Number(a.isCurrent) || b.lastSeenAt.localeCompare(a.lastSeenAt)
  );
}

export async function listDevices(): Promise<{ devices: DeviceInfo[]; error: string | null }> {
  const currentId = await getDeviceId();

  if (localAuthSimulation.isActive()) {
    const email = await localAuthSimulation.currentEmail();
    const devices = email ? await localDeviceSimulation.list(email) : [];
    return {
      devices: ordered(devices.map((d) => ({ ...d, isCurrent: d.deviceId === currentId }))),
      error: null,
    };
  }

  const client = getSupabaseClient();
  if (!client) return { devices: [], error: LIST_FAILED };

  try {
    const { data, error } = await client
      .from('user_devices')
      .select('device_id, device_name, platform, last_seen_at, revoked_at')
      .is('revoked_at', null);
    if (error || !Array.isArray(data)) {
      console.warn('[SmartMeal] Dispozitivele nu au putut fi citite.', error);
      return { devices: [], error: LIST_FAILED };
    }
    const devices = data
      .map((row) => parseRow(row, currentId))
      .filter((d): d is DeviceInfo => d !== null);
    return { devices: ordered(devices), error: null };
  } catch (e) {
    console.warn('[SmartMeal] Dispozitivele nu au putut fi citite.', e);
    return { devices: [], error: LIST_FAILED };
  }
}

export async function revokeDevice(
  deviceId: string
): Promise<{ success: boolean; error: string | null }> {
  if (deviceId === (await getDeviceId())) return { success: false, error: IS_CURRENT };

  if (localAuthSimulation.isActive()) {
    const email = await localAuthSimulation.currentEmail();
    const done = email ? await localDeviceSimulation.revoke(email, deviceId) : false;
    return done ? { success: true, error: null } : { success: false, error: ALREADY_GONE };
  }

  const client = getSupabaseClient();
  if (!client) return { success: false, error: REVOKE_FAILED };

  try {
    const { error } = await client.rpc('revoke_device', { p_device_id: deviceId });
    if (!error) return { success: true, error: null };
    if (error.message === 'no such device') return { success: false, error: ALREADY_GONE };
    if (error.message === 'cannot revoke the current device')
      return { success: false, error: IS_CURRENT };
    console.warn('[SmartMeal] Dispozitivul nu a putut fi deconectat.', error);
    return { success: false, error: REVOKE_FAILED };
  } catch (e) {
    console.warn('[SmartMeal] Dispozitivul nu a putut fi deconectat.', e);
    return { success: false, error: REVOKE_FAILED };
  }
}
