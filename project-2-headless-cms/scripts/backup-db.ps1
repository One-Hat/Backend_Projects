# Backup PostgreSQL database cluster
param (
    [string]$DbName = "headless_cms",
    [string]$OutputDir = ".\backups"
)

$pgDump = "d:\Backend_Domination\pgsql\bin\pg_dump.exe"
if (!(Test-Path $pgDump)) {
    $pgDump = "pg_dump"
}

if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dumpFile = "$OutputDir\backup_${DbName}_${timestamp}.sql"

Write-Host "Creating backup for database '$DbName'..." -ForegroundColor Cyan
& $pgDump -U postgres -h 127.0.0.1 -p 5432 -d $DbName -f $dumpFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup successfully created: $dumpFile" -ForegroundColor Green
} else {
    Write-Host "❌ Backup failed with exit code $LASTEXITCODE" -ForegroundColor Red
}
