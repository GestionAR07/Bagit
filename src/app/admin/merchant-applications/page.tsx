import Link from "next/link";
import { loadAdminContext } from "../_lib/load-admin";
import { listMerchantApplicationsForAdmin } from "@/infrastructure/db/repositories/merchant-application-repository";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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

function formatApplicationStatus(status: string): string {
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

export default async function AdminMerchantApplicationsPage() {
  await loadAdminContext("/admin/merchant-applications");
  const applications = await listMerchantApplicationsForAdmin();

  const pendingCount = applications.filter(
    (application) => application.status === "PENDING",
  ).length;
  const approvedCount = applications.filter(
    (application) => application.status === "APPROVED",
  ).length;
  const rejectedCount = applications.filter(
    (application) => application.status === "REJECTED",
  ).length;

  return (
    <main className="mx-auto w-full max-w-[94rem] space-y-6">
      <header>
        <p className="mb-1 text-xs font-extrabold tracking-[0.14em] text-[#20aee5] uppercase">
          Incorporación de comercios
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#083f66]">
          Solicitudes
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
          Revisá las postulaciones recibidas y acompañá cada comercio desde la
          solicitud hasta su incorporación a Bag It.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
          <p className="text-sm font-semibold text-slate-500">
            Total recibidas
          </p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#083f66]">
            {applications.length}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Historial de solicitudes
          </p>
        </article>
        <article className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
          <p className="text-sm font-semibold text-slate-500">Pendientes</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-amber-700">
            {pendingCount}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">Por revisar</p>
        </article>
        <article className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
          <p className="text-sm font-semibold text-slate-500">Aprobadas</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-emerald-700">
            {approvedCount}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Aceptadas por administración
          </p>
        </article>
        <article className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
          <p className="text-sm font-semibold text-slate-500">Rechazadas</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-rose-700">
            {rejectedCount}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Solicitudes no aprobadas
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-sky-100/80 bg-white shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-extrabold text-[#083f66]">
            Bandeja de solicitudes
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Abrí una solicitud para consultar los datos enviados y resolverla.
          </p>
        </div>

        {applications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-[#1498cf]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
                <path
                  d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Zm7 .5v4h4M9 12h6M9 16h6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="mt-4 font-bold text-[#083f66]">
              No hay solicitudes registradas
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
              Cuando un comercio complete el formulario para sumarse a Bag It,
              su solicitud aparecerá acá para que puedas revisarla.
            </p>
            <Link
              href="/sumar-comercio"
              className="mt-5 inline-flex min-h-10 items-center justify-center rounded-xl border border-sky-100 bg-white px-4 text-sm font-bold text-[#1498cf] transition hover:bg-sky-50"
            >
              Ver formulario público
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-xs font-bold tracking-wide text-slate-400 uppercase">
                  <th className="px-5 py-3 sm:pl-6">Comercio</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Ubicación</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-5 py-3 sm:pr-6">Recibida</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr
                    key={application.id}
                    className="border-t border-slate-100 transition hover:bg-sky-50/40"
                  >
                    <td className="px-5 py-4 sm:pl-6">
                      <Link
                        href={`/admin/merchant-applications/${application.id}`}
                        className="font-bold text-[#083f66] hover:text-[#1498cf]"
                      >
                        {application.businessName}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Revisar solicitud →
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-700">
                        {application.contactName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {application.contactEmail}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-700">
                        {application.zoneName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {application.cityName}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${applicationStatusClass(application.status)}`}
                      >
                        {formatApplicationStatus(application.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 sm:pr-6">
                      {formatDate(application.createdAt)}
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
