"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { publishMerchantAction } from "./actions";
import type { MerchantOperationalActionState } from "./actions";

export type PublicationRequirement = {
  key: string;
  label: string;
  complete: boolean;
};

type Props = {
  merchantId: string;
  status: string;
  requirements: PublicationRequirement[];
};

const initialState: MerchantOperationalActionState = {
  error: null,
  success: null,
};

export function MerchantPublicationPanel({
  merchantId,
  status,
  requirements,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    publishMerchantAction.bind(null, merchantId),
    initialState,
  );
  const ready = requirements.every((requirement) => requirement.complete);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [router, state.success]);

  if (status === "ACTIVE") {
    return null;
  }

  if (status !== "DRAFT") {
    return null;
  }

  return (
    <section className="merchant-workspace-card space-y-4">
      <div>
        <p className="text-xs font-extrabold tracking-[0.12em] text-[#20aee5] uppercase">
          Prepará tu comercio
        </p>
        <h2 className="mt-1 text-xl font-extrabold text-[#083f66]">
          Completá la configuración antes de publicar
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#4A6B82]">
          Estos datos los administra tu comercio. Cuando todo esté listo, podés
          publicarlo sin intervención del administrador.
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {requirements.map((requirement) => (
          <li
            key={requirement.key}
            className="flex items-center gap-3 rounded-xl bg-[#F5F9FC] px-3.5 py-3"
          >
            <span
              className={
                requirement.complete
                  ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold text-emerald-700"
                  : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-extrabold text-slate-500"
              }
              aria-hidden="true"
            >
              {requirement.complete ? "✓" : "○"}
            </span>
            <span className="text-sm font-semibold text-[#4A6B82]">
              {requirement.label}
            </span>
          </li>
        ))}
      </ul>

      {state.error ? (
        <p
          className="merchant-workspace-alert merchant-workspace-alert--error"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p
          className="merchant-workspace-alert merchant-workspace-alert--success"
          role="status"
        >
          {state.success}
        </p>
      ) : null}

      <form action={formAction}>
        <button
          type="submit"
          disabled={pending || !ready}
          className="merchant-workspace-primary-btn"
        >
          {pending ? "Publicando…" : "Publicar comercio"}
        </button>
      </form>

      {!ready ? (
        <p className="text-xs font-medium leading-5 text-[#7890A3]">
          Completá los requisitos pendientes desde Catálogo y Configuración.
        </p>
      ) : null}
    </section>
  );
}
