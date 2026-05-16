# Database Restore Script for Windows
# Usage: .\scripts\restore.ps1 -BackupFile "C:\Backups\delivery-platform\backup_file.sql.gz"

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    
    [string]$DBName = "delivery_platform",
    [string]$DBUser = "postgres",
    [string]$DBHost = "localhost",
    [string]$DBPort = "5432"
)

# Path to PostgreSQL binaries (adjust to your version)
$PGPath = "C:\Program Files\PostgreSQL\16\bin"
$PSQLPath = Join-Path $PGPath "psql.exe"
$DropDBPath = Join-Path $PGPath "dropdb.exe"
$CreatedbPath = Join-Path $PGPath "createdb.exe"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

Clear-Host
Write-Host "========================================="
Write-Host "Database Restore - Delivery Platform"
Write-Host "========================================="
Write-Info "Backup file: $BackupFile"
Write-Info "Database: $DBName"
Write-Info "Host: $DBHost`:$DBPort"
Write-Host ""

# Check if backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Error "ERROR: Backup file not found: $BackupFile"
    exit 1
}

# Check if PostgreSQL binaries exist
if (-not (Test-Path $PSQLPath)) {
    Write-Error "ERROR: PostgreSQL not found at $PGPath"
    Write-Info "Please update `$PGPath variable to your PostgreSQL installation path"
    Write-Info "Common paths:"
    Write-Info "  - C:\Program Files\PostgreSQL\16\bin"
    Write-Info "  - C:\Program Files\PostgreSQL\15\bin"
    Write-Info "  - C:\Program Files\PostgreSQL\14\bin"
    exit 1
}

# Get password from environment variable
$DBPassword = $env:DB_PASSWORD
if (-not $DBPassword) {
    Write-Error "ERROR: DB_PASSWORD environment variable not set"
    Write-Info ""
    Write-Info "Set it using one of these methods:"
    Write-Info "  PowerShell: `$env:DB_PASSWORD='your_password'"
    Write-Info "  CMD: set DB_PASSWORD=your_password"
    Write-Info ""
    exit 1
}

$env:PGPASSWORD = $DBPassword

# Confirm restoration (dangerous operation!)
Write-Warning "WARNING: This will COMPLETELY OVERWRITE the '$DBName' database!"
Write-Warning "All current data in this database will be LOST forever!"
Write-Host ""
$confirmation = Read-Host "Type 'RESTORE' to confirm, or anything else to cancel"

if ($confirmation -ne "RESTORE") {
    Write-Info "Restore cancelled by user."
    $env:PGPASSWORD = $null
    exit 0
}

Write-Host ""
Write-Info "Starting restore process..."

try {
    # Step 1: Terminate all connections to the database
    Write-Info "Step 1: Terminating existing connections..."
    $terminateQuery = @"
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = '$DBName'
  AND pid <> pg_backend_pid();
"@
    
    $terminateQuery | & $PSQLPath -h $DBHost -p $DBPort -U $DBUser -d postgres -t -A 2>$null
    
    # Step 2: Drop the database
    Write-Info "Step 2: Dropping existing database..."
    & $DropDBPath -h $DBHost -p $DBPort -U $DBUser --if-exists $DBName 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Database did not exist or could not be dropped. Continuing..."
    }
    
    # Step 3: Create new database
    Write-Info "Step 3: Creating fresh database..."
    & $CreatedbPath -h $DBHost -p $DBPort -U $DBUser $DBName
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create database"
    }
    
    # Step 4: Enable PostGIS extension
    Write-Info "Step 4: Enabling PostGIS extension..."
    "CREATE EXTENSION IF NOT EXISTS postgis;" | & $PSQLPath -h $DBHost -p $DBPort -U $DBUser -d $DBName
    
    # Step 5: Restore from backup
    Write-Info "Step 5: Restoring data from backup..."
    
    # Check if backup is gzipped or plain SQL
    if ($BackupFile -match "\.gz$") {
        # Gzipped backup
        Write-Info "  Detected compressed backup (.gz)"
        $tempFile = [System.IO.Path]::GetTempFileName() + ".sql"
        
        # Decompress
        $input = [System.IO.File]::OpenRead($BackupFile)
        $output = [System.IO.File]::OpenWrite($tempFile)
        $gzip = New-Object System.IO.Compression.GZipStream $input, [System.IO.Compression.CompressionMode]::Decompress
        $gzip.CopyTo($output)
        $gzip.Close()
        $output.Close()
        $input.Close()
        
        # Restore from decompressed file
        Get-Content $tempFile -Raw | & $PSQLPath -h $DBHost -p $DBPort -U $DBUser -d $DBName
        
        # Clean up
        Remove-Item $tempFile -Force
    } else {
        # Plain SQL backup
        Get-Content $BackupFile -Raw | & $PSQLPath -h $DBHost -p $DBPort -U $DBUser -d $DBName
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success ""
        Write-Success "✓ Restore completed successfully!"
        Write-Info ""
        Write-Info "Database '$DBName' has been restored from:"
        Write-Info "  $BackupFile"
    } else {
        throw "Restore command failed with exit code: $LASTEXITCODE"
    }
    
} catch {
    Write-Error ""
    Write-Error "✗ Restore failed: $_"
    exit 1
} finally {
    $env:PGPASSWORD = $null
}

Write-Host ""
Write-Host "========================================="
Write-Host "Restore completed at: $(Get-Date)"
Write-Host "========================================="