"use server";

import {
  approveMerchantApplicationApp,
  rejectMerchantApplicationApp,
} from "@/application/merchant/merchant-application-wiring";
import { isAuthzError } from "@/server/auth/errors";
import type {
  ActionState,
  ApproveMerchantApplicationActionState,
} from "../action-state";

function mapAuthzFailure(error: unknown): ActionState {
  if (isAuthzError(error)) {
    if (error.code === "UNAUTHENTICATED" || error.code === "CONFIG_MISSING") {
      return {
        error: "Tenés que iniciar sesión como administrador.",
        success: null,
      };
    }
    if (error.code === "USER_SUSPENDED") {
      return { error: "Tu cuenta está suspendida.", success: null };
    }
    return {
      error: "No tenés acceso a esa sección.",
      success: null,
    };
  }
  return {
    error: "No se pudo completar la operación.",
    success: null,
  };
}

export async function approveMerchantApplicationAction(
  _prev: ApproveMerchantApplicationActionState,
  formData: FormData,
): Promise<ApproveMerchantApplicationActionState> {
  try {
    const result = await approveMerchantApplicationApp({
      applicationId: String(formData.get("applicationId") ?? ""),
    });

    if (!result.ok) {
      return { error: result.error.message, success: null };
    }

    return {
      error: null,
      success: "Solicitud aprobada.",
      merchantId: result.value.merchant.id,
    };
  } catch (error) {
    return { ...mapAuthzFailure(error) };
  }
}

export async function rejectMerchantApplicationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const result = await rejectMerchantApplicationApp({
      applicationId: String(formData.get("applicationId") ?? ""),
      rejectionReason: String(formData.get("rejectionReason") ?? ""),
    });

    if (!result.ok) {
      return { error: result.error.message, success: null };
    }

    return { error: null, success: "Solicitud rechazada." };
  } catch (error) {
    return mapAuthzFailure(error);
  }
}
