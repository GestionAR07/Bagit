"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createMerchantActionWithId } from "../actions";
import type { CreateMerchantActionState } from "../action-state";

export type CityOption = {
  id: string;
  name: string;
};

export type ZoneOption = {
  id: string;
  cityId: string;
  name: string;
};

type MerchantCreateFormProps = {
  cities: CityOption[];
  zones: ZoneOption[];
};

const initial: CreateMerchantActionState = {
  error: null,
  success: null,
};

const fieldClass =
  "min-h-11 rounded-xl border border-sky-100 bg-white px-3.5 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#20aee5] focus:ring-2 focus:ring-sky-100";

export function MerchantCreateForm({ cities, zones }: MerchantCreateFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createMerchantActionWithId,
    initial,
  );
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");

  const filteredZones = useMemo(
    () => zones.filter((zone) => zone.cityId === cityId),
    [zones, cityId],
  );

  useEffect(() => {
    if (state.merchantId) {
      router.push(`/admin/merchants/${state.merchantId}`);
      router.refresh();
    }
  }, [state.merchantId, router]);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-bold text-[#083f66]">Nombre del comercio</span>
          <input
            name="name"
            required
            placeholder="Ej. Panadería del Sur"
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-bold text-[#083f66]">
            Identificador público
          </span>
          <input
            name="slug"
            required
            placeholder="panaderia-del-sur"
            className={fieldClass}
          />
          <span className="text-xs leading-5 text-slate-400">
            Se usa en la dirección pública del comercio. Usá minúsculas, números
            y guiones.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-bold text-[#083f66]">
            Descripción
            <span className="ml-1 font-medium text-slate-400">(opcional)</span>
          </span>
          <textarea
            name="description"
            rows={4}
            placeholder="Contá brevemente qué ofrece este comercio."
            className="rounded-xl border border-sky-100 bg-white px-3.5 py-3 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#20aee5] focus:ring-2 focus:ring-sky-100"
          />
        </label>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <h3 className="font-extrabold text-[#083f66]">Ubicación</h3>
        <p className="mt-1 mb-4 text-sm text-slate-500">
          Elegí dónde opera inicialmente el comercio.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-bold text-[#083f66]">Ciudad</span>
            <select
              name="cityId"
              required
              value={cityId}
              onChange={(event) => setCityId(event.target.value)}
              className={fieldClass}
            >
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-bold text-[#083f66]">Zona</span>
            <select
              name="zoneId"
              required
              className={fieldClass}
              disabled={filteredZones.length === 0}
            >
              {filteredZones.length === 0 ? (
                <option value="">Sin zonas para esta ciudad</option>
              ) : (
                filteredZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <h3 className="font-extrabold text-[#083f66]">Modalidad inicial</h3>
        <p className="mt-1 mb-4 text-sm text-slate-500">
          Definí cómo podrá recibir pedidos al comenzar la configuración.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-sky-100 bg-slate-50/70 p-4 transition hover:border-sky-200 hover:bg-sky-50/60">
            <input
              type="checkbox"
              name="pickupEnabled"
              defaultChecked
              className="mt-0.5 h-4 w-4 accent-[#20aee5]"
            />
            <span>
              <span className="block text-sm font-extrabold text-[#083f66]">
                Retiro en el comercio
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-400">
                El cliente retira el pedido personalmente.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-sky-100 bg-slate-50/70 p-4 transition hover:border-sky-200 hover:bg-sky-50/60">
            <input
              type="checkbox"
              name="merchantDeliveryEnabled"
              className="mt-0.5 h-4 w-4 accent-[#20aee5]"
            />
            <span>
              <span className="block text-sm font-extrabold text-[#083f66]">
                Delivery propio
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-400">
                El comercio organiza y realiza sus entregas.
              </span>
            </span>
          </label>
        </div>
      </div>

      <label className="flex max-w-sm flex-col gap-1.5 text-sm">
        <span className="font-bold text-[#083f66]">
          Tiempo estimado de preparación
        </span>
        <div className="relative">
          <input
            type="number"
            name="preparationMinutes"
            min={0}
            max={1440}
            defaultValue={30}
            required
            className={`${fieldClass} w-full pr-20`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">
            minutos
          </span>
        </div>
      </label>

      <div className="rounded-2xl bg-sky-50/70 p-4 ring-1 ring-sky-100 ring-inset">
        <p className="text-sm font-extrabold text-[#083f66]">
          Se guardará como borrador
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Todavía no será visible para clientes. La entrega gestionada por Bag It
          permanece deshabilitada en esta etapa.
        </p>
      </div>

      {state.error ? (
        <p
          className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        <button
          type="submit"
          disabled={pending || filteredZones.length === 0}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#20aee5] px-5 text-sm font-extrabold text-white shadow-[0_8px_22px_rgba(32,174,229,0.2)] transition hover:bg-[#159ed4] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          {pending ? "Creando…" : "Crear comercio"}
        </button>
        <span className="text-xs font-medium text-slate-400">
          Podrás completar el resto de la configuración después.
        </span>
      </div>
    </form>
  );
}
