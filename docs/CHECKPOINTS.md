# Checkpoints — Bag It

Este archivo resume hitos funcionales relevantes. Los commits históricos detallados permanecen en Git; los checkpoints sirven como referencia de producto, no como sustituto del historial.

## Fundación

### `PROJECT_ARCHITECTURE_V1_APPROVED`

Arquitectura general del proyecto aprobada.

### `BASE_TECH_FOUNDATION_READY`

Next.js/TypeScript/Tailwind, calidad y estructura base operativas.

### `CORE_DOMAIN_MODEL_HARDENED`

Dominio y reglas principales validados.

### `CORE_PERSISTENCE_SCHEMA_VALIDATED`

PostgreSQL + Drizzle + migraciones base aplicadas/validadas en DEV.

### `AUTH_FOUNDATION_VALIDATED`

Supabase Auth SSR, perfiles, roles, login/logout, ADMIN y memberships merchant validados.

### `PUBLIC_PASSWORD_RECOVERY_IMPLEMENTED`

La UI pública “Olvidé mi contraseña” solicita recovery mediante Supabase sin usar privilegios admin, mantiene respuesta neutral para no revelar existencia de cuentas y reutiliza `/auth/confirm` → `/set-password`.

### `PUBLIC_PASSWORD_RECOVERY_END_TO_END_VALIDATED`

El flujo externo real quedó validado en DEV: email de recuperación → enlace de Supabase → callback a Bag It → `/set-password` → contraseña nueva persistida → retorno al login. Reutilizar la contraseña actual muestra “La nueva contraseña debe ser distinta de la contraseña actual.”

### `DEPENDENCY_SECURITY_AUDIT_RECORDED`

`docs/DEPENDENCY_SECURITY.md` registra `npm audit` del lockfile: hallazgos moderate solo en `drizzle-kit` / esbuild de desarrollo, no en el runtime de Next. No sustituye observabilidad ni un entorno PROD.

## Catálogo y storefront

### `PRODUCT_IMAGES_STORAGE_READY`

Imágenes de producto con Storage y persistencia de path validadas.

### `PUBLIC_STOREFRONT_DISCOVERY_VALIDATED`

Discovery público, zonas, categorías, tarjetas de comercio y storefront responsive validados.

### `MERCHANT_STOREFRONT_CATALOG_VALIDATED`

Catálogo público con disponibilidad, stock, opciones y presentación de comercio integrado.

## Comprador

### `BUYER_CART_CHECKOUT_VALIDATED`

Carrito persistente, checkout, retiro/delivery, pagos, mínimos y review autoritativo funcionales.

### `BUYER_ORDER_IDEMPOTENCY_VALIDATED`

Confirmación idempotente y recuperación ante respuesta perdida validadas.

### `BUYER_ADVERSARIAL_CHECKOUT_VALIDATED`

Carreras de stock, requote, producto que deja de estar disponible y configuración de opciones obsoleta bloqueadas correctamente.

### `BUYER_CRITICAL_E2E_VALIDATED`

Batería crítica WRITE_DEV comprador/comercio cerrada: no hay persistencia ni descuento de stock cuando una revalidación invalida el pedido.

## Operación merchant

### `MERCHANT_ORDER_READ_ONLY_INBOX_READY`

Inbox merchant-scoped y detalle de pedido disponibles.

### `MERCHANT_ORDER_LIFECYCLE_VALIDATED`

Flujo `PENDING → ACCEPTED → PREPARING → READY → COMPLETED` validado para retiro.

### `MERCHANT_DELIVERY_LIFECYCLE_VALIDATED`

Delivery propio `PENDING → IN_TRANSIT → DELIVERED` y finalización de Order validados sin doble descuento de stock.

### `ORDER_CANCELLATION_RESTOCK_READY`

Cancelación/rechazo transaccional y restitución de stock validados.

### `MERCHANT_REALTIME_PRIVATE_VALIDATED`

Realtime de pedidos merchant-scoped y alertas de nuevos pedidos integrados.

## Onboarding

### `MERCHANT_ONBOARDING_ACTIVE_FLOW_VALIDATED`

Flujo actual validado:

```text
solicitud pública
→ aprobación ADMIN
→ Merchant DRAFT
→ OWNER configura comercio
→ readiness completo
→ activación ADMIN
→ ACTIVE visible en Bag It
```

El E2E automatizado DEV valida el producto completo usando un OWNER temporal ya confirmado; la entrega real de email se revalida manualmente cuando cambia Auth/SMTP/template.

## Seguridad

### `MERCHANT_MULTITENANCY_SECURITY_VALIDATED`

Validado en DEV:

- `STAFF` accede a su propio workspace;
- el mismo usuario recibe `forbidden` al intentar rutas equivalentes de otro comercio;
- RLS sólo expone el Merchant del que es miembro;
- un `UPDATE` directo autenticado sobre `merchants` es rechazado y no modifica el estado autoritativo;
- catálogo, delivery, pagos, portada, disponibilidad y pedidos mantienen autorización server-side merchant-scoped.

Merge de referencia: PR #17, `92878e3` en `main`.

## Estado actual

### `PRE_PILOT_SAFE_OPERATIONAL_LOGGING_IMPLEMENTED`

Logger central `src/lib/operational-log.ts` con allowlist. Eventos P0 de place, cancel, transición merchant y fallo OAuth. No registra PII, tokens ni `Error.message`. No es observabilidad completa: no hay sink externo.

### `PRE_PILOT_SAFE_ERROR_BOUNDARIES_IMPLEMENTED`

`src/app/error.tsx`, `global-error.tsx` y `not-found.tsx` muestran copy Bag It y un retorno a `/`. No renderizan `error.message`, stack ni digest. `global-error` reemplaza el root layout y no importa Auth, DB ni Supabase. Los fallos de render del cliente todavía no tienen captura remota.

### `PRE_PILOT_LIVENESS_HEALTH_IMPLEMENTED`

`GET /api/health` responde `{"status":"ok"}` si el proceso web está vivo. No consulta PostgreSQL, Auth ni Storage. Readiness queda fuera de este endpoint.

### `PRE_PILOT_ENVIRONMENT_GUARD_IMPLEMENTED`

`src/config/runtime-environment.ts` rechaza mezclas claras de DEV y PROD. Solo `MARKETPLACE_ENV` selecciona el entorno. Un proceso que ya sirve con `NODE_ENV=production` no puede arrancar si esa variable falta; `next build` queda exceptuado. Supabase PROD ya está creado y conectado; el guard no prueba por sí solo que todas las keys y `DATABASE_URL` pertenezcan al mismo proyecto.

### `PRE_PILOT_SENTRY_OBSERVABILITY_IMPLEMENTED`

Sentry está integrado en servidor, edge y cliente, con configuración de producción y error boundaries instrumentados. La recepción real de un error controlado debe revalidarse antes de abrir el piloto.

### `PRE_PILOT_OPERATIONS_BASELINE_IN_PROGRESS`

Runbook en [`OPERATIONS.md`](./OPERATIONS.md). No marca como hecho lo que la app todavía no tiene.

Hecho en esta baseline documental:

- separación DEV/PROD, migraciones, backup, restore, rollback, incidentes y cutover de Auth descritos;
- recuperación de contraseña E2E DEV ya validada;
- auditoría de dependencias registrada.

Estado externo actual:

- Supabase PROD separado y Netlify productivo con HTTPS: completados;
- Sentry remoto para servidor, edge y cliente: implementado;
- dominio propio, Google OAuth y configuración final de marca: pendientes;
- backup inicial y ensayo de restore en proyecto descartable: pendientes;
- QA en Android, iPhone y viewport pequeño: pendiente.

### `PRE_PILOT_POLISH_IN_PROGRESS`

Sigue en paralelo, sin cerrar operación:

- eliminar warnings conocidos;
- endurecer fallbacks públicos;
- accesibilidad y responsive final.

## Próximo checkpoint objetivo

### `PRE_PILOT_READY`

Se alcanza cuando el producto queda listo para una prueba controlada con un comercio real de Rawson/Playa Unión, teléfonos reales y operación supervisada, sin mezclar DEV con producción.
