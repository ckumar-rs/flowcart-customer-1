# Simple IIS Deployment Script for FlowCart Customer
# Run this script as Administrator

param(
    [string]$DeployPath = "C:\inetpub\wwwroot\flowcart-customer",
    [string]$AppPoolName = "FlowCartCustomerAppPool",
    [string]$SiteName = "FlowCartCustomer",
    [int]$Port = 80
)

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FlowCart Customer - IIS Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build
Write-Host "Step 1: Building application..." -ForegroundColor Green
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $projectRoot

if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found. Are you in the correct directory?" -ForegroundColor Red
    Pop-Location
    exit 1
}

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "✓ Build completed" -ForegroundColor Green
Write-Host ""

# Step 2: Copy files
Write-Host "Step 2: Copying files to IIS..." -ForegroundColor Green
New-Item -ItemType Directory -Force -Path $DeployPath | Out-Null
New-Item -ItemType Directory -Force -Path "$DeployPath\.next" | Out-Null

# Copy standalone
Write-Host "  Copying standalone build..." -ForegroundColor Gray
Copy-Item -Path ".next\standalone\*" -Destination "$DeployPath\.next\standalone\" -Recurse -Force

# Copy static (REQUIRED for CSS!)
Write-Host "  Copying static files..." -ForegroundColor Gray
Copy-Item -Path ".next\static" -Destination "$DeployPath\.next\static\" -Recurse -Force

# Copy public
if (Test-Path "public") {
    Write-Host "  Copying public folder..." -ForegroundColor Gray
    Copy-Item -Path "public\*" -Destination "$DeployPath\public\" -Recurse -Force
}

# Copy web.config
Write-Host "  Copying web.config..." -ForegroundColor Gray
Copy-Item -Path "web.config" -Destination "$DeployPath\web.config" -Force

Pop-Location
Write-Host "✓ Files copied" -ForegroundColor Green
Write-Host ""

# Step 3: Set permissions
Write-Host "Step 3: Setting permissions..." -ForegroundColor Green
Write-Host "  Granting permissions to IIS_IUSRS..." -ForegroundColor Gray
icacls $DeployPath /grant "IIS_IUSRS:(OI)(CI)(F)" /T /Q | Out-Null

Write-Host "  Granting permissions to Application Pool..." -ForegroundColor Gray
icacls $DeployPath /grant "IIS AppPool\$AppPoolName:(OI)(CI)(F)" /T /Q | Out-Null

Write-Host "  Granting permissions to IUSR..." -ForegroundColor Gray
icacls $DeployPath /grant "IUSR:(OI)(CI)(RX)" /T /Q | Out-Null

# Create iisnode directory
$iisnodeDir = "$DeployPath\.next\standalone\iisnode"
New-Item -ItemType Directory -Force -Path $iisnodeDir | Out-Null
icacls $iisnodeDir /grant "IIS AppPool\$AppPoolName:(OI)(CI)(F)" /Q | Out-Null
icacls $iisnodeDir /grant "IIS_IUSRS:(OI)(CI)(F)" /Q | Out-Null

Write-Host "✓ Permissions set" -ForegroundColor Green
Write-Host ""

# Step 4: Create IIS Application Pool
Write-Host "Step 4: Configuring IIS..." -ForegroundColor Green
Import-Module WebAdministration -ErrorAction SilentlyContinue

# Create Application Pool
$appPool = Get-IISAppPool -Name $AppPoolName -ErrorAction SilentlyContinue
if (-not $appPool) {
    Write-Host "  Creating Application Pool: $AppPoolName..." -ForegroundColor Gray
    New-WebAppPool -Name $AppPoolName | Out-Null
    Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name managedRuntimeVersion -Value ""
    Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name managedPipelineMode -Value "Integrated"
    Write-Host "  ✓ Application Pool created" -ForegroundColor Green
} else {
    Write-Host "  Application Pool already exists" -ForegroundColor Yellow
}

# Start Application Pool
Start-WebAppPool -Name $AppPoolName
Write-Host "  ✓ Application Pool started" -ForegroundColor Green

# Create or update Website
$site = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
if (-not $site) {
    Write-Host "  Creating Website: $SiteName..." -ForegroundColor Gray
    New-Website -Name $SiteName -PhysicalPath $DeployPath -ApplicationPool $AppPoolName -Port $Port | Out-Null
    Write-Host "  ✓ Website created" -ForegroundColor Green
} else {
    Write-Host "  Website already exists, updating..." -ForegroundColor Yellow
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name physicalPath -Value $DeployPath
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name applicationPool -Value $AppPoolName
}

# Start Website
Start-Website -Name $SiteName
Write-Host "  ✓ Website started" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access your application at:" -ForegroundColor Yellow
Write-Host "  http://localhost:$Port/" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you see errors, check:" -ForegroundColor Yellow
Write-Host "  1. Application Pool is started" -ForegroundColor Gray
Write-Host "  2. Website is started" -ForegroundColor Gray
Write-Host "  3. Permissions are set correctly" -ForegroundColor Gray
Write-Host "  4. .next/static folder exists" -ForegroundColor Gray
Write-Host ""

