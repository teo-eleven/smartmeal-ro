import { accountMethods } from './supabase/account';
import { cloudDataMethods } from './supabase/cloudData';
import { sessionMethods } from './supabase/session';

export { getSupabaseClient } from './supabase/client';
export type {
  CloudPlanResult,
  RecordedConsent,
  SavePlanRequest,
  SavePlanResult,
  SignUpResult,
  VerifiedUser,
} from './supabase/types';

export const cloudSyncService = {
  ...sessionMethods,
  ...accountMethods,
  ...cloudDataMethods,
};
