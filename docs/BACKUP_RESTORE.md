# Backup y restore de Supabase PROD

Este procedimiento complementa [OPERATIONS.md](./OPERATIONS.md). El primer objetivo es obtener un backup lógico reproducible sin escribir en producción.

## Alcance real

El script `scripts/backup-supabase-production.ps1` genera:

- `roles.sql`;
- `schema.sql`;
- `data.sql`;
- `manifest.json` con fecha UTC, Project Ref, versión de CLI, tamaños y SHA-256.

También detecta si el volcado de datos contiene `auth.users` y metadata de `storage.objects`. La detección queda registrada en el manifiesto: no se presume.

No incluye:

- archivos reales de los buckets;
- configuración externa de Auth/OAuth, SMTP, Redirect URLs ni API keys;
- secretos;
- prueba de restauración.

Supabase aclara que los backups de base no restauran los objetos almacenados por Storage. Los buckets de Bag It (`product-images` y `merchant-images`) requieren una copia separada.

## Requisitos en Windows

En PowerShell, desde el repositorio:

```powershell
supabase --version
docker version
supabase db dump --help
```

La CLI usa Docker para ejecutar el volcado. Si alguno falla, detenerse y corregir el requisito; no improvisar con un `pg_dump` completo de todos los schemas administrados.

## Crear el backup lógico inicial

1. En Supabase PROD, abrir **Connect** y copiar la URL **Session pooler**.
2. En una nueva ventana de PowerShell, cargarla solo para esa sesión:

```powershell
$env:SUPABASE_DB_URL = 'postgresql://postgres.PROJECT_REF:CONTRASEÑA@HOST:5432/postgres'
```

3. Ejecutar el script indicando el mismo Project Ref:

```powershell
.\scripts\backup-supabase-production.ps1 `
  -ProjectRef 'PROJECT_REF' `
  -ConfirmProductionBackup
```

El script aborta antes de conectar si la URL no coincide con el Project Ref confirmado. No imprime la URL ni la contraseña.

4. Al finalizar, revisar:

```powershell
Get-ChildItem .\backups\prod-* | Select-Object Name, Length
Get-Content .\backups\prod-*\manifest.json
```

5. Quitar la credencial de la sesión:

```powershell
Remove-Item Env:SUPABASE_DB_URL
```

La carpeta `backups/` está ignorada por Git. Copiar el backup cifrado a una ubicación privada fuera del equipo. Nunca subirlo a GitHub, Drive compartido públicamente ni adjuntarlo en un chat.

## Storage

El backup inicial no queda completo hasta copiar los objetos de:

- `product-images`;
- `merchant-images`.

La base conserva paths y metadata, pero no el contenido binario. La copia debe hacerse en una ventana temporal cercana al dump de PostgreSQL y conservar un inventario por bucket (path, tamaño y hash cuando sea viable).

## Auth

El manifiesto indica si `auth.users` apareció en `data.sql`; esto depende del alcance efectivo del volcado y de la versión de CLI. Aun cuando aparezca, el backup no incluye configuración de Google OAuth, Site URL, Redirect URLs, SMTP, API keys ni sesiones válidas del proyecto destino.

Antes del piloto se deben registrar, en un documento privado:

- cuenta ADMIN;
- OWNER del comercio piloto;
- métodos de acceso habilitados;
- procedimiento de reinvitación o recuperación.

No almacenar contraseñas en el repositorio.

## Ensayo de restauración

No restaurar por primera vez sobre PROD. El ensayo debe usar un proyecto Supabase vacío y descartable.

Orden recomendado por la documentación oficial:

```powershell
psql `
  --single-transaction `
  --variable ON_ERROR_STOP=1 `
  --file roles.sql `
  --file schema.sql `
  --command "SET session_replication_role = replica" `
  --file data.sql `
  --dbname $env:SUPABASE_RESTORE_DB_URL
```

Después:

1. reconfigurar extensiones y Realtime necesarios;
2. restaurar Storage por separado;
3. configurar Auth/OAuth/SMTP/redirects del proyecto destino;
4. comprobar usuarios, perfiles y memberships;
5. comprobar merchants, productos, stock, pedidos e imágenes;
6. arrancar Bag It apuntando solamente al proyecto descartable;
7. ejecutar smoke de home, login, storefront e inbox merchant;
8. registrar el resultado y recién entonces marcar `restoreTested: true` en una copia del manifiesto operativo.

## Fuentes oficiales

- [Database Backups](https://supabase.com/docs/guides/platform/backups)
- [Backup and Restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
