"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { activateMerchantAction } from "../actions";
import { initialActionState } from "../action-state";

type ActivateMerchantFormProps = {
  merchantId: string;
  status: string;
  ready: boolean;
};

export function ActivateMerchantForm({
  merchantId,
  status,
  ready,
}: ActivateMerchantFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    activateMerchantAction.bind(null, merchantId),
    initialActionState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  if (status === "ACTIVE") {
    return (
      <div
        className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100 ring-inset"
        role="status"
      >
        <p className="text-sm font-extrabold text-emerald-800">
          Comercio activo
        </p>
        <p className="mt-1 text-sm leading-6 text-emerald-700">
          Está habilitado para aparecer públicamente y operar en Bag It.
        </p>
      </div>
    );
  }

  if (status !== "DRAFT") {
    return (
      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100 ring-inset">
        <p className="text-sm font-bold text-slate-600">
          La activación no está disponible en este estado.
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          La reactivación de comercios pausados o inactivos se gestiona por
          separado.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? (
        <p
          className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"
          role="status"
        >
          {state.success}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || !ready}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#20aee5] px-4 text-sm font-extrabold text-white shadow-[0_8px_22px_rgba(32,174,229,0.2)] transition hover:bg-[#159ed4] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
      >
        {pending ? "Activando…" : "Activar comercio"}
      </button>
      {!ready ? (
        <p className="text-center text-xs font-medium leading-5 text-slate-400">
          Completá los requisitos pendientes para habilitar esta acción.
        </p>
      ) : null}
    </form>
  );
}
