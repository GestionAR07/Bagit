"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type {
  MerchantHoursActionState,
  MerchantHoursDayInput,
  MerchantHoursIntervalInput,
} from "./action-state";

type Props = {
  merchantId: string;
  initialSchedule: MerchantHoursDayInput[];
  saveAction: (
    merchantId: string,
    schedule: MerchantHoursDayInput[],
  ) => Promise<MerchantHoursActionState>;
};

const WEEKDAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

const MAX_INTERVALS_PER_DAY = 3;
const DEFAULT_INTERVAL: MerchantHoursIntervalInput = {
  openTime: "09:00",
  closeTime: "18:00",
};

const UNEXPECTED_ACTION_ERROR =
  "No se pudo completar la operación. Intentá de nuevo.";

function cloneSchedule(
  schedule: MerchantHoursDayInput[],
): MerchantHoursDayInput[] {
  return schedule.map((day) => ({
    weekday: day.weekday,
    enabled: day.enabled,
    intervals: day.intervals.map((interval) => ({ ...interval })),
  }));
}

export function MerchantHoursEditor({
  merchantId,
  initialSchedule,
  saveAction,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [schedule, setSchedule] = useState(() =>
    cloneSchedule(initialSchedule),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function updateDay(
    weekday: number,
    updater: (day: MerchantHoursDayInput) => MerchantHoursDayInput,
  ): void {
    setSchedule((prev) =>
      prev.map((day) => (day.weekday === weekday ? updater(day) : day)),
    );
  }

  function toggleDay(weekday: number, enabled: boolean): void {
    updateDay(weekday, (day) => ({
      ...day,
      enabled,
      intervals:
        enabled && day.intervals.length === 0
          ? [{ ...DEFAULT_INTERVAL }]
          : day.intervals,
    }));
  }

  function setIntervalField(
    weekday: number,
    index: number,
    field: keyof MerchantHoursIntervalInput,
    value: string,
  ): void {
    updateDay(weekday, (day) => ({
      ...day,
      intervals: day.intervals.map((interval, i) =>
        i === index ? { ...interval, [field]: value } : interval,
      ),
    }));
  }

  function addInterval(weekday: number): void {
    updateDay(weekday, (day) => {
      if (day.intervals.length >= MAX_INTERVALS_PER_DAY) {
        return day;
      }
      return {
        ...day,
        intervals: [...day.intervals, { ...DEFAULT_INTERVAL }],
      };
    });
  }

  function removeInterval(weekday: number, index: number): void {
    updateDay(weekday, (day) => ({
      ...day,
      intervals: day.intervals.filter((_, i) => i !== index),
    }));
  }

  function onSave(): void {
    startTransition(async () => {
      setError(null);
      setSuccess(null);
      try {
        const result = await saveAction(merchantId, schedule);
        if (result.error) {
          setError(result.error);
          return;
        }
        setSuccess(result.success);
        router.refresh();
      } catch {
        setError(UNEXPECTED_ACTION_ERROR);
      }
    });
  }

  return (
    <section className="merchant-workspace-card merchant-workspace-hours">
      <h2 className="merchant-workspace-card-title">Horarios de atención</h2>
      <p className="merchant-workspace-card-copy">
        Definí qué días abrís y las franjas horarias. Podés agregar un turno
        cortado (hasta {MAX_INTERVALS_PER_DAY} por día).
      </p>

      {success ? (
        <p
          className="merchant-workspace-alert merchant-workspace-alert--success"
          role="status"
        >
          {success}
        </p>
      ) : null}
      {error ? (
        <p
          className="merchant-workspace-alert merchant-workspace-alert--error"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <ul className="merchant-workspace-hours-list">
        {schedule.map((day) => {
          const label = WEEKDAY_LABELS[day.weekday] ?? `Día ${day.weekday}`;
          return (
            <li key={day.weekday} className="merchant-workspace-hours-day">
              <header className="merchant-workspace-hours-day-header">
                <span className="merchant-workspace-hours-day-label">
                  {label}
                </span>
                <label className="merchant-workspace-switch merchant-workspace-switch--compact">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(event) =>
                      toggleDay(day.weekday, event.target.checked)
                    }
                    disabled={pending}
                    className="merchant-workspace-switch-input"
                    aria-label={`${label}: abierto`}
                  />
                  <span
                    className="merchant-workspace-switch-track"
                    aria-hidden="true"
                  />
                  <span className="merchant-workspace-switch-copy">
                    <span className="merchant-workspace-switch-label-on">
                      Abierto
                    </span>
                    <span className="merchant-workspace-switch-label-off">
                      Cerrado
                    </span>
                  </span>
                </label>
              </header>

              {day.enabled ? (
                <div className="merchant-workspace-hours-intervals">
                  {day.intervals.map((interval, index) => (
                    <div
                      key={`${day.weekday}-${index}`}
                      className="merchant-workspace-hours-interval"
                    >
                      <label className="merchant-workspace-field merchant-workspace-hours-time-field">
                        <span>Abre</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="09:00"
                          pattern="([01]\d|2[0-3]):[0-5]\d"
                          title="HH:mm"
                          value={interval.openTime}
                          onChange={(event) =>
                            setIntervalField(
                              day.weekday,
                              index,
                              "openTime",
                              event.target.value,
                            )
                          }
                          disabled={pending}
                          className="merchant-workspace-input"
                          required
                        />
                      </label>
                      <label className="merchant-workspace-field merchant-workspace-hours-time-field">
                        <span>Cierra</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="18:00"
                          pattern="(([01]\d|2[0-3]):[0-5]\d|24:00)"
                          title="HH:mm (24:00 = medianoche)"
                          value={interval.closeTime}
                          onChange={(event) =>
                            setIntervalField(
                              day.weekday,
                              index,
                              "closeTime",
                              event.target.value,
                            )
                          }
                          disabled={pending}
                          className="merchant-workspace-input"
                          required
                        />
                      </label>
                      {day.intervals.length > 1 ? (
                        <button
                          type="button"
                          className="merchant-workspace-secondary-btn merchant-workspace-hours-remove"
                          onClick={() => removeInterval(day.weekday, index)}
                          disabled={pending}
                        >
                          Quitar
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {day.intervals.length < MAX_INTERVALS_PER_DAY ? (
                    <button
                      type="button"
                      className="merchant-workspace-secondary-btn"
                      onClick={() => addInterval(day.weekday)}
                      disabled={pending}
                    >
                      Agregar turno
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="merchant-workspace-card-copy merchant-workspace-hours-closed-hint">
                  Cerrado este día.
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="merchant-workspace-form-actions">
        <button
          type="button"
          className="merchant-workspace-primary-btn"
          onClick={onSave}
          disabled={pending}
        >
          {pending ? "Guardando…" : "Guardar horarios"}
        </button>
      </div>
    </section>
  );
}
