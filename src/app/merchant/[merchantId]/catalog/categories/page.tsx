import Link from "next/link";
import { redirect } from "next/navigation";
import { MerchantWorkspacePage } from "@/components/merchant/merchant-workspace-page";
import { isAuthzError } from "@/server/auth/errors";
import { requireMerchantMembership } from "@/server/auth/authorization";
import { listMerchantCategories } from "@/infrastructure/db/repositories/catalog-repository";
import { findMerchantDetailForMember } from "@/infrastructure/db/repositories/merchant-repository";
import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoryAction,
  updateCategoryAction,
} from "../actions";

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
        redirect(`/login?next=/merchant/${merchantId}/catalog/categories`);
      }
      redirect("/login?next=/merchant&error=forbidden");
    }
    throw error;
  }
}

export default async function CategoriesPage({ params }: PageProps) {
  const { merchantId } = await params;
  const { merchant } = await loadPage(merchantId);
  const categories = await listMerchantCategories(merchantId);

  const boundCreate = createCategoryAction.bind(null, merchantId);

  return (
    <MerchantWorkspacePage
      merchantId={merchantId}
      merchantName={merchant.name}
      activeSection="catalog"
      title="Categorías"
      description="Organizá los productos que aparecen en tu tienda."
    >
      <nav className="merchant-workspace-toolbar" aria-label="Catálogo">
        <Link
          href={`/merchant/${merchantId}/catalog`}
          className="merchant-workspace-toolbar-link"
        >
          Productos
        </Link>
        <Link
          href={`/merchant/${merchantId}/catalog/categories`}
          className="merchant-workspace-toolbar-link merchant-workspace-toolbar-link--active"
          aria-current="page"
        >
          Categorías
        </Link>
      </nav>

      <section className="merchant-workspace-card merchant-workspace-form-panel">
        <h2 className="merchant-workspace-card-title mb-3">Nueva categoría</h2>
        <form
          action={boundCreate}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <label className="merchant-workspace-field min-w-0 flex-1">
            <span className="sr-only">Nombre</span>
            <input
              name="name"
              required
              placeholder="Empanadas"
              className="merchant-workspace-input"
            />
          </label>
          <button type="submit" className="merchant-workspace-primary-btn">
            Crear
          </button>
        </form>
      </section>

      {categories.length === 0 ? (
        <p className="merchant-workspace-empty">Todavía no hay categorías.</p>
      ) : (
        <ul className="merchant-workspace-category-list">
          {categories.map((category, index) => {
            const boundUpdate = updateCategoryAction.bind(
              null,
              merchantId,
              category.id,
            );
            const boundDelete = deleteCategoryAction.bind(
              null,
              merchantId,
              category.id,
            );
            const boundUp = reorderCategoryAction.bind(
              null,
              merchantId,
              category.id,
              "up",
            );
            const boundDown = reorderCategoryAction.bind(
              null,
              merchantId,
              category.id,
              "down",
            );

            return (
              <li
                key={category.id}
                className="merchant-workspace-card merchant-workspace-category-card"
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <form
                    action={boundUpdate}
                    className="flex min-w-0 flex-1 gap-2"
                  >
                    <input
                      name="name"
                      defaultValue={category.name}
                      required
                      className="merchant-workspace-input min-w-0 flex-1"
                      aria-label={`Nombre de la categoría ${category.name}`}
                    />
                    <input
                      type="hidden"
                      name="active"
                      value={category.active ? "on" : "off"}
                    />
                    <button
                      type="submit"
                      className="merchant-workspace-secondary-btn shrink-0"
                    >
                      Guardar
                    </button>
                  </form>

                  <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
                    <form action={boundUpdate}>
                      <input type="hidden" name="name" value={category.name} />
                      <input
                        type="hidden"
                        name="active"
                        value={category.active ? "off" : "on"}
                      />
                      <button
                        type="submit"
                        className={
                          category.active
                            ? "inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                            : "inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
                        }
                        aria-pressed={category.active}
                        aria-label={`${category.active ? "Ocultar" : "Mostrar"} ${category.name}`}
                        title={
                          category.active
                            ? "Ocultar categoría de la tienda"
                            : "Mostrar categoría en la tienda"
                        }
                      >
                        <span
                          aria-hidden="true"
                          className={
                            category.active
                              ? "relative inline-flex h-6 w-11 shrink-0 rounded-full bg-emerald-500"
                              : "relative inline-flex h-6 w-11 shrink-0 rounded-full bg-slate-300"
                          }
                        >
                          <span
                            className={
                              category.active
                                ? "absolute top-1 left-6 h-4 w-4 rounded-full bg-white shadow-sm"
                                : "absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm"
                            }
                          />
                        </span>
                        {category.active ? "Activa" : "Inactiva"}
                      </button>
                    </form>

                    <form action={boundUp}>
                      <button
                        type="submit"
                        disabled={index === 0}
                        className="merchant-workspace-secondary-btn min-w-11 px-3 disabled:opacity-40"
                        aria-label={`Subir ${category.name}`}
                        title="Subir categoría"
                      >
                        ↑
                      </button>
                    </form>
                    <form action={boundDown}>
                      <button
                        type="submit"
                        disabled={index === categories.length - 1}
                        className="merchant-workspace-secondary-btn min-w-11 px-3 disabled:opacity-40"
                        aria-label={`Bajar ${category.name}`}
                        title="Bajar categoría"
                      >
                        ↓
                      </button>
                    </form>
                    <form action={boundDelete}>
                      <button
                        type="submit"
                        className="merchant-workspace-danger-btn"
                        aria-label={`Eliminar ${category.name}`}
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </MerchantWorkspacePage>
  );
}
