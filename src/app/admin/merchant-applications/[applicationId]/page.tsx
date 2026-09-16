import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAdminContext } from "../../_lib/load-admin";
import { findMerchantApplicationById } from "@/infrastructure/db/repositories/merchant-application-repository";
import { ApplicationApproveForm } from "../application-approve-form";
import { ApplicationRejectForm } from "../application-reject-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ applicationId: string }>;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

export default async function AdminMerchantApplicationDetailPage({
  params,
}: PageProps) {
  const { applicationId } = await params;
  await loadAdminContext(`/admin/merchant-applications/${applicationId}`);

  const application = await findMerchantApplicationById(applicationId);
  if (!application) {
    notFound();
  }

  const isPending = application.status === "PENDING";
  const isApproved = application.status === "APPROVED";
  const isRejected = application.status === "REJECTED";

  return (
    <main className="mx-auto w-full max-w-[94rem] space-y-6">
      <header>
        <Link
          href="/admin/merchant-applications"
          className="inline-flex items-center gap-1 text-sm font-bold text-[#1498cf] transition hover:text-[#083f66]"
        >
          ← Volver a solicitudes
        </Link>
        <div className="mt-4">
          <p className="mb-1 text-xs font-extrabold tracking-[0.14em] text-[#20aee5] uppercase">
            Revisión de incorporación
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#083f66]">
              {application.businessName}
            </h1>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset ${applicationStatusClass(application.status)}`}
            >
              {applicationStatusLabel(application.status)}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Revisá los datos enviados por el comercio antes de aprobar o
            rechazar la solicitud.
          </p>
        </div>
      </header>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <div className="grid gap-5">
          <article className="rounded-2xl border border-sky-100/80 bg-white shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h2 className="text-lg font-extrabold text-[#083f66]">
                Datos de la solicitud
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Información comercial y ubicación declarada por el postulante.
              </p>
            </div>
            <dl className="grid gap-x-6 gap-y-5 px-5 py-5 text-sm sm:grid-cols-2 sm:px-6">
              <div>
                <dt className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Comercio
                </dt>
                <dd className="mt-1 font-bold text-[#083f66]">
                  {application.businessName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Fecha de recepción
                </dt>
                <dd className="mt-1 font-semibold text-slate-600">
                  {formatDate(application.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Ciudad
                </dt>
                <dd className="mt-1 font-semibold text-slate-600">
                  {application.cityName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Zona
                </dt>
                <dd className="mt-1 font-semibold text-slate-600">
                  {application.zoneName}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Descripción
                </dt>
                <dd className="mt-1 leading-6 text-slate-600">
                  {application.description || "Sin descripción cargada."}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Mensaje del postulante
                </dt>
                <dd className="mt-1 rounded-xl bg-slate-50 px-4 py-3 leading-6 text-slate-600">
                  {application.message || "Sin mensaje adicional."}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-sky-100/80 bg-white shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h2 className="text-lg font-extrabold text-[#083f66]">
                Datos de contacto
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Persona indicada como propietaria del comercio.
              </p>
            </div>
            <div className="grid gap-4 px-5 py-5 text-sm sm:grid-cols-3 sm:px-6">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Contacto
                </p>
                <p className="mt-1 font-bold text-[#083f66]">
                  {application.contactName}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Email
                </p>
                <p className="mt-1 break-all font-semibold text-slate-600">
                  {application.contactEmail}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Teléfono
                </p>
                <p className="mt-1 font-semibold text-slate-600">
                  {application.contactPhone}
                </p>
              </div>
            </div>
          </article>
        </div>

        <article className="self-start rounded-2xl border border-sky-100/80 bg-white shadow-[0_8px_30px_rgba(8,63,102,0.05)] xl:sticky xl:top-6">
          <div className="border-b border-slate-100 px-5 py-5">
            <h2 className="text-lg font-extrabold text-[#083f66]">
              Resolución administrativa
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Tu intervención termina al aprobar o rechazar la incorporación.
            </p>
          </div>

          <div className="space-y-5 px-5 py-5">
            {isApproved ? (
              <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100 ring-inset">
                <p className="text-sm font-extrabold text-emerald-800">
                  Solicitud aprobada
                </p>
                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  El propietario quedó vinculado. La configuración y publicación
                  del comercio quedan a cargo de su cuenta.
                </p>
                {application.merchantId ? (
                  <Link
                    href={`/admin/merchants/${application.merchantId}`}
                    className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-extrabold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
                  >
                    Ver estado del comercio
                  </Link>
                ) : null}
              </div>
            ) : null}

            {isRejected ? (
              <div className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-100 ring-inset">
                <p className="text-sm font-extrabold text-rose-800">
                  Solicitud rechazada
                </p>
                <p className="mt-3 text-xs font-bold tracking-wide text-rose-500 uppercase">
                  Motivo
                </p>
                <p className="mt-1 text-sm leading-6 text-rose-700">
                  {application.rejectionReason || "Sin motivo registrado."}
                </p>
              </div>
            ) : null}

            {isPending ? (
              <>
                <div>
                  <h3 className="font-extrabold text-[#083f66]">
                    Aprobar solicitud
                  </h3>
                  <p className="mt-1 mb-4 text-sm leading-6 text-slate-500">
                    Al aprobar, se crea el comercio en borrador y se vincula
                    automáticamente al solicitante como propietario.
                  </p>
                  <ApplicationApproveForm applicationId={application.id} />
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h3 className="font-extrabold text-[#083f66]">
                    Rechazar solicitud
                  </h3>
                  <p className="mt-1 mb-4 text-sm leading-6 text-slate-500">
                    Registrá un motivo claro para dejar documentada la decisión.
                  </p>
                  <ApplicationRejectForm applicationId={application.id} />
                </div>
              </>
            ) : null}
          </div>
        </article>
      </section>
    </main>
  );
}
