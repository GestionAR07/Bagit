import Link from "next/link";
import { loadAdminContext } from "./_lib/load-admin";
import { listMerchantsForAdmin } from "@/infrastructure/db/repositories/merchant-repository";
import { listMerchantApplicationsForAdmin } from "@/infrastructure/db/repositories/merchant-application-repository";
import { listZones } from "@/infrastructure/db/repositories/geography-repository";

export const dynamic = "force-dynamic";

type DashboardIconName = "shop" | "file" | "pin" | "check" | "arrow";

function DashboardIcon({ name }: { name: DashboardIconName }) {
  if (name === "shop") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M4 9.5h16l-1.4-5H5.4L4 9.5Zm1 0v9.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5M8.5 20v-6h7v6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "file") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Zm7 .5v4h4M9 12h6M9 16h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "pin") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d="m5 12.5 4 4L19 6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

function applicationStatusClass(status: string): string {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function applicationStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "APPROVED":
      return "Aprobada";
    case "REJECTED":
      return "Rechazada";
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

export default async function AdminPage() {
  await loadAdminContext("/admin");
  const [merchants, applications, zones] = await Promise.all([
    listMerchantsForAdmin(),
    listMerchantApplicationsForAdmin(),
    listZones(),
  ]);

  const pendingApplications = applications.filter(
    (application) => application.status === "PENDING",
  );
  const activeMerchants = merchants.filter(
    (merchant) => merchant.status === "ACTIVE",
  );
  const recentMerchants = [...merchants]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);
  const recentApplications = [...applications]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 4);

  const zoneRows = zones.slice(0, 4).map((zone) => ({
    ...zone,
    merchantCount: merchants.filter(
      (merchant) =>
        merchant.zoneName === zone.name && merchant.cityName === zone.cityName,
    ).length,
  }));

  const metrics = [
    {
      label: "Comercios",
      value: merchants.length,
      helper: `${activeMerchants.length} activos`,
      icon: "shop" as const,
      iconClass: "bg-sky-100 text-[#1498cf]",
    },
    {
      label: "Solicitudes pendientes",
      value: pendingApplications.length,
      helper: pendingApplications.length === 1 ? "Por revisar" : "Por revisar",
      icon: "file" as const,
      iconClass: "bg-amber-100 text-amber-700",
    },
    {
      label: "Zonas configuradas",
      value: zones.length,
      helper:
        zones.length > 0 ? "Disponibles para operar" : "Sin zonas cargadas",
      icon: "pin" as const,
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Comercios activos",
      value: activeMerchants.length,
      helper:
        merchants.length > 0
          ? `${Math.round((activeMerchants.length / merchants.length) * 100)}% del total`
          : "Sin comercios todavía",
      icon: "check" as const,
      iconClass: "bg-violet-100 text-violet-700",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-[94rem] space-y-6">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="mb-1 text-xs font-extrabold tracking-[0.14em] text-[#20aee5] uppercase">
            Bag It Admin
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#083f66] sm:text-[2rem]">
            Panel administrativo
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            Gestioná comercios, solicitudes y cobertura geográfica desde un solo
            lugar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/admin/merchant-applications"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-sky-100 bg-white px-4 text-sm font-bold text-[#083f66] shadow-sm transition hover:border-sky-200 hover:bg-sky-50"
          >
            Ver solicitudes
          </Link>
          <Link
            href="/admin/merchants/new"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#20aee5] px-4 text-sm font-extrabold text-white shadow-[0_10px_26px_rgba(32,174,229,0.25)] transition hover:bg-[#159ed4]"
          >
            + Nuevo comercio
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl border border-sky-100/80 bg-white p-4 shadow-[0_8px_30px_rgba(8,63,102,0.05)] sm:p-5"
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${metric.iconClass}`}
              >
                <DashboardIcon name={metric.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-500">
                  {metric.label}
                </p>
                <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-[#083f66]">
                  {metric.value}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {metric.helper}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.8fr)]">
        <article className="min-w-0 overflow-hidden rounded-2xl border border-sky-100/80 bg-white shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-extrabold text-[#083f66]">
                Comercios recientes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Últimos comercios creados en la plataforma.
              </p>
            </div>
            <Link
              href="/admin/merchants"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#1498cf] hover:text-[#083f66]"
            >
              Ver todos <DashboardIcon name="arrow" />
            </Link>
          </div>

          {recentMerchants.length === 0 ? (
            <div className="px-5 py-10 text-center sm:px-6">
              <p className="text-sm font-semibold text-[#083f66]">
                Todavía no hay comercios.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Creá el primero para empezar a operar el marketplace.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-xs font-bold tracking-wide text-slate-400 uppercase">
                    <th className="px-5 py-3 sm:pl-6">Comercio</th>
                    <th className="px-4 py-3">Zona</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Modalidad</th>
                    <th className="px-5 py-3 sm:pr-6">Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMerchants.map((merchant) => (
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
                          {merchant.cityName}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {merchant.zoneName}
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
                      <td className="px-5 py-4 text-slate-500 sm:pr-6">
                        {formatDate(merchant.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <div className="grid min-w-0 gap-5">
          <article className="overflow-hidden rounded-2xl border border-sky-100/80 bg-white shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-5">
              <div>
                <h2 className="text-lg font-extrabold text-[#083f66]">
                  Solicitudes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Comercios que esperan revisión.
                </p>
              </div>
              <Link
                href="/admin/merchant-applications"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#1498cf] hover:text-[#083f66]"
              >
                Ver todas <DashboardIcon name="arrow" />
              </Link>
            </div>

            {recentApplications.length === 0 ? (
              <div className="px-5 py-8 text-sm text-slate-500">
                No hay solicitudes registradas.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentApplications.map((application) => (
                  <Link
                    key={application.id}
                    href={`/admin/merchant-applications/${application.id}`}
                    className="flex items-center gap-3 px-5 py-4 transition hover:bg-sky-50/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-extrabold text-[#1498cf]">
                      {application.businessName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#083f66]">
                        {application.businessName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {application.cityName} ·{" "}
                        {formatDate(application.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-bold ring-1 ring-inset ${applicationStatusClass(application.status)}`}
                    >
                      {applicationStatusLabel(application.status)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </article>

          <article className="overflow-hidden rounded-2xl border border-sky-100/80 bg-white shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-5">
              <div>
                <h2 className="text-lg font-extrabold text-[#083f66]">
                  Resumen geográfico
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Zonas configuradas para el marketplace.
                </p>
              </div>
              <Link
                href="/admin/geography"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#1498cf] hover:text-[#083f66]"
              >
                Gestionar <DashboardIcon name="arrow" />
              </Link>
            </div>

            {zoneRows.length === 0 ? (
              <div className="px-5 py-8 text-sm text-slate-500">
                Todavía no hay zonas configuradas.
              </div>
            ) : (
              <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {zoneRows.map((zone, index) => (
                  <div
                    key={zone.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${index % 2 === 0 ? "bg-[#20aee5]" : "bg-[#ffc51b]"}`}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#083f66]">
                          {zone.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {zone.cityName} · {zone.merchantCount}{" "}
                          {zone.merchantCount === 1 ? "comercio" : "comercios"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
