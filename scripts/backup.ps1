# Database Backup Script for Windows
# Run this script daily via Task Scheduler

param(
    [string]$BackupDir = "C:\Backups\delivery-platform",
    [string]$DBName = "delivery_platform",
    [string]$DBUser = "postgres",
    [string]$DBHost = "localhost",
    [int]$RetentionDays = 30
)

# Configuration
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "${DBName}_${Timestamp}.sql.gz"
$PGDumpPath = "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

Write-Host "========================================="
Write-Host "Database Backup - Delivery Platform"
Write-Host "Started at: $(Get-Date)"
Write-Host "========================================="

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    Write-Info "Creating backup directory: $BackupDir"
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Get password from environment variable
$DBPassword = $env:DB_PASSWORD
if (-not $DBPassword) {
    Write-Error "ERROR: DB_PASSWORD environment variable not set"
    Write-Info "Set it using: `$env:DB_PASSWORD='your_password'"
    exit 1
}

# Perform the backup
Write-Info "Backing up database: $DBName"
$env:PGPASSWORD = $DBPassword

try {
    & $PGDumpPath -h $DBHost -U $DBUser -d $DBName | Out-File -FilePath "temp_backup.sql" -Encoding utf8
    
    if (Test-Path "temp_backup.sql") {
        # Compress the backup
        $compression = [System.IO.Compression.CompressionLevel]::Optimal
        [System.IO.Compression.GZipStream]::new(
            [System.IO.File]::OpenWrite($BackupFile),
            $compression
        )
        
        $content = Get-Content "temp_backup.sql" -Raw
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
        
        $gzStream = New-Object System.IO.FileStream $BackupFile, [System.IO.FileMode]::Create
        $zipStream = New-Object System.IO.Compression.GZipStream $gzStream, $compression
        $zipStream.Write($bytes, 0, $bytes.Length)
        $zipStream.Close()
        $gzStream.Close()
        
        Remove-Item "temp_backup.sql"
        
        $fileSize = [math]::Round((Get-Item $BackupFile).Length / 1MB, 2)
        Write-Success "✓ Backup successful"
        Write-Info "  File: $BackupFile"
        Write-Info "  Size: ${fileSize} MB"
    } else {
        throw "Backup file not created"
    }
} catch {
    Write-Error "✗ Backup failed: $_"
    exit 1
} finally {
    $env:PGPASSWORD = $null
}

# Remove old backups
Write-Info "Cleaning up backups older than $RetentionDays days..."
$cutoffDate = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "${DBName}_*.sql.gz" | Where-Object {
    $_.LastWriteTime -lt $cutoffDate
} | Remove-Item -Force

$backupCount = (Get-ChildItem -Path $BackupDir -Filter "${DBName}_*.sql.gz").Count
Write-Success "✓ Cleanup complete"
Write-Info "  Backups remaining: $backupCount"

Write-Host ""
Write-Host "========================================="
Write-Host "Backup completed at: $(Get-Date)"
Write-Host "========================================="