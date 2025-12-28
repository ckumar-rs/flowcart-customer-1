# PowerShell script to set IIS permissions for web-customer deployment
# Run this script as Administrator

param(
    [string]$DeployPath = "C:\inetpub\wwwroot\flowcart-customer",
    [string]$AppPoolName = "DefaultAppPool"
)

Write-Host "Setting IIS permissions for: $DeployPath" -ForegroundColor Green
Write-Host "Application Pool: $AppPoolName" -ForegroundColor Green
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Check if deployment path exists
if (-not (Test-Path $DeployPath)) {
    Write-Host "ERROR: Deployment path does not exist: $DeployPath" -ForegroundColor Red
    Write-Host "Please create the directory first or update the DeployPath parameter" -ForegroundColor Yellow
    exit 1
}

# Get Application Pool identity
Write-Host "Getting Application Pool identity..." -ForegroundColor Cyan
try {
    Import-Module WebAdministration -ErrorAction Stop
    $appPool = Get-Item "IIS:\AppPools\$AppPoolName" -ErrorAction Stop
    $appPoolIdentity = $appPool.processModel.identityType
    
    if ($appPoolIdentity -eq "ApplicationPoolIdentity") {
        $identity = "IIS AppPool\$AppPoolName"
    }
    elseif ($appPoolIdentity -eq "NetworkService") {
        $identity = "NT AUTHORITY\NETWORK SERVICE"
    }
    elseif ($appPoolIdentity -eq "LocalService") {
        $identity = "NT AUTHORITY\LOCAL SERVICE"
    }
    else {
        $identity = $appPool.processModel.userName
    }
    
    Write-Host "Application Pool Identity: $identity" -ForegroundColor Green
}
catch {
    Write-Host "WARNING: Could not determine Application Pool identity. Using default IIS_IUSRS." -ForegroundColor Yellow
    $identity = "IIS_IUSRS"
}

# Set permissions
Write-Host ""
Write-Host "Setting permissions..." -ForegroundColor Cyan

# Grant permissions to IIS_IUSRS (for general IIS access)
Write-Host "Granting permissions to IIS_IUSRS..." -ForegroundColor Yellow
icacls $DeployPath /grant "IIS_IUSRS:(OI)(CI)(RX)" /T /Q
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ IIS_IUSRS permissions set" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to set IIS_IUSRS permissions" -ForegroundColor Red
}

# Grant permissions to Application Pool identity (for iisnode logs)
if ($identity -ne "IIS_IUSRS") {
    Write-Host "Granting permissions to $identity..." -ForegroundColor Yellow
    icacls $DeployPath /grant "${identity}:(OI)(CI)(F)" /T /Q
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Application Pool identity permissions set" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to set Application Pool identity permissions" -ForegroundColor Red
    }
}

# Grant permissions to IUSR (for anonymous access)
Write-Host "Granting permissions to IUSR..." -ForegroundColor Yellow
icacls $DeployPath /grant "IUSR:(OI)(CI)(RX)" /T /Q
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ IUSR permissions set" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to set IUSR permissions" -ForegroundColor Red
}

# Set permissions on .next directory structure
$nextDir = Join-Path $DeployPath ".next"
if (Test-Path $nextDir) {
    Write-Host "Setting permissions on .next directory..." -ForegroundColor Yellow
    icacls $nextDir /grant "${identity}:(OI)(CI)(F)" /Q
    icacls $nextDir /grant "IIS_IUSRS:(OI)(CI)(F)" /Q
    icacls $nextDir /grant "IUSR:(OI)(CI)(RX)" /Q
    Write-Host "✓ .next directory permissions set" -ForegroundColor Green
} else {
    Write-Host "WARNING: .next directory not found: $nextDir" -ForegroundColor Yellow
}

# Set permissions on .next/standalone directory (where server.js runs)
$standaloneDir = Join-Path $DeployPath ".next\standalone"
if (Test-Path $standaloneDir) {
    Write-Host "Setting permissions on .next/standalone directory..." -ForegroundColor Yellow
    icacls $standaloneDir /grant "${identity}:(OI)(CI)(F)" /Q
    icacls $standaloneDir /grant "IIS_IUSRS:(OI)(CI)(F)" /Q
    icacls $standaloneDir /grant "IUSR:(OI)(CI)(RX)" /Q
    Write-Host "✓ .next/standalone permissions set" -ForegroundColor Green
} else {
    Write-Host "WARNING: .next/standalone directory not found: $standaloneDir" -ForegroundColor Yellow
}

# Set permissions on .next/static directory (for static assets)
$staticDir = Join-Path $DeployPath ".next\static"
if (Test-Path $staticDir) {
    Write-Host "Setting permissions on .next/static directory..." -ForegroundColor Yellow
    icacls $staticDir /grant "${identity}:(OI)(CI)(RX)" /Q
    icacls $staticDir /grant "IIS_IUSRS:(OI)(CI)(RX)" /Q
    icacls $staticDir /grant "IUSR:(OI)(CI)(RX)" /Q
    Write-Host "✓ .next/static permissions set" -ForegroundColor Green
}

# Create iisnode directory in .next/standalone if it doesn't exist and set permissions
$iisnodeDir = Join-Path $standaloneDir "iisnode"
if (-not (Test-Path $iisnodeDir)) {
    Write-Host "Creating iisnode directory at .next/standalone/iisnode..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $iisnodeDir -Force | Out-Null
}

# Grant full control to iisnode directory for Application Pool identity
Write-Host "Setting iisnode directory permissions..." -ForegroundColor Yellow
icacls $iisnodeDir /grant "${identity}:(OI)(CI)(F)" /Q
icacls $iisnodeDir /grant "IIS_IUSRS:(OI)(CI)(F)" /Q
icacls $iisnodeDir /grant "IUSR:(OI)(CI)(F)" /Q
Write-Host "✓ iisnode directory permissions set" -ForegroundColor Green

Write-Host ""
Write-Host "✓ Permissions set successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart the Application Pool: Restart-WebAppPool -Name '$AppPoolName'" -ForegroundColor Cyan
Write-Host "2. Refresh your browser and check if the error is resolved" -ForegroundColor Cyan
Write-Host "3. Check iisnode logs at: $iisnodeDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: iisnode logs are created at: .next\standalone\iisnode\" -ForegroundColor Gray

