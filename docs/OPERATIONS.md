# Bag It Operations Runbook

## 1. Propósito

Este documento es el procedimiento operativo para pasar de desarrollo a un piloto real sin mezclar datos.

Cubre:

- DEV y PROD
- deployment
- migrations
- backup
- restore
- rollback
- incidentes
- credenciales
- Auth / OAuth / recuperación
- Storage

**DEV y PROD nunca deben compartir proyecto Supabase.** Un proyecto incluye Postgres, Auth y Storage. Si producción usa las keys o la URL del proyecto de desarrollo, los pedidos reales quedan en DEV (o al revés).

No asume plan pago de Supabase ni point-in-time recovery. El backup mínimo es un volcado explícito de Postgres, una exportación o procedimiento de Auth, y una copia de los buckets, hechos antes del piloto y antes de cada migración en PROD.

El runbook de código relacionado vive en este repo. La creación del proyecto PROD, el DNS, el HTTPS y las Redirect URLs se hacen fuera del repo.

## 2. Entornos

| Entorno | Uso                      | Base de datos | Auth | Storage |
| ------- | ------------------------ | ------------- | ---- | ------- |
| DEV     | desarrollo y QA          | Supabase DEV  | DEV  | DEV     |
| PROD    | piloto / usuarios reales | Supabase PROD | PROD | PROD    |

No documentar ni commitear project refs reales.

Invariantes:

- `DATABASE_URL` DEV ≠ PROD
- URL de Supabase DEV ≠ PROD
- publishable/anon key DEV ≠ PROD
- secret/service key DEV ≠ PROD
- Storage DEV ≠ PROD
- Auth DEV ≠ PROD

Nunca copiar secretos al repo. `.env.local` es solo la máquina de quien desarrolla. Producción carga las mismas _nombres_ de variables en el hosting, con valores del proyecto PROD.

`MARKETPLACE_DEV_PROJECT_REF` identifica el proyecto DEV autorizado para harnesses de escritura. No es la identidad de PROD y no debe apuntar al proyecto de producción.

`MARKETPLACE_PROD_PROJECT_REF` es el ref esperado cuando `MARKETPLACE_ENV=production`. No es un secreto. DEV y PROD deben ser refs distintos.

## 3. Variables críticas

Nombres reales usados por este repo. En el dashboard de Supabase la publishable key a veces se llama “anon”; la secret key, “service_role”. El código no lee `NEXT_PUBLIC_SUPABASE_ANON_KEY` ni `SUPABASE_SERVICE_ROLE_KEY`.

| Variable                               | Dónde vive  | Rol                                                                                                                             |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                         | SERVER ONLY | Postgres para Drizzle (`getDb`) y `db:migrate`.                                                                                 |
| `NEXT_PUBLIC_SUPABASE_URL`             | CLIENT SAFE | URL del proyecto. Viaja al browser.                                                                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | CLIENT SAFE | Key pública (anon/publishable). Nunca la secret key.                                                                            |
| `SUPABASE_SECRET_KEY`                  | SERVER ONLY | Auth Admin (invites, lookup). Prohibido `NEXT_PUBLIC_SUPABASE_SECRET_KEY`.                                                      |
| `APP_BASE_URL`                         | SERVER ONLY | Origen público de Next. Invites, recovery y OAuth. Ejemplo local `http://localhost:3001`. Producción `https://<dominio-bagit>`. |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`      | CLIENT SAFE | `true` solo después de configurar Google en ese proyecto.                                                                       |
| `MARKETPLACE_ENV`                      | SERVER ONLY | Selecciona DEV/test/PROD. Obligatoria en un runtime que ya sirve con `NODE_ENV=production`. No la infiere `NODE_ENV`.           |
| `MARKETPLACE_DEV_PROJECT_REF`          | SERVER ONLY | Ref exacto del proyecto DEV. Harnesses y guard. Nunca el ref de PROD. Nunca en Git.                                             |
| `MARKETPLACE_PROD_PROJECT_REF`         | SERVER ONLY | Ref esperado de PROD. No es secreto. Obligatorio solo si `MARKETPLACE_ENV=production`.                                          |
| `E2E_ALLOW_WRITES`                     | LOCAL ONLY  | Debe ser `I_ACCEPT_E2E_DEV_WRITES` y solo en la shell del operador. No en CI ni en hosting PROD.                                |
| `E2E_MODE`                             | LOCAL ONLY  | `WRITE_DEV` lo setea `npm run e2e:dev`. CI usa READ_ONLY.                                                                       |

`NODE_ENV` y `VERCEL_ENV` los setea el runtime/host. Si alguno es `production`, los scripts de escritura contra DEV abortan. No los uses para “marcar” un `.env.local` de desarrollo, ni para elegir el proyecto Supabase. `next build` y CI usan `NODE_ENV=production` y no por eso aplican las reglas PROD.

`MARKETPLACE_ENV` es la única selección de entorno. En un proceso que ya está sirviendo (`NODE_ENV=production` y `NEXT_PHASE` distinto de `phase-production-build`) tiene que estar puesta; si falta, el proceso se niega a abrir DB o Auth. El valor de producción es `production`. `next build` es la excepción: durante esa fase Next setea `NEXT_PHASE=phase-production-build` y un `MARKETPLACE_ENV` vacío sigue permitido. `NEXT_PHASE` no elige DEV, PROD ni el proyecto.

El guard corre al abrir `getDb()`, al crear clientes Supabase de servidor (sesión, admin, proxy y `/auth/confirm`) y al cargar `drizzle.config.ts` vía `getDatabaseConfig`. `assertSafeRuntimeEnvironment` exige primero esa presencia; después `validateRuntimeEnvironment` aplica las reglas. Solo `MARKETPLACE_ENV=production` exige ref PROD, URL de ese proyecto y `APP_BASE_URL` en `https:`. En `development`, si el ref DEV está configurado, la URL pública debe coincidir y no puede ser el ref PROD conocido. `test` y un `next dev` local sin `MARKETPLACE_ENV` no activan esas reglas.

Detecta: PROD apuntando a DEV, DEV apuntando a un PROD conocido, refs iguales, URL de API inválida, `APP_BASE_URL` sin HTTPS en producción, y `DATABASE_URL` que contiene literalmente el ref DEV.

No detecta: que la publishable key, la secret key y `DATABASE_URL` pertenezcan al mismo proyecto; hosts pooler u otras formas de Postgres que no incluyen el ref; un PROD real todavía no creado. No imprime `DATABASE_URL` ni secretos.

## 4. Preflight antes de iniciar producción

Checklist manual. Dominio aún no fijado: usar `https://<dominio-bagit>`.

- [x] Proyecto Supabase PROD creado (distinto de DEV)
- [ ] Postgres separado
- [ ] Auth separado
- [ ] Storage separado
- [ ] Variables PROD cargadas solo en hosting (no en Git, no en `.env.local` de desarrollo)
- [ ] `APP_BASE_URL` apunta a `https://<dominio-bagit>`
- [ ] HTTPS activo
- [ ] Supabase Site URL = `https://<dominio-bagit>`
- [ ] Redirect URLs incluyen `https://<dominio-bagit>/auth/confirm` (y el origen de la app)
- [ ] Google OAuth configurado para el proyecto PROD (origen de producción; redirect del callback de _ese_ Supabase)
- [ ] Recovery configurado para PROD (plantilla + redirect a `/auth/confirm`)
- [ ] Invite configurado para PROD (misma ruta `/auth/confirm`)
- [ ] Buckets `product-images` y `merchant-images` creados en PROD, privados, como en las migraciones
- [ ] Migraciones aplicadas **contra PROD** después de identificar el destino
- [ ] Smoke test: home, login, un pedido de prueba controlado, panel merchant
- [ ] Backup inicial tomado (Postgres + plan de Auth + Storage)

DEV debe seguir con su propio proyecto, `APP_BASE_URL` local y Redirect URLs de localhost. No borrar las allow-list de DEV al configurar PROD.

## 5. Migraciones

Scripts existentes (`package.json`):

```text
npm run db:generate   # genera SQL; no aplica
npm run db:check      # compara schema y migraciones; no escribe datos de negocio
npm run db:migrate    # APLICA migraciones pendientes al DATABASE_URL cargado
```

`drizzle.config.ts` lee `.env.local` si existe. **No ejecutar `db:migrate` solo porque hay un `.env.local`.** Esa URL puede ser DEV, o —peor— una URL de PROD copiada en la máquina local.

No existe todavía un guard de runtime que bloquee migrate contra el proyecto equivocado.

Antes de migrar PROD:

1. Identificar el entorno en voz alta: DEV o PROD.
2. Verificar que `DATABASE_URL` (host/usuario del pooler, sin pegar la contraseña en un ticket) corresponde al proyecto que se quiere cambiar. El usuario del pooler suele ser `postgres.<project-ref>`.
3. Verificar que `NEXT_PUBLIC_SUPABASE_URL` del mismo entorno es el mismo proyecto.
4. Tomar backup (sección 6) si el destino es PROD o tiene datos que no se pueden perder.
5. Ejecutar `npm run db:migrate` solo con ese entorno cargado (hosting o shell dedicada; no reutilizar la shell de desarrollo).
6. Verificar que la app de _ese_ entorno arranca y un smoke mínimo pasa.
7. Registrar fecha, entorno y resultado. No editar migraciones ya aplicadas (`drizzle/0000_…`).

`db:generate` no se corre contra producción como paso de release. El SQL se revisa en Git y recién después se aplica.

## 6. Backup

Hacer backup **antes** del primer tráfico real y **antes** de cada `db:migrate` en PROD.

### PostgreSQL

Incluye el estado de negocio que Bag It no puede reconstruir desde el código:

- merchants, categorías, productos, opciones, stock
- orders, ítems, eventos, deliveries
- `user_profiles` y `merchant_users` (memberships)
- geografía, horarios, pagos, zonas
- paths de imágenes (`image_path`, `cover_image_path`), no los archivos

Cómo obtenerlo depende del plan de Supabase (descarga/backup del dashboard o `pg_dump` con una URL de sesión/directa autorizada). No asumir PITR.

### Supabase Auth

`auth.users` no está modelado ni migrado por Drizzle. Un restore solo de tablas `public` deja perfiles sin usuario Auth, o usuarios sin poder entrar.

Exportar o documentar el procedimiento de Auth del proyecto (usuarios, identidades Google vinculadas) como paso aparte. Si el plan no ofrece export automático, registrar al menos qué cuentas ADMIN/OWNER existen y cómo se reinvitarían, y no prometer un restore completo de contraseñas.

### Supabase Storage

Buckets usados por la app:

- `product-images`
- `merchant-images`

Son privados. La base guarda paths. Restaurar la DB sin copiar los objetos deja productos y portadas con referencias rotas. Copiar Storage del mismo momento aproximado que el volcado de Postgres.

### Secrets

No forman parte del backup de datos. Viven en el hosting y en un almacén fuera del repo. Un backup de base no debe incluir `DATABASE_URL`, `SUPABASE_SECRET_KEY` ni cookies.

No commitear el archivo de backup.

## 7. Restore

Probar el restore **la primera vez en un proyecto vacío o descartable**. Nunca la primera vez sobre PROD.

1. Detener escrituras (no invitar comercios, no tomar pedidos; apagar o bloquear la app si hace falta).
2. Identificar el backup (fecha, entorno, qué incluye: Postgres, Auth, Storage).
3. Restaurar PostgreSQL en el proyecto destino (vacío o el de recuperación, no “encima” de DEV mezclado).
4. Restaurar Auth si el backup lo cubre y el procedimiento existe. Si no, no dar por recuperadas las sesiones ni las contraseñas.
5. Restaurar Storage de los buckets `product-images` y `merchant-images`.
6. Verificar consistencia: un producto con `image_path` tiene objeto; un `user_profiles.id` esperado existe en Auth; un pedido apunta a un merchant que existe.
7. Arrancar la aplicación apuntando **solo** a ese proyecto restaurado.
8. Smoke: home, login, historial de un pedido conocido, inbox merchant.
9. Revisar stock y pedidos recientes contra la hora del backup. Pedidos posteriores al backup no vuelven solos.
10. Reabrir escrituras solo después de ese chequeo.

No borrar filas a mano para “hacer lugar” al restore.

## 8. Rollback de aplicación

### Rollback de código

Volver al deployment / commit anterior que ya estaba en producción.

No revierte migraciones. Si el release nuevo ya aplicó SQL, el código viejo puede no arrancar contra el schema nuevo. En ese caso no alcanza con el rollback de app: hay que decidir restaurar backup (abajo) o corregir hacia adelante.

### Rollback de base de datos

Solo con procedimiento explícito y backup identificado.

Las migraciones de Bag It no se asumen reversibles. No escribir ni ejecutar SQL inverso improvisado sobre producción.

Si el schema o los datos de negocio quedaron mal, restaurar el backup de la sección 7 en un proyecto de recuperación, verificar, y recién después cortar el tráfico. No “desmigrar” en vivo.

## 9. Auth / OAuth / Recovery

Al pasar de localhost a `https://<dominio-bagit>` hay que cambiar configuración externa. El código ya arma redirects con `APP_BASE_URL`.

Rutas que deben estar en la allow-list de **ese** proyecto Supabase:

- `https://<dominio-bagit>/auth/confirm` — confirmación de email, invite, recovery y callback PKCE de Google
- Site URL = `https://<dominio-bagit>`

Flujos que dependen de eso:

- registro público (`/auth/confirm`)
- invitación de OWNER (`/auth/confirm?next=…`)
- “Olvidé mi contraseña” → `/auth/confirm?type=recovery&…` → `/set-password?flow=recovery`
- Google OAuth → Supabase callback del **proyecto PROD** → `APP_BASE_URL/auth/confirm` → `/auth/oauth/continue`

Google (consola del cliente OAuth de producción, no la de DEV):

- origen JavaScript: `https://<dominio-bagit>`
- redirect URI: el callback que muestra Supabase PROD (`https://<project-ref-prod>.supabase.co/auth/v1/callback`), no el de DEV

No pegar Client ID, Client Secret ni service keys en Git ni en este documento.

DEV sigue con `http://localhost:3001` (o el puerto local) y su propio proyecto. Desactivar Google en un entorno no debe apagar el otro: `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` es por despliegue.

Detalle de branding y linking: `docs/GOOGLE_OAUTH.md`.

## 10. Incidentes

Conservar evidencia. No borrar usuarios ni pedidos para “arreglar”.

### SEV-1

- pedidos creados mal, stock corrupto o doble cobro/compromiso operativo
- pérdida o corrupción de datos
- acceso no autorizado (otro comercio, admin indebido)
- PROD apuntando a DEV (o DEV recibiendo tráfico real)

1. Detener escrituras nuevas si el daño puede seguir (mantenimiento o quitar el dominio del proceso que escribe mal).
2. No borrar datos.
3. Preservar logs del hosting y la hora aproximada. No pegar secretos ni emails completos en un ticket público.
4. Anotar hora de inicio y último síntoma.
5. Verificar el último deploy (commit).
6. Verificar si hubo `db:migrate` después del último backup.
7. Revisar qué proyecto usan `DATABASE_URL` y `NEXT_PUBLIC_SUPABASE_URL` (ref, no el secreto).
8. Decidir: rollback de código, corrección hacia adelante, o restore. Si hay duda de corrupción, no seguir operando encima.
9. Validar stock, un pedido conocido y el aislamiento merchant antes de reabrir.

### SEV-2

- login roto
- checkout caído
- el comercio no puede aceptar/preparar/completar

Tratar como incidente de piloto: avisar al comercio, no inventar pedidos a mano en la base, reproducir en el entorno que falla, corregir o volver al deploy anterior si el schema no cambió.

### SEV-3

- error visual no bloqueante
- copy, layout, sonido

Puede esperar a una corrección normal si no afecta dinero, stock ni acceso.

Canal humano: una persona de guardia con acceso al hosting y al dashboard de **PROD**, distinta de quien solo tiene DEV.

## 11. Logs operativos

El baseline local en `src/lib/operational-log.ts` escribe JSON seguro a la salida estándar. Sentry complementa este registro con captura remota en servidor, edge y cliente; debe comprobarse la recepción real de un error controlado antes del piloto.

Eventos conectados:

- `order.place_ok` / `order.place_failed`
- `order.cancel_ok` / `order.cancel_failed`
- `merchant.transition_ok` / `merchant.transition_failed`
- `oauth.continue_failed` (solo `stage`)

Campos permitidos: `stage`, `error_code`, `operation`, `status_from`, `status_to`, `actor_type`, `delivery_type`, `storage_bucket`, `provider`, `reason_code`.

Prohibido en logs: passwords, tokens, cookies, Authorization, service role, keys, emails, teléfonos, direcciones, nombres, bodies, objetos Supabase, `Error.message` crudo, IDs/UUIDs.

Si el logger falla al serializar, no debe romper el pedido. Storage upload e Auth invite todavía no emiten eventos.

Los fallos de render usan `src/app/error.tsx`, `global-error.tsx` y `not-found.tsx`. Esas pantallas no muestran `error.message`, stack ni digest. La instrumentación de Sentry captura errores remotos sin exponer detalles técnicos al usuario.

`GET /api/health` es solo liveness: HTTP 200 y `{"status":"ok"}` si el proceso Next responde. No prueba PostgreSQL, Auth ni Storage. No escribe logs. Un chequeo de readiness queda para más adelante, cuando un balanceador lo necesite de verdad.

## 12. Credenciales

- Los secrets no van a Git, capturas, chats ni issues.
- `SUPABASE_SECRET_KEY` solo en servidor. La publishable key sí puede ir al browser.
- DEV y PROD tienen secretos distintos. Rotar uno no actualiza al otro.
- Si una credencial se filtra: rotarla en Supabase, actualizar el hosting, invalidar sesiones si aplica, y no reutilizar la clave vieja en `.env.local`.
- Después de rotar, la app debe reiniciarse con la variable nueva. Un proceso viejo sigue usando la anterior.

## 13. Checklist GO / NO-GO del piloto

No iniciar con comercios reales si falta un ítem de INFRA o AUTH. OPERATIONS marcado pendiente no bloquea un ensayo interno, sí el corte a usuarios reales.

### INFRA

- [x] Supabase PROD separado
- [ ] dominio + HTTPS
- [ ] secrets PROD solo en hosting
- [ ] migrations aplicadas al proyecto correcto
- [ ] backup inicial tomado

### AUTH

- [ ] login email/password
- [ ] Google OAuth en PROD (si el piloto lo usa)
- [ ] recovery email → `/set-password`
- [ ] Admin entra
- [ ] Owner entra a su merchant

### BUYER

- [ ] storefront
- [ ] cart
- [ ] checkout
- [ ] place order
- [ ] historial en `/cuenta`

### MERCHANT

- [ ] recibe pedido
- [ ] sonido
- [ ] aceptar
- [ ] rechazar
- [ ] preparar
- [ ] ready
- [ ] completar retiro o delivery

### OPERATIONS

- [x] logs operativos mínimos y captura remota con Sentry
- [x] error boundaries propios (sin captura remota de render)
- [ ] backup
- [ ] restore ensayado en proyecto descartable
- [x] health de liveness (`GET /api/health`; no es readiness)
- [ ] canal humano de incidente

### DEVICES

- [ ] Android real
- [ ] iPhone real
- [ ] desktop
- [ ] viewport pequeño

Documento de apoyo: `docs/DEPENDENCY_SECURITY.md` (auditoría de dependencias ya registrada; no sustituye este runbook).
