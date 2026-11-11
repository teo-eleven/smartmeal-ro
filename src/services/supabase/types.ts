import { User } from '@supabase/supabase-js';
import { GroceryListItem, MealPlan, UserPreferences } from '../../types';

export interface VerifiedUser {
  user: User | null;
  reason: 'ok' | 'offline' | 'signed_out';
}

export interface SavePlanRequest {
  plan: MealPlan | null;
  groceryItems: GroceryListItem[];
  preferences?: UserPreferences;
  /** The cloud's updated_at this device last saw; null if it never saw one. */
  expectedUpdatedAt: string | null;
}

export interface SavePlanResult {
  status: 'saved' | 'conflict' | 'error';
  /** The cloud's version after the call: the new one when saved, the newer one on conflict. */
  updatedAt: string | null;
  error: string | null;
}

export interface SignUpResult {
  user: User | null;
  error: string | null;
  /** Set on success: true when the address must be confirmed before anyone can sign in. */
  needsConfirmation?: boolean;
}

/** A row of user_consents, as written by the sign-up trigger in migration 0005. */
export interface RecordedConsent {
  age_confirmed_16: boolean;
  health_data_consent: boolean;
  privacy_policy_version: string | null;
  consented_at: string | null;
}

/** What a cloud row turns into once it has been checked rather than merely cast. */
export interface CloudPlanResult {
  plan: MealPlan | null;
  groceryItems: GroceryListItem[];
  preferences: UserPreferences | null;
  /** When the other device last wrote this row, shown to the user so they can judge it. */
  updatedAt: string | null;
  error: string | null;
}
