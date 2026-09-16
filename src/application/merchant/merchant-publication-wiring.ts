import "server-only";

import {
  publishMerchant,
  type PublishMerchantDeps,
} from "@/application/merchant/publish-merchant";
import {
  activateMerchantDraftById,
  findMerchantActivationReadiness,
} from "@/infrastructure/db/repositories/merchant-activation-repository";
import { requireMerchantRole } from "@/server/auth/authorization";

function publicationDeps(): PublishMerchantDeps {
  return {
    requireMerchantOwner: async (merchantId) => {
      await requireMerchantRole(merchantId, ["OWNER"]);
    },
    findActivationReadiness: findMerchantActivationReadiness,
    activateDraftMerchant: activateMerchantDraftById,
  };
}

export async function publishMerchantApp(merchantId: string) {
  return publishMerchant(merchantId, publicationDeps());
}
