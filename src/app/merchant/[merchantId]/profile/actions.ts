"use server";

import { revalidatePath } from "next/cache";
import {
  deleteMerchantCoverApp,
  upsertMerchantCoverApp,
} from "@/application/merchant/cover-image-wiring";
import { assertOpeningInterval, isWeekday } from "@/domain/merchant/hours";
import { DomainError } from "@/domain/shared/errors";
import { replaceMerchantOpeningIntervals } from "@/infrastructure/db/repositories/storefront-repository";
import { validateMerchantCoverFile } from "@/lib/merchant-cover-image";
import { requireMerchantRole } from "@/server/auth/authorization";
import { isAuthzError } from "@/server/auth/errors";
import type {
  MerchantCoverActionState,
  MerchantHoursActionState,
  MerchantHoursDayInput,
} from "./action-state";

const HOURS_ALLOWED_ROLES = ["OWNER", "STAFF"] as const;
const MAX_INTERVALS_PER_DAY = 3;

function mapAuthzFailure(error: unknown): MerchantCoverActionState {
  if (isAuthzError(error)) {
    if (error.code === "UNAUTHENTICATED" || error.code === "CONFIG_MISSING") {
      return {
        error: "Tenés que iniciar sesión.",
        success: null,
      };
    }
    if (error.code === "USER_SUSPENDED") {
      return { error: "Tu cuenta está suspendida.", success: null };
    }
    return {
      error: "No tenés acceso a este comercio.",
      success: null,
    };
  }
  return {
    error: "No se pudo completar la operación.",
    success: null,
  };
}

function revalidateCover(merchantId: string): void {
  revalidatePath(`/merchant/${merchantId}/profile`);
  revalidatePath("/");
}

function revalidateHours(merchantId: string): void {
  revalidatePath(`/merchant/${merchantId}/profile`);
  revalidatePath(`/comercios/${merchantId}`);
  revalidatePath("/");
  revalidatePath("/checkout");
}

function parseClockToMinute(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "24:00") {
    return 24 * 60;
  }
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

function intervalsOverlap(
  left: { openMinute: number; closeMinute: number },
  right: { openMinute: number; closeMinute: number },
): boolean {
  return (
    left.openMinute < right.closeMinute && right.openMinute < left.closeMinute
  );
}

function buildOpeningRows(schedule: MerchantHoursDayInput[]):
  | {
      ok: true;
      rows: Array<{ weekday: number; openMinute: number; closeMinute: number }>;
    }
  | { ok: false; error: string } {
  if (!Array.isArray(schedule) || schedule.length !== 7) {
    return { ok: false, error: "La grilla de horarios es inválida." };
  }

  const seenWeekdays = new Set<number>();
  const rows: Array<{
    weekday: number;
    openMinute: number;
    closeMinute: number;
  }> = [];

  for (const day of schedule) {
    if (!day || typeof day !== "object") {
      return { ok: false, error: "La grilla de horarios es inválida." };
    }
    if (!isWeekday(day.weekday) || seenWeekdays.has(day.weekday)) {
      return { ok: false, error: "Hay un día de la semana inválido." };
    }
    seenWeekdays.add(day.weekday);

    if (!day.enabled) {
      continue;
    }

    if (!Array.isArray(day.intervals) || day.intervals.length === 0) {
      return {
        ok: false,
        error: "Cada día activo necesita al menos una franja horaria.",
      };
    }
    if (day.intervals.length > MAX_INTERVALS_PER_DAY) {
      return {
        ok: false,
        error: `Podés configurar hasta ${MAX_INTERVALS_PER_DAY} turnos por día.`,
      };
    }

    const dayRows: Array<{ openMinute: number; closeMinute: number }> = [];
    for (const interval of day.intervals) {
      const openMinute = parseClockToMinute(String(interval?.openTime ?? ""));
      const closeMinute = parseClockToMinute(String(interval?.closeTime ?? ""));
      if (openMinute === null || closeMinute === null) {
        return {
          ok: false,
          error: "Usá horarios en formato HH:mm (ej. 09:00).",
        };
      }
      if (openMinute === 24 * 60) {
        return {
          ok: false,
          error: "La hora de apertura no puede ser 24:00.",
        };
      }

      try {
        assertOpeningInterval({
          weekday: day.weekday,
          openMinute,
          closeMinute,
        });
      } catch (error) {
        if (error instanceof DomainError) {
          return {
            ok: false,
            error:
              "Revisá que cada franja tenga cierre posterior a la apertura.",
          };
        }
        throw error;
      }

      for (const existing of dayRows) {
        if (intervalsOverlap(existing, { openMinute, closeMinute })) {
          return {
            ok: false,
            error: "Las franjas del mismo día no pueden solaparse.",
          };
        }
      }
      dayRows.push({ openMinute, closeMinute });
      rows.push({ weekday: day.weekday, openMinute, closeMinute });
    }
  }

  if (seenWeekdays.size !== 7) {
    return { ok: false, error: "La grilla de horarios es inválida." };
  }

  return { ok: true, rows };
}

export async function upsertMerchantCoverAction(
  merchantId: string,
  formData: FormData,
): Promise<MerchantCoverActionState> {
  try {
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return {
        error: "Seleccioná un archivo de imagen.",
        success: null,
      };
    }

    const earlyValidation = validateMerchantCoverFile({
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (earlyValidation) {
      return { error: earlyValidation.message, success: null };
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await upsertMerchantCoverApp(merchantId, {
      mimeType: file.type,
      sizeBytes: file.size,
      bytes,
    });

    if (!result.ok) {
      return { error: result.error.message, success: null };
    }

    revalidateCover(merchantId);
    return { error: null, success: "Portada guardada." };
  } catch (error) {
    return mapAuthzFailure(error);
  }
}

export async function deleteMerchantCoverAction(
  merchantId: string,
): Promise<MerchantCoverActionState> {
  try {
    const result = await deleteMerchantCoverApp(merchantId);
    if (!result.ok) {
      return { error: result.error.message, success: null };
    }

    revalidateCover(merchantId);
    return { error: null, success: "Portada eliminada." };
  } catch (error) {
    return mapAuthzFailure(error);
  }
}

export async function saveMerchantHoursAction(
  merchantId: string,
  schedule: MerchantHoursDayInput[],
): Promise<MerchantHoursActionState> {
  try {
    await requireMerchantRole(merchantId, HOURS_ALLOWED_ROLES);

    const built = buildOpeningRows(schedule);
    if (!built.ok) {
      return { error: built.error, success: null };
    }

    await replaceMerchantOpeningIntervals(merchantId, built.rows);
    revalidateHours(merchantId);
    return { error: null, success: "Horarios guardados." };
  } catch (error) {
    return mapAuthzFailure(error);
  }
}
