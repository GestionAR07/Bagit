param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern("^[a-z0-9]{20}$")]
  [string]$ProjectRef,

  [string]$DatabaseUrl = $env:SUPABASE_DB_URL,

  [switch]$ConfirmProductionBackup
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

if (-not $ConfirmProductionBackup) {
  throw "Falta -ConfirmProductionBackup. El script no ejecuta backups de producción por accidente."
}

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  throw "Definí SUPABASE_DB_URL en esta sesión o pasá -DatabaseUrl. No guardes la URL en el repositorio."
}

try {
  $parsedUrl = [System.Uri]$DatabaseUrl
} catch {
  throw "SUPABASE_DB_URL no es una URL PostgreSQL válida."
}

if ($parsedUrl.Scheme -notin @("postgres", "postgresql")) {
  throw "SUPABASE_DB_URL debe usar postgres:// o postgresql://."
}

$expectedUserFragment = "postgres.$ProjectRef"
$matchesDirectHost = $parsedUrl.Host -eq "db.$ProjectRef.supabase.co"
$matchesPoolerUser = $parsedUrl.UserInfo.Split(":")[0] -eq $expectedUserFragment

if (-not ($matchesDirectHost -or $matchesPoolerUser)) {
  throw "La URL no coincide con el Project Ref confirmado. Abortado antes de conectar."
}

if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  throw "Supabase CLI no está instalado o no está en PATH. Instalalo y verificá con: supabase --version"
}

$supabaseVersion = (& supabase --version 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0) {
  throw "No se pudo ejecutar Supabase CLI."
}

& supabase db dump --help *> $null
if ($LASTEXITCODE -ne 0) {
  throw "La versión instalada de Supabase CLI no ofrece 'db dump'."
}

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$backupRoot = Join-Path $PSScriptRoot "..\backups"
$backupDirectory = Join-Path $backupRoot "prod-$timestamp"
New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null

$incompleteMarker = Join-Path $backupDirectory "INCOMPLETE"
Set-Content -Path $incompleteMarker -Value "Backup incompleto. No usar para restaurar." -Encoding utf8

$rolesPath = Join-Path $backupDirectory "roles.sql"
$schemaPath = Join-Path $backupDirectory "schema.sql"
$dataPath = Join-Path $backupDirectory "data.sql"

Write-Host "Destino: $backupDirectory"
Write-Host "Proyecto confirmado: $ProjectRef"
Write-Host "Exportando roles..."

& supabase db dump --db-url $DatabaseUrl -f $rolesPath --role-only
if ($LASTEXITCODE -ne 0) { throw "Falló la exportación de roles." }

Write-Host "Exportando esquema..."
& supabase db dump --db-url $DatabaseUrl -f $schemaPath
if ($LASTEXITCODE -ne 0) { throw "Falló la exportación del esquema." }

Write-Host "Exportando datos..."
& supabase db dump --db-url $DatabaseUrl -f $dataPath --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
if ($LASTEXITCODE -ne 0) { throw "Falló la exportación de datos." }

$paths = @($rolesPath, $schemaPath, $dataPath)
foreach ($path in $paths) {
  $file = Get-Item $path
  if ($file.Length -eq 0) {
    throw "El archivo $($file.Name) quedó vacío."
  }
}

$authUsersIncluded = [bool](Select-String -Path $dataPath -Pattern 'COPY auth\.users|INSERT INTO auth\.users' -Quiet)
$storageObjectsMetadataIncluded = [bool](Select-String -Path $dataPath -Pattern 'COPY storage\.objects|INSERT INTO storage\.objects' -Quiet)

$files = foreach ($path in $paths) {
  $file = Get-Item $path
  $hash = Get-FileHash -Path $path -Algorithm SHA256
  [ordered]@{
    name = $file.Name
    bytes = $file.Length
    sha256 = $hash.Hash.ToLowerInvariant()
  }
}

$manifest = [ordered]@{
  formatVersion = 1
  createdAtUtc = (Get-Date).ToUniversalTime().ToString("o")
  projectRef = $ProjectRef
  supabaseCliVersion = $supabaseVersion
  database = [ordered]@{
    roles = "roles.sql"
    schema = "schema.sql"
    data = "data.sql"
    authUsersDetectedInDataDump = $authUsersIncluded
    storageObjectMetadataDetectedInDataDump = $storageObjectsMetadataIncluded
  }
  storageObjectsIncluded = $false
  authConfigurationIncluded = $false
  secretsIncluded = $false
  restoreTested = $false
  files = $files
}

$manifestPath = Join-Path $backupDirectory "manifest.json"
$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestPath -Encoding utf8

Remove-Item $incompleteMarker
Write-Host ""
Write-Host "Backup lógico finalizado y verificado por tamaño/hash."
Write-Host "Manifest: $manifestPath"
Write-Warning "No incluye los archivos reales de Storage ni la configuración externa de Auth/OAuth."
Write-Warning "No marcar restoreTested=true hasta restaurarlo en un proyecto descartable."
