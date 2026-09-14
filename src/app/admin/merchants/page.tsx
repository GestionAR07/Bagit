import Link from "next/link";
import { loadAdminContext } from "../_lib/load-admin";
import { listMerchantsForAdmin } from "@/infrastructure/db/repositories/merchant-repository";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function merchantStatusClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "DRAFT":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "PAUSED":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "INACTIVE":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

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

function merchantMode(input: {
  pickupEnabled: boolean;
  merchantDeliveryEnabled: boolean;
}): string {
  if (input.pickupEnabled && input.merchantDeliveryEnabled) {
    return "Retiro + delivery";
  }
  if (input.merchantDeliveryEnabled) {
    return "Delivery";
  }
  if (input.pickupEnabled) {
    return "Retiro";
  }
  return "Sin modalidad";
}

export default async function AdminMerchantsPage() {
  await loadAdminContext("/admin/merchants");
  const merchants = await listMerchantsForAdmin();

  const activeMerchants = merchants.filter(
    (merchant) => merchant.status === "ACTIVE",
  ).length;
  const draftMerchants = merchants.filter(
    (merchant) => merchant.status === "DRAFT",
  ).length;
  const ownerCount = merchants.reduce(
    (total, merchant) => total + merchant.ownerCount,
    0,
  );

  return (
    <main className="mx-auto w-full max-w-[94rem] space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-extrabold tracking-[0.14em] text-[#20aee5] uppercase">
            Gestión comercial
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#083f66]">
            Comercios
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            Administrá los comercios que operan en Bag It y controlá su estado,
            cobertura y modalidad de entrega.
          </p>
        </div>
        <Link
          href="/admin/merchants/new"
          className="inline-flex min-h-11 items-center justify-center self-start rounded-xl bg-[#20aee5] px-4 text-sm font-extrabold text-white shadow-[0_10px_26px_rgba(32,174,229,0.25)] transition hover:bg-[#159ed4] lg:self-auto"
        >
          + Nuevo comercio
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
          <p className="text-sm font-semibold text-slate-500">Total</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#083f66]">
            {merchants.length}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Comercios registrados
          </p>
        </article>
        <article className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
          <p className="text-sm font-semibold text-slate-500">Activos</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-emerald-700">
            {activeMerchants}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Visibles para operar
          </p>
        </article>
        <article className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
          <p className="text-sm font-semibold text-slate-500">En preparación</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-sky-700">
            {draftMerchants}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Comercios en borrador
          </p>
        </article>
        <article className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
          <p className="text-sm font-semibold text-slate-500">Responsables</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#083f66]">
            {ownerCount}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Owners vinculados
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-sky-100/80 bg-white shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-extrabold text-[#083f66]">
            Listado de comercios
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Seleccioná un comercio para revisar su configuración y operación.
          </p>
        </div>

        {merchants.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-xl">
              🏪
            </div>
            <p className="mt-4 font-bold text-[#083f66]">
              Todavía no hay comercios
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              Creá el primero para empezar a configurar catálogo, cobertura y
              responsables.
            </p>
            <Link
              href="/admin/merchants/new"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl bg-[#20aee5] px-4 text-sm font-bold text-white"
            >
              Crear comercio
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[58rem] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-xs font-bold tracking-wide text-slate-400 uppercase">
                  <th className="px-5 py-3 sm:pl-6">Comercio</th>
                  <th className="px-4 py-3">Ubicación</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Modalidad</th>
                  <th className="px-4 py-3 text-center">Responsables</th>
                  <th className="px-5 py-3 sm:pr-6">Creado</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((merchant) => (
                  <tr
                    key={merchant.id}
                    className="border-t border-slate-100 transition hover:bg-sky-50/40"
                  >
                    <td className="px-5 py-4 sm:pl-6">
                      <Link
                        href={`/admin/merchants/${merchant.id}`}
                        className="font-bold text-[#083f66] hover:text-[#1498cf]"
                      >
                        {merchant.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Ver configuración →
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-700">
                        {merchant.zoneName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {merchant.cityName}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${merchantStatusClass(merchant.status)}`}
                      >
                        {merchantStatusLabel(merchant.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {merchantMode(merchant)}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-700">
                      {merchant.ownerCount}
                    </td>
                    <td className="px-5 py-4 text-slate-500 sm:pr-6">
                      {formatDate(merchant.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
