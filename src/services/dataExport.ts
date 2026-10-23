import { cloudSyncService, RecordedConsent } from './supabase';
import { getDisplayName } from './profile';
import { DeviceInfo, listDevices } from './devices';
import { recipeNotesCloud } from './recipeNotesCloud';
import { PRIVACY_POLICY_VERSION } from '../../config/legal';
import { GroceryListItem, MealPlan, ReminderSettings, SavedPlan, UserPreferences } from '../types';

/** What the phone holds, passed in by the screen so this module never reaches into the store. */
export interface LocalData {
  preferences: UserPreferences;
  currentPlan: MealPlan | null;
  groceryItems: GroceryListItem[];
  savedPlans: SavedPlan[];
  reminders: ReminderSettings;
  /** Personal notes per recipe id, kept on the phone. */
  recipeNotes: Readonly<Record<string, string>>;
}

export interface AccountData {
  email: string | null;
  createdAt: string | null;
  displayName: string | null;
  /** The phones and browsers signed in to the account; null if they could not be read. */
  devices: DeviceInfo[] | null;
  /** Recipe notes kept in the account (migration 0010); null if they could not be read. */
  recipeNotes: Readonly<Record<string, string>> | null;
  /**
   * From user_consents, which only the sign-up trigger writes. Never from user_metadata: its
   * owner can rewrite that at any time, so it would prove nothing. Null when no record exists.
   */
  consent: RecordedConsent | null;
  plan: MealPlan | null;
  groceryItems: GroceryListItem[];
  preferences: UserPreferences | null;
  planUpdatedAt: string | null;
  reminders: ReminderSettings | null;
  /**
   * One line per section that could not be read, so the file never looks complete when it
   * is not. Empty when everything was read.
   */
  errors: string[];
}

export interface DataExport {
  format: 'smartmeal-ro-export';
  exportedAt: string;
  privacyPolicyVersion: string;
  notes: string[];
  /** What we hold. Null without an account: then we hold nothing. */
  inYourAccount: AccountData | null;
  /** What exists only on this phone and has never been sent to us. */
  onThisPhone: LocalData;
}

const NOTES = [
  '„inYourAccount" este ce păstrăm noi pe server pentru contul tău.',
  '„onThisPhone" există doar pe acest telefon și nu a ajuns niciodată la noi.',
  'Pe server mai ținem, pentru limita de cereri AI, doar un contor de cereri și începutul intervalului curent.',
];

export function buildDataExport(args: {
  local: LocalData;
  account: AccountData | null;
  now: Date;
}): DataExport {
  return {
    format: 'smartmeal-ro-export',
    exportedAt: args.now.toISOString(),
    privacyPolicyVersion: PRIVACY_POLICY_VERSION,
    notes: NOTES,
    inYourAccount: args.account,
    onThisPhone: args.local,
  };
}

const RETRY = 'Încearcă din nou cu internet.';

/** The value of a settled read, or null with a line in `errors` naming the section. */
function settledOrNull<T>(
  result: PromiseSettledResult<T>,
  section: string,
  errors: string[]
): T | null {
  if (result.status === 'fulfilled') return result.value;
  errors.push(`Nu am putut citi ${section}. ${RETRY}`);
  return null;
}

/**
 * Each section is read on its own (F10): one that fails is named in `errors`, and the rest
 * is still exported, instead of one failure emptying or silently thinning the file.
 */
async function readAccount(): Promise<AccountData | null> {
  const user = await cloudSyncService.getCurrentUser();
  if (!user) return null;

  const [cloud, reminders, consent, displayName, devices, notes] = await Promise.allSettled([
    cloudSyncService.loadMealPlan(user.id),
    cloudSyncService.loadReminders(user.id),
    cloudSyncService.loadConsent(user.id),
    getDisplayName(),
    listDevices(),
    recipeNotesCloud.load(),
  ]);

  const errors: string[] = [];
  const plan = settledOrNull(cloud, 'planul din cont', errors);
  if (plan?.error) errors.push(`Nu am putut citi planul din cont (${plan.error}). ${RETRY}`);
  const reminderRow = settledOrNull(reminders, 'mementourile', errors);
  const consentRow = settledOrNull(consent, 'acordul dat la înregistrare', errors);
  const name = settledOrNull(displayName, 'numele din profil', errors);
  const deviceList = settledOrNull(devices, 'dispozitivele', errors);
  if (deviceList?.error) errors.push(`Nu am putut citi dispozitivele. ${RETRY}`);
  const noteList = settledOrNull(notes, 'notițele la rețete', errors);
  if (noteList?.error) errors.push(`Nu am putut citi notițele la rețete. ${RETRY}`);

  return {
    email: user.email ?? null,
    createdAt: user.created_at ?? null,
    displayName: name,
    devices: deviceList && !deviceList.error ? deviceList.devices : null,
    recipeNotes: noteList && !noteList.error ? noteList.notes : null,
    consent: consentRow,
    plan: plan?.plan ?? null,
    groceryItems: plan?.groceryItems ?? [],
    preferences: plan?.preferences ?? null,
    planUpdatedAt: plan?.updatedAt ?? null,
    reminders: reminderRow,
    errors,
  };
}

/** Gathers both halves. The phone's half is exported even when the account cannot be read. */
export async function collectDataExport(local: LocalData, now = new Date()): Promise<DataExport> {
  return buildDataExport({ local, account: await readAccount(), now });
}
