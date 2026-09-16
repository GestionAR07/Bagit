import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMerchantActivationBlockers,
  MERCHANT_ACTIVATION_BLOCKER_LABELS,
} from "@/application/merchant/activate-merchant";
import { findMerchantActivationReadiness } from "@/infrastructure/db/repositories/merchant-activation-repository";
import {
  findMerchantDetailById,
  listMerchantMembers,
} from "@/infrastructure/db/repositories/merchant-repository";
import { loadAdminContext } from "../../_lib/load-admin";
import { ActivateMerchantForm } from "../activate-merchant-form";
import { InviteOwnerForm } from "../invite-owner-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ merchantId: string }>;
};

function merchantStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Activo";
    case "DRAFT":
      return "Borrador";
    case "PAUSED":
      return "Pausado";
    case "INACTIVE":
      return "Inactivo";
    default:
      return status;
  }
}

function merchantStatusClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "DRAFT":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "PAUSED":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function Requirement({
  complete,
  children,
}: {
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
          complete
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-200 text-slate-500"
        }`}
        aria-hidden="true"
      >
        {complete ? "✓" : "○"}
      </span>
      <span className="text-sm font-semibold text-slate-600">{children}</span>
    </li>
  );
}

export default async function AdminMerchantDetailPage({ params }: PageProps) {
  const { merchantId } = await params;
  await loadAdminContext(`/admin/merchants/${merchantId}`);

  const merchant = await findMerchantDetailById(merchantId);
  if (!merchant) {
    notFound();
  }

  const [members, readiness] = await Promise.all([
    listMerchantMembers(merchantId),
    findMerchantActivationReadiness(merchantId),
  ]);
  const blockers = readiness ? getMerchantActivationBlockers(readiness) : [];
  const activationReady = Boolean(
    readiness && merchant.status === "DRAFT" && blockers.length === 0,
  );
  const hasOwner = members.some((member) => member.role === "OWNER");
  const cityDiffersFromZone =
    merchant.cityName.trim().toLocaleLowerCase("es-AR") !==
    merchant.zoneName.trim().toLocaleLowerCase("es-AR");

  return (
    <main className="mx-auto w-full max-w-[94rem] space-y-6">
      <header>
        <Link
          href="/admin/merchants"
          className="inline-flex items-center gap-1 text-sm font-bold text-[#1498cf] transition hover:text-[#083f66]"
        >
          ← Volver a comercios
        </Link>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-extrabold tracking-[0.14em] text-[#20aee5] uppercase">
              Gestión del comercio
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#083f66]">
                {merchant.name}
              </h1>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset ${merchantStatusClass(merchant.status)}`}
              >
                {merchantStatusLabel(merchant.status)}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Revisá la configuración, responsables y preparación para operar en
              Bag It.
            </p>
          </div>
        </div>
      </header>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <div className="grid gap-5">
          <article className="rounded-2xl border border-sky-100/80 bg-white shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h2 className="text-lg font-extrabold text-[#083f66]">
                Información general
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Datos principales y modalidades operativas del comercio.
              </p>
            </div>
            <dl className="grid gap-x-6 gap-y-5 px-5 py-5 text-sm sm:grid-cols-2 sm:px-6">
              <div>
                <dt className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Ubicación
                </dt>
                <dd className="mt-1 font-bold text-[#083f66]">
                  {merchant.zoneName}
                </dd>
                {cityDiffersFromZone ? (
                  <dd className="text-xs text-slate-400">
                    {merchant.cityName}
                  </dd>
                ) : null}
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Identificador
                </dt>
                <dd className="mt-1 font-semibold text-slate-600">
                  {merchant.slug}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Preparación estimada
                </dt>
                <dd className="mt-1 font-semibold text-slate-600">
                  {merchant.preparationMinutes} minutos
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Responsables vinculados
                </dt>
                <dd className="mt-1 font-semibold text-slate-600">
                  {members.length}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Modalidades
                </dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`rounded-xl px-3 py-2 text-xs font-bold ring-1 ring-inset ${
                      merchant.pickupEnabled
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                        : "bg-slate-100 text-slate-400 ring-slate-200"
                    }`}
                  >
                    Retiro{" "}
                    {merchant.pickupEnabled ? "habilitado" : "deshabilitado"}
                  </span>
                  <span
                    className={`rounded-xl px-3 py-2 text-xs font-bold ring-1 ring-inset ${
                      merchant.merchantDeliveryEnabled
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                        : "bg-slate-100 text-slate-400 ring-slate-200"
                    }`}
                  >
                    Delivery propio{" "}
                    {merchant.merchantDeliveryEnabled
                      ? "habilitado"
                      : "deshabilitado"}
                  </span>
                  <span
                    className={`rounded-xl px-3 py-2 text-xs font-bold ring-1 ring-inset ${
                      merchant.platformDeliveryEnabled
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                        : "bg-slate-100 text-slate-400 ring-slate-200"
                    }`}
                  >
                    Delivery Bag It{" "}
                    {merchant.platformDeliveryEnabled
                      ? "habilitado"
                      : "deshabilitado"}
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Descripción
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {merchant.description || "Sin descripción cargada."}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-sky-100/80 bg-white shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h2 className="text-lg font-extrabold text-[#083f66]">
                Responsables del comercio
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Personas con acceso para administrar la operación del comercio.
              </p>
            </div>

            <div className="px-5 py-5 sm:px-6">
              {members.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 px-4 py-6 text-center">
                  <p className="font-bold text-[#083f66]">
                    Todavía no hay responsables vinculados
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Invitá al propietario para completar el onboarding.
                  </p>
                </div>
              ) : (
                <div className="mb-5 grid gap-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#083f66]">
                          {member.displayName ?? member.userId}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-400">
                          {member.role === "OWNER" ? "Propietario" : "Staff"}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          member.active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {member.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {hasOwner ? (
                <div className="border-t border-slate-100 pt-5">
                  <div className="rounded-2xl bg-emerald-50 px-4 py-4 ring-1 ring-emerald-100 ring-inset">
                    <p className="font-extrabold text-emerald-800">
                      Propietario vinculado
                    </p>
                    <p className="mt-1 text-sm leading-6 text-emerald-700">
                      El comercio ya tiene una cuenta propietaria activa. No
                      hace falta enviar una invitación para completar el
                      onboarding.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="font-extrabold text-[#083f66]">
                    Invitar propietario
                  </h3>
                  <p className="mt-1 mb-4 text-sm text-slate-500">
                    Enviaremos una invitación para vincular una cuenta como
                    propietaria del comercio.
                  </p>
                  <InviteOwnerForm merchantId={merchant.id} />
                </div>
              )}
            </div>
          </article>
        </div>

        <article className="self-start rounded-2xl border border-sky-100/80 bg-white shadow-[0_8px_30px_rgba(8,63,102,0.05)] xl:sticky xl:top-6">
          <div className="border-b border-slate-100 px-5 py-5">
            <h2 className="text-lg font-extrabold text-[#083f66]">
              Preparación para operar
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Verificá que el comercio tenga lo necesario antes de publicarlo.
            </p>
          </div>

          <div className="space-y-4 px-5 py-5">
            {readiness ? (
              <ul className="grid gap-2" aria-label="Requisitos de activación">
                <Requirement complete={readiness.activeOwnerCount > 0}>
                  Propietario activo
                </Requirement>
                <Requirement
                  complete={
                    readiness.pickupEnabled || readiness.merchantDeliveryEnabled
                  }
                >
                  Retiro o delivery propio habilitado
                </Requirement>
                {readiness.merchantDeliveryEnabled ? (
                  <Requirement complete={readiness.activeDeliveryZoneCount > 0}>
                    Zona de delivery activa
                  </Requirement>
                ) : null}
                <Requirement complete={readiness.activePaymentMethodCount > 0}>
                  Medio de pago activo
                </Requirement>
                <Requirement complete={readiness.activeCatalogProductCount > 0}>
                  Producto publicado y disponible
                </Requirement>
              </ul>
            ) : (
              <p
                className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                role="alert"
              >
                No se pudo calcular el estado de preparación del comercio.
              </p>
            )}

            {blockers.length > 0 && merchant.status === "DRAFT" ? (
              <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100 ring-inset">
                <p className="text-sm font-extrabold text-amber-800">
                  Pendiente antes de activar
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
                  {blockers.map((blocker) => (
                    <li key={blocker}>
                      {MERCHANT_ACTIVATION_BLOCKER_LABELS[blocker]}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="border-t border-slate-100 pt-4">
              <ActivateMerchantForm
                merchantId={merchant.id}
                status={merchant.status}
                ready={activationReady}
              />
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
