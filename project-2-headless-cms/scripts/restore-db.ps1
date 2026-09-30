# Restore PostgreSQL database cluster from dump file
param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$DbName = "headless_cms"
)

$psql = "d:\Backend_Domination\pgsql\bin\psql.exe"
if (!(Test-Path $psql)) {
    $psql = "psql"
}

if (!(Test-Path $BackupFile)) {
    Write-Host "❌ Error: Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "Restoring database '$DbName' from $BackupFile..." -ForegroundColor Cyan
& $psql -U postgres -h 127.0.0.1 -p 5432 -d $DbName -f $BackupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database successfully restored!" -ForegroundColor Green
} else {
    Write-Host "❌ Restore failed with exit code $LASTEXITCODE" -ForegroundColor Red
}
