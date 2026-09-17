import Link from "next/link";
import { redirect } from "next/navigation";
import { MerchantWorkspacePage } from "@/components/merchant/merchant-workspace-page";
import { isAuthzError } from "@/server/auth/errors";
import { requireMerchantMembership } from "@/server/auth/authorization";
import { listActiveMerchantCategories } from "@/infrastructure/db/repositories/catalog-repository";
import { findMerchantDetailForMember } from "@/infrastructure/db/repositories/merchant-repository";
import { createProductAction } from "../../actions";
import { ProductFormSubmitButton } from "../../product-form-submit-button";
import { ProductStockControl } from "../../product-stock-control";
import styles from "../../catalog-polish.module.css";

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
        redirect(`/login?next=/merchant/${merchantId}/catalog/products/new`);
      }
      redirect("/login?next=/merchant&error=forbidden");
    }
    throw error;
  }
}

export default async function NewProductPage({ params }: PageProps) {
  const { merchantId } = await params;
  const { merchant } = await loadPage(merchantId);
  const categories = await listActiveMerchantCategories(merchantId);

  if (categories.length === 0) {
    return (
      <MerchantWorkspacePage
        merchantId={merchantId}
        merchantName={merchant.name}
        activeSection="catalog"
        title="Nuevo producto"
        description="Agregá un producto al catálogo de tu comercio."
      >
        <div className={styles.catalogShell}>
          <section className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">
              +
            </span>
            <h2 className={styles.emptyTitle}>Primero necesitás una categoría</h2>
            <p className={styles.emptyCopy}>
              No hay categorías activas. Reactivá una categoría o creá una nueva
              antes de agregar productos.
            </p>
            <div className={styles.emptyAction}>
              <Link
                href={`/merchant/${merchantId}/catalog/categories`}
                className="merchant-workspace-primary-btn"
              >
                Ir a categorías
              </Link>
            </div>
          </section>
        </div>
      </MerchantWorkspacePage>
    );
  }

  const boundCreate = createProductAction.bind(null, merchantId);

  return (
    <MerchantWorkspacePage
      merchantId={merchantId}
      merchantName={merchant.name}
      activeSection="catalog"
      title="Nuevo producto"
      description="Agregá un producto al catálogo de tu comercio."
      action={
        <Link
          href={`/merchant/${merchantId}/catalog`}
          className="merchant-workspace-secondary-btn"
        >
          ← Catálogo
        </Link>
      }
    >
      <div className={styles.productCreateLayout}>
        <form
          action={boundCreate}
          className={`${styles.productFormCard} merchant-workspace-card merchant-workspace-product-form`}
        >
          <header className={styles.formHeader}>
            <div>
              <p className={styles.formEyebrow}>Alta de producto</p>
              <h2 className={styles.formTitle}>Información del producto</h2>
              <p className={styles.formCopy}>
                Cargá lo esencial ahora. Después vas a poder sumar foto,
                variantes y extras desde la ficha del producto.
              </p>
            </div>
            <span className={styles.formBadge}>Borrador editable</span>
          </header>

          <div className={styles.productFormInner}>
            <section className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <span className={styles.sectionNumber}>1</span>
                <div>
                  <h3 className={styles.sectionTitle}>Datos principales</h3>
                  <p className={styles.sectionCopy}>
                    Nombre, categoría, precio y control de stock.
                  </p>
                </div>
              </div>

              <div className="merchant-workspace-product-grid">
                <label className="merchant-workspace-field">
                  <span>Nombre</span>
                  <input
                    name="name"
                    required
                    placeholder="Ej. Empanada Carne"
                    className="merchant-workspace-input"
                  />
                </label>

                <label className="merchant-workspace-field">
                  <span>Categoría</span>
                  <select
                    name="merchantCategoryId"
                    required
                    className="merchant-workspace-input"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="merchant-workspace-field">
                  <span>Precio (ARS)</span>
                  <input
                    name="priceInput"
                    required
                    inputMode="decimal"
                    placeholder="2500 o 2500,50"
                    className="merchant-workspace-input"
                  />
                </label>

                <ProductStockControl />
              </div>
            </section>

            <section className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <span className={styles.sectionNumber}>2</span>
                <div>
                  <h3 className={styles.sectionTitle}>Descripción</h3>
                  <p className={styles.sectionCopy}>
                    Contale al cliente qué incluye o qué hace especial al producto.
                  </p>
                </div>
              </div>

              <label className="merchant-workspace-field merchant-workspace-field--full">
                <span>Descripción</span>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Ej. Empanada casera de carne cortada a cuchillo."
                  className="merchant-workspace-input merchant-workspace-textarea"
                />
              </label>
            </section>

            <section className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <span className={styles.sectionNumber}>3</span>
                <div>
                  <h3 className={styles.sectionTitle}>Publicación</h3>
                  <p className={styles.sectionCopy}>
                    Elegí si se muestra y si puede pedirse desde el primer momento.
                  </p>
                </div>
              </div>

              <div className="merchant-workspace-commerce-states">
                <p className="merchant-workspace-commerce-states-title">
                  Estados comerciales
                </p>
                <label className="merchant-workspace-check-row">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked
                    className="merchant-workspace-checkbox"
                  />
                  <span className="merchant-workspace-check-copy">
                    <span className="merchant-workspace-check-title">
                      Mostrar en la tienda
                    </span>
                    <span className="merchant-workspace-check-help">
                      Visible para tus clientes.
                    </span>
                  </span>
                </label>
                <label className="merchant-workspace-check-row">
                  <input
                    type="checkbox"
                    name="available"
                    value="on"
                    defaultChecked
                    className="merchant-workspace-checkbox"
                  />
                  <span className="merchant-workspace-check-copy">
                    <span className="merchant-workspace-check-title">
                      Disponible para pedir
                    </span>
                    <span className="merchant-workspace-check-help">
                      Podés pausarlo temporalmente sin eliminarlo.
                    </span>
                  </span>
                </label>
                <input type="hidden" name="available" value="off" />
              </div>
            </section>
          </div>

          <footer className={styles.formFooter}>
            <p className={styles.formFooterCopy}>
              Después de crearlo vas a poder cargar la imagen y configurar
              variantes o extras.
            </p>
            <ProductFormSubmitButton mode="create" />
          </footer>
        </form>

        <aside className={styles.guideCard}>
          <p className={styles.guideEyebrow}>Antes de crear</p>
          <h2 className={styles.guideTitle}>Tres claves para una buena ficha</h2>
          <ul className={styles.guideList}>
            <li className={styles.guideItem}>
              <span className={styles.guideDot}>1</span>
              <span>Usá un nombre corto que el cliente reconozca al instante.</span>
            </li>
            <li className={styles.guideItem}>
              <span className={styles.guideDot}>2</span>
              <span>Ingresá el precio final que querés mostrar en la tienda.</span>
            </li>
            <li className={styles.guideItem}>
              <span className={styles.guideDot}>3</span>
              <span>
                Si tenés unidades limitadas, activá el control de stock desde el
                inicio.
              </span>
            </li>
          </ul>
        </aside>
      </div>
    </MerchantWorkspacePage>
  );
}
