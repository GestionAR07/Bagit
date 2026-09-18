"use server";

import { submitMerchantApplicationApp } from "@/application/merchant/merchant-application-wiring";
import { requireActiveUser } from "@/server/auth/authorization";
import { isAuthzError } from "@/server/auth/errors";
import type { SubmitMerchantApplicationActionState } from "./action-state";

function mapDuplicateMessage(): SubmitMerchantApplicationActionState {
  return {
    error: "Ya recibimos una solicitud pendiente para ese comercio y email.",
    success: false,
  };
}

export async function submitMerchantApplicationAction(
  _prev: SubmitMerchantApplicationActionState,
  formData: FormData,
): Promise<SubmitMerchantApplicationActionState> {
  const website = String(formData.get("website") ?? "").trim();
  if (website !== "") {
    return { error: null, success: true };
  }

  let applicantUserId: string;
  try {
    const context = await requireActiveUser();
    applicantUserId = context.user.id;
  } catch (error) {
    if (isAuthzError(error)) {
      return {
        error: "Tenés que iniciar sesión para enviar la solicitud.",
        success: false,
      };
    }
    throw error;
  }

  const result = await submitMerchantApplicationApp({
    applicantUserId,
    businessName: String(formData.get("businessName") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    contactPhone: String(formData.get("contactPhone") ?? ""),
    cityId: String(formData.get("cityId") ?? ""),
    zoneId: String(formData.get("zoneId") ?? ""),
    description: String(formData.get("description") ?? ""),
    message: String(formData.get("message") ?? ""),
  });

  if (!result.ok) {
    if (result.error.code === "PENDING_DUPLICATE") {
      return mapDuplicateMessage();
    }
    return { error: result.error.message, success: false };
  }

  return { error: null, success: true };
}
