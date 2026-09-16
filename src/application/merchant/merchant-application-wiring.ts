import "server-only";

import {
  approveMerchantApplication,
  rejectMerchantApplication,
  submitMerchantApplication,
  type ApproveMerchantApplicationDeps,
  type ApproveMerchantApplicationInput,
  type RejectMerchantApplicationDeps,
  type RejectMerchantApplicationInput,
  type SubmitMerchantApplicationDeps,
  type SubmitMerchantApplicationInput,
} from "@/application/merchant/merchant-applications";
import { getDb, type Db } from "@/infrastructure/db/client";
import {
  countPendingMerchantApplicationsByEmail,
  findMerchantApplicationById,
  findPendingDuplicate,
  insertMerchantApplication,
  markApproved,
  markRejected,
} from "@/infrastructure/db/repositories/merchant-application-repository";
import {
  findMerchantBySlug,
  insertMerchantDraft,
} from "@/infrastructure/db/repositories/merchant-repository";
import {
  ensureUserProfile,
  insertMerchantOwner,
} from "@/infrastructure/db/repositories/merchant-user-repository";
import {
  findCityById,
  findZoneById,
} from "@/infrastructure/db/repositories/geography-repository";
import { isUniqueViolation } from "@/infrastructure/db/pg-errors";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { findAuthUserByEmail } from "@/infrastructure/supabase/auth-admin";
import { hasSupabaseSecretKey } from "@/infrastructure/supabase/env";
import { requirePlatformAdmin } from "@/server/auth/authorization";

type MerchantApplicationDbTx = Parameters<Parameters<Db["transaction"]>[0]>[0];

function submitDeps(): SubmitMerchantApplicationDeps {
  return {
    findCityById,
    findZoneById,
    findPendingDuplicate,
    countPendingMerchantApplicationsByEmail,
    insertMerchantApplication,
  };
}

function approveDeps(): ApproveMerchantApplicationDeps {
  return {
    requirePlatformAdmin,
    findMerchantBySlug,
    runTransaction: <T>(fn: (tx: MerchantApplicationDbTx) => Promise<T>) =>
      getDb().transaction(fn),
    findMerchantApplicationById,
    insertMerchantDraft,
    markApproved,
    findRegisteredUserByEmail: async (email) => {
      if (!hasSupabaseSecretKey()) {
        throw new Error(
          "SUPABASE_SECRET_KEY is required to verify the merchant applicant before approval",
        );
      }
      const admin = createSupabaseAdminClient();
      return findAuthUserByEmail(admin, email);
    },
    ensureUserProfile,
    insertOwnerMembership: async (input, tx) => {
      await insertMerchantOwner(input, tx);
    },
    isUniqueViolation,
  };
}

function rejectDeps(): RejectMerchantApplicationDeps {
  return {
    requirePlatformAdmin,
    markRejected,
  };
}

export async function submitMerchantApplicationApp(
  input: SubmitMerchantApplicationInput,
) {
  return submitMerchantApplication(input, submitDeps());
}

export async function approveMerchantApplicationApp(
  input: ApproveMerchantApplicationInput,
) {
  return approveMerchantApplication(input, approveDeps());
}

export async function rejectMerchantApplicationApp(
  input: RejectMerchantApplicationInput,
) {
  return rejectMerchantApplication(input, rejectDeps());
}
