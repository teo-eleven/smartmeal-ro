import { cloudSyncService, RecordedConsent } from './supabase';
import { PRIVACY_POLICY_VERSION } from '../../config/legal';
import { GroceryListItem, MealPlan, ReminderSettings, SavedPlan, UserPreferences } from '../types';

/** What the phone holds, passed in by the screen so this module never reaches into the store. */
export interface LocalData {
  preferences: UserPreferences;
  currentPlan: MealPlan | null;
  groceryItems: GroceryListItem[];
  savedPlans: SavedPlan[];
  reminders: ReminderSettings;
}

export interface AccountData {
  email: string | null;
  createdAt: string | null;
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
  /** Set when the account could not be read in full, so the file never looks complete when it is not. */
  error: string | null;
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

async function readAccount(): Promise<AccountData | null> {
  const user = await cloudSyncService.getCurrentUser();
  if (!user) return null;

  const [cloud, reminders, consent] = await Promise.all([
    cloudSyncService.loadMealPlan(user.id),
    cloudSyncService.loadReminders(user.id),
    cloudSyncService.loadConsent(user.id),
  ]);

  return {
    email: user.email ?? null,
    createdAt: user.created_at ?? null,
    consent,
    plan: cloud.plan,
    groceryItems: cloud.groceryItems,
    preferences: cloud.preferences,
    planUpdatedAt: cloud.updatedAt,
    reminders,
    error: cloud.error
      ? `Nu am putut citi planul din cont (${cloud.error}). Încearcă din nou cu internet.`
      : null,
  };
}

/** Gathers both halves. The phone's half is exported even when the account cannot be read. */
export async function collectDataExport(local: LocalData, now = new Date()): Promise<DataExport> {
  return buildDataExport({ local, account: await readAccount(), now });
}
