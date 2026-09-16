"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { approveMerchantApplicationAction } from "./actions";
import type { ApproveMerchantApplicationActionState } from "../action-state";

type ApplicationApproveFormProps = {
  applicationId: string;
};

const initial: ApproveMerchantApplicationActionState = {
  error: null,
  success: null,
};

export function ApplicationApproveForm({
  applicationId,
}: ApplicationApproveFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    approveMerchantApplicationAction,
    initial,
  );

  useEffect(() => {
    if (state.merchantId) {
      router.push("/admin/merchant-applications");
      router.refresh();
    }
  }, [state.merchantId, router]);

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="applicationId" value={applicationId} />

      <div className="rounded-2xl bg-sky-50/70 px-4 py-4 text-sm leading-6 text-slate-600 ring-1 ring-sky-100 ring-inset">
        Al aprobar, la cuenta registrada con el email de la solicitud quedará
        vinculada automáticamente como propietaria. La configuración del
        comercio se completa luego desde su propio panel.
      </div>

      {state.error ? (
        <p
          className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#20aee5] px-4 text-sm font-extrabold text-white shadow-[0_8px_22px_rgba(32,174,229,0.2)] transition hover:bg-[#159ed4] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Aprobando…" : "Aprobar solicitud"}
      </button>
    </form>
  );
}
