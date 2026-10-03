import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DevicePlatform } from '../utils/deviceLabel';

/**
 * The device list without a server, for the same reason localAuthSimulation exists: a panel
 * nobody can see on a laptop is a panel nobody tests. Kept per account in AsyncStorage.
 *
 * The first device an account registers gets a made-up second one beside it, marked as
 * simulated, so "Deconectează" has something to act on.
 */
const DEVICES_KEY = '@smartmeal_sim_devices';
const SIMULATED_OTHER_ID = '00000000-0000-4000-8000-00000000510a';

export interface SimDevice {
  deviceId: string;
  name: string;
  platform: DevicePlatform;
  lastSeenAt: string;
}

type DevicesByAccount = Record<string, SimDevice[]>;

async function readAll(): Promise<DevicesByAccount> {
  try {
    const raw = await AsyncStorage.getItem(DEVICES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as DevicesByAccount)
      : {};
  } catch {
    return {};
  }
}

async function writeAll(all: DevicesByAccount): Promise<void> {
  await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify(all));
}

export const localDeviceSimulation = {
  async register(email: string, device: Omit<SimDevice, 'lastSeenAt'>): Promise<void> {
    const all = await readAll();
    const now = new Date().toISOString();
    const existing = all[email] ?? [];
    const others = existing.filter((d) => d.deviceId !== device.deviceId);
    const seeded =
      existing.length === 0
        ? [
            {
              deviceId: SIMULATED_OTHER_ID,
              name: 'Laptop (simulat)',
              platform: 'web' as const,
              lastSeenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ]
        : [];
    await writeAll({ ...all, [email]: [{ ...device, lastSeenAt: now }, ...others, ...seeded] });
  },

  async list(email: string): Promise<SimDevice[]> {
    return (await readAll())[email] ?? [];
  },

  /** False when there is no such device on this account. */
  async revoke(email: string, deviceId: string): Promise<boolean> {
    const all = await readAll();
    const devices = all[email] ?? [];
    if (!devices.some((d) => d.deviceId === deviceId)) return false;
    await writeAll({ ...all, [email]: devices.filter((d) => d.deviceId !== deviceId) });
    return true;
  },
};
