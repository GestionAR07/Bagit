import { loadAdminContext } from "../_lib/load-admin";
import {
  listCities,
  listProvinces,
  listZones,
} from "@/infrastructure/db/repositories/geography-repository";
import { GeographyForms } from "./geography-forms";

export const dynamic = "force-dynamic";

export default async function AdminGeographyPage() {
  await loadAdminContext("/admin/geography");
  const [provinces, cities, zones] = await Promise.all([
    listProvinces(),
    listCities(),
    listZones(),
  ]);

  return (
    <main className="mx-auto w-full max-w-[94rem] space-y-6">
      <header>
        <p className="mb-1 text-xs font-extrabold tracking-[0.14em] text-[#20aee5] uppercase">
          Cobertura del marketplace
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#083f66]">
          Geografía
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
          Organizá las provincias, ciudades y zonas donde Bag It puede operar.
          Esta estructura define la cobertura disponible para comercios y
          clientes.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
          <p className="text-sm font-semibold text-slate-500">Provincias</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#083f66]">
            {provinces.length}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Regiones principales
          </p>
        </article>
        <article className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
          <p className="text-sm font-semibold text-slate-500">Ciudades</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#083f66]">
            {cities.length}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Localidades configuradas
          </p>
        </article>
        <article className="rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_8px_30px_rgba(8,63,102,0.05)]">
          <p className="text-sm font-semibold text-slate-500">Zonas</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-emerald-700">
            {zones.length}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Áreas disponibles para operar
          </p>
        </article>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        <article className="self-start rounded-2xl border border-sky-100/80 bg-white p-5 shadow-[0_8px_30px_rgba(8,63,102,0.05)] sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-extrabold text-[#083f66]">
              Cobertura configurada
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Estructura geográfica actualmente disponible en Bag It.
            </p>
          </div>

          {provinces.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 px-4 py-8 text-center">
              <p className="font-bold text-[#083f66]">
                Todavía no hay cobertura configurada
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Empezá creando una provincia y luego agregá sus ciudades y
                zonas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {provinces.map((province) => {
                const provinceCities = cities.filter(
                  (city) => city.provinceId === province.id,
                );

                return (
                  <div
                    key={province.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-extrabold text-[#083f66]">
                          {province.name}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-400">
                          Código {province.code}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200 ring-inset">
                        {provinceCities.length} ciudad
                        {provinceCities.length === 1 ? "" : "es"}
                      </span>
                    </div>

                    {provinceCities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {provinceCities.map((city) => (
                          <span
                            key={city.id}
                            className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 ring-inset"
                          >
                            {city.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 border-t border-slate-100 pt-5">
            <p className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
              Zonas disponibles
            </p>
            {zones.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No hay zonas cargadas todavía.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {zones.map((zone) => (
                  <span
                    key={zone.id}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100 ring-inset"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {zone.name}
                    <span className="font-medium text-emerald-600/70">
                      · {zone.cityName}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        <GeographyForms
          provinces={provinces.map((province) => ({
            id: province.id,
            name: province.name,
            code: province.code,
          }))}
          cities={cities.map((city) => ({
            id: city.id,
            name: city.name,
            provinceId: city.provinceId,
          }))}
        />
      </section>
    </main>
  );
}
