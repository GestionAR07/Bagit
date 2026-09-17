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
import styles from "../catalog-polish.module.css";

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
      <div className={styles.catalogShell}>
        <nav
          className={`${styles.tabBar} merchant-workspace-toolbar`}
          aria-label="Catálogo"
        >
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

        <section className={styles.categoryLead}>
          <div className={styles.categoryLeadRow}>
            <div>
              <h2 className={styles.categoryLeadTitle}>Ordená tu menú</h2>
              <p className={styles.categoryLeadCopy}>
                Las categorías ayudan a tus clientes a encontrar productos más
                rápido. Podés renombrarlas, pausarlas y cambiar su orden.
              </p>
            </div>
            <span className={styles.categoryCounter}>
              {categories.length} categoría{categories.length === 1 ? "" : "s"}
            </span>
          </div>
        </section>

        <section
          className={`${styles.createCategoryCard} merchant-workspace-card merchant-workspace-form-panel`}
        >
          <div className={styles.createHeader}>
            <p className={styles.formEyebrow}>Organización</p>
            <h2 className={styles.createTitle}>Nueva categoría</h2>
            <p className={styles.createCopy}>
              Usá nombres simples y reconocibles, por ejemplo Empanadas, Bebidas
              o Promociones.
            </p>
          </div>
          <form
            action={boundCreate}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <label className="merchant-workspace-field min-w-0 flex-1">
              <span>Nombre de la categoría</span>
              <input
                name="name"
                required
                placeholder="Ej. Empanadas"
                className="merchant-workspace-input"
              />
            </label>
            <button type="submit" className="merchant-workspace-primary-btn">
              Crear categoría
            </button>
          </form>
        </section>

        {categories.length === 0 ? (
          <section className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">
              +
            </span>
            <h2 className={styles.emptyTitle}>Todavía no hay categorías</h2>
            <p className={styles.emptyCopy}>
              Creá una categoría arriba para poder empezar a cargar productos en
              tu tienda.
            </p>
          </section>
        ) : (
          <ul
            className={`${styles.categoryList} merchant-workspace-category-list`}
          >
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
                  className={`${styles.categoryCard} merchant-workspace-card merchant-workspace-category-card`}
                >
                  <div className={styles.categoryCardHeader}>
                    <span className={styles.categoryOrder}>
                      <span className={styles.orderBadge}>{index + 1}</span>
                      Orden en la tienda
                    </span>
                    <span
                      className={`${styles.categoryStatus} ${
                        category.active ? "" : styles.categoryStatusInactive
                      }`}
                    >
                      {category.active ? "Activa" : "Pausada"}
                    </span>
                  </div>

                  <form action={boundUpdate} className={styles.categoryForm}>
                    <div className={styles.categoryMainRow}>
                      <label className="merchant-workspace-field min-w-0">
                        <span>Nombre</span>
                        <input
                          name="name"
                          defaultValue={category.name}
                          required
                          className="merchant-workspace-input min-w-0"
                        />
                      </label>
                      <label className="merchant-workspace-active-pill">
                        <input
                          type="checkbox"
                          name="active"
                          defaultChecked={category.active}
                          className="merchant-workspace-checkbox"
                        />
                        Mostrar en la tienda
                      </label>
                    </div>
                    <div className={styles.categoryActions}>
                      <button
                        type="submit"
                        className="merchant-workspace-secondary-btn"
                      >
                        Guardar cambios
                      </button>
                      <button
                        formAction={boundUp}
                        type="submit"
                        disabled={index === 0}
                        className={`${styles.moveButton} merchant-workspace-secondary-btn disabled:opacity-40`}
                      >
                        ↑ Subir
                      </button>
                      <button
                        formAction={boundDown}
                        type="submit"
                        disabled={index === categories.length - 1}
                        className={`${styles.moveButton} merchant-workspace-secondary-btn disabled:opacity-40`}
                      >
                        ↓ Bajar
                      </button>
                      <button
                        formAction={boundDelete}
                        type="submit"
                        className="merchant-workspace-danger-btn"
                      >
                        Eliminar
                      </button>
                    </div>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </MerchantWorkspacePage>
  );
}
