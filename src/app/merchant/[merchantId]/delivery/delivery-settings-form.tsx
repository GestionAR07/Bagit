"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { moneyCents } from "@/domain/money/money-cents";
import { formatMoneyCentsArs } from "@/lib/format-money";
import type { DeliverySettingsView } from "@/application/merchant/delivery-settings";
import { saveMerchantDeliverySettingsAction } from "./actions";
import type { DeliverySettingsActionState } from "./action-state";

type Props = {
  merchantId: string;
  settings: DeliverySettingsView;
};

const initialState: DeliverySettingsActionState = {
  error: null,
  success: null,
};

function moneyDefault(cents: number | null): string {
  if (cents === null) {
    return "";
  }
  return formatMoneyCentsArs(moneyCents(cents));
}

export function DeliverySettingsForm({ merchantId, settings }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    saveMerchantDeliverySettingsAction.bind(null, merchantId),
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="merchant-workspace-form">
      <label className="merchant-workspace-card merchant-workspace-toggle-card merchant-workspace-toggle-card--switch">
        <input
          type="checkbox"
          name="pickup_enabled"
          defaultChecked={settings.pickupEnabled}
          className="merchant-workspace-switch-input merchant-workspace-switch-input--overlay"
        />
        <div className="merchant-workspace-toggle-copy min-w-0">
          <span className="merchant-workspace-card-title">
            Ofrecer retiro en el comercio
          </span>
          <span className="merchant-workspace-card-copy">
            Los clientes podrán retirar sus pedidos directamente en tu local.
          </span>
        </div>
        <span
          className="merchant-workspace-switch-track merchant-workspace-switch-track--decor"
          aria-hidden="true"
        />
      </label>

      <label className="merchant-workspace-card merchant-workspace-toggle-card merchant-workspace-toggle-card--switch">
        <input
          type="checkbox"
          name="merchant_delivery_enabled"
          defaultChecked={settings.merchantDeliveryEnabled}
          className="merchant-workspace-switch-input merchant-workspace-switch-input--overlay"
        />
        <div className="merchant-workspace-toggle-copy min-w-0">
          <span className="merchant-workspace-card-title">
            Ofrecer envío a domicilio
          </span>
          <span className="merchant-workspace-card-copy">
            Los clientes podrán elegir entrega en las zonas que tengas activas.
          </span>
        </div>
        <span
          className="merchant-workspace-switch-track merchant-workspace-switch-track--decor"
          aria-hidden="true"
        />
      </label>

      <section className="merchant-workspace-card">
        <label className="merchant-workspace-field">
          <span className="merchant-workspace-card-title">
            Tiempo de preparación del pedido
          </span>
          <span className="merchant-workspace-card-copy">
            Indicá cuántos minutos necesitás normalmente antes de entregar o
            despachar un pedido.
          </span>
          <span className="merchant-workspace-inline-input mt-3">
            <input
              type="number"
              name="preparation_minutes"
              inputMode="numeric"
              min={0}
              max={1440}
              step={1}
              required
              defaultValue={settings.preparationMinutes}
              className="merchant-workspace-input merchant-workspace-input--narrow"
            />
            <span className="text-sm text-[#4A6B82]">minutos</span>
          </span>
        </label>
      </section>

      {settings.zones.length === 0 ? (
        <p className="merchant-workspace-empty" role="status">
          No hay zonas geográficas en {settings.cityName} para configurar
          envíos.
        </p>
      ) : (
        <div className="merchant-workspace-zone-grid">
          {settings.zones.map((zone) => (
            <section
              key={zone.zoneId}
              className="merchant-workspace-card merchant-workspace-zone-card"
            >
              <input type="hidden" name="zone_id" value={zone.zoneId} />
              <header className="merchant-workspace-zone-header">
                <div>
                  <h2 className="merchant-workspace-card-title">
                    {zone.zoneName}
                  </h2>
                  <p className="merchant-workspace-card-copy">
                    {zone.cityName}
                  </p>
                </div>
                <label className="merchant-workspace-active-pill">
                  <input
                    type="checkbox"
                    name={`active_${zone.zoneId}`}
                    defaultChecked={zone.active}
                    className="merchant-workspace-checkbox"
                  />
                  <span>Activa</span>
                </label>
              </header>

              <div className="merchant-workspace-zone-fields">
                <label className="merchant-workspace-field">
                  <span>Costo de envío</span>
                  <input
                    type="text"
                    name={`fee_${zone.zoneId}`}
                    inputMode="decimal"
                    defaultValue={moneyDefault(zone.deliveryFeeCents)}
                    placeholder="$ 0,00"
                    className="merchant-workspace-input"
                  />
                </label>

                <label className="merchant-workspace-field">
                  <span>Pedido mínimo</span>
                  <input
                    type="text"
                    name={`minimum_${zone.zoneId}`}
                    inputMode="decimal"
                    defaultValue={moneyDefault(zone.minimumOrderCents)}
                    placeholder="$ 0,00"
                    className="merchant-workspace-input"
                  />
                </label>

                <label className="merchant-workspace-field">
                  <span>Tiempo estimado</span>
                  <span className="merchant-workspace-inline-input">
                    <input
                      type="text"
                      name={`estimated_minutes_${zone.zoneId}`}
                      inputMode="numeric"
                      defaultValue={
                        zone.estimatedMinutes === null
                          ? ""
                          : String(zone.estimatedMinutes)
                      }
                      placeholder="30"
                      className="merchant-workspace-input merchant-workspace-input--narrow"
                    />
                    <span className="text-sm text-[#4A6B82]">minutos</span>
                  </span>
                </label>
              </div>
            </section>
          ))}
        </div>
      )}

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

      <div className="merchant-workspace-form-actions">
        <button
          type="submit"
          disabled={pending}
          className="merchant-workspace-primary-btn"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
