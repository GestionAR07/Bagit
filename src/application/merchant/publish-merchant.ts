import { err, ok, type Result } from "@/domain/shared/result";
import {
  getMerchantActivationBlockers,
  MERCHANT_ACTIVATION_BLOCKER_LABELS,
  type MerchantActivationBlocker,
  type MerchantActivationReadiness,
} from "./activate-merchant";

export type PublishMerchantError = {
  code: string;
  message: string;
  blockers?: MerchantActivationBlocker[];
};

export type PublishMerchantDeps = {
  requireMerchantOwner: (merchantId: string) => Promise<void>;
  findActivationReadiness: (
    merchantId: string,
  ) => Promise<MerchantActivationReadiness | null>;
  activateDraftMerchant: (
    merchantId: string,
  ) => Promise<{ id: string; status: string } | null>;
};

export async function publishMerchant(
  merchantIdInput: string,
  deps: PublishMerchantDeps,
): Promise<
  Result<
    { merchantId: string; status: "ACTIVE"; alreadyActive: boolean },
    PublishMerchantError
  >
> {
  const merchantId = merchantIdInput.trim();
  if (!merchantId) {
    return err({
      code: "INVALID_MERCHANT",
      message: "El comercio no es válido.",
    });
  }

  await deps.requireMerchantOwner(merchantId);

  const readiness = await deps.findActivationReadiness(merchantId);
  if (!readiness) {
    return err({
      code: "MERCHANT_NOT_FOUND",
      message: "El comercio no existe.",
    });
  }

  if (readiness.status === "ACTIVE") {
    return ok({ merchantId, status: "ACTIVE", alreadyActive: true });
  }

  if (readiness.status !== "DRAFT") {
    return err({
      code: "INVALID_STATUS",
      message:
        "Este comercio no puede publicarse desde su estado actual. La reactivación de comercios suspendidos se gestiona por separado.",
    });
  }

  const blockers = getMerchantActivationBlockers(readiness);
  if (blockers.length > 0) {
    return err({
      code: "MERCHANT_NOT_READY",
      message: `Antes de publicar tu comercio: ${blockers
        .map((blocker) => MERCHANT_ACTIVATION_BLOCKER_LABELS[blocker])
        .join(" ")}`,
      blockers,
    });
  }

  const activated = await deps.activateDraftMerchant(merchantId);
  if (!activated || activated.status !== "ACTIVE") {
    return err({
      code: "PUBLICATION_FAILED",
      message:
        "No pudimos publicar el comercio. Actualizá la página y volvé a intentarlo.",
    });
  }

  return ok({ merchantId, status: "ACTIVE", alreadyActive: false });
}
