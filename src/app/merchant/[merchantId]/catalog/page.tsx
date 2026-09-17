import Link from "next/link";
import { redirect } from "next/navigation";
import { MerchantWorkspacePage } from "@/components/merchant/merchant-workspace-page";
import { isAuthzError } from "@/server/auth/errors";
import { requireMerchantMembership } from "@/server/auth/authorization";
import {
  listMerchantCategories,
  listProductsForMerchant,
} from "@/infrastructure/db/repositories/catalog-repository";
import { findMerchantDetailForMember } from "@/infrastructure/db/repositories/merchant-repository";
import { formatMoneyCentsArs } from "@/lib/format-money";
import { formatMerchantCategoryLabel } from "@/lib/format-category-label";
import { getMerchantProductAvailabilityStatus } from "@/lib/product-availability-presentation";
import { moneyCents } from "@/domain/money/money-cents";
import { createProductImageSignedUrls } from "@/infrastructure/storage/product-images";
import { toggleProductAvailabilityAction } from "./actions";
import { ProductAvailabilityToggle } from "./product-availability-toggle";
import { ProductImageThumbnail } from "./product-image-thumbnail";
import styles from "./catalog-polish.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ merchantId: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    available?: string;
  }>;
};

async function loadCatalogPage(merchantId: string) {
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
        redirect(`/login?next=/merchant/${merchantId}/catalog`);
      }
      redirect("/login?next=/merchant&error=forbidden");
    }
    throw error;
  }
}

export default async function CatalogPage({ params, searchParams }: PageProps) {
  const { merchantId } = await params;
  const filters = await searchParams;
  const { merchant } = await loadCatalogPage(merchantId);

  const categories = await listMerchantCategories(merchantId);
  const products = await listProductsForMerchant(merchantId, {
    search: filters.q,
    categoryId: filters.category,
    available:
      filters.available === "yes"
        ? true
        : filters.available === "no"
          ? false
          : undefined,
  });
  const signedUrls = await createProductImageSignedUrls(
    products
      .map((product) => product.imagePath)
      .filter((path): path is string => Boolean(path)),
  );
  const hasFilters = Boolean(filters.q || filters.category || filters.available);
  const activeCategoryCount = categories.filter((category) => category.active).length;

  return (
    <MerchantWorkspacePage
      merchantId={merchantId}
      merchantName={merchant.name}
      activeSection="catalog"
      title="Catálogo"
      description="Gestioná productos y disponibilidad operativa."
      action={
        <Link
          href={`/merchant/${merchantId}/catalog/products/new`}
          className="merchant-workspace-primary-btn"
        >
          + Nuevo producto
        </Link>
      }
    >
      <div className={styles.catalogShell}>
        <nav
          className={`${styles.tabBar} merchant-workspace-toolbar`}
          aria-label="Catálogo"
        >
          <Link
            href={`/merchant/${merchantId}/catalog`}
            className="merchant-workspace-toolbar-link merchant-workspace-toolbar-link--active"
            aria-current="page"
          >
            Productos
          </Link>
          <Link
            href={`/merchant/${merchantId}/catalog/categories`}
            className="merchant-workspace-toolbar-link"
          >
            Categorías
          </Link>
        </nav>

        <section className={styles.catalogLead}>
          <div>
            <p className={styles.leadEyebrow}>Tu vidriera digital</p>
            <h2 className={styles.leadTitle}>
              Mantené el catálogo claro, actualizado y listo para vender.
            </h2>
            <p className={styles.leadCopy}>
              Organizá productos por categoría, ajustá disponibilidad y entrá a
              cada ficha cuando necesites cambiar precio, stock u opciones.
            </p>
          </div>
          <div className={styles.leadMetrics} aria-label="Resumen del catálogo">
            <span className={styles.metricPill}>
              <span className={styles.metricValue}>{products.length}</span>
              resultado{products.length === 1 ? "" : "s"}
            </span>
            <span className={styles.metricPill}>
              <span className={styles.metricValue}>{activeCategoryCount}</span>
              categoría{activeCategoryCount === 1 ? "" : "s"} activa
              {activeCategoryCount === 1 ? "" : "s"}
            </span>
          </div>
        </section>

        <section className={`${styles.filterPanel} merchant-workspace-card`}>
          <div className={styles.filterHeader}>
            <div>
              <h2 className={styles.filterTitle}>Encontrá un producto</h2>
              <p className={styles.filterCopy}>
                Buscá por nombre y combiná categoría con disponibilidad.
              </p>
            </div>
            {hasFilters ? (
              <Link
                href={`/merchant/${merchantId}/catalog`}
                className={styles.clearFilters}
              >
                Limpiar filtros
              </Link>
            ) : null}
          </div>

          <form method="get" className="merchant-workspace-filters">
            <label className="merchant-workspace-field">
              <span>Buscar</span>
              <input
                name="q"
                defaultValue={filters.q ?? ""}
                placeholder="Ej. Empanada carne"
                className="merchant-workspace-input"
              />
            </label>
            <label className="merchant-workspace-field">
              <span>Categoría</span>
              <select
                name="category"
                defaultValue={filters.category ?? ""}
                className="merchant-workspace-input"
              >
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {formatMerchantCategoryLabel(category.name, category.active)}
                  </option>
                ))}
              </select>
            </label>
            <label className="merchant-workspace-field">
              <span>Disponibilidad</span>
              <select
                name="available"
                defaultValue={filters.available ?? ""}
                className="merchant-workspace-input"
              >
                <option value="">Todas</option>
                <option value="yes">Disponible</option>
                <option value="no">Pausados (no disponibles)</option>
              </select>
            </label>
            <div className="merchant-workspace-filters-action">
              <button
                type="submit"
                className="merchant-workspace-secondary-btn"
              >
                Filtrar
              </button>
            </div>
          </form>
        </section>

        {products.length === 0 ? (
          <section className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">
              +
            </span>
            <h2 className={styles.emptyTitle}>
              {hasFilters
                ? "No encontramos productos con esos filtros"
                : "Tu catálogo todavía está vacío"}
            </h2>
            <p className={styles.emptyCopy}>
              {hasFilters
                ? "Probá limpiar los filtros o cambiá los criterios de búsqueda."
                : "Creá tu primer producto para empezar a construir la tienda que van a ver tus clientes."}
            </p>
            <div className={styles.emptyAction}>
              {hasFilters ? (
                <Link
                  href={`/merchant/${merchantId}/catalog`}
                  className="merchant-workspace-secondary-btn"
                >
                  Ver todo el catálogo
                </Link>
              ) : (
                <Link
                  href={`/merchant/${merchantId}/catalog/products/new`}
                  className="merchant-workspace-primary-btn"
                >
                  Crear el primero
                </Link>
              )}
            </div>
          </section>
        ) : (
          <ul
            className={`${styles.productsGrid} merchant-workspace-product-grid`}
          >
            {products.map((product) => {
              const status = getMerchantProductAvailabilityStatus(product);

              return (
                <li key={product.id} className="merchant-workspace-product-card">
                  <div className="merchant-workspace-product-body">
                    <ProductImageThumbnail
                      name={product.name}
                      size="md"
                      imageUrl={
                        product.imagePath
                          ? (signedUrls.get(product.imagePath) ?? null)
                          : null
                      }
                    />
                    <div className="merchant-workspace-product-copy min-w-0">
                      <p className="merchant-workspace-product-name">
                        {product.name}
                      </p>
                      <p className="merchant-workspace-product-meta">
                        {formatMerchantCategoryLabel(
                          product.categoryName,
                          product.categoryActive,
                        )}
                      </p>
                      <p className="merchant-workspace-product-price">
                        {formatMoneyCentsArs(moneyCents(product.priceCents))}
                      </p>
                      <p className="merchant-workspace-product-status">
                        <span
                          className={
                            status.operationallyAvailable
                              ? "merchant-workspace-status-live"
                              : "merchant-workspace-status-muted"
                          }
                        >
                          {status.label}
                        </span>
                        {status.detail && (
                          <span className="merchant-workspace-status-muted">
                            {" "}
                            · {status.detail}
                          </span>
                        )}
                        {product.optionGroupCount > 0 && (
                          <span className="merchant-workspace-status-muted">
                            {" "}
                            · {product.optionGroupCount} grupo
                            {product.optionGroupCount === 1 ? "" : "s"} de
                            opciones
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="merchant-workspace-product-actions">
                    {product.active && (
                      <ProductAvailabilityToggle
                        merchantId={merchantId}
                        productId={product.id}
                        available={product.available}
                        action={toggleProductAvailabilityAction}
                      />
                    )}
                    <Link
                      href={`/merchant/${merchantId}/catalog/products/${product.id}`}
                      className="merchant-workspace-secondary-btn"
                    >
                      Editar
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </MerchantWorkspacePage>
  );
}
