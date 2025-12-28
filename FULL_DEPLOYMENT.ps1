# Complete end-to-end deployment script for FlowCart Web Customer
# This script installs all prerequisites and deploys the application
# Run this script as Administrator

param(
    [string]$SiteName = "FlowCartCustomer",
    [string]$AppPoolName = "FlowCartCustomerAppPool",
    [string]$PhysicalPath = "C:\inetpub\wwwroot\flowcart-customer",
    [int]$Port = 80,
    [string]$HostName = "",
    [switch]$SkipPrerequisites = $false
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "FlowCart Complete Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Step 1: Install Prerequisites
if (-not $SkipPrerequisites) {
    Write-Host "Step 1: Installing Prerequisites..." -ForegroundColor Cyan
    Write-Host ""
    
    $prereqScript = Join-Path $PSScriptRoot "INSTALL_PREREQUISITES.ps1"
    if (Test-Path $prereqScript) {
        & powershell.exe -ExecutionPolicy Bypass -File $prereqScript -SkipNodeJS
        if ($LASTEXITCODE -ne 0) {
            Write-Host "WARNING: Some prerequisites installation failed, but continuing..." -ForegroundColor Yellow
        }
    } else {
        Write-Host "WARNING: INSTALL_PREREQUISITES.ps1 not found, skipping prerequisite installation" -ForegroundColor Yellow
        Write-Host "Please ensure IIS, URL Rewrite, iisnode, and Node.js are installed" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Step 2: Verify Node.js
Write-Host "Step 2: Verifying Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit 1
}
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Step 3: Run Deployment
Write-Host "Step 3: Running Deployment..." -ForegroundColor Cyan
Write-Host ""

$deployScript = Join-Path $PSScriptRoot "DEPLOY_TO_IIS.ps1"
if (Test-Path $deployScript) {
    $deployParams = @{
        SiteName = $SiteName
        AppPoolName = $AppPoolName
        PhysicalPath = $PhysicalPath
        Port = $Port
    }
    if ($HostName) {
        $deployParams['HostName'] = $HostName
    }
    & powershell.exe -ExecutionPolicy Bypass -File $deployScript @deployParams
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Deployment failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ERROR: DEPLOY_TO_IIS.ps1 not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

