# Start local portable PostgreSQL 16
$pgDir = "d:\Backend_Domination\pgsql"
$dataDir = "d:\Backend_Domination\pgsql\data"

if (!(Test-Path $dataDir)) {
    Write-Host "Initializing PostgreSQL database cluster in $dataDir..."
    & "$pgDir\bin\initdb.exe" -D $dataDir -U postgres -A trust -E UTF8
}

Write-Host "Starting PostgreSQL 16..."
& "$pgDir\bin\pg_ctl.exe" -D $dataDir -l "$dataDir\server.log" start
Write-Host "PostgreSQL 16 is running on localhost:5432"
