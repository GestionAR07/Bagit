import Link from "next/link";
import { notFound } from "next/navigation";
import {
  findMerchantDetailById,
  listMerchantMembers,
} from "@/infrastructure/db/repositories/merchant-repository";
import { loadAdminContext } from "../../_lib/load-admin";

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

export default async function AdminMerchantDetailPage({ params }: PageProps) {
  const { merchantId } = await params;
  await loadAdminContext(`/admin/merchants/${merchantId}`);

  const merchant = await findMerchantDetailById(merchantId);
  if (!merchant) {
    notFound();
  }

  const members = await listMerchantMembers(merchantId);
  const owners = members.filter((member) => member.role === "OWNER");
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
        <div className="mt-4">
          <p className="mb-1 text-xs font-extrabold tracking-[0.14em] text-[#20aee5] uppercase">
            Estado administrativo
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
            Vista de seguimiento. La configuración operativa pertenece al
            propietario del comercio.
          </p>
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
                Datos básicos para identificar el comercio dentro de la
                plataforma.
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
                  Estado
                </dt>
                <dd className="mt-1 font-semibold text-slate-600">
                  {merchantStatusLabel(merchant.status)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Propietarios vinculados
                </dt>
                <dd className="mt-1 font-semibold text-slate-600">
                  {owners.length}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Descripción declarada
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
                Responsables vinculados
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Cuentas que actualmente tienen acceso al comercio.
              </p>
            </div>

            <div className="px-5 py-5 sm:px-6">
              {members.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-4 py-6 text-center">
                  <p className="font-bold text-rose-800">
                    No hay responsables vinculados
                  </p>
                  <p className="mt-1 text-sm text-rose-600">
                    Este estado no debería producirse en una solicitud aprobada.
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
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
            </div>
          </article>
        </div>

        <article className="self-start rounded-2xl border border-sky-100/80 bg-white shadow-[0_8px_30px_rgba(8,63,102,0.05)] xl:sticky xl:top-6">
          <div className="border-b border-slate-100 px-5 py-5">
            <h2 className="text-lg font-extrabold text-[#083f66]">
              Gestión a cargo del propietario
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              El administrador no define la operación del comercio.
            </p>
          </div>
          <div className="px-5 py-5">
            <div className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-100 ring-inset">
              <p className="text-sm font-extrabold text-[#083f66]">
                Configuración separada de la aprobación
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Medios de pago, catálogo, retiro, delivery y publicación se
                administran exclusivamente desde la cuenta del comercio.
              </p>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
