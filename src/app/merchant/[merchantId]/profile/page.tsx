import { redirect } from "next/navigation";
import { getMerchantCoverPreviewApp } from "@/application/merchant/cover-image-wiring";
import { MerchantSettingsNav } from "@/components/merchant/merchant-settings-nav";
import { MerchantWorkspacePage } from "@/components/merchant/merchant-workspace-page";
import { findMerchantDetailForMember } from "@/infrastructure/db/repositories/merchant-repository";
import {
  listOpeningIntervalsForMerchant,
  type PublicOpeningIntervalRecord,
} from "@/infrastructure/db/repositories/storefront-repository";
import { formatLocalMinuteAsClock } from "@/lib/local-weekday";
import { isAuthzError } from "@/server/auth/errors";
import { requireMerchantMembership } from "@/server/auth/authorization";
import type { MerchantHoursDayInput } from "./action-state";
import {
  deleteMerchantCoverAction,
  saveMerchantHoursAction,
  upsertMerchantCoverAction,
} from "./actions";
import { MerchantCoverEditor } from "./merchant-cover-editor";
import { MerchantHoursEditor } from "./merchant-hours-editor";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ merchantId: string }>;
};

async function loadPage(merchantId: string) {
  try {
    const context = await requireMerchantMembership(merchantId);
    const merchant = await findMerchantDetailForMember(
      merchantId,
      context.user.id,
    );
    if (!merchant) {
      redirect("/login?next=/merchant&error=forbidden");
    }
    return { ...context, merchant };
  } catch (error) {
    if (isAuthzError(error)) {
      if (error.code === "UNAUTHENTICATED" || error.code === "CONFIG_MISSING") {
        redirect(`/login?next=/merchant/${merchantId}/profile`);
      }
      redirect("/login?next=/merchant&error=forbidden");
    }
    throw error;
  }
}

function formatMerchantRoleLabel(role: string): string {
  switch (role) {
    case "OWNER":
      return "Propietario";
    case "STAFF":
      return "Personal";
    default:
      return role.replaceAll("_", " ");
  }
}

function formatMerchantStatusLabel(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "Activo";
    case "DRAFT":
      return "Borrador";
    case "SUSPENDED":
      return "Suspendido";
    default:
      return status.replaceAll("_", " ");
  }
}

function buildInitialSchedule(
  intervals: readonly PublicOpeningIntervalRecord[],
): MerchantHoursDayInput[] {
  return Array.from({ length: 7 }, (_, weekday) => {
    const dayIntervals = intervals
      .filter((interval) => interval.weekday === weekday)
      .map((interval) => ({
        openTime: formatLocalMinuteAsClock(interval.openMinute),
        closeTime: formatLocalMinuteAsClock(interval.closeMinute),
      }));
    return {
      weekday,
      enabled: dayIntervals.length > 0,
      intervals: dayIntervals,
    };
  });
}

export default async function MerchantProfilePage({ params }: PageProps) {
  const { merchantId } = await params;
  const { user, merchant } = await loadPage(merchantId);
  const preview = await getMerchantCoverPreviewApp(merchantId);
  const openingIntervals = await listOpeningIntervalsForMerchant(merchantId);
  const initialSchedule = buildInitialSchedule(openingIntervals);
  const statusLabel = formatMerchantStatusLabel(merchant.status);
  const roleLabel = formatMerchantRoleLabel(merchant.role);
  const userLabel = user.email ?? user.id;

  return (
    <MerchantWorkspacePage
      merchantId={merchantId}
      merchantName={merchant.name}
      activeSection="settings"
      title="Configuración"
      description="Administrá cómo se presenta y funciona tu comercio."
    >
      <div className="merchant-workspace-settings-stack">
        <MerchantSettingsNav merchantId={merchantId} activeTab="store" />
        <header className="merchant-workspace-settings-pane">
          <h3 className="merchant-workspace-settings-pane-title">Tienda</h3>
          <p className="merchant-workspace-settings-pane-copy">
            Revisá los datos y la imagen de tu comercio.
          </p>
        </header>
        <section className="merchant-workspace-card merchant-workspace-store-details">
          <h4 className="merchant-workspace-card-title">Datos del comercio</h4>
          <dl className="merchant-workspace-store-details-grid">
            <div className="merchant-workspace-store-details-item">
              <dt>Nombre comercial</dt>
              <dd>{merchant.name}</dd>
            </div>
            <div className="merchant-workspace-store-details-item">
              <dt>Estado</dt>
              <dd>
                <span className="merchant-workspace-store-status-badge">
                  {statusLabel}
                </span>
              </dd>
            </div>
            <div className="merchant-workspace-store-details-item">
              <dt>Ubicación</dt>
              <dd>
                {merchant.cityName} / {merchant.zoneName}
              </dd>
            </div>
            <div className="merchant-workspace-store-details-item">
              <dt>Tu rol</dt>
              <dd>{roleLabel}</dd>
            </div>
            <div className="merchant-workspace-store-details-item merchant-workspace-store-details-item--full">
              <dt>Usuario</dt>
              <dd className="merchant-workspace-store-email">{userLabel}</dd>
            </div>
          </dl>
        </section>
        <MerchantCoverEditor
          merchantId={merchantId}
          merchantName={merchant.name}
          coverUrl={preview.coverUrl}
          upsertAction={upsertMerchantCoverAction}
          deleteAction={deleteMerchantCoverAction}
        />
        <MerchantHoursEditor
          merchantId={merchantId}
          initialSchedule={initialSchedule}
          saveAction={saveMerchantHoursAction}
        />
      </div>
    </MerchantWorkspacePage>
  );
}
