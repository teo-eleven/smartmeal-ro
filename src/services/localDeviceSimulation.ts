import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DevicePlatform } from '../utils/deviceLabel';

/**
 * The device list without a server, for the same reason localAuthSimulation exists: a panel
 * nobody can see on a laptop is a panel nobody tests. Kept per account in AsyncStorage.
 *
 * It follows register_device and revoke_device in migration 0007 rather than approximating
 * them: rows have the table's shape (so devices.ts validates both with one parser), a signed-
 * out device keeps its row with revoked_at set, and a device whose session was revoked is
 * refused when it checks in — 'session ended' — until it signs in again. The simulated
 * session id is localAuthSimulation.currentSessionId().
 *
 * The first device an account registers gets a made-up second one beside it, marked as
 * simulated, so "Deconectează" has something to act on.
 */
const DEVICES_KEY = '@smartmeal_sim_devices';
const SIMULATED_OTHER_ID = '00000000-0000-4000-8000-00000000510a';
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

/** A row as public.user_devices returns it. Read back through devices.ts's parser. */
export interface DeviceRow {
  device_id: string;
  device_name: string;
  platform: DevicePlatform;
  session_id: string;
  last_seen_at: string;
  revoked_at: string | null;
}

type RowsByAccount = Record<string, DeviceRow[]>;

const keyOf = (email: string) => email.trim().toLowerCase();

/** Stored JSON is not trusted: anything that is not a list of objects reads as no devices. */
async function readAll(): Promise<RowsByAccount> {
  try {
    const raw = await AsyncStorage.getItem(DEVICES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([email, rows]) => [
        email,
        Array.isArray(rows) ? rows.filter((r) => typeof r === 'object' && r !== null) : [],
      ])
    ) as RowsByAccount;
  } catch {
    return {};
  }
}

async function writeRows(email: string, rows: DeviceRow[]): Promise<void> {
  const all = await readAll();
  await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify({ ...all, [keyOf(email)]: rows }));
}

function simulatedOther(): DeviceRow {
  return {
    device_id: SIMULATED_OTHER_ID,
    device_name: 'Laptop (simulat)',
    platform: 'web',
    session_id: 'simulated-other',
    last_seen_at: new Date(Date.now() - TWO_DAYS_MS).toISOString(),
    revoked_at: null,
  };
}

export const localDeviceSimulation = {
  /** 'session ended' when this device's session was revoked from elsewhere. */
  async register(
    email: string,
    device: { deviceId: string; name: string; platform: DevicePlatform; sessionId: string }
  ): Promise<'ok' | 'session ended'> {
    const rows = await this.list(email);
    const own = rows.find((r) => r.device_id === device.deviceId);
    if (own?.revoked_at && own.session_id === device.sessionId) return 'session ended';

    const updated: DeviceRow = {
      device_id: device.deviceId,
      device_name: device.name,
      platform: device.platform,
      session_id: device.sessionId,
      last_seen_at: new Date().toISOString(),
      revoked_at: null,
    };
    const others = rows.filter((r) => r.device_id !== device.deviceId);
    await writeRows(email, [updated, ...others, ...(rows.length === 0 ? [simulatedOther()] : [])]);
    return 'ok';
  },

  async list(email: string): Promise<DeviceRow[]> {
    return (await readAll())[keyOf(email)] ?? [];
  },

  /** False when the device is not on this account or is already signed out. */
  async revoke(email: string, deviceId: string): Promise<boolean> {
    const rows = await this.list(email);
    if (!rows.some((r) => r.device_id === deviceId && !r.revoked_at)) return false;
    const now = new Date().toISOString();
    await writeRows(
      email,
      rows.map((r) => (r.device_id === deviceId ? { ...r, revoked_at: now } : r))
    );
    return true;
  },

  /** forget_this_device: "Deconectare" takes this sign-in's row off the list. */
  async forgetSession(email: string, sessionId: string): Promise<void> {
    const rows = await this.list(email);
    await writeRows(
      email,
      rows.filter((r) => r.session_id !== sessionId)
    );
  },

  /** What the server's cascade does when the account is deleted. */
  async forget(email: string): Promise<void> {
    const all = await readAll();
    const rest = Object.fromEntries(Object.entries(all).filter(([key]) => key !== keyOf(email)));
    await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify(rest));
  },
};
