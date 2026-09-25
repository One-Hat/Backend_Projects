# Stop local portable PostgreSQL 16
$pgDir = "d:\Backend_Domination\pgsql"
$dataDir = "d:\Backend_Domination\pgsql\data"

Write-Host "Stopping PostgreSQL 16..."
& "$pgDir\bin\pg_ctl.exe" -D $dataDir stop
Write-Host "PostgreSQL 16 stopped."
